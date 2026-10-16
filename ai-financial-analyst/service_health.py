"""
service_health.py - Phase 5 production health payload for the analyst Space.

The endpoint is intentionally lightweight: it checks import/runtime readiness
without calling external market or LLM APIs, so the frontend can distinguish a
healthy Space from slow downstream data providers.
"""

from __future__ import annotations

import importlib.util
import json
import os
import platform
from datetime import datetime, timezone
from pathlib import Path


def _module_ready(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


def get_service_health() -> str:
    model_path = Path(os.getenv("NEURAL_CHART_MODEL_PATH", "models/neural_chart_vision/v1/model.pt"))
    checks = {
        "gradio": _module_ready("gradio"),
        "yfinance": _module_ready("yfinance"),
        "pandas": _module_ready("pandas"),
        "numpy": _module_ready("numpy"),
        "torch": _module_ready("torch"),
        "prophet": _module_ready("prophet"),
        "langchain_groq": _module_ready("langchain_groq"),
        "neural_model_bundle": model_path.exists(),
    }
    required = ["gradio", "yfinance", "pandas", "numpy", "langchain_groq"]
    status = "online" if all(checks[name] for name in required) else "degraded"

    return json.dumps({
        "status": status,
        "phase": 5,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "python": platform.python_version(),
        "model_path": str(model_path),
        "checks": checks,
        "features": {
            "market_signals": checks["yfinance"],
            "watchlist_metrics": checks["yfinance"],
            "portfolio_rebalancer": checks["langchain_groq"],
            "neural_chart_vision": checks["numpy"] and checks["pandas"],
            "deep_learning_bundle": checks["torch"] and checks["neural_model_bundle"],
        },
    })
