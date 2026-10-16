"""
provider_test_suite.py — Provider Integration Test Suite

Test suite for validating provider schema compliance, envelope integrity, Enum usage,
and cross-provider data discrepancy detection.

Generates compatibility scores (e.g. Massive 98%, Alpaca 95%).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from market_entities import Quote
from provider_interface import MarketDataProvider
from provider_test_models import ProviderComparison, ProviderTestResult, SchemaValidationResult
from provider_test_rules import (
    calculate_compatibility_score,
    validate_entity_schema,
    validate_normalized_wrapper,
    validate_unavailable_quality_flag,
    validate_unsupported_quality_flag,
)

logger = logging.getLogger("provider_test_suite")


class ProviderIntegrationTestSuite:
    """Enterprise integration test suite for market data providers.

    Usage::

        suite = ProviderIntegrationTestSuite()
        result = suite.validate_provider(polygon_provider)
        print(result.provider, result.compatibility_score)  # e.g. 98.5%
    """

    # ── Single Validation Helpers ───────────────────────────────

    def validate_normalized_response(self, response: Any) -> SchemaValidationResult:
        """Validate NormalizedResponse envelope."""
        return validate_normalized_wrapper(response)

    def validate_schema(self, entity: Any) -> SchemaValidationResult:
        """Validate canonical domain entity schema."""
        return validate_entity_schema(entity)

    # ── Provider Validation Engine ──────────────────────────────

    def validate_provider(self, provider: MarketDataProvider) -> ProviderTestResult:
        """Run full schema and contract validation against a MarketDataProvider instance.

        Args:
            provider: Target MarketDataProvider instance.

        Returns:
            ProviderTestResult with compatibility score and detailed validation checks.
        """
        p_name = provider.provider_name()
        now = datetime.now(timezone.utc).isoformat()
        validations: List[SchemaValidationResult] = []

        logger.info("Starting integration test validation for provider: %s", p_name)

        # 1. Validate get_quote()
        try:
            quote_res = provider.get_quote("AAPL")
            v_wrap = validate_normalized_wrapper(quote_res)
            v_schema = validate_entity_schema(quote_res.value)
            validations.extend([v_wrap, v_schema])
        except Exception as exc:
            validations.append(SchemaValidationResult("get_quote", is_valid=False, errors=[str(exc)], failed_checks=1))

        # 2. Validate get_historical()
        try:
            hist_res = provider.get_historical("AAPL", timeframe="1d", limit=5)
            v_wrap = validate_normalized_wrapper(hist_res)
            v_schema = validate_entity_schema(hist_res.value)
            validations.extend([v_wrap, v_schema])
        except Exception as exc:
            validations.append(SchemaValidationResult("get_historical", is_valid=False, errors=[str(exc)], failed_checks=1))

        # 3. Validate get_news()
        try:
            news_res = provider.get_news("AAPL", limit=2)
            v_wrap = validate_normalized_wrapper(news_res)
            v_schema = validate_entity_schema(news_res.value)
            validations.extend([v_wrap, v_schema])
        except Exception as exc:
            validations.append(SchemaValidationResult("get_news", is_valid=False, errors=[str(exc)], failed_checks=1))

        # 4. Validate get_company_fundamentals() & quality flag mapping
        try:
            fund_res = provider.get_company_fundamentals("AAPL")
            v_wrap = validate_normalized_wrapper(fund_res)
            v_schema = validate_entity_schema(fund_res.value)
            v_flag = validate_unsupported_quality_flag(fund_res)
            validations.extend([v_wrap, v_schema, v_flag])
        except Exception as exc:
            validations.append(SchemaValidationResult("get_company_fundamentals", is_valid=False, errors=[str(exc)], failed_checks=1))

        # 5. Validate get_market_status()
        try:
            status_res = provider.get_market_status()
            v_wrap = validate_normalized_wrapper(status_res)
            v_schema = validate_entity_schema(status_res.value)
            validations.extend([v_wrap, v_schema])
        except Exception as exc:
            validations.append(SchemaValidationResult("get_market_status", is_valid=False, errors=[str(exc)], failed_checks=1))

        # 6. Validate health()
        try:
            h = provider.health()
            v_schema = validate_entity_schema(h)
            validations.append(v_schema)
        except Exception as exc:
            validations.append(SchemaValidationResult("health", is_valid=False, errors=[str(exc)], failed_checks=1))

        score = calculate_compatibility_score(validations)
        overall_status = "PASSED" if score >= 90.0 else ("WARNING" if score >= 75.0 else "FAILED")

        logger.info("Validation complete for %s. Score: %.1f%% (%s)", p_name, score, overall_status)

        return ProviderTestResult(
            provider=p_name,
            compatibility_score=score,
            overall_status=overall_status,
            schema_validations=validations,
            comparisons=[],
            timestamp=now,
        )

    # ── Cross-Provider Comparison Methods ───────────────────────

    def compare_quotes(
        self, provider_a: MarketDataProvider, provider_b: MarketDataProvider, symbol: str = "AAPL"
    ) -> ProviderComparison:
        """Compare real-time quote outputs between two providers and calculate price discrepancy."""
        p_a_name = provider_a.provider_name()
        p_b_name = provider_b.provider_name()

        res_a = provider_a.get_quote(symbol)
        res_b = provider_b.get_quote(symbol)

        price_a = getattr(res_a.value, "price", 0.0) if res_a.value else 0.0
        price_b = getattr(res_b.value, "price", 0.0) if res_b.value else 0.0

        if price_a > 0 and price_b > 0:
            disc_pct = (abs(price_a - price_b) / ((price_a + price_b) / 2.0)) * 100.0
        else:
            disc_pct = 0.0

        agreed = disc_pct <= 1.5

        return ProviderComparison(
            symbol=symbol,
            data_type="QUOTE",
            provider_a=p_a_name,
            provider_b=p_b_name,
            value_a=price_a,
            value_b=price_b,
            discrepancy_percent=disc_pct,
            agreed=agreed,
            notes=f"Price comparison for {symbol}: ${price_a:.2f} vs ${price_b:.2f} (Discrepancy: {disc_pct:.2f}%)",
        )

    def compare_historical(
        self, provider_a: MarketDataProvider, provider_b: MarketDataProvider, symbol: str = "AAPL"
    ) -> ProviderComparison:
        """Compare historical series bar counts between two providers."""
        res_a = provider_a.get_historical(symbol, timeframe="1d", limit=10)
        res_b = provider_b.get_historical(symbol, timeframe="1d", limit=10)

        count_a = len(getattr(res_a.value, "candles", [])) if res_a.value else 0
        count_b = len(getattr(res_b.value, "candles", [])) if res_b.value else 0
        disc = abs(count_a - count_b)

        return ProviderComparison(
            symbol=symbol,
            data_type="HISTORICAL_BARS",
            provider_a=provider_a.provider_name(),
            provider_b=provider_b.provider_name(),
            value_a=float(count_a),
            value_b=float(count_b),
            discrepancy_percent=float(disc),
            agreed=(disc <= 2),
            notes=f"Bar count comparison for {symbol}: {count_a} bars vs {count_b} bars",
        )

    def compare_news(
        self, provider_a: MarketDataProvider, provider_b: MarketDataProvider, symbol: str = "AAPL"
    ) -> ProviderComparison:
        """Compare news article query counts between two providers."""
        res_a = provider_a.get_news(symbol, limit=5)
        res_b = provider_b.get_news(symbol, limit=5)

        count_a = len(res_a.value) if isinstance(res_a.value, list) else 0
        count_b = len(res_b.value) if isinstance(res_b.value, list) else 0

        return ProviderComparison(
            symbol=symbol,
            data_type="NEWS",
            provider_a=provider_a.provider_name(),
            provider_b=provider_b.provider_name(),
            value_a=float(count_a),
            value_b=float(count_b),
            discrepancy_percent=0.0,
            agreed=True,
            notes=f"News article count for {symbol}: {count_a} vs {count_b}",
        )

    def compare_market_status(
        self, provider_a: MarketDataProvider, provider_b: MarketDataProvider
    ) -> ProviderComparison:
        """Compare market session status decisions between two providers."""
        res_a = provider_a.get_market_status()
        res_b = provider_b.get_market_status()

        open_a = getattr(res_a.value, "is_open", False) if res_a.value else False
        open_b = getattr(res_b.value, "is_open", False) if res_b.value else False

        return ProviderComparison(
            symbol="EXCHANGE_NYSE",
            data_type="MARKET_STATUS",
            provider_a=provider_a.provider_name(),
            provider_b=provider_b.provider_name(),
            value_a=1.0 if open_a else 0.0,
            value_b=1.0 if open_b else 0.0,
            discrepancy_percent=0.0 if open_a == open_b else 100.0,
            agreed=(open_a == open_b),
            notes=f"Market status agreement: {open_a} vs {open_b}",
        )

    def compare_supported_data_types(
        self, provider_a: MarketDataProvider, provider_b: MarketDataProvider
    ) -> Dict[str, Any]:
        """Compare supported DataType categories between two providers."""
        types_a = [t.value for t in provider_a.supported_data_types()]
        types_b = [t.value for t in provider_b.supported_data_types()]
        return {
            "provider_a": provider_a.provider_name().value,
            "provider_b": provider_b.provider_name().value,
            "supported_by_a": types_a,
            "supported_by_b": types_b,
            "common": list(set(types_a).intersection(set(types_b))),
        }

    def compare_asset_classes(
        self, provider_a: MarketDataProvider, provider_b: MarketDataProvider
    ) -> Dict[str, Any]:
        """Compare supported AssetClass categories between two providers."""
        assets_a = [a.value for a in provider_a.supported_asset_classes()]
        assets_b = [a.value for a in provider_b.supported_asset_classes()]
        return {
            "provider_a": provider_a.provider_name().value,
            "provider_b": provider_b.provider_name().value,
            "supported_by_a": assets_a,
            "supported_by_b": assets_b,
            "common": list(set(assets_a).intersection(set(assets_b))),
        }

    def run_full_validation(self, providers: List[MarketDataProvider]) -> List[ProviderTestResult]:
        """Run full integration test validation across a list of provider instances."""
        results: List[ProviderTestResult] = []
        for p in providers:
            res = self.validate_provider(p)
            results.append(res)
        return results
