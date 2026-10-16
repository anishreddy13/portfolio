"""
provider_execution.py — Provider Execution Engine

Executes RoutingDecision objects by invoking target providers, applying retry policies
with exponential backoff, handling failover fallback chains, and compiling full
ExecutionTrace metadata logs.

Contains NO routing logic, provider selection, or registry lookups.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Tuple

from market_types import ProviderType
from normalized_response import NormalizedResponse
from provider_execution_models import ExecutionAttempt, ExecutionTrace
from provider_interface import MarketDataProvider
from retry_policy import RetryPolicy
from routing_models import RoutingDecision

logger = logging.getLogger("provider_execution")


class ProviderExecutionEngine:
    """Decoupled execution layer executing RoutingDecision instructions.

    Usage::

        engine = ProviderExecutionEngine()
        response, trace = engine.execute(
            decision=routing_decision,
            providers={ProviderType.POLYGON: polygon_instance},
            call_fn=lambda p: p.get_quote("AAPL")
        )
    """

    def __init__(self, retry_policy: Optional[RetryPolicy] = None) -> None:
        self.retry_policy = retry_policy or RetryPolicy()
        logger.info("ProviderExecutionEngine initialized.")

    def execute_multi(
        self,
        decision: RoutingDecision,
        providers: Dict[ProviderType, MarketDataProvider],
        call_fn: Callable[[MarketDataProvider], NormalizedResponse[Any]],
        candidate_tags: Optional[List[ProviderType]] = None,
    ) -> Tuple[List[NormalizedResponse[Any]], ExecutionTrace]:
        """Execute requests across multiple candidate providers and return all successful NormalizedResponse envelopes.

        Args:
            decision: RoutingDecision specification.
            providers: Dictionary mapping ProviderType tags to concrete MarketDataProvider instances.
            call_fn: Callback executing target API method on provider.
            candidate_tags: List of ProviderType tags to execute against for consensus.

        Returns:
            Tuple of (List[NormalizedResponse], ExecutionTrace).
        """
        start_t = time.monotonic()
        attempts: List[ExecutionAttempt] = []
        successful_responses: List[NormalizedResponse[Any]] = []

        target_tags = candidate_tags or ([decision.selected_provider] + decision.fallback_chain)

        for provider_tag in target_tags:
            provider_instance = providers.get(provider_tag)
            if not provider_instance:
                continue

            attempt_start_t = time.monotonic()
            start_iso = datetime.now(timezone.utc).isoformat()

            try:
                resp = call_fn(provider_instance)
                dur_ms = (time.monotonic() - attempt_start_t) * 1000.0
                end_iso = datetime.now(timezone.utc).isoformat()

                attempts.append(
                    ExecutionAttempt(
                        provider=provider_tag,
                        start_time=start_iso,
                        end_time=end_iso,
                        duration_ms=dur_ms,
                        status="SUCCESS",
                        retry_number=0,
                    )
                )
                if resp and resp.value is not None:
                    successful_responses.append(resp)
            except Exception as exc:
                dur_ms = (time.monotonic() - attempt_start_t) * 1000.0
                end_iso = datetime.now(timezone.utc).isoformat()
                attempts.append(
                    ExecutionAttempt(
                        provider=provider_tag,
                        start_time=start_iso,
                        end_time=end_iso,
                        duration_ms=dur_ms,
                        status="FAILED",
                        error_message=str(exc),
                        retry_number=0,
                    )
                )

        total_dur_ms = (time.monotonic() - start_t) * 1000.0
        trace = ExecutionTrace(
            attempts=attempts,
            successful_provider=successful_responses[0].provider if successful_responses else None,
            total_duration_ms=total_dur_ms,
            fallback_used=len(successful_responses) > 1,
            final_status="COMPLETED" if successful_responses else "FAILED",
        )

        return successful_responses, trace

    def execute(
        self,
        decision: RoutingDecision,
        providers: Dict[ProviderType, MarketDataProvider],
        call_fn: Callable[[MarketDataProvider], NormalizedResponse[Any]],
    ) -> Tuple[NormalizedResponse[Any], ExecutionTrace]:
        """Execute a RoutingDecision using provided provider instances.

        Args:
            decision: RoutingDecision specification from router layer.
            providers: Dictionary mapping ProviderType tags to concrete MarketDataProvider instances.
            call_fn: Callback executing target API method on provider.

        Returns:
            Tuple of (NormalizedResponse, ExecutionTrace).
        """
        start_t = time.monotonic()
        attempts: List[ExecutionAttempt] = []

        # Order of execution: Primary Provider -> Fallback Chain
        execution_order: List[ProviderType] = [decision.selected_provider] + [
            fb for fb in decision.fallback_chain if fb != decision.selected_provider
        ]

        successful_provider: Optional[ProviderType] = None
        final_response: Optional[NormalizedResponse[Any]] = None
        fallback_used = False

        for provider_tag in execution_order:
            provider_instance = providers.get(provider_tag)
            if not provider_instance:
                logger.warning("Provider instance %s not found in execution mapping. Skipping.", provider_tag)
                continue

            if provider_tag != decision.selected_provider:
                fallback_used = True

            # Attempt execution on current provider with retry policy
            attempt_count = 0
            provider_success = False

            while True:
                attempt_start_t = time.monotonic()
                start_iso = datetime.now(timezone.utc).isoformat()

                try:
                    logger.info(
                        "Executing request on provider %s (attempt %d for %s)",
                        provider_tag.value if hasattr(provider_tag, "value") else provider_tag,
                        attempt_count + 1,
                        decision.requested_symbol,
                    )

                    response = call_fn(provider_instance)
                    dur_ms = (time.monotonic() - attempt_start_t) * 1000.0
                    end_iso = datetime.now(timezone.utc).isoformat()

                    attempts.append(
                        ExecutionAttempt(
                            provider=provider_tag,
                            start_time=start_iso,
                            end_time=end_iso,
                            duration_ms=dur_ms,
                            status="SUCCESS",
                            retry_number=attempt_count,
                        )
                    )

                    successful_provider = provider_tag
                    final_response = response
                    provider_success = True
                    break

                except Exception as exc:
                    dur_ms = (time.monotonic() - attempt_start_t) * 1000.0
                    end_iso = datetime.now(timezone.utc).isoformat()
                    err_msg = str(exc)

                    logger.warning(
                        "Execution attempt %d failed on provider %s: %s",
                        attempt_count + 1,
                        provider_tag,
                        err_msg,
                    )

                    attempts.append(
                        ExecutionAttempt(
                            provider=provider_tag,
                            start_time=start_iso,
                            end_time=end_iso,
                            duration_ms=dur_ms,
                            status="FAILED",
                            error_message=err_msg,
                            retry_number=attempt_count,
                        )
                    )

                    # Check retry policy for same provider
                    if self.retry_policy.should_retry(attempt_count, exc):
                        delay_sec = self.retry_policy.next_delay(attempt_count)
                        logger.info("Retrying provider %s in %.2fs...", provider_tag, delay_sec)
                        time.sleep(delay_sec)
                        attempt_count += 1
                    else:
                        logger.warning("Retry policy exhausted for provider %s.", provider_tag)
                        break

            if provider_success:
                break

        total_dur_ms = (time.monotonic() - start_t) * 1000.0

        if final_response is None:
            # Fallback envelope when all attempts fail
            final_response = NormalizedResponse(
                value=None,
                provider=decision.selected_provider,
                confidence=0.0,
                quality_flags=["ALL_EXECUTION_ATTEMPTS_FAILED"],
            )
            final_status = "FAILED"
        else:
            final_status = "COMPLETED"

        trace = ExecutionTrace(
            attempts=attempts,
            successful_provider=successful_provider,
            total_duration_ms=total_dur_ms,
            fallback_used=fallback_used,
            final_status=final_status,
        )

        logger.info(
            "Execution completed. Status: %s, Attempts: %d, Total Duration: %.2fms",
            final_status, len(attempts), total_dur_ms
        )

        return final_response, trace
