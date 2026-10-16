---
title: AI Financial Analyst
emoji: 🏦
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: 6.20.0
app_file: app.py
pinned: false
license: apache-2.0
---

<div align="center">

# 🏦 AI Financial Analyst + Trading Platform

**Enterprise-grade financial intelligence & algorithmic trading platform**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-6366f1)](https://langchain-ai.github.io/langgraph/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Gradio](https://img.shields.io/badge/Gradio-6.20-orange?logo=gradio)](https://gradio.app/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![HF Spaces](https://img.shields.io/badge/HuggingFace-Spaces-FFD21E?logo=huggingface)](https://huggingface.co/spaces)

> A 5-agent LangGraph financial research system + full algorithmic trading platform with a custom
> PyTorch CNN+Transformer chart model, paper trading, event-driven backtesting, real-time
> streaming, and an enterprise OMS — all backed by 198 Python modules.

</div>

---

## Projects in This Directory

This directory contains **three interconnected products**:

1. **[AI Financial Analyst](#1-ai-financial-analyst)** — 5-agent investment research & reporting
2. **[AI Trading CoPilot](#2-ai-trading-copilot)** — Strategy builder, backtester & AI coach
3. **[Live Trading Dashboard](#3-live-trading-dashboard)** — Real-time streaming market dashboard

---

## 1. AI Financial Analyst

### What It Does

An enterprise financial intelligence platform orchestrated by **5 specialized LangGraph agents**:

| Agent | Role |
|-------|------|
| 🔎 Researcher | SEC filings, news aggregation, market context |
| 📐 Quant | Factor models, statistical analysis, return attribution |
| 🧾 Auditor | Audit rules, compliance checks, risk scoring |
| 🏢 Competitor | Peer benchmarking, industry comparison |
| ✍️ Editor | Structured report synthesis, narrative generation |

### Architecture

```
User Query
    │
    ▼
┌──────────────────────────────────────────────────┐
│                 LangGraph Orchestrator            │
│  (graph.py → agents.py → trading_agents.py)      │
│                                                  │
│  [Researcher] → [Quant] → [Auditor]              │
│       ↓              ↓         ↓                 │
│  [Competitor] ─────────→ [Editor]                │
└──────────────────────────────────────────────────┘
    │
    ├── Neural Chart Vision (CNN + Transformer)
    ├── Social Sentiment Feed
    ├── Portfolio Rebalancer
    ├── Factor Model Engine
    ├── Multi-Portfolio Manager
    └── XAI Explainability (ml_explainer.py)
```

### Neural Chart Vision (PyTorch)

A custom **multimodal CNN + Transformer** model trained on candlestick chart images:

```bash
# Phase 1: Build training dataset
python neural_chart_dataset.py \
  --tickers AAPL,MSFT,NVDA,TSLA,AMZN \
  --period 5y --windows 60,90,120 --stride 5 \
  --render-images --output-dir dataset/neural_chart_vision

# Phase 2: Train model
python neural_chart_trainer.py \
  --dataset-dir dataset/neural_chart_vision \
  --output-dir models/neural_chart_vision/v1 \
  --epochs 40

# Phase 3: Run inference
python neural_chart_inference.py AAPL \
  --model-path models/neural_chart_vision/v1/model.pt
```

**Model outputs per ticker:**
- Chart pattern probabilities
- 5-day return prediction
- `attention_timeline` — per-session attention intensity for x-ray strip
- `key_levels` — support, resistance, VWAP
- `evidence` — momentum, volume, volatility, RSI cards

### API Endpoints (via Gradio Space)

| Endpoint | Description |
|----------|-------------|
| `POST /run_financial_analysis` | Full 5-agent research report |
| `POST /get_neural_chart_vision` | CNN+Transformer chart analysis |
| `POST /rebalance_portfolio` | Portfolio optimization |
| `POST /get_factor_model` | Multi-factor attribution |
| `POST /get_market_signals` | Real-time signals |
| `POST /get_social_sentiment` | Social sentiment aggregation |
| `POST /get_market_context` | Macro context engine |
| `POST /get_financial_statements` | SEC EDGAR financials |
| `POST /get_competitor_analysis` | Peer benchmarking |
| `POST /get_market_regime` | Regime detection |
| `GET /get_service_health` | Production health check |

---

## 2. AI Trading CoPilot

### What It Does

Build, backtest, monitor, and improve trading strategies using **natural language** and autonomous validation.

```
User: "Create a momentum strategy for AAPL with 2% stop loss"
    │
    ▼
┌─────────────────────────────────────────┐
│          Trading CoPilot (9-node graph)  │
│                                         │
│  Parse → Validate → Context Analysis    │
│      → Backtest (Event-Driven)          │
│      → Paper Trade → Drift Detection    │
│      → Health Monitor → AI Coach        │
└─────────────────────────────────────────┘
```

### Key Features

| Feature | Detail |
|---------|--------|
| **Strategy Builder** | Natural language → parsed strategy config |
| **Event-Driven Backtester** | Tick-level simulation, slippage, commission models |
| **Paper Trading Engine** | Live paper session with P&L tracking |
| **Drift Detection** | 10-dimensional strategy health scoring |
| **AI Strategy Coach** | GPT-powered coaching on underperforming strategies |
| **Multi-Portfolio** | Manage multiple strategies simultaneously |
| **OMS** | Order Management System with execution simulation |
| **Compliance Engine** | Pre-trade rule validation |

### Modules

```
trading_copilot.py          # Main CoPilot orchestrator
trading_agents.py           # Autonomous trading agent nodes
strategy_parser.py          # NL → strategy config parser
strategy_validator.py       # Rule-based validation
backtest_engine.py          # Event-driven backtester
backtester.py               # Historical replay engine
paper_trader.py             # Paper trading session manager
drift_detector.py           # 10-dim health monitoring
strategy_coach.py           # AI performance coaching
order_management_system.py  # Order lifecycle management
risk_engine.py              # Real-time risk limits
execution_manager.py        # Smart order routing
compliance_engine.py        # Pre/post-trade compliance
```

---

## 3. Live Trading Dashboard

### What It Does

A **Phase 5** real-time trading dashboard consuming:
- **EnterpriseMarketCache** — multi-provider market data with SWR
- **SingleFlight Request Coordinator** — deduplication of concurrent requests
- **Streaming Consensus Engine** — real-time multi-provider data reconciliation
- **AI Strategy Coach** — live coaching integrated into the UI

### Key Components

```
trading_dashboard.py            # Core dashboard orchestrator
market_cache.py                 # Enterprise SWR cache (16K lines)
request_coordinator.py          # SingleFlight deduplication
streaming_consensus_engine.py   # Multi-provider consensus
stream_cache_bridge.py          # Streaming ↔ cache bridge
dashboard_scheduler.py          # Background refresh scheduler
```

### Dashboard Features

- Live watchlist with real-time quotes
- Provider health matrix (3 active providers)
- 0ms SWR latency via cache
- Real-time telemetry meters
- Strategy drift alerts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Orchestration | LangGraph (9-node graph) |
| ML / Deep Learning | PyTorch, CNN+Transformer |
| Financial Data | yfinance, SEC EDGAR (sec_tools.py) |
| News & Sentiment | news_aggregator.py, sentiment_engine.py |
| Explainability | Grad-CAM, SHAP (ml_explainer.py) |
| API Interface | Gradio 6.20 |
| Broker Adapters | broker_gateway.py (Alpaca-style API) |
| Risk Management | risk_engine.py |
| Persistence | persistence_manager.py |
| Observability | observability_engine.py |
| High Availability | ha_engine.py |
| Security | identity_engine.py, security_engine.py |

---

## Local Setup

```bash
cd ai-financial-analyst

# Create virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set environment variables
export OPENAI_API_KEY=sk-...
export GROQ_API_KEY=gsk_...

# Launch Gradio app
python app.py
# → http://localhost:7860
```

---

## Scale of the Codebase

| Metric | Value |
|--------|-------|
| Python modules | 198 |
| LangGraph agents | 5 |
| Trading graph nodes | 9 |
| Gradio API endpoints | 11 |
| Risk dimensions monitored | 10 |
| Strategy health dimensions | 10 |
| Broker adapter protocols | 3+ |
| Market data providers | 3 active |

---

## HuggingFace Space Deployment

This service is deployed as a Gradio Docker Space on Hugging Face Spaces.

- **Space URL:** `https://anishreddy13-ai-financial-analyst.hf.space`
- **Health check:** `GET /get_service_health`
- **Config:** See frontmatter in `README.md` (sdk: gradio, sdk_version: 6.20.0)

Set `NEURAL_CHART_MODEL_PATH` if the trained `model.pt` lives somewhere other than the default.
When no model bundle is present, the endpoint returns a live heuristic fallback with the same
JSON shape so the frontend visuals remain fully functional.

---

## License

Part of the [Portfolio Platform](../README.md) · [MIT](../LICENSE)
