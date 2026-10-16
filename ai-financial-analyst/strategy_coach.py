"""
strategy_coach.py â€” AI Strategy Coach Service

Synthesizes pipeline evaluation outputs into clear, professional, natural-language
explanations using the project's existing ChatGroq AI infrastructure.

If the LLM client is unavailable or encounters errors, falls back seamlessly to a
deterministic explanation builder assembled from pipeline data.

Public API:
  StrategyCoach.generate(pipeline_data) -> StrategyCoachResponse
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from strategy_coach_models import StrategyCoachResponse
from strategy_coach_prompts import (
    STRATEGY_COACH_SYSTEM_PROMPT,
    STRATEGY_COACH_USER_PROMPT_TEMPLATE,
)

logger = logging.getLogger("strategy_coach")


class StrategyCoach:
    """AI Strategy Coach service for synthesizing natural-language analysis.

    Usage::

        coach = StrategyCoach()
        response = coach.generate(pipeline_data)
        print(response.executive_summary)
    """

    def __init__(self, model_name: str = "openai/gpt-oss-120b") -> None:
        self.model_name = model_name
        self._llm: Optional[ChatGroq] = None
        self._init_llm_client()

    def _init_llm_client(self) -> None:
        """Initialize the shared ChatGroq LLM client using existing project pattern."""
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            logger.info("GROQ_API_KEY not found. StrategyCoach will use deterministic fallback mode.")
            return

        try:
            self._llm = ChatGroq(
                model=self.model_name,
                api_key=api_key,
                temperature=0.3,
                max_tokens=2048,
                max_retries=3,
            )
            logger.info("StrategyCoach LLM client initialized successfully with model=%s", self.model_name)
        except Exception as exc:
            logger.warning("Failed to initialize ChatGroq client: %s. Using fallback mode.", exc)
            self._llm = None

    def generate(self, pipeline_data: Dict[str, Any]) -> StrategyCoachResponse:
        """Generate a StrategyCoachResponse from pipeline outputs.

        Args:
            pipeline_data: Dictionary containing parsed_strategy, validation_result,
                           market_context, backtest_summary, paper_summary,
                           strategy_health, and drift_result.

        Returns:
            StrategyCoachResponse instance.
        """
        now = datetime.now(timezone.utc).isoformat()

        if self._llm is not None:
            try:
                logger.info("Generating StrategyCoach analysis via Groq LLM...")
                prompt_text = STRATEGY_COACH_USER_PROMPT_TEMPLATE.format(
                    parsed_strategy=json.dumps(pipeline_data.get("parsed_strategy", {}), indent=2),
                    validation_result=json.dumps(pipeline_data.get("validation_result", {}), indent=2),
                    market_context=json.dumps(pipeline_data.get("market_context", {}), indent=2),
                    backtest_summary=json.dumps(pipeline_data.get("backtest_summary", {}), indent=2),
                    paper_summary=json.dumps(pipeline_data.get("paper_summary", {}), indent=2),
                    strategy_health=json.dumps(pipeline_data.get("strategy_health", {}), indent=2),
                    drift_result=json.dumps(pipeline_data.get("drift_result", {}), indent=2),
                )

                messages = [
                    SystemMessage(content=STRATEGY_COACH_SYSTEM_PROMPT),
                    HumanMessage(content=prompt_text),
                ]

                response = self._llm.invoke(messages)
                content = response.content.strip()

                # Clean markdown JSON block if present
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()

                parsed = json.loads(content)

                return StrategyCoachResponse(
                    executive_summary=parsed.get("executive_summary", ""),
                    strengths=parsed.get("strengths", []),
                    weaknesses=parsed.get("weaknesses", []),
                    risk_observations=parsed.get("risk_observations", []),
                    validation_summary=parsed.get("validation_summary", ""),
                    backtest_interpretation=parsed.get("backtest_interpretation", ""),
                    health_interpretation=parsed.get("health_interpretation", ""),
                    drift_interpretation=parsed.get("drift_interpretation", ""),
                    behavior_summary=parsed.get("behavior_summary", ""),
                    next_operational_steps=parsed.get("next_operational_steps", []),
                    generation_method="llm",
                    timestamp=now,
                )

            except Exception as exc:
                logger.warning("LLM generation failed: %s. Falling back to deterministic analysis.", exc)

        # Deterministic Fallback if LLM is unavailable or fails
        return self._generate_deterministic_fallback(pipeline_data, now)

    # â”€â”€ Deterministic Fallback Builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def _generate_deterministic_fallback(
        self, pipeline_data: Dict[str, Any], timestamp: str
    ) -> StrategyCoachResponse:
        """Assemble a deterministic explanation directly from existing pipeline data."""
        logger.info("Building deterministic fallback explanation from pipeline data...")

        parsed = pipeline_data.get("parsed_strategy", {})
        val = pipeline_data.get("validation_result", {})
        ctx = pipeline_data.get("market_context", {})
        bt = pipeline_data.get("backtest_summary", {})
        health = pipeline_data.get("strategy_health", {})
        drift = pipeline_data.get("drift_result", {})

        asset = parsed.get("asset") or "target asset"
        timeframe = parsed.get("timeframe") or "1d"
        is_valid = val.get("valid", True)
        val_score = val.get("score", 100)
        ret_pct = bt.get("total_return_percent", 0.0)
        win_rate = bt.get("win_rate", 0.0)
        max_dd = bt.get("max_drawdown_percent", 0.0)
        health_score = health.get("current_score", 100)
        health_state = health.get("current_state", "Healthy")
        drift_state = drift.get("current_state", "No Drift")

        exec_summary = (
            f"Strategy evaluation for {asset} ({timeframe}) completed with a validation score of {val_score}/100 "
            f"and an operational health score of {health_score}/100 ({health_state}). "
            f"Historical backtesting yielded a {ret_pct:.1f}% total return with a {win_rate:.1f}% win rate "
            f"and a maximum drawdown of {max_dd:.1f}%."
        )

        strengths: List[str] = []
        if is_valid:
            strengths.append(f"Passed structural validation with a score of {val_score}/100.")
        if win_rate >= 50.0:
            strengths.append(f"Maintains a solid historical win rate of {win_rate:.1f}%.")
        if max_dd <= 15.0:
            strengths.append(f"Demonstrates controlled historical drawdown of {max_dd:.1f}%.")

        weaknesses: List[str] = []
        if not is_valid:
            weaknesses.append("Failed structural validation rules due to parameter or rule errors.")
        if val.get("warnings"):
            weaknesses.extend(val.get("warnings", []))
        if max_dd > 15.0:
            weaknesses.append(f"Historical drawdown is elevated ({max_dd:.1f}%).")

        risk_obs: List[str] = []
        if max_dd > 0:
            risk_obs.append(f"Maximum drawdown recorded at {max_dd:.1f}% during backtesting.")
        if parsed.get("stop_loss"):
            risk_obs.append(f"Stop loss rule set at {parsed.get('stop_loss')}.")
        else:
            risk_obs.append("No explicit stop loss rule detected in parsed strategy.")

        val_summary = f"Strategy structural validation status is {'VALID' if is_valid else 'INVALID'} (Score: {val_score}/100)."
        bt_interp = f"Historical backtest over analyzed series produced {ret_pct:.1f}% total return across {bt.get('total_trades', 0)} trades with Sharpe ratio of {bt.get('sharpe_ratio', 0.0):.2f}."
        health_interp = f"Strategy operational health is assessed as {health_state} (Score: {health_score}/100)."
        drift_interp = f"Behavioral drift status is categorized as '{drift_state}'."
        behavior_summary = f"Execution pattern reflects {ctx.get('regime', 'Ranging')} market regime compatibility under {ctx.get('volatility', 'Medium')} volatility."

        next_steps = [
            "Run paper trading for additional test sessions.",
            "Review backtest equity curve and drawdown metrics.",
            "Inspect strategy health alerts and dimension scores."
        ]

        return StrategyCoachResponse(
            executive_summary=exec_summary,
            strengths=strengths,
            weaknesses=weaknesses,
            risk_observations=risk_obs,
            validation_summary=val_summary,
            backtest_interpretation=bt_interp,
            health_interpretation=health_interp,
            drift_interpretation=drift_interp,
            behavior_summary=behavior_summary,
            next_operational_steps=next_steps,
            generation_method="deterministic_fallback",
            timestamp=timestamp,
        )
