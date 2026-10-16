"""
stream_normalizers.py — Pure Stream Payload Normalizers

Pure transformation functions converting raw provider websocket payloads (e.g. Polygon / Massive JSON)
into canonical StreamMessage objects containing standardized Quote, Trade, or OHLCBar payloads.

No network calls or socket logic inside this module.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from market_entities import Instrument, OHLCBar, Quote
from market_types import AssetClass, DataType, Exchange, ProviderType, Region
from streaming_models import StreamMessage
from streaming_rules import subscription_key

logger = logging.getLogger("stream_normalizers")


def _timestamp_to_iso(ms_timestamp: Optional[int]) -> str:
    """Convert millisecond Epoch timestamp to ISO-8601 UTC string."""
    if not ms_timestamp:
        return datetime.now(timezone.utc).isoformat()
    try:
        sec = ms_timestamp / 1000.0
        return datetime.fromtimestamp(sec, timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def normalize_massive_quote(raw_data: Dict[str, Any], provider: str = "POLYGON") -> StreamMessage:
    """Normalize Polygon/Massive raw quote WS frame into canonical StreamMessage.

    Raw Polygon Quote Example:
      {"ev": "Q", "sym": "AAPL", "bx": 4, "bp": 182.50, "bs": 10, "ax": 7, "ap": 182.55, "as": 20, "t": 1672531199000}
    """
    symbol = str(raw_data.get("sym") or raw_data.get("symbol") or "UNKNOWN").upper()
    bid_price = float(raw_data.get("bp") or raw_data.get("bid_price") or 0.0)
    ask_price = float(raw_data.get("ap") or raw_data.get("ask_price") or 0.0)
    bid_size = float(raw_data.get("bs") or raw_data.get("bid_size") or 0.0)
    ask_size = float(raw_data.get("as") or raw_data.get("ask_size") or 0.0)
    price = (bid_price + ask_price) / 2.0 if (bid_price > 0 and ask_price > 0) else (bid_price or ask_price or 100.0)

    ts_iso = _timestamp_to_iso(raw_data.get("t") or raw_data.get("timestamp"))

    instrument = Instrument(symbol=symbol, asset_class=AssetClass.EQUITY, exchange=Exchange.NYSE, region=Region.US)

    canonical_quote = Quote(
        instrument=instrument,
        price=price,
        bid=bid_price,
        ask=ask_price,
        bid_size=bid_size,
        ask_size=ask_size,
        timestamp=ts_iso,
        volume=bid_size + ask_size,
        change_24h=0.0,
        change_pct_24h=0.0,
        vwap=price,
    )

    key = subscription_key(DataType.QUOTE, symbol=symbol)

    return StreamMessage(
        message_id=str(uuid.uuid4()),
        key=key,
        symbol=symbol,
        data_type=DataType.QUOTE.value,
        provider=provider,
        timestamp=ts_iso,
        payload=canonical_quote,
        sequence_number=int(raw_data.get("s", 0)),
    )


def normalize_massive_trade(raw_data: Dict[str, Any], provider: str = "POLYGON") -> StreamMessage:
    """Normalize Polygon/Massive raw trade WS frame into canonical StreamMessage.

    Raw Polygon Trade Example:
      {"ev": "T", "sym": "AAPL", "p": 182.52, "s": 100, "t": 1672531199000}
    """
    symbol = str(raw_data.get("sym") or raw_data.get("symbol") or "UNKNOWN").upper()
    trade_price = float(raw_data.get("p") or raw_data.get("price") or 0.0)
    trade_size = float(raw_data.get("s") or raw_data.get("size") or 0.0)
    ts_iso = _timestamp_to_iso(raw_data.get("t") or raw_data.get("timestamp"))

    instrument = Instrument(symbol=symbol, asset_class=AssetClass.EQUITY, exchange=Exchange.NYSE, region=Region.US)

    canonical_quote = Quote(
        instrument=instrument,
        price=trade_price,
        bid=trade_price,
        ask=trade_price,
        bid_size=trade_size,
        ask_size=trade_size,
        timestamp=ts_iso,
        volume=trade_size,
        change_24h=0.0,
        change_pct_24h=0.0,
        vwap=trade_price,
    )

    key = subscription_key(DataType.QUOTE, symbol=symbol)

    return StreamMessage(
        message_id=str(uuid.uuid4()),
        key=key,
        symbol=symbol,
        data_type=DataType.QUOTE.value,
        provider=provider,
        timestamp=ts_iso,
        payload=canonical_quote,
        sequence_number=int(raw_data.get("i", 0)),
    )


def normalize_massive_bar(raw_data: Dict[str, Any], provider: str = "POLYGON") -> StreamMessage:
    """Normalize Polygon/Massive raw aggregate bar WS frame into canonical StreamMessage.

    Raw Polygon Aggregate Bar Example:
      {"ev": "AM", "sym": "AAPL", "v": 1000, "o": 182.0, "c": 182.5, "h": 183.0, "l": 181.8, "s": 1672531199000}
    """
    symbol = str(raw_data.get("sym") or raw_data.get("symbol") or "UNKNOWN").upper()
    open_p = float(raw_data.get("o") or raw_data.get("open") or 0.0)
    high_p = float(raw_data.get("h") or raw_data.get("high") or 0.0)
    low_p = float(raw_data.get("l") or raw_data.get("low") or 0.0)
    close_p = float(raw_data.get("c") or raw_data.get("close") or 0.0)
    vol = float(raw_data.get("v") or raw_data.get("volume") or 0.0)
    ts_iso = _timestamp_to_iso(raw_data.get("s") or raw_data.get("start") or raw_data.get("t"))

    canonical_bar = OHLCBar(
        timestamp=ts_iso,
        open=open_p,
        high=high_p,
        low=low_p,
        close=close_p,
        volume=vol,
    )

    key = subscription_key(DataType.HISTORICAL_BARS, symbol=symbol)

    return StreamMessage(
        message_id=str(uuid.uuid4()),
        key=key,
        symbol=symbol,
        data_type=DataType.HISTORICAL_BARS.value,
        provider=provider,
        timestamp=ts_iso,
        payload=canonical_bar,
        sequence_number=0,
    )
