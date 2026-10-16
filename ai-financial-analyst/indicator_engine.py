"""
indicator_engine.py — Technical Indicator Computation Engine

High-level, reusable backend service for calculating technical indicators from
HistoricalSeries OHLCV data using the IndicatorRegistry.

Supports batch execution (compute_many) to calculate multiple indicators in a
single pass efficiently.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import pandas as pd

from indicator_models import (
    IndicatorCalculationError,
    IndicatorRequest,
    IndicatorResult,
    InsufficientDataError,
    InvalidParameterError,
)
from indicator_registry import IndicatorRegistry, global_registry
from market_models import HistoricalSeries

logger = logging.getLogger("indicator_engine")


class IndicatorEngine:
    """Core calculation engine for technical indicators.

    Usage::

        engine = IndicatorEngine()
        result = engine.compute(series, "RSI", period=14)
        print(result.latest)

        # Batch execution
        batch = engine.compute_many(series, [
            "EMA20",
            {"indicator": "RSI", "parameters": {"period": 14}},
            IndicatorRequest(indicator="MACD", parameters={"fast": 12, "slow": 26})
        ])
    """

    def __init__(self, registry: Optional[IndicatorRegistry] = None) -> None:
        self._registry = registry or global_registry
        logger.info("IndicatorEngine initialized with %d indicators.", len(self._registry.list_available()))

    def available_indicators(self) -> List[str]:
        """Return list of supported indicator names."""
        return self._registry.list_available()

    # ── Single Indicator Computation ──────────────────────────

    def compute(
        self,
        series: HistoricalSeries,
        indicator_name: str,
        **params: Any,
    ) -> IndicatorResult:
        """Compute a single technical indicator for a HistoricalSeries.

        Args:
            series: HistoricalSeries object containing OHLCV candles.
            indicator_name: Name of the indicator (e.g. 'EMA', 'RSI', 'MACD').
            **params: Additional parameter kwargs (e.g. period=20).

        Returns:
            IndicatorResult object containing series values and latest scalar.

        Raises:
            InsufficientDataError: If not enough candles are available.
            InvalidParameterError: If parameter constraints are violated.
            IndicatorCalculationError: On calculation failure or unknown indicator.
        """
        # Unroll enterprise consensus wrappers if passed
        if hasattr(series, "normalized_response"):
            series = series.normalized_response.value
        elif hasattr(series, "value"):
            series = series.value

        if not series or not hasattr(series, "candles") or not series.candles:
            raise InsufficientDataError(
                f"HistoricalSeries for '{getattr(series, 'symbol', 'UNKNOWN')}' contains 0 candles.",
                indicator=indicator_name,
                symbol=getattr(series, "symbol", ""),
            )

        calculator = self._registry.get(indicator_name)
        min_req = calculator.min_candles(params)

        if len(series.candles) < min_req:
            raise InsufficientDataError(
                f"Indicator '{indicator_name}' requires at least {min_req} candles, "
                f"but series '{series.symbol}' only has {len(series.candles)} candles.",
                indicator=indicator_name,
                symbol=series.symbol,
            )

        logger.debug(
            "Computing %s for symbol=%s (%d candles)",
            indicator_name, series.symbol, len(series.candles)
        )

        df = self._series_to_dataframe(series)

        try:
            values, latest = calculator.calculate(df, params)
            latest_timestamp = getattr(series.candles[-1], "timestamp", getattr(series.candles[-1], "date", "")) if series.candles else ""

            return IndicatorResult(
                indicator=calculator.name,
                parameters=params,
                values=values,
                latest=latest,
                timestamp=latest_timestamp,
            )
        except IndicatorCalculationError:
            raise
        except Exception as exc:
            logger.exception("Failed computing %s: %s", indicator_name, exc)
            raise IndicatorCalculationError(
                f"Calculation failed for indicator '{indicator_name}': {exc}",
                indicator=indicator_name,
                symbol=series.symbol,
            ) from exc

    # ── Multi Indicator Computation ──────────────────────────

    def compute_many(
        self,
        series: HistoricalSeries,
        requests: List[Union[IndicatorRequest, Dict[str, Any], str]],
    ) -> Dict[str, IndicatorResult]:
        """Compute multiple indicators in a single efficient pass over shared data.

        Args:
            series: HistoricalSeries object containing OHLCV candles.
            requests: List of IndicatorRequest objects, dicts, or indicator names/codes
                      (e.g., ["EMA20", "RSI14", {"indicator": "MACD"}]).

        Returns:
            Dict mapping key/code -> IndicatorResult object.
        """
        if not requests:
            return {}

        results: Dict[str, IndicatorResult] = {}
        df = self._series_to_dataframe(series)

        for req in requests:
            indicator_name, params, result_key = self._normalize_request(req)
            try:
                calculator = self._registry.get(indicator_name)
                min_req = calculator.min_candles(params)

                if len(series.candles) < min_req:
                    raise InsufficientDataError(
                        f"Indicator '{indicator_name}' requires at least {min_req} candles.",
                        indicator=indicator_name,
                        symbol=series.symbol,
                    )

                values, latest = calculator.calculate(df, params)
                latest_timestamp = series.candles[-1].date if series.candles else ""

                results[result_key] = IndicatorResult(
                    indicator=calculator.name,
                    parameters=params,
                    values=values,
                    latest=latest,
                    timestamp=latest_timestamp,
                )
            except Exception as exc:
                logger.warning("Failed computing batch item '%s': %s", result_key, exc)
                # Store null result container instead of crashing entire batch
                results[result_key] = IndicatorResult(
                    indicator=indicator_name,
                    parameters=params,
                    values=[],
                    latest=None,
                    timestamp="",
                )

        return results

    # ── Helpers ────────────────────────────────────────────────

    @staticmethod
    def _series_to_dataframe(series: HistoricalSeries) -> pd.DataFrame:
        """Convert HistoricalSeries to clean pandas DataFrame."""
        records = [
            {
                "date": getattr(c, "timestamp", getattr(c, "date", "")),
                "open": float(c.open),
                "high": float(c.high),
                "low": float(c.low),
                "close": float(c.close),
                "volume": float(c.volume),
            }
            for c in series.candles
        ]
        df = pd.DataFrame(records)
        return df

    @staticmethod
    def _normalize_request(req: Union[IndicatorRequest, Dict[str, Any], str]) -> tuple[str, Dict[str, Any], str]:
        """Parse shortcut request strings (e.g. 'EMA20', 'RSI14') into (indicator, params, key)."""
        if isinstance(req, IndicatorRequest):
            key = req.indicator
            if req.parameters and "period" in req.parameters:
                key = f"{req.indicator}{req.parameters['period']}"
            return req.indicator, req.parameters, key

        if isinstance(req, dict):
            ind = req.get("indicator", "")
            params = req.get("parameters", {})
            key = req.get("key") or (f"{ind}{params.get('period')}" if "period" in params else ind)
            return ind, params, key

        if isinstance(req, str):
            code = req.strip().upper()
            import re
            match = re.match(r"^([A-Z_]+)([0-9]+)$", code)
            if match:
                ind_name, p_str = match.groups()
                return ind_name, {"period": int(p_str)}, code
            return code, {}, code

        raise InvalidParameterError(f"Invalid indicator request type: {type(req)}")
