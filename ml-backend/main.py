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
from cancer_model import predict_cancer, load_cancer_model, FEATURE_RANGES, MALIGNANT_SAMPLE, BENIGN_SAMPLE

SENTIMENT_MODEL_PATH = "sentiment_model.pkl"
SPAM_MODEL_PATH      = "spam_model.pkl"
EMOTION_MODEL_PATH   = "emotion_model.pkl"
CANCER_MODEL_PATH    = "cancer_model.pkl"

sentiment_pipeline = None
spam_pipeline      = None
emotion_pipeline   = None
gender_pipeline    = None
age_pipeline       = None
cancer_pipeline    = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sentiment_pipeline, spam_pipeline
    global emotion_pipeline, gender_pipeline, age_pipeline
    global cancer_pipeline

    for path, name in [
        (SENTIMENT_MODEL_PATH, "Sentiment"),
        (SPAM_MODEL_PATH,      "Spam"),
        (EMOTION_MODEL_PATH,   "Emotion"),
        (CANCER_MODEL_PATH,    "Cancer"),
    ]:
        if not os.path.exists(path):
            raise RuntimeError(f"{name} model not found. Run the training script first.")

    sentiment_pipeline = load_model(SENTIMENT_MODEL_PATH)
    spam_pipeline      = load_spam_model(SPAM_MODEL_PATH)
    emotion_pipeline, gender_pipeline, age_pipeline = load_emotion_models()
    cancer_pipeline    = load_cancer_model(CANCER_MODEL_PATH)

    print("✅ Sentiment model loaded!")
    print("✅ Spam model loaded!")
    print("✅ Emotion + Gender + Age models loaded!")
    print("✅ Cancer detection model loaded!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="ML Portfolio API",
    description="Sentiment + Spam + Emotion + Cancer Detection",
    version="4.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ────────────────────────────────────────────────

class TextInput(BaseModel):
    text: str

class CancerInput(BaseModel):
    features: dict

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

class FeatureImportance(BaseModel):
    feature: str
    importance: float

class CancerResponse(BaseModel):
    prediction: str
    confidence: float
    malignant_probability: float
    benign_probability: float
    risk_level: str
    top_features: List[FeatureImportance]
    is_malignant: bool


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "ML Portfolio API v4.0",
        "models": ["sentiment", "spam", "emotion+gender+age", "cancer-detection"],
        "status": "healthy"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "sentiment_model": sentiment_pipeline is not None,
        "spam_model": spam_pipeline is not None,
        "emotion_model": emotion_pipeline is not None,
        "cancer_model": cancer_pipeline is not None,
    }

@app.get("/cancer/meta")
def cancer_meta():
    return {
        "feature_ranges": FEATURE_RANGES,
        "malignant_sample": MALIGNANT_SAMPLE,
        "benign_sample": BENIGN_SAMPLE,
    }

@app.post("/predict", response_model=SentimentResponse)
def predict_sentiment_route(input: TextInput):
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(input.text) > 1000:
        raise HTTPException(status_code=400, detail="Max 1000 characters")
    if sentiment_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    result = predict_sentiment(input.text, sentiment_pipeline)
    return SentimentResponse(
        sentiment=result["sentiment"], confidence=result["confidence"],
        scores=result["scores"], cleaned_text=result["cleaned_text"],
        original_text=input.text
    )

@app.post("/predict/spam", response_model=SpamResponse)
def predict_spam_route(input: TextInput):
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if spam_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    result = predict_spam(input.text, spam_pipeline)
    return SpamResponse(
        label=result["label"], confidence=result["confidence"],
        scores=result["scores"], spam_keywords_found=result["spam_keywords_found"],
        cleaned_text=result["cleaned_text"], original_text=input.text,
        is_spam=result["is_spam"]
    )

@app.post("/predict/emotion", response_model=EmotionResponse)
def predict_emotion_route(input: TextInput):
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if emotion_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    result = predict_emotion(input.text, emotion_pipeline, gender_pipeline, age_pipeline)
    return EmotionResponse(
        primary_emotion=result["primary_emotion"],
        emotion_emoji=result["emotion_emoji"],
        emotion_color=result["emotion_color"],
        emotion_confidence=result["emotion_confidence"],
        top_emotions=[EmotionItem(**e) for e in result["top_emotions"]],
        gender=result["gender"], gender_confidence=result["gender_confidence"],
        gender_scores=result["gender_scores"], age_group=result["age_group"],
        age_confidence=result["age_confidence"], age_scores=result["age_scores"],
        cleaned_text=result["cleaned_text"], original_text=input.text
    )

@app.post("/predict/cancer", response_model=CancerResponse)
def predict_cancer_route(input: CancerInput):
    if not input.features:
        raise HTTPException(status_code=400, detail="Features cannot be empty")
    if cancer_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    result = predict_cancer(input.features, cancer_pipeline)
    return CancerResponse(
        prediction=result["prediction"],
        confidence=result["confidence"],
        malignant_probability=result["malignant_probability"],
        benign_probability=result["benign_probability"],
        risk_level=result["risk_level"],
        top_features=[FeatureImportance(**f) for f in result["top_features"]],
        is_malignant=result["is_malignant"]
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)