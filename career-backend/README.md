---
title: Career Intelligence API
emoji: 🤖
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
---


# Career Intelligence API

FastAPI backend for the portfolio Career Intelligence system. It scrapes job-market signals, extracts skill trends, stores intelligence in Supabase, queues scrape work with Upstash Redis, and uses Groq for AI career mentoring.

## Features

- RapidAPI JSearch job scraping
- GitHub trending repository ingestion
- Keyword-based skill extraction
- Skill demand, velocity, salary momentum, AI risk, and decay scoring
- Student employability analysis
- Six-month AI career roadmap generation
- AI mentor chat with market trend context
- Hugging Face Spaces Docker deployment on port `7860`

## Endpoints

All API endpoints return:

```json
{
  "status": "success",
  "data": {},
  "message": "Human-readable message",
  "timestamp": "2026-05-29T00:00:00+00:00"
}
```

### Health

```bash
GET /
GET /health
```

### Scraping

```bash
POST /scrape/jobs
POST /scrape/github
POST /scrape/all
GET /scrape/status
GET /scrape/logs
```

Example:

```bash
curl -X POST http://localhost:7860/scrape/jobs \
  -H "Content-Type: application/json" \
  -d '{"location":"India"}'
```

### Trends

```bash
GET /trends/skills?limit=50
GET /trends/skills/python
GET /trends/top?limit=10
GET /trends/declining
GET /trends/github
POST /trends/recompute
```

### Student Intelligence

```bash
POST /student/analyze
POST /student/roadmap
GET /student/{user_id}
```

Example:

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

### AI Mentor

```bash
POST /mentor/chat
POST /mentor/analyze-resume
```

## Environment Variables

Set these locally in `.env` or as Hugging Face Space secrets:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GROQ_API_KEY=
RAPIDAPI_KEY=
GITHUB_TOKEN=
HUGGINGFACE_TOKEN=
GEMINI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Run Locally

```bash
cd career-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 7860
```

Open:

- `http://localhost:7860`
- `http://localhost:7860/docs`
- `http://localhost:7860/health`

## Deploy to Hugging Face Spaces

1. Create a Docker Space named `anishreddy13-career-intelligence-api`.
2. Push the contents of `career-backend/` to the Space repository root.
3. Add all environment variables above as Space secrets.
4. Hugging Face Spaces will build the Docker image and serve the app on port `7860`.

Production URL:

```text
https://anishreddy13-career-intelligence-api.hf.space
```

## Notes

- The service is intentionally isolated from the existing Next.js app.
- No frontend routes or existing ML APIs are modified.
- Job scraping handles rate limits and continues when individual API requests fail.
- Supabase and Redis operations are wrapped with logging and graceful failures.
