from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import uvicorn
from model import predict_sentiment, load_model
from spam_model import predict_spam, load_spam_model
from emotion_model import predict_emotion, load_emotion_models

SENTIMENT_MODEL_PATH = "sentiment_model.pkl"
SPAM_MODEL_PATH = "spam_model.pkl"
EMOTION_MODEL_PATH = "emotion_model.pkl"

sentiment_pipeline = None
spam_pipeline = None
emotion_pipeline = None
gender_pipeline = None
age_pipeline = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sentiment_pipeline, spam_pipeline
    global emotion_pipeline, gender_pipeline, age_pipeline

    if not os.path.exists(SENTIMENT_MODEL_PATH):
        raise RuntimeError("Run: python train.py")
    if not os.path.exists(SPAM_MODEL_PATH):
        raise RuntimeError("Run: python train_spam.py")
    if not os.path.exists(EMOTION_MODEL_PATH):
        raise RuntimeError("Run: python train_emotion.py")

    sentiment_pipeline = load_model(SENTIMENT_MODEL_PATH)
    spam_pipeline = load_spam_model(SPAM_MODEL_PATH)
    emotion_pipeline, gender_pipeline, age_pipeline = load_emotion_models()

    print("✅ Sentiment model loaded!")
    print("✅ Spam model loaded!")
    print("✅ Emotion + Gender + Age models loaded!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="ML Portfolio API",
    description="Sentiment + Spam + Emotion + Gender + Age — no external APIs",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextInput(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    scores: dict
    cleaned_text: str
    original_text: str


class SpamResponse(BaseModel):
    label: str
    confidence: float
    scores: dict
    spam_keywords_found: list
    cleaned_text: str
    original_text: str
    is_spam: bool


class EmotionItem(BaseModel):
    emotion: str
    score: float
    emoji: str
    color: str


class EmotionResponse(BaseModel):
    primary_emotion: str
    emotion_emoji: str
    emotion_color: str
    emotion_confidence: float
    top_emotions: List[EmotionItem]
    gender: str
    gender_confidence: float
    gender_scores: dict
    age_group: str
    age_confidence: float
    age_scores: dict
    cleaned_text: str
    original_text: str


@app.get("/")
def root():
    return {
        "message": "ML Portfolio API v3.0",
        "models": [
            "sentiment-analysis",
            "spam-detector",
            "emotion-gender-age"
        ],
        "status": "healthy"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "sentiment_model": sentiment_pipeline is not None,
        "spam_model": spam_pipeline is not None,
        "emotion_model": emotion_pipeline is not None,
        "gender_model": gender_pipeline is not None,
        "age_model": age_pipeline is not None,
    }


@app.post("/predict", response_model=SentimentResponse)
def predict_sentiment_route(input: TextInput):
    if not input.text or len(input.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(input.text) > 1000:
        raise HTTPException(status_code=400, detail="Max 1000 characters")
    if sentiment_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    result = predict_sentiment(input.text, sentiment_pipeline)
    return SentimentResponse(
        sentiment=result['sentiment'],
        confidence=result['confidence'],
        scores=result['scores'],
        cleaned_text=result['cleaned_text'],
        original_text=input.text
    )


@app.post("/predict/spam", response_model=SpamResponse)
def predict_spam_route(input: TextInput):
    if not input.text or len(input.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(input.text) > 2000:
        raise HTTPException(status_code=400, detail="Max 2000 characters")
    if spam_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    result = predict_spam(input.text, spam_pipeline)
    return SpamResponse(
        label=result['label'],
        confidence=result['confidence'],
        scores=result['scores'],
        spam_keywords_found=result['spam_keywords_found'],
        cleaned_text=result['cleaned_text'],
        original_text=input.text,
        is_spam=result['is_spam']
    )


@app.post("/predict/emotion", response_model=EmotionResponse)
def predict_emotion_route(input: TextInput):
    if not input.text or len(input.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(input.text) > 1000:
        raise HTTPException(status_code=400, detail="Max 1000 characters")
    if emotion_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    result = predict_emotion(
        input.text, emotion_pipeline, gender_pipeline, age_pipeline
    )
    return EmotionResponse(
        primary_emotion=result['primary_emotion'],
        emotion_emoji=result['emotion_emoji'],
        emotion_color=result['emotion_color'],
        emotion_confidence=result['emotion_confidence'],
        top_emotions=[EmotionItem(**e) for e in result['top_emotions']],
        gender=result['gender'],
        gender_confidence=result['gender_confidence'],
        gender_scores=result['gender_scores'],
        age_group=result['age_group'],
        age_confidence=result['age_confidence'],
        age_scores=result['age_scores'],
        cleaned_text=result['cleaned_text'],
        original_text=input.text
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )