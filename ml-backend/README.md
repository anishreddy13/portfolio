<div align="center">

# 🤖 ML Backend — Unified AI Inference Service

**6 production ML models served from a single FastAPI microservice**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

> Shared inference platform hosting 6 AI models: Plant Disease, Skin Disease, Emotion Detection,
> Spam Detection, Sentiment Analysis, and AI Interview Analyzer — with real-time prediction workers.

</div>

---

## Models Hosted

| # | Model | Type | Classes | Status |
|---|-------|------|---------|--------|
| 1 | [Plant Disease Detection](#1-plant-disease-detection) | Computer Vision (CNN) | 15 | 🟢 Live |
| 2 | [Skin Disease Detection](#2-skin-disease-detection) | Computer Vision (CNN) | 7 | 🟢 Live |
| 3 | [Emotion Detection](#3-emotion-detection) | NLP (Multi-task) | 28 | 🟢 Live |
| 4 | [Spam Detection](#4-spam-detection) | NLP (Binary) | 2 | 🟢 Live |
| 5 | [Sentiment Analysis](#5-sentiment-analysis) | NLP (3-class) | 3 | 🟢 Live |
| 6 | [AI Interview Analyzer](#6-ai-interview-analyzer) | Speech AI | — | 🟢 Live |

---

## Architecture

```
FastAPI (main.py)
│
├── routes/
│   ├── plant_routes.py         → plant_inference.py → EfficientNet-B0
│   ├── skin_routes.py          → skin_model.py → Custom CNN
│   ├── emotion_routes.py       → emotion_model.py → scikit-learn
│   ├── spam_routes.py          → spam_model.py → scikit-learn
│   ├── sentiment_routes.py     → sentiment_model.py → scikit-learn
│   └── interview_routes.py     → scoring engine
│
├── workers/
│   ├── data_ingestion.py       → RSS feeds → Redis (every 5 min)
│   └── prediction_worker.py    → Redis → ML Model → Supabase
│
├── streaming/                  → WebSocket streaming endpoints
├── services/                   → Business logic layer
├── utils/                      → Shared utilities
└── monitoring/                 → Health metrics
```

---

## 1. Plant Disease Detection

> **97.84% accuracy** · 15 classes · EfficientNet-B0 · Grad-CAM

See [`hf_plant_api/`](../hf_plant_api/README.md) for full documentation.

**Routes served from this backend:**

```
POST /predict/plant    → Top-5 disease predictions
POST /explain/plant    → Predictions + Grad-CAM heatmap
```

**Training:**

```bash
python train_plant.py
# Outputs: plant_model_state_dict_clean.pth
# Dataset: 20,000+ labeled leaf images
```

---

## 2. Skin Disease Detection

> 7-class CNN · Clinical-style confidence breakdown · Risk-oriented result panels

**Model:** Custom CNN trained on HAM10000 dermoscopy dataset.

```
POST /predict/skin
```

**Classes:**

| # | Class | Description |
|---|-------|-------------|
| 1 | Melanocytic nevi | Benign moles |
| 2 | Melanoma | Malignant |
| 3 | Benign keratosis | Non-cancerous |
| 4 | Basal cell carcinoma | Cancerous |
| 5 | Actinic keratoses | Pre-cancerous |
| 6 | Vascular lesions | Vascular |
| 7 | Dermatofibroma | Benign fibrous |

**Request:**

```bash
curl -X POST http://localhost:8000/predict/skin \
  -F "image=@skin.jpg;type=image/jpeg"
```

**Response includes:** top-5 probabilities, risk level, confidence breakdown.

**Training:**

```bash
python train_skin.py
# Model: ResNet-18 / custom CNN, outputs: skin_model.pth (45MB)
```

---

## 3. Emotion Detection

> 28 emotion classes · Multi-task (emotion + gender + age) · Text input

**Model:** scikit-learn pipeline trained on multi-label emotion corpus.

```
POST /predict/emotion
```

**Request:**

```json
{ "text": "I can't believe how amazing this day turned out!" }
```

**Response:**

```json
{
  "primary_emotion": "joy",
  "secondary_emotions": ["excitement", "surprise"],
  "gender_signal": "neutral",
  "age_signal": "adult",
  "confidence_scores": { "joy": 0.87, "excitement": 0.64, ... },
  "ranked_emotions": [...]
}
```

**Training:**

```bash
python train_emotion.py
# Model: emotion_model.pkl (3.9MB)
```

---

## 4. Spam Detection

> SMS-style binary classifier · ham/spam · Keyword surfacing

**Model:** scikit-learn TF-IDF + Naive Bayes / SVM pipeline.

```
POST /predict/spam
```

**Request:**

```json
{ "text": "WINNER!! You have been selected for a FREE prize. Call now!" }
```

**Response:**

```json
{
  "label": "spam",
  "ham_probability": 0.02,
  "spam_probability": 0.98,
  "keywords": ["WINNER", "FREE", "Call now"],
  "confidence": 0.98
}
```

**Training:**

```bash
python train_spam.py
# Model: spam_model.pkl (1.9MB)
```

---

## 5. Sentiment Analysis

> 3-class (positive / negative / neutral) · Confidence bars · History

**Model:** scikit-learn pipeline.

```
POST /predict/sentiment
```

**Request:**

```json
{ "text": "The product quality exceeded my expectations." }
```

**Response:**

```json
{
  "label": "positive",
  "scores": { "positive": 0.91, "neutral": 0.07, "negative": 0.02 },
  "confidence": 0.91
}
```

**Training:**

```bash
python train.py
# Model: sentiment_model.pkl (580KB)
```

---

## 6. AI Interview Analyzer

> Browser-native · Live speech capture · Real-time transcript scoring · Coaching UI

**Technology:** Web Speech API (browser-side) + server-side scoring engine.

```
POST /analyze/interview
```

**Flow:**

```
Browser mic → Web Speech API → transcript
    → POST /analyze/interview
    → Scoring engine (relevance, clarity, depth, confidence)
    → Feedback JSON
    → Frontend coaching UI (InterviewAnalyzer.tsx)
```

**Response:**

```json
{
  "transcript": "...",
  "scores": {
    "relevance": 0.82,
    "clarity": 0.75,
    "depth": 0.68,
    "confidence": 0.90
  },
  "overall_score": 0.79,
  "feedback": ["Strong opening...", "Consider elaborating on..."],
  "coaching_tips": [...]
}
```

---

## Real-Time Worker Pipeline

```
data_ingestion worker
    → Scrapes RSS feeds every 5 minutes
    → Publishes raw text to Redis queue

prediction_worker
    → Consumes from Redis
    → Runs ML inference
    → Stores results in Supabase
```

Start workers:

```bash
python start_workers.py
```

---

## Local Setup

```bash
cd ml-backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_KEY, REDIS_URL, etc.

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000/docs
```

---

## Docker

```bash
# Build
docker build -t ml-backend .

# Run
docker run -p 8000:8000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_KEY=... \
  ml-backend
```

---

## Model Artifacts

| File | Size | Description |
|------|------|-------------|
| `skin_model.pth` | 45MB | Skin disease CNN (PyTorch) |
| `emotion_model.pkl` | 3.9MB | Emotion classifier (sklearn) |
| `spam_model.pkl` | 1.9MB | Spam detector (sklearn) |
| `sentiment_model.pkl` | 580KB | Sentiment classifier (sklearn) |
| `cancer_model.pkl` | 559KB | Cancer risk model (sklearn) |
| `gender_model.pkl` | 13KB | Gender signal model |
| `age_model.pkl` | 23KB | Age signal model |

---

## License

Part of the [Portfolio Platform](../README.md) · [MIT](../LICENSE)