from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uvicorn

from model        import predict_sentiment, load_model
from spam_model   import predict_spam,      load_spam_model
from emotion_model import predict_emotion,  load_emotion_models
from cancer_model  import predict_cancer,   load_cancer_model, FEATURE_RANGES, MALIGNANT_SAMPLE, BENIGN_SAMPLE
from skin_model    import predict_skin_cancer, load_skin_model

# ── Model paths ────────────────────────────────────────────────────────────────
SENTIMENT_MODEL_PATH = "sentiment_model.pkl"
SPAM_MODEL_PATH      = "spam_model.pkl"
EMOTION_MODEL_PATH   = "emotion_model.pkl"
CANCER_MODEL_PATH    = "cancer_model.pkl"
SKIN_MODEL_PATH      = "skin_model.pth"

# ── Global model refs ──────────────────────────────────────────────────────────
sentiment_pipeline = None
spam_pipeline      = None
emotion_pipeline   = None
gender_pipeline    = None
age_pipeline       = None
cancer_pipeline    = None
skin_model         = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sentiment_pipeline, spam_pipeline
    global emotion_pipeline, gender_pipeline, age_pipeline
    global cancer_pipeline, skin_model

    for path, name in [
        (SENTIMENT_MODEL_PATH, "Sentiment"),
        (SPAM_MODEL_PATH,      "Spam"),
        (EMOTION_MODEL_PATH,   "Emotion"),
        (CANCER_MODEL_PATH,    "Cancer"),
        (SKIN_MODEL_PATH,      "Skin Cancer"),
    ]:
        if not os.path.exists(path):
            raise RuntimeError(
                f"{name} model not found at {path}. "
                "Run the corresponding training script first."
            )

    sentiment_pipeline                          = load_model(SENTIMENT_MODEL_PATH)
    spam_pipeline                               = load_spam_model(SPAM_MODEL_PATH)
    emotion_pipeline, gender_pipeline, age_pipeline = load_emotion_models()
    cancer_pipeline                             = load_cancer_model(CANCER_MODEL_PATH)
    skin_model                                  = load_skin_model(SKIN_MODEL_PATH)

    print("✅ Sentiment model loaded!")
    print("✅ Spam model loaded!")
    print("✅ Emotion + Gender + Age models loaded!")
    print("✅ Breast cancer model loaded!")
    print("✅ Skin cancer image model loaded!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="ML Portfolio API",
    description="Sentiment + Spam + Emotion + Cancer + Skin Cancer Image Detection",
    version="5.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ─────────────────────────────────────────────────

class TextInput(BaseModel):
    text: str

class CancerInput(BaseModel):
    features: dict

class SkinImageInput(BaseModel):
    image: str          # base64 encoded image

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

class SkinClassResult(BaseModel):
    class_code: str
    class_name: str
    probability: float
    is_cancerous: bool

class SkinCancerResponse(BaseModel):
    prediction: str
    predicted_type: str
    predicted_code: str
    confidence: float
    cancer_probability: float
    benign_probability: float
    risk_level: str
    is_cancerous: bool
    top_5: List[SkinClassResult]


# ── Health / Meta ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "ML Portfolio API v5.0",
        "models": [
            "sentiment-analysis",
            "spam-detector",
            "emotion-gender-age",
            "breast-cancer-detection",
            "skin-cancer-image-detection"
        ],
        "status": "healthy"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "sentiment_model":    sentiment_pipeline is not None,
        "spam_model":         spam_pipeline      is not None,
        "emotion_model":      emotion_pipeline   is not None,
        "cancer_model":       cancer_pipeline    is not None,
        "skin_cancer_model":  skin_model         is not None,
    }

@app.get("/cancer/meta")
def cancer_meta():
    return {
        "feature_ranges":    FEATURE_RANGES,
        "malignant_sample":  MALIGNANT_SAMPLE,
        "benign_sample":     BENIGN_SAMPLE,
    }


# ── Sentiment ──────────────────────────────────────────────────────────────────

@app.post("/predict", response_model=SentimentResponse)
def predict_sentiment_route(input: TextInput):
    if not input.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if len(input.text) > 1000:
        raise HTTPException(400, "Max 1000 characters")
    if sentiment_pipeline is None:
        raise HTTPException(503, "Model not loaded")
    r = predict_sentiment(input.text, sentiment_pipeline)
    return SentimentResponse(
        sentiment=r["sentiment"], confidence=r["confidence"],
        scores=r["scores"], cleaned_text=r["cleaned_text"],
        original_text=input.text
    )


# ── Spam ───────────────────────────────────────────────────────────────────────

@app.post("/predict/spam", response_model=SpamResponse)
def predict_spam_route(input: TextInput):
    if not input.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if spam_pipeline is None:
        raise HTTPException(503, "Model not loaded")
    r = predict_spam(input.text, spam_pipeline)
    return SpamResponse(
        label=r["label"], confidence=r["confidence"],
        scores=r["scores"], spam_keywords_found=r["spam_keywords_found"],
        cleaned_text=r["cleaned_text"], original_text=input.text,
        is_spam=r["is_spam"]
    )


# ── Emotion ────────────────────────────────────────────────────────────────────

@app.post("/predict/emotion", response_model=EmotionResponse)
def predict_emotion_route(input: TextInput):
    if not input.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if emotion_pipeline is None:
        raise HTTPException(503, "Model not loaded")
    r = predict_emotion(input.text, emotion_pipeline, gender_pipeline, age_pipeline)
    return EmotionResponse(
        primary_emotion=r["primary_emotion"],
        emotion_emoji=r["emotion_emoji"],
        emotion_color=r["emotion_color"],
        emotion_confidence=r["emotion_confidence"],
        top_emotions=[EmotionItem(**e) for e in r["top_emotions"]],
        gender=r["gender"], gender_confidence=r["gender_confidence"],
        gender_scores=r["gender_scores"], age_group=r["age_group"],
        age_confidence=r["age_confidence"], age_scores=r["age_scores"],
        cleaned_text=r["cleaned_text"], original_text=input.text
    )


# ── Breast Cancer ──────────────────────────────────────────────────────────────

@app.post("/predict/cancer", response_model=CancerResponse)
def predict_cancer_route(input: CancerInput):
    if not input.features:
        raise HTTPException(400, "Features cannot be empty")
    if cancer_pipeline is None:
        raise HTTPException(503, "Model not loaded")
    r = predict_cancer(input.features, cancer_pipeline)
    return CancerResponse(
        prediction=r["prediction"],
        confidence=r["confidence"],
        malignant_probability=r["malignant_probability"],
        benign_probability=r["benign_probability"],
        risk_level=r["risk_level"],
        top_features=[FeatureImportance(**f) for f in r["top_features"]],
        is_malignant=r["is_malignant"]
    )


# ── Skin Cancer Image ──────────────────────────────────────────────────────────

@app.post("/predict/skin", response_model=SkinCancerResponse)
def predict_skin_route(input: SkinImageInput):
    if not input.image:
        raise HTTPException(400, "Image cannot be empty")
    if skin_model is None:
        raise HTTPException(503, "Skin model not loaded")
    try:
        r = predict_skin_cancer(input.image, skin_model)
    except Exception as e:
        raise HTTPException(400, f"Image processing failed: {str(e)}")
    return SkinCancerResponse(
        prediction=r["prediction"],
        predicted_type=r["predicted_type"],
        predicted_code=r["predicted_code"],
        confidence=r["confidence"],
        cancer_probability=r["cancer_probability"],
        benign_probability=r["benign_probability"],
        risk_level=r["risk_level"],
        is_cancerous=r["is_cancerous"],
        top_5=[SkinClassResult(**c) for c in r["top_5"]]
    )

# ── File upload alternative ────────────────────────────────────────────────────

@app.post("/predict/skin/upload")
async def predict_skin_upload(file: UploadFile = File(...)):
    if skin_model is None:
        raise HTTPException(503, "Skin model not loaded")
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Max 10MB")
    try:
        contents = await file.read()
        import base64
        b64 = base64.b64encode(contents).decode()
        r = predict_skin_cancer(b64, skin_model)
    except Exception as e:
        raise HTTPException(400, f"Image processing failed: {str(e)}")
    return SkinCancerResponse(
        prediction=r["prediction"],
        predicted_type=r["predicted_type"],
        predicted_code=r["predicted_code"],
        confidence=r["confidence"],
        cancer_probability=r["cancer_probability"],
        benign_probability=r["benign_probability"],
        risk_level=r["risk_level"],
        is_cancerous=r["is_cancerous"],
        top_5=[SkinClassResult(**c) for c in r["top_5"]]
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)