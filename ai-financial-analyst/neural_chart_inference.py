"""
neural_chart_inference.py - Live inference for Neural Chart Vision.

Turns a ticker into a chart-ready prediction payload. If a trained Phase 2
bundle is present, the CNN + Transformer model is used. If the bundle is not
available yet, the endpoint falls back to the Phase 1 pattern heuristics so the
visual product surface remains useful during deployment.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from neural_chart_dataset import FEATURE_COLUMNS, PATTERNS, compute_indicators, fetch_ohlcv, label_window, render_chart_image


DEFAULT_MODEL_PATH = Path(os.getenv("NEURAL_CHART_MODEL_PATH", "models/neural_chart_vision/v1/model.pt"))
DEFAULT_LOOKBACK_PERIOD = os.getenv("NEURAL_CHART_LOOKBACK_PERIOD", "18mo")


def _round(value: float | np.floating | None, digits: int = 4) -> float | None:
    if value is None:
        return None
    if not np.isfinite(value):
        return None
    return round(float(value), digits)


def _sigmoid(values: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-values))


def _safe_percentile(values: np.ndarray, percentile: float, default: float = 0.0) -> float:
    finite = values[np.isfinite(values)]
    if not len(finite):
        return default
    return float(np.percentile(finite, percentile))


def _pad_sequence(window_features: np.ndarray, max_steps: int) -> tuple[np.ndarray, np.ndarray]:
    if max_steps < 1:
        raise ValueError("Model max_steps must be positive")
    clipped = window_features[-max_steps:].astype(np.float32)
    padded = np.zeros((max_steps, len(FEATURE_COLUMNS)), dtype=np.float32)
    mask = np.zeros((max_steps,), dtype=np.float32)
    padded[-len(clipped):] = clipped
    mask[-len(clipped):] = 1.0
    return padded, mask


def _chart_payload(window) -> list[dict[str, Any]]:
    return [
        {
            "date": row.date.strftime("%Y-%m-%d"),
            "open": _round(row.open, 2),
            "high": _round(row.high, 2),
            "low": _round(row.low, 2),
            "close": _round(row.close, 2),
            "volume": int(row.volume) if np.isfinite(row.volume) else 0,
        }
        for row in window.itertuples(index=False)
    ]


def _normalize(values: np.ndarray) -> np.ndarray:
    finite = np.nan_to_num(values.astype(float), nan=0.0, posinf=0.0, neginf=0.0)
    low = float(np.min(finite))
    high = float(np.max(finite))
    if high - low < 1e-9:
        return np.zeros_like(finite, dtype=np.float32)
    return ((finite - low) / (high - low)).astype(np.float32)


def _pattern_label(pattern: str) -> str:
    return pattern.replace("_", " ").title()


def _heuristic_probabilities(window) -> np.ndarray:
    labels, _ = label_window(window)
    close = window["close"].to_numpy(dtype=float)
    volume = window["volume"].to_numpy(dtype=float)
    bb_width = window["bb_width"].to_numpy(dtype=float)
    rsi = window["rsi_14"].to_numpy(dtype=float)
    returns_5d = window["return_5d"].to_numpy(dtype=float)

    latest_close = close[-1]
    high_20 = float(np.nanmax(window["high"].to_numpy(dtype=float)[-20:]))
    volume_ratio = volume[-1] / max(float(np.nanmean(volume[-30:])), 1.0)
    squeeze_rank = 1.0 - min(1.0, float(bb_width[-1]) / max(_safe_percentile(bb_width, 60, 0.1), 1e-6))
    momentum = float(np.nanmean(returns_5d[-5:]))
    rsi_rollover = max(0.0, float(np.nanmax(rsi[-14:]) - rsi[-1]))

    scores = np.array(
        [
            0.25 + 0.40 * float(latest_close >= high_20 * 0.985) + 0.20 * min(volume_ratio / 2.0, 1.0),
            0.22 + 0.48 * labels[PATTERNS.index("double_bottom")],
            0.20 + 0.55 * max(squeeze_rank, 0.0),
            0.18 + 0.35 * float(momentum > 0.04) + 0.25 * min(rsi_rollover / 0.2, 1.0),
            0.15 + 0.55 * labels[PATTERNS.index("head_shoulders")],
            0.16 + 0.55 * labels[PATTERNS.index("cup_and_handle")],
        ],
        dtype=np.float32,
    )
    return np.clip(scores, 0.03, 0.96)


def _heuristic_return(window) -> float:
    close = window["close"].to_numpy(dtype=float)
    returns_1d = window["return_1d"].to_numpy(dtype=float)
    returns_5d = window["return_5d"].to_numpy(dtype=float)
    trend = (close[-1] / max(close[-20], 1e-9)) - 1.0 if len(close) >= 20 else returns_5d[-1]
    momentum = float(np.nanmean(returns_1d[-7:])) * 5.0
    reversal_penalty = max(0.0, float(window["rsi_14"].iloc[-1]) - 0.72) * 0.12
    return float(np.clip((trend * 0.35) + (momentum * 0.55) - reversal_penalty, -0.2, 0.2))


def _build_patterns(probabilities: np.ndarray) -> list[dict[str, Any]]:
    return [
        {
            "id": pattern,
            "label": _pattern_label(pattern),
            "probability": _round(probability, 4),
            "active": bool(probability >= 0.5),
        }
        for pattern, probability in zip(PATTERNS, probabilities)
    ]


def _support_resistance(window) -> list[dict[str, Any]]:
    close = window["close"].to_numpy(dtype=float)
    high = window["high"].to_numpy(dtype=float)
    low = window["low"].to_numpy(dtype=float)
    current = float(close[-1])
    recent_high = float(np.nanmax(high[-20:]))
    recent_low = float(np.nanmin(low[-20:]))
    volume_weighted = float(np.average(close[-30:], weights=np.maximum(window["volume"].to_numpy(dtype=float)[-30:], 1)))
    return [
        {
            "label": "20D Resistance",
            "price": _round(recent_high, 2),
            "distance_percent": _round(((recent_high - current) / current) * 100.0, 2),
            "kind": "resistance",
        },
        {
            "label": "20D Support",
            "price": _round(recent_low, 2),
            "distance_percent": _round(((recent_low - current) / current) * 100.0, 2),
            "kind": "support",
        },
        {
            "label": "Volume Fair Price",
            "price": _round(volume_weighted, 2),
            "distance_percent": _round(((volume_weighted - current) / current) * 100.0, 2),
            "kind": "mean",
        },
    ]


def _attention_timeline(window) -> list[dict[str, Any]]:
    close = window["close"].to_numpy(dtype=float)
    high = window["high"].to_numpy(dtype=float)
    low = window["low"].to_numpy(dtype=float)
    volume = window["volume"].to_numpy(dtype=float)
    returns = np.nan_to_num(window["return_1d"].to_numpy(dtype=float), nan=0.0)
    bb_width = np.nan_to_num(window["bb_width"].to_numpy(dtype=float), nan=0.0)
    rsi = np.nan_to_num(window["rsi_14"].to_numpy(dtype=float), nan=0.5)

    range_pressure = _normalize((high - low) / np.maximum(close, 1e-9))
    volume_pressure = _normalize(volume / max(float(np.nanmean(volume[-30:])), 1.0))
    return_pressure = _normalize(np.abs(returns))
    squeeze_pressure = 1.0 - _normalize(bb_width)
    rsi_extreme = _normalize(np.abs(rsi - 0.5))
    recency = np.linspace(0.25, 1.0, len(window), dtype=np.float32)

    attention = (
        0.26 * range_pressure
        + 0.24 * volume_pressure
        + 0.22 * return_pressure
        + 0.16 * squeeze_pressure
        + 0.12 * rsi_extreme
    ) * recency
    attention = _normalize(attention)

    return [
        {
            "date": row.date.strftime("%Y-%m-%d"),
            "attention": _round(score, 4),
            "close": _round(row.close, 2),
        }
        for row, score in zip(window.itertuples(index=False), attention)
    ]


def _evidence_cards(window) -> list[dict[str, Any]]:
    close = window["close"].to_numpy(dtype=float)
    volume = window["volume"].to_numpy(dtype=float)
    rsi = float(window["rsi_14"].iloc[-1])
    bb_width = window["bb_width"].to_numpy(dtype=float)
    five_day_return = float((close[-1] / max(close[-6], 1e-9)) - 1.0) if len(close) >= 6 else 0.0
    twenty_day_return = float((close[-1] / max(close[-21], 1e-9)) - 1.0) if len(close) >= 21 else five_day_return
    volume_ratio = volume[-1] / max(float(np.nanmean(volume[-30:])), 1.0)
    squeeze_rank = 1.0 - min(1.0, float(bb_width[-1]) / max(_safe_percentile(bb_width, 60, 0.1), 1e-6))

    return [
        {
            "label": "Momentum",
            "value": _round(five_day_return * 100.0, 2),
            "unit": "%",
            "polarity": "positive" if five_day_return >= 0 else "negative",
            "detail": f"5D price move with 20D trend at {twenty_day_return * 100.0:.1f}%",
        },
        {
            "label": "Volume Shock",
            "value": _round(volume_ratio, 2),
            "unit": "x",
            "polarity": "positive" if volume_ratio >= 1.15 else "neutral",
            "detail": "Latest volume compared with the trailing 30-session average",
        },
        {
            "label": "Volatility Squeeze",
            "value": _round(squeeze_rank * 100.0, 1),
            "unit": "%",
            "polarity": "positive" if squeeze_rank >= 0.45 else "neutral",
            "detail": "Lower band width means the chart may be coiling for a move",
        },
        {
            "label": "RSI Regime",
            "value": _round(rsi * 100.0, 1),
            "unit": "",
            "polarity": "negative" if rsi >= 0.72 else "positive" if rsi <= 0.38 else "neutral",
            "detail": "Momentum regime used by the pattern evidence layer",
        },
    ]


def _summarize(
    mode: str,
    ticker: str,
    probabilities: np.ndarray,
    forward_return: float,
    evidence: list[dict[str, Any]],
) -> str:
    strongest_index = int(np.argmax(probabilities))
    strongest = _pattern_label(PATTERNS[strongest_index])
    direction = "bullish" if forward_return >= 0 else "bearish"
    source = "custom CNN + Transformer model" if mode == "deep_learning" else "live chart heuristics"
    lead_evidence = max(evidence, key=lambda item: abs(float(item.get("value") or 0)))
    return (
        f"{ticker} is showing a {direction} five-session setup. "
        f"The strongest visual pattern is {strongest} at {probabilities[strongest_index] * 100:.1f}% "
        f"confidence from {source}. The evidence layer is most sensitive to {lead_evidence['label']}."
    )


@lru_cache(maxsize=2)
def _load_model_bundle(model_path: str) -> dict[str, Any]:
    try:
        import torch
        from neural_chart_trainer import NeuralChartVision
    except Exception as exc:
        raise RuntimeError(f"PyTorch model runtime unavailable: {exc}") from exc

    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(f"Model bundle not found at {path}")

    checkpoint = torch.load(path, map_location="cpu", weights_only=False)
    model_config = checkpoint["model_config"]
    model = NeuralChartVision(**model_config)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    return {
        "torch": torch,
        "model": model,
        "model_config": model_config,
        "feature_mean": np.asarray(checkpoint["feature_mean"], dtype=np.float32),
        "feature_std": np.asarray(checkpoint["feature_std"], dtype=np.float32),
        "patterns": checkpoint.get("patterns", PATTERNS),
        "metrics": checkpoint.get("metrics", {}),
        "dataset_manifest": checkpoint.get("dataset_manifest", {}),
    }


def _predict_with_model(window, model_path: Path) -> tuple[np.ndarray, float, dict[str, Any]]:
    bundle = _load_model_bundle(str(model_path))
    torch = bundle["torch"]
    model = bundle["model"]
    model_config = bundle["model_config"]
    max_steps = int(model_config["max_steps"])
    sequence, mask = _pad_sequence(window[FEATURE_COLUMNS].to_numpy(dtype=np.float32), max_steps)
    sequence = (sequence - bundle["feature_mean"]) / np.maximum(bundle["feature_std"], 1e-6)
    sequence[mask <= 0] = 0

    inputs: dict[str, Any] = {
        "sequence": torch.from_numpy(sequence).unsqueeze(0),
        "mask": torch.from_numpy(mask).unsqueeze(0),
    }
    if model_config.get("use_images"):
        image_shape = bundle["dataset_manifest"].get("image_shape") or []
        image_size = int(image_shape[-1]) if len(image_shape) == 4 else 224
        inputs["image"] = torch.from_numpy(render_chart_image(window, image_size)).unsqueeze(0)

    with torch.no_grad():
        output = model(inputs["sequence"], inputs["mask"], inputs.get("image"))
        probabilities = torch.sigmoid(output["pattern_logits"]).squeeze(0).cpu().numpy()
        forward_return = float(output["forward_return"].squeeze(0).cpu().item())

    return probabilities.astype(np.float32), forward_return, {
        "best_epoch": bundle["metrics"].get("best_epoch"),
        "validation_loss": bundle["metrics"].get("best_validation_loss"),
        "path": str(model_path),
    }


def generate_neural_chart_vision(
    ticker: str,
    model_path: str | Path | None = None,
    lookback_period: str = DEFAULT_LOOKBACK_PERIOD,
) -> str:
    """Return a live Neural Chart Vision payload for a ticker as JSON."""
    normalized = ticker.strip().upper()
    if not normalized:
        return json.dumps({"error": "Invalid ticker"})

    selected_model_path = Path(model_path) if model_path is not None else DEFAULT_MODEL_PATH

    try:
        raw = fetch_ohlcv(normalized, period=lookback_period, interval="1d")
        enriched = compute_indicators(raw)
        min_window = 60
        if len(enriched) < min_window:
            return json.dumps({"error": f"Not enough live chart history for {normalized}"})

        window_size = min(120, len(enriched))
        window = enriched.iloc[-window_size:].copy()
        model_meta: dict[str, Any] = {}
        model_error = None
        try:
            probabilities, forward_return, model_meta = _predict_with_model(window, selected_model_path)
            mode = "deep_learning"
            model_ready = True
        except Exception as exc:
            probabilities = _heuristic_probabilities(window)
            forward_return = _heuristic_return(window)
            mode = "heuristic_fallback"
            model_ready = False
            model_error = str(exc)

        confidence = float(np.max(probabilities))
        attention_window = window.tail(90)
        evidence = _evidence_cards(window)
        payload = {
            "ticker": normalized,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "as_of": window["date"].iloc[-1].strftime("%Y-%m-%d"),
            "window_start": window["date"].iloc[0].strftime("%Y-%m-%d"),
            "window_end": window["date"].iloc[-1].strftime("%Y-%m-%d"),
            "mode": mode,
            "model_ready": model_ready,
            "model_error": model_error,
            "model": model_meta,
            "current_price": _round(window["close"].iloc[-1], 2),
            "forward_return_prediction": _round(forward_return, 4),
            "forward_return_percent": _round(forward_return * 100.0, 2),
            "direction": "bullish" if forward_return >= 0 else "bearish",
            "confidence_score": _round(confidence, 4),
            "patterns": _build_patterns(probabilities),
            "chart": _chart_payload(attention_window),
            "attention_timeline": _attention_timeline(attention_window),
            "key_levels": _support_resistance(window),
            "evidence": evidence,
            "summary": _summarize(mode, normalized, probabilities, forward_return, evidence),
        }
        return json.dumps(payload)
    except Exception as exc:
        return json.dumps({"ticker": normalized, "error": str(exc)})


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Phase 3 Neural Chart Vision inference for one ticker.")
    parser.add_argument("ticker", help="Ticker symbol, e.g. AAPL")
    parser.add_argument("--model-path", default=str(DEFAULT_MODEL_PATH))
    parser.add_argument("--lookback-period", default=DEFAULT_LOOKBACK_PERIOD)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    print(generate_neural_chart_vision(args.ticker, model_path=args.model_path, lookback_period=args.lookback_period))
