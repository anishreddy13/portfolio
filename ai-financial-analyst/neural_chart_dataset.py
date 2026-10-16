"""
neural_chart_dataset.py - Phase 1 dataset engine for Neural Chart Vision.

Builds sequence tensors, optional chart-image tensors, weak pattern labels, and
metadata from OHLCV windows. This is intentionally model-agnostic so Phase 2 can
train CNN/LSTM/Transformer variants from the same artifacts.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


PATTERNS = [
    "breakout_setup",
    "double_bottom",
    "volatility_squeeze",
    "trend_exhaustion",
    "head_shoulders",
    "cup_and_handle",
]

FEATURE_COLUMNS = [
    "open_norm",
    "high_norm",
    "low_norm",
    "close_norm",
    "volume_z",
    "return_1d",
    "return_5d",
    "range_pct",
    "rsi_14",
    "macd",
    "macd_signal",
    "bb_width",
    "volume_ratio",
]


@dataclass(frozen=True)
class DatasetConfig:
    tickers: list[str]
    period: str
    interval: str
    windows: list[int]
    stride: int
    output_dir: Path
    render_images: bool
    image_size: int
    synthetic: bool


def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).lower() for c in df.columns]
    required = ["open", "high", "low", "close", "volume"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required OHLCV columns: {missing}")

    close = df["close"].astype(float)
    volume = df["volume"].astype(float)
    rolling_close = close.rolling(20, min_periods=5)
    rolling_volume = volume.rolling(20, min_periods=5)

    basis = rolling_close.mean()
    price_scale = basis.replace(0, np.nan).bfill().ffill()
    for col in ["open", "high", "low", "close"]:
        df[f"{col}_norm"] = (df[col].astype(float) / price_scale) - 1

    volume_mean = rolling_volume.mean()
    volume_std = rolling_volume.std().replace(0, np.nan)
    df["volume_z"] = ((volume - volume_mean) / volume_std).clip(-5, 5)
    df["volume_ratio"] = (volume / volume_mean.replace(0, np.nan)).clip(0, 10)

    df["return_1d"] = close.pct_change().clip(-0.25, 0.25)
    df["return_5d"] = close.pct_change(5).clip(-0.5, 0.5)
    df["range_pct"] = ((df["high"] - df["low"]) / close.replace(0, np.nan)).clip(0, 0.5)

    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14, min_periods=5).mean()
    loss = (-delta.clip(upper=0)).rolling(14, min_periods=5).mean()
    rs = gain / loss.replace(0, np.nan)
    df["rsi_14"] = ((100 - (100 / (1 + rs))) / 100).clip(0, 1)

    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    macd_raw = ema_12 - ema_26
    macd_signal_raw = macd_raw.ewm(span=9, adjust=False).mean()
    df["macd"] = (macd_raw / close.replace(0, np.nan)).clip(-0.2, 0.2)
    df["macd_signal"] = (macd_signal_raw / close.replace(0, np.nan)).clip(-0.2, 0.2)

    bb_std = rolling_close.std()
    df["bb_width"] = ((4 * bb_std) / basis.replace(0, np.nan)).clip(0, 1)

    df[FEATURE_COLUMNS] = df[FEATURE_COLUMNS].replace([np.inf, -np.inf], np.nan)
    df[FEATURE_COLUMNS] = df[FEATURE_COLUMNS].ffill().bfill().fillna(0)
    return df


def _local_minima(values: np.ndarray) -> list[int]:
    return [
        i for i in range(1, len(values) - 1)
        if values[i] <= values[i - 1] and values[i] <= values[i + 1]
    ]


def _local_maxima(values: np.ndarray) -> list[int]:
    return [
        i for i in range(1, len(values) - 1)
        if values[i] >= values[i - 1] and values[i] >= values[i + 1]
    ]


def label_window(window: pd.DataFrame) -> tuple[np.ndarray, dict[str, float]]:
    close = window["close"].to_numpy(dtype=float)
    high = window["high"].to_numpy(dtype=float)
    low = window["low"].to_numpy(dtype=float)
    volume = window["volume"].to_numpy(dtype=float)
    bb_width = window["bb_width"].to_numpy(dtype=float)
    rsi = window["rsi_14"].to_numpy(dtype=float)
    returns_5d = window["return_5d"].to_numpy(dtype=float)

    labels = dict.fromkeys(PATTERNS, 0.0)
    if len(close) < 30 or not np.isfinite(close).all():
        return np.array([labels[p] for p in PATTERNS], dtype=np.float32), labels

    recent_high = np.nanmax(high[-20:-1])
    prior_high = np.nanmax(high[:-20]) if len(high) > 30 else np.nanmax(high[:-1])
    recent_volume = np.nanmean(volume[-5:])
    base_volume = np.nanmean(volume[-30:-5])
    near_breakout = close[-1] >= recent_high * 0.985
    high_volume = recent_volume >= base_volume * 1.15 if base_volume else False
    labels["breakout_setup"] = float(near_breakout and high_volume and close[-1] >= prior_high * 0.95)

    minima = _local_minima(close)
    if len(minima) >= 2:
        a, b = minima[-2], minima[-1]
        separated = 5 <= b - a <= max(45, len(close) // 2)
        same_zone = abs(close[a] - close[b]) / max(close[a], close[b]) <= 0.04
        neckline = np.nanmax(close[a:b + 1])
        recovered = close[-1] >= neckline * 0.97
        labels["double_bottom"] = float(separated and same_zone and recovered)

    latest_bb = np.nanmean(bb_width[-5:])
    prior_bb = np.nanmean(bb_width[-60:-10]) if len(bb_width) >= 70 else np.nanmean(bb_width[:-10])
    labels["volatility_squeeze"] = float(latest_bb < np.nanpercentile(bb_width, 20) and latest_bb < prior_bb * 0.75)

    strong_run = np.nanmax(returns_5d[-15:]) > 0.08
    rsi_rollover = np.nanmax(rsi[-15:]) > 0.72 and rsi[-1] < np.nanmax(rsi[-15:]) - 0.08
    volume_climax = volume[-1] > np.nanmean(volume[-30:]) * 1.7 if np.nanmean(volume[-30:]) else False
    labels["trend_exhaustion"] = float(strong_run and (rsi_rollover or volume_climax))

    maxima = _local_maxima(close)
    if len(maxima) >= 3:
        left, head, right = maxima[-3], maxima[-2], maxima[-1]
        head_taller = close[head] > close[left] * 1.03 and close[head] > close[right] * 1.03
        shoulders_close = abs(close[left] - close[right]) / max(close[left], close[right]) <= 0.06
        labels["head_shoulders"] = float(left < head < right and head_taller and shoulders_close)

    first_half_low = np.nanmin(close[: len(close) // 2])
    mid_low = np.nanmin(close[len(close) // 4: 3 * len(close) // 4])
    start = close[0]
    end = close[-1]
    recovered_cup = mid_low < start * 0.9 and end >= start * 0.96
    shallow_handle = np.nanmin(close[-15:]) >= end * 0.9
    labels["cup_and_handle"] = float(recovered_cup and shallow_handle and first_half_low <= mid_low * 1.08)

    return np.array([labels[p] for p in PATTERNS], dtype=np.float32), labels


def render_chart_image(window: pd.DataFrame, image_size: int) -> np.ndarray:
    from PIL import Image, ImageDraw

    close = window["close"].to_numpy(dtype=float)
    open_ = window["open"].to_numpy(dtype=float)
    high = window["high"].to_numpy(dtype=float)
    low = window["low"].to_numpy(dtype=float)
    volume = window["volume"].to_numpy(dtype=float)

    image = Image.new("RGB", (image_size, image_size), "#050505")
    draw = ImageDraw.Draw(image)
    chart_bottom = int(image_size * 0.78)
    chart_top = 4
    volume_top = chart_bottom + 4
    volume_bottom = image_size - 4

    price_min = float(np.nanmin(low))
    price_max = float(np.nanmax(high))
    price_span = max(price_max - price_min, 1e-9)
    step = image_size / max(len(window), 1)
    body_width = max(1, int(step * 0.62))

    def y_price(value: float) -> int:
        normalized = (value - price_min) / price_span
        return int(chart_bottom - normalized * (chart_bottom - chart_top))

    volume_max = float(np.nanmax(volume)) or 1.0
    for i in range(len(window)):
        x = int(i * step + step / 2)
        color = "#36c275" if close[i] >= open_[i] else "#f05a4f"
        wick_top = y_price(high[i])
        wick_bottom = y_price(low[i])
        open_y = y_price(open_[i])
        close_y = y_price(close[i])
        body_top = min(open_y, close_y)
        body_bottom = max(open_y, close_y)
        if body_top == body_bottom:
            body_bottom += 1

        draw.line((x, wick_top, x, wick_bottom), fill=color, width=1)
        draw.rectangle(
            (x - body_width // 2, body_top, x + body_width // 2, body_bottom),
            fill=color,
        )

        vol_height = int((volume[i] / volume_max) * (volume_bottom - volume_top))
        draw.rectangle(
            (x - body_width // 2, volume_bottom - vol_height, x + body_width // 2, volume_bottom),
            fill="#6b7280",
        )

    rgb = np.asarray(image).astype(np.float32) / 255.0
    return np.transpose(rgb, (2, 0, 1)).astype(np.float32)


def fetch_ohlcv(ticker: str, period: str, interval: str) -> pd.DataFrame:
    import yfinance as yf

    data = yf.Ticker(ticker).history(period=period, interval=interval, auto_adjust=False)
    if data.empty:
        raise ValueError(f"No historical data returned for {ticker}")
    data = data.reset_index()
    data.columns = [str(column).lower() for column in data.columns]
    date_col = "date" if "date" in data.columns else "datetime" if "datetime" in data.columns else None
    if date_col is None:
        raise ValueError(f"Historical data for {ticker} is missing a date column")
    data["date"] = pd.to_datetime(data[date_col], utc=True).dt.tz_convert(None)
    return data[["date", "open", "high", "low", "close", "volume"]].dropna()


def synthetic_ohlcv(ticker: str, rows: int = 520) -> pd.DataFrame:
    rng = np.random.default_rng(abs(hash(ticker)) % (2**32))
    dates = pd.bdate_range(end=pd.Timestamp.today().normalize(), periods=rows)
    drift = rng.normal(0.0008, 0.018, size=rows)
    cycle = np.sin(np.linspace(0, 18, rows)) * 0.006
    close = 100 * np.exp(np.cumsum(drift + cycle))
    open_ = close * (1 + rng.normal(0, 0.006, size=rows))
    high = np.maximum(open_, close) * (1 + rng.uniform(0.002, 0.018, size=rows))
    low = np.minimum(open_, close) * (1 - rng.uniform(0.002, 0.018, size=rows))
    volume = rng.lognormal(mean=14, sigma=0.35, size=rows).astype(int)
    return pd.DataFrame({
        "date": dates,
        "open": open_,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume,
    })


def iter_windows(df: pd.DataFrame, window_size: int, stride: int) -> Iterable[tuple[int, int, pd.DataFrame]]:
    for end in range(window_size, len(df) + 1, stride):
        start = end - window_size
        yield start, end, df.iloc[start:end].copy()


def build_dataset(config: DatasetConfig) -> dict[str, object]:
    output_dir = config.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    sequences: list[np.ndarray] = []
    labels: list[np.ndarray] = []
    images: list[np.ndarray] = []
    metadata: list[dict[str, object]] = []

    for ticker in config.tickers:
        print(f"[DATASET] Processing {ticker}")
        try:
            raw = synthetic_ohlcv(ticker) if config.synthetic else fetch_ohlcv(ticker, config.period, config.interval)
            enriched = compute_indicators(raw)
        except Exception as exc:
            print(f"[DATASET] Skipping {ticker}: {exc}")
            continue

        for window_size in config.windows:
            for start, end, window in iter_windows(enriched, window_size, config.stride):
                y, label_scores = label_window(window)
                sequence = window[FEATURE_COLUMNS].to_numpy(dtype=np.float32)
                sequences.append(sequence)
                labels.append(y)
                if config.render_images:
                    images.append(render_chart_image(window, config.image_size))

                future_return = (
                    float((enriched["close"].iloc[end + 4] / enriched["close"].iloc[end - 1]) - 1)
                    if end + 4 < len(enriched)
                    else np.nan
                )
                metadata.append({
                    "ticker": ticker,
                    "window_size": window_size,
                    "start_idx": start,
                    "end_idx": end - 1,
                    "start_date": window["date"].iloc[0].strftime("%Y-%m-%d"),
                    "end_date": window["date"].iloc[-1].strftime("%Y-%m-%d"),
                    "close_start": float(window["close"].iloc[0]),
                    "close_end": float(window["close"].iloc[-1]),
                    "forward_5d_return": future_return,
                    **{f"label_{k}": v for k, v in label_scores.items()},
                })

    if not sequences:
        raise RuntimeError("No dataset windows were generated")

    max_window = max(config.windows)
    padded_sequences = np.zeros((len(sequences), max_window, len(FEATURE_COLUMNS)), dtype=np.float32)
    sequence_mask = np.zeros((len(sequences), max_window), dtype=np.float32)
    for i, sequence in enumerate(sequences):
        padded_sequences[i, -len(sequence):, :] = sequence
        sequence_mask[i, -len(sequence):] = 1

    labels_array = np.stack(labels).astype(np.float32)
    metadata_df = pd.DataFrame(metadata)

    np.save(output_dir / "X_sequence.npy", padded_sequences)
    np.save(output_dir / "X_sequence_mask.npy", sequence_mask)
    np.save(output_dir / "y_patterns.npy", labels_array)

    if images:
        np.save(output_dir / "X_chart_images.npy", np.stack(images).astype(np.float32))

    metadata_df.to_csv(output_dir / "metadata.csv", index=False)
    try:
        metadata_df.to_parquet(output_dir / "metadata.parquet", index=False)
    except Exception as exc:
        print(f"[DATASET] Parquet skipped: {exc}")

    manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "tickers": config.tickers,
        "period": config.period,
        "interval": config.interval,
        "windows": config.windows,
        "stride": config.stride,
        "feature_columns": FEATURE_COLUMNS,
        "patterns": PATTERNS,
        "num_samples": len(sequences),
        "sequence_shape": list(padded_sequences.shape),
        "label_shape": list(labels_array.shape),
        "has_chart_images": bool(images),
        "image_shape": list(np.stack(images).shape) if images else None,
        "synthetic": config.synthetic,
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"[DATASET] Wrote {len(sequences)} samples to {output_dir}")
    return manifest


def parse_args() -> DatasetConfig:
    parser = argparse.ArgumentParser(description="Build Neural Chart Vision Phase 1 dataset artifacts.")
    parser.add_argument("--tickers", default="AAPL,MSFT,NVDA,TSLA,AMZN,GOOGL,META,JPM,UNH,XOM")
    parser.add_argument("--period", default="5y")
    parser.add_argument("--interval", default="1d")
    parser.add_argument("--windows", default="60,90,120")
    parser.add_argument("--stride", type=int, default=5)
    parser.add_argument("--output-dir", default="dataset/neural_chart_vision")
    parser.add_argument("--render-images", action="store_true")
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--synthetic", action="store_true")
    args = parser.parse_args()

    return DatasetConfig(
        tickers=[t.strip().upper() for t in args.tickers.split(",") if t.strip()],
        period=args.period,
        interval=args.interval,
        windows=[int(w.strip()) for w in args.windows.split(",") if w.strip()],
        stride=args.stride,
        output_dir=Path(args.output_dir),
        render_images=args.render_images,
        image_size=args.image_size,
        synthetic=args.synthetic,
    )


if __name__ == "__main__":
    build_dataset(parse_args())
