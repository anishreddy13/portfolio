<div align="center">

# 💼 Career Intelligence API

**AI-powered job market signal engine with skill trend analysis and personalized career coaching**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Groq](https://img.shields.io/badge/Groq-AI%20Mentor-f97316)](https://groq.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Upstash%20Redis-DC382D?logo=redis&logoColor=white)](https://upstash.com/)
[![HF Spaces](https://img.shields.io/badge/HuggingFace-Spaces-FFD21E?logo=huggingface)](https://huggingface.co/spaces/anishreddy13/career-intelligence-api)

> Scrapes real-time job market data, extracts skill demand trends, scores employability, generates
> 6-month AI career roadmaps, and powers an AI mentor with live market context — all backed by
> Supabase, Upstash Redis, and Groq LLM.

</div>

---

## What It Does

| Feature | Description |
|---------|-------------|
| 🔍 **Job Scraping** | RapidAPI JSearch integration — scrapes live job postings |
| 📈 **GitHub Trending** | Ingests trending repos to surface emerging tech skills |
| 🧠 **Skill Intelligence** | Extracts keywords, scores demand, velocity, salary momentum |
| 🤖 **AI Risk Scoring** | Flags skills at risk of AI automation |
| 📊 **Decay Scoring** | Detects declining tech skills before they become obsolete |
| 👤 **Student Analysis** | Employability score based on resume vs. market trends |
| 🗺️ **Career Roadmap** | AI-generated 6-month personalized learning roadmap |
| 💬 **AI Mentor** | Groq-powered chat with live market trend context |

---

## Architecture

```
Career Intelligence API (FastAPI)
│
├── routes/
│   ├── scraping_routes.py      → RapidAPI JSearch + GitHub trending
│   ├── trends_routes.py        → Skill demand scoring & analytics
│   ├── student_routes.py       → Employability analysis & roadmaps
│   └── mentor_routes.py        → Groq AI mentor chat
│
├── services/
│   ├── scraper_service.py      → Job & GitHub data ingestion
│   ├── skill_extractor.py      → Keyword-based skill extraction
│   ├── trend_scorer.py         → Demand velocity, salary, AI risk
│   └── mentor_service.py       → Groq chat with market context
│
├── workers/
│   └── scrape_worker.py        → Async background scraping
│
├── db/
│   └── supabase_client.py      → Supabase persistence
│
├── training/                   → MLflow experiment tracking
│   └── mlflow_tracking.py
│
└── utils/
    └── redis_client.py         → Upstash Redis queue
```

---

## API Endpoints

All endpoints return a standard envelope:

```json
{
  "status": "success",
  "data": {},
  "message": "Human-readable message",
  "timestamp": "2026-09-23T00:00:00+00:00"
}
```

### Health

```bash
GET  /          # Root check
GET  /health    # Detailed health status
```

### Scraping

```bash
POST /scrape/jobs       # Scrape job postings (body: {"location": "India"})
POST /scrape/github     # Scrape GitHub trending repos
POST /scrape/all        # Run both scrapers
GET  /scrape/status     # Scraper status
GET  /scrape/logs       # Scraper execution logs
```

**Example:**

```bash
curl -X POST http://localhost:7860/scrape/jobs \
  -H "Content-Type: application/json" \
  -d '{"location": "India"}'
```

### Skill Trends

```bash
GET  /trends/skills?limit=50     # Top N skills by demand score
GET  /trends/skills/{skill}      # Detail for a specific skill
GET  /trends/top?limit=10        # Top 10 trending skills
GET  /trends/declining           # Skills with falling demand
GET  /trends/github              # GitHub-derived trending tech
POST /trends/recompute           # Trigger full trend recomputation
```

### Student Intelligence

```bash
POST /student/analyze    # Analyze resume against market trends
POST /student/roadmap    # Generate 6-month AI career roadmap
GET  /student/{user_id}  # Retrieve previous analysis
```

**Example — analyze resume:**

```bash
curl -X POST http://localhost:7860/student/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo-user",
    "name": "Demo Student",
    "resume_text": "Python, React, FastAPI, Docker, PyTorch",
    "skills": ["python", "react"],
    "target_role": "AI engineer"
  }'
```

**Response includes:**
- `employability_score` — 0–100 market fit rating
- `skill_gaps` — skills in demand that are missing from resume
- `strength_skills` — resume skills with high market velocity
- `ai_risk_skills` — skills at risk of automation
- `roadmap` — 6-month week-by-week learning plan

### AI Mentor

```bash
POST /mentor/chat             # Conversational AI career advice
POST /mentor/analyze-resume   # Resume critique with market context
```

**Example:**

```bash
curl -X POST http://localhost:7860/mentor/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo-user",
    "message": "Should I learn Rust or stay with Python for AI roles?",
    "context": "market_trends"
  }'
```

---

## Skill Scoring Model

Each skill is scored across 5 dimensions:

| Dimension | Description |
|-----------|-------------|
| **Demand** | Raw job posting frequency |
| **Velocity** | Week-over-week growth rate |
| **Salary Momentum** | Correlation with high-salary listings |
| **AI Risk** | Probability of automation impact |
| **Decay Score** | Trend of declining mentions |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# AI / LLM
GROQ_API_KEY=
GEMINI_API_KEY=

# Data Sources
RAPIDAPI_KEY=
GITHUB_TOKEN=
HUGGINGFACE_TOKEN=

# Cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Local Setup

```bash
cd career-backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Fill in API keys above

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 7860
```

Open:
- API: `http://localhost:7860`
- Swagger Docs: `http://localhost:7860/docs`
- Health: `http://localhost:7860/health`

---

## Docker

```bash
# Build
docker build -t career-intelligence-api .

# Run
docker run -p 7860:7860 \
  --env-file .env \
  career-intelligence-api
```

---

## HuggingFace Spaces Deployment

```bash
# Push career-backend/ contents to HF Space repo root
# Add all env vars as Space Secrets
```

**Production URL:**

```
https://anishreddy13-career-intelligence-api.hf.space
```

---

## Design Notes

- **Isolated service** — no dependencies on the Next.js frontend or ML inference APIs
- **Rate-limit aware** — scraping handles API failures gracefully and continues partial results
- **Supabase + Redis** — all operations are wrapped with logging and graceful fallbacks
- **MLflow tracking** — experiment tracking for skill model iterations

---

## License

Part of the [Portfolio Platform](../README.md) · [MIT](../LICENSE)
