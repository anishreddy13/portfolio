<div align="center">

# 🚀 Anish Reddy — Portfolio Platform

**9 Production-Grade AI/ML Projects** · Full-Stack · Cloud-Native · Enterprise Architecture

[![CI](https://github.com/anishreddy13/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/anishreddy13/portfolio/actions/workflows/ci.yml)
[![Frontend](https://github.com/anishreddy13/portfolio/actions/workflows/frontend.yml/badge.svg)](https://github.com/anishreddy13/portfolio/actions/workflows/frontend.yml)
[![ML Pipeline](https://github.com/anishreddy13/portfolio/actions/workflows/ml_pipeline.yml/badge.svg)](https://github.com/anishreddy13/portfolio/actions/workflows/ml_pipeline.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-6366f1)](https://langchain-ai.github.io/langgraph/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)

</div>

---

## What's Inside

This monorepo is the codebase behind my personal portfolio site. It ships **9 independently deployable AI/ML projects** under a single Next.js frontend, backed by Python microservices, with enterprise-grade tooling throughout.

| # | Project | Category | Status | Stack | Docs |
|---|---------|----------|--------|-------|------|
| 01 | 🌿 **Plant Disease Detection** | Computer Vision | 🟢 Live | PyTorch · EfficientNet-B0 · FastAPI · HF Spaces | [README](hf_plant_api/README.md) |
| 02 | 🏦 **AI Financial Analyst** | Multi-Agent AI | 🟢 Live | LangGraph · PyTorch · Gradio · yfinance | [README](ai-financial-analyst/README.md) |
| 03 | 🤖 **AI Trading CoPilot** | Algorithmic Trading | 🟢 Live | LangGraph · Event Backtesting · Drift Engine | [README](ai-financial-analyst/README.md#trading-copilot) |
| 04 | 🎤 **AI Interview Analyzer** | Speech AI | 🟢 Live | Web Speech API · React · TypeScript | [README](ml-backend/README.md#interview-analyzer) |
| 05 | 🔬 **Skin Disease Detection** | Computer Vision | 🟢 Live | PyTorch · CNN · FastAPI | [README](ml-backend/README.md#skin-disease) |
| 06 | 😊 **Emotion Detection** | NLP | 🟢 Live | scikit-learn · FastAPI · 28 classes | [README](ml-backend/README.md#emotion-detection) |
| 07 | 🛡️ **Spam Detection** | NLP | 🟢 Live | scikit-learn · FastAPI · SMS Classifier | [README](ml-backend/README.md#spam-detection) |
| 08 | 📊 **Sentiment Analysis** | NLP | 🟢 Live | scikit-learn · FastAPI · 3-class | [README](ml-backend/README.md#sentiment-analysis) |
| 09 | 📡 **Live Trading Dashboard** | Real-Time Streaming | 🟢 Live | WebSockets · SingleFlight · SWR Cache | [README](ai-financial-analyst/README.md#live-dashboard) |

---

## Architecture Overview

```
portfolio/
├── src/                        # Next.js 15 frontend (TypeScript)
│   ├── components/             # 85+ React components
│   ├── data/                   # Project & certificate metadata
│   └── app/                    # App Router pages
│
├── ai-financial-analyst/       # 🏦 Enterprise trading platform
│   ├── agents.py               # 5-agent LangGraph orchestration
│   ├── neural_chart_*.py       # CNN + Transformer chart model
│   ├── trading_copilot.py      # AI Trading CoPilot
│   ├── trading_dashboard.py    # Live Trading Dashboard
│   └── 190+ Python modules     # Risk, execution, compliance, OMS…
│
├── ml-backend/                 # 🤖 Shared ML inference service
│   ├── main.py                 # FastAPI app (emotion, spam, sentiment, skin, plant, interview)
│   ├── routes/                 # Per-model route handlers
│   ├── workers/                # Streaming prediction workers
│   └── training/               # Model training pipelines
│
├── hf_plant_api/               # 🌿 Plant disease HF Spaces deployment
│   ├── app.py                  # Standalone FastAPI (EfficientNet-B0 + Grad-CAM)
│   └── plant_inference.py
│
├── career-backend/             # 💼 Career Intelligence API
│   ├── main.py                 # Job market signals, skill trends, AI mentor
│   └── routes/                 # /trends, /student, /mentor endpoints
│
├── hf-career-space/            # 🚀 HF Spaces career deployment
│
├── terraform/                  # ☁️ Infrastructure as Code
├── kubernetes/                 # ☸️ K8s manifests
├── docker/                     # 🐳 Docker Compose configs
├── monitoring/                 # 📈 Observability stack
├── docs/                       # 📚 Service catalog & guides
└── .github/workflows/          # 🔄 CI/CD pipelines
```

---

## Quick Start

### Frontend

```bash
# 1. Copy environment variables
cp .env.example .env.local
# Fill in your Supabase, Groq, and other service keys

# 2. Install dependencies
npm ci

# 3. Run development server
npm run dev
# → http://localhost:3000
```

### ML Backend (Python services)

```bash
cd ml-backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000/docs
```

### AI Financial Analyst

```bash
cd ai-financial-analyst
pip install -r requirements.txt
python app.py
# → Gradio interface at http://localhost:7860
```

### Docker (full stack)

```bash
docker compose -f docker/docker-compose.yml up
```

---

## Key Metrics Across Projects

| Metric | Value |
|--------|-------|
| Total Projects | 9 |
| Python Modules (AI Financial Analyst alone) | 198 |
| React Components | 85+ |
| ML Models Served | 6 |
| LangGraph Agents | 5 |
| API Endpoints | 30+ |
| Test Coverage | Unit + Integration |
| CI/CD Pipelines | 4 (ci, deploy, frontend, ml_pipeline) |

---

## Services Catalog

See [docs/SERVICES.md](docs/SERVICES.md) for individual service boundaries, ports, and local setup instructions.

---

## Security Notes

- Apply [`scripts/secure_contact_submissions.sql`](scripts/secure_contact_submissions.sql) before enabling the contact endpoint.
- Set `CONTACT_RATE_LIMIT_SALT` to a high-entropy secret.
- Only enable `TRUST_PROXY_HEADERS` behind a proxy that overwrites forwarding headers.
- Configure explicit `ALLOWED_ORIGINS` for every Python service.
- Analytics are opt-in and collect no IP address or location data.

---

## Pre-commit Checklist

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run build       # Next.js production build
python -m py_compile ai-financial-analyst/*.py  # Python syntax
```

---

## License

[MIT](LICENSE) · Built by [Anish Reddy](https://github.com/anishreddy13)
