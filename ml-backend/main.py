from dotenv import load_dotenv
load_dotenv()  # FIRST — must be before all other imports

from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import uvicorn
from pathlib import Path


# ─────────────────────────────────────────────────────────────
# EXISTING MODELS
# ─────────────────────────────────────────────────────────────
OPTIONAL_IMPORT_ERRORS = {}

def _optional_loader_unavailable(*args, **kwargs):
    return None


def _optional_emotion_loader_unavailable(*args, **kwargs):
    return None, None, None


predict_sentiment = None
load_model = _optional_loader_unavailable
predict_spam = None
load_spam_model = _optional_loader_unavailable
predict_emotion = None
load_emotion_models = _optional_emotion_loader_unavailable
predict_cancer = None
load_cancer_model = _optional_loader_unavailable
FEATURE_RANGES = {}
MALIGNANT_SAMPLE = {}
BENIGN_SAMPLE = {}
try:
    from plant_inference import (
        PlantInferenceError,
        load_plant_predictor,
        predict_plant_disease_from_bytes,
    )
except (ImportError, ModuleNotFoundError) as err:
    class PlantInferenceError(ValueError):
        pass

    def load_plant_predictor(*args, **kwargs):
        return None

    def predict_plant_disease_from_bytes(*args, **kwargs):
        raise PlantInferenceError("PyTorch plant inference is handled via Hugging Face Space.")

    OPTIONAL_IMPORT_ERRORS["plant"] = str(err)

# ─────────────────────────────────────────────────────────────
# NEW INFRASTRUCTURE
# ─────────────────────────────────────────────────────────────
from utils.config import settings
from utils.logger import get_logger

class OptionalRedisService:
    async def connect(self):
        raise RuntimeError("Redis service is not installed or not configured")

    async def close(self):
        return None

    async def health_check(self):
        return {
            "status": "unavailable",
            "connected": False,
            "error": "Redis service is not installed or not configured",
        }


class OptionalSupabaseService:
    def health_check(self):
        return {
            "status": "unavailable",
            "connected": False,
            "error": "Supabase service is not installed or not configured",
        }


if settings.REDIS_URL:
    try:
        from services.redis_service import redis_service
    except Exception as e:
        redis_service = OptionalRedisService()
        OPTIONAL_IMPORT_ERRORS["redis_service"] = str(e)
else:
    redis_service = OptionalRedisService()

if settings.SUPABASE_URL and (
    settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
):
    try:
        from services.supabase_service import supabase_service
    except Exception as e:
        supabase_service = OptionalSupabaseService()
        OPTIONAL_IMPORT_ERRORS["supabase_service"] = str(e)
else:
    supabase_service = OptionalSupabaseService()


# ─────────────────────────────────────────────────────────────
# LOGGER
# ─────────────────────────────────────────────────────────────
logger = get_logger("main")


# ─────────────────────────────────────────────────────────────
# MODEL PATHS
# ─────────────────────────────────────────────────────────────
SENTIMENT_MODEL_PATH = "sentiment_model.pkl"
SPAM_MODEL_PATH      = "spam_model.pkl"
EMOTION_MODEL_PATH   = "emotion_model.pkl"
CANCER_MODEL_PATH    = "cancer_model.pkl"
ML_BACKEND_DIR       = Path(__file__).resolve().parent
PLANT_MODEL_PATH     = ML_BACKEND_DIR / "models" / "plant_disease" / "best_model.pt"
PLANT_MAPPING_PATH   = ML_BACKEND_DIR / "models" / "plant_disease" / "plant_class_to_idx.json"
SUPPORTED_PLANT_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


# ─────────────────────────────────────────────────────────────
# GLOBAL MODEL REFS
# ─────────────────────────────────────────────────────────────
sentiment_pipeline = None
spam_pipeline      = None
emotion_pipeline   = None
gender_pipeline    = None
age_pipeline       = None
cancer_pipeline    = None
plant_predictor    = None


# ─────────────────────────────────────────────────────────────
# APP START TIME
# ─────────────────────────────────────────────────────────────
START_TIME = datetime.utcnow()


# ─────────────────────────────────────────────────────────────
# FASTAPI LIFESPAN
# ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global sentiment_pipeline, spam_pipeline
    global emotion_pipeline, gender_pipeline, age_pipeline
    global cancer_pipeline
    global plant_predictor
    global predict_sentiment, load_model
    global predict_spam, load_spam_model
    global predict_emotion, load_emotion_models
    global predict_cancer, load_cancer_model
    global FEATURE_RANGES, MALIGNANT_SAMPLE, BENIGN_SAMPLE

    logger.info("🚀 Starting ML Portfolio API")

    # ── Validate model files exist ────────────────────────────
    for path, name in [
        (SENTIMENT_MODEL_PATH, "Sentiment"),
        (SPAM_MODEL_PATH,      "Spam"),
        (EMOTION_MODEL_PATH,   "Emotion"),
        (CANCER_MODEL_PATH,    "Cancer"),
    ]:
        if not os.path.exists(path):
            logger.error(f"❌ {name} model missing at {path}")
            logger.warning(f"{name} model not found at {path}; endpoint will return 503")
            continue

    # ── Load ML models ────────────────────────────────────────
    try:
        sentiment_pipeline = load_model(SENTIMENT_MODEL_PATH)
        spam_pipeline      = load_spam_model(SPAM_MODEL_PATH)

        (
            emotion_pipeline,
            gender_pipeline,
            age_pipeline,
        ) = load_emotion_models()

        cancer_pipeline = load_cancer_model(CANCER_MODEL_PATH)

        logger.info("✅ Core ML models loaded")

    except Exception as e:
        logger.exception(f"❌ Model loading failed: {e}")
        logger.warning("Core model loading skipped or partially unavailable; endpoints will return 503")

    if os.path.exists(SENTIMENT_MODEL_PATH):
        try:
            from model import predict_sentiment as _predict_sentiment, load_model as _load_model
            predict_sentiment = _predict_sentiment
            load_model = _load_model
            sentiment_pipeline = load_model(SENTIMENT_MODEL_PATH)
            logger.info("Sentiment model loaded")
        except Exception as e:
            OPTIONAL_IMPORT_ERRORS["sentiment"] = str(e)
            logger.exception(f"Sentiment model loading failed: {e}")

    if os.path.exists(SPAM_MODEL_PATH):
        try:
            from spam_model import predict_spam as _predict_spam, load_spam_model as _load_spam_model
            predict_spam = _predict_spam
            load_spam_model = _load_spam_model
            spam_pipeline = load_spam_model(SPAM_MODEL_PATH)
            logger.info("Spam model loaded")
        except Exception as e:
            OPTIONAL_IMPORT_ERRORS["spam"] = str(e)
            logger.exception(f"Spam model loading failed: {e}")

    if os.path.exists(EMOTION_MODEL_PATH):
        try:
            from emotion_model import predict_emotion as _predict_emotion, load_emotion_models as _load_emotion_models
            predict_emotion = _predict_emotion
            load_emotion_models = _load_emotion_models
            (
                emotion_pipeline,
                gender_pipeline,
                age_pipeline,
            ) = load_emotion_models()
            logger.info("Emotion models loaded")
        except Exception as e:
            OPTIONAL_IMPORT_ERRORS["emotion"] = str(e)
            logger.exception(f"Emotion model loading failed: {e}")

    if os.path.exists(CANCER_MODEL_PATH):
        try:
            from cancer_model import (
                predict_cancer as _predict_cancer,
                load_cancer_model as _load_cancer_model,
                FEATURE_RANGES as _FEATURE_RANGES,
                MALIGNANT_SAMPLE as _MALIGNANT_SAMPLE,
                BENIGN_SAMPLE as _BENIGN_SAMPLE,
            )
            predict_cancer = _predict_cancer
            load_cancer_model = _load_cancer_model
            FEATURE_RANGES = _FEATURE_RANGES
            MALIGNANT_SAMPLE = _MALIGNANT_SAMPLE
            BENIGN_SAMPLE = _BENIGN_SAMPLE
            cancer_pipeline = load_cancer_model(CANCER_MODEL_PATH)
            logger.info("Cancer model loaded")
        except Exception as e:
            OPTIONAL_IMPORT_ERRORS["cancer"] = str(e)
            logger.exception(f"Cancer model loading failed: {e}")

    # Plant disease inference is optional so existing endpoints keep working
    # if the image checkpoint is not present on a deployment yet.
    try:
        if os.path.exists(PLANT_MODEL_PATH) and os.path.exists(PLANT_MAPPING_PATH):
            plant_predictor = load_plant_predictor(
                checkpoint_path=PLANT_MODEL_PATH,
                mapping_path=PLANT_MAPPING_PATH,
            )
            logger.info("✅ Plant disease model loaded")
        else:
            logger.warning(
                "⚠️ Plant disease model unavailable "
                f"(checkpoint={PLANT_MODEL_PATH}, mapping={PLANT_MAPPING_PATH})"
            )

    except Exception as e:
        plant_predictor = None
        logger.exception(f"⚠️ Plant disease model loading failed: {e}")

    # ── Connect Redis (non-fatal) ─────────────────────────────
    try:
        await redis_service.connect()
        logger.info("✅ Redis connected")

    except Exception as e:
        logger.warning(f"⚠️  Redis unavailable (non-fatal): {e}")

    # ── Verify Supabase (non-fatal) ───────────────────────────
    #
    # WHY NON-FATAL:
    # Supabase is used for logging/analytics, not core inference.
    # A bad API key should NOT prevent the ML API from starting.
    # Fix your .env keys, but the server will still serve predictions.
    #
    try:
        supabase_health = supabase_service.health_check()
        logger.info(f"✅ Supabase status: {supabase_health}")

    except Exception as e:
        logger.warning(f"⚠️  Supabase unavailable (non-fatal): {e}")

    logger.info("✅ API startup complete")

    yield  # ← app runs here

    # ── Shutdown ──────────────────────────────────────────────
    logger.info("🛑 Shutting down API")

    try:
        await redis_service.close()

    except Exception as e:
        logger.exception(f"Redis shutdown error: {e}")


# ─────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production ML Portfolio API with "
        "Realtime Streaming + MLOps"
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)


# ─────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ─────────────────────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────
class TextInput(BaseModel):
    text: str


class CancerInput(BaseModel):
    features: dict


class SentimentResponse(BaseModel):
    sentiment:     str
    confidence:    float
    scores:        dict
    cleaned_text:  str
    original_text: str


class SpamResponse(BaseModel):
    label:                str
    confidence:           float
    scores:               dict
    spam_keywords_found:  list
    cleaned_text:         str
    original_text:        str
    is_spam:              bool


class EmotionItem(BaseModel):
    emotion: str
    score:   float
    emoji:   str
    color:   str


class EmotionResponse(BaseModel):
    primary_emotion:    str
    emotion_emoji:      str
    emotion_color:      str
    emotion_confidence: float
    top_emotions:       List[EmotionItem]
    gender:             str
    gender_confidence:  float
    gender_scores:      dict
    age_group:          str
    age_confidence:     float
    age_scores:         dict
    cleaned_text:       str
    original_text:      str


class FeatureImportance(BaseModel):
    feature:    str
    importance: float


class CancerResponse(BaseModel):
    prediction:             str
    confidence:             float
    malignant_probability:  float
    benign_probability:     float
    risk_level:             str
    top_features:           List[FeatureImportance]
    is_malignant:           bool


class PlantPredictionItem(BaseModel):
    class_name:   str
    display_name: str
    confidence:   float
    status:       str


class PlantPredictionResponse(BaseModel):
    predicted_class:        str
    predicted_display_name: str
    confidence_score:       float
    status:                 str
    is_healthy:             bool
    top_5_predictions:      List[PlantPredictionItem]


# ─────────────────────────────────────────────────────────────
# ROOT
# ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message":     "ML Production API",
        "version":     settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "models": [
            "sentiment-analysis",
            "spam-detector",
            "emotion-gender-age",
            "breast-cancer-detection",
            "plant-disease-detection",
        ],
        "status": "healthy",
    }


# ─────────────────────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    redis_health = await redis_service.health_check()

    # Supabase health is wrapped so a bad key doesn't 500 this endpoint
    try:
        supabase_health = supabase_service.health_check()
    except Exception as e:
        supabase_health = {"status": "unavailable", "error": str(e)}

    uptime_seconds = (datetime.utcnow() - START_TIME).total_seconds()

    return {
        "status":          "ok",
        "environment":     settings.ENVIRONMENT,
        "uptime_seconds":  uptime_seconds,

        "models": {
            "sentiment_model": sentiment_pipeline is not None,
            "spam_model":      spam_pipeline      is not None,
            "emotion_model":   emotion_pipeline   is not None,
            "cancer_model":    cancer_pipeline     is not None,
            "plant_model":     plant_predictor     is not None,
        },

        "services": {
            "redis":    redis_health,
            "supabase": supabase_health,
        },
    }


# ─────────────────────────────────────────────────────────────
# CANCER META
# ─────────────────────────────────────────────────────────────
@app.get("/cancer/meta")
def cancer_meta():
    return {
        "feature_ranges":   FEATURE_RANGES,
        "malignant_sample": MALIGNANT_SAMPLE,
        "benign_sample":    BENIGN_SAMPLE,
    }


# ─────────────────────────────────────────────────────────────
# SENTIMENT
# ─────────────────────────────────────────────────────────────
@app.post("/predict", response_model=SentimentResponse)
def predict_sentiment_route(input: TextInput):

    if not input.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    if len(input.text) > 1000:
        raise HTTPException(400, "Max 1000 characters")

    if sentiment_pipeline is None:
        raise HTTPException(503, "Model not loaded")

    r = predict_sentiment(input.text, sentiment_pipeline)
    logger.info("Sentiment prediction generated")

    return SentimentResponse(
        sentiment=r["sentiment"],
        confidence=r["confidence"],
        scores=r["scores"],
        cleaned_text=r["cleaned_text"],
        original_text=input.text,
    )


# ─────────────────────────────────────────────────────────────
# SPAM
# ─────────────────────────────────────────────────────────────
@app.post("/predict/spam", response_model=SpamResponse)
def predict_spam_route(input: TextInput):

    if not input.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    if spam_pipeline is None:
        raise HTTPException(503, "Model not loaded")

    r = predict_spam(input.text, spam_pipeline)
    logger.info("Spam prediction generated")

    return SpamResponse(
        label=r["label"],
        confidence=r["confidence"],
        scores=r["scores"],
        spam_keywords_found=r["spam_keywords_found"],
        cleaned_text=r["cleaned_text"],
        original_text=input.text,
        is_spam=r["is_spam"],
    )


# ─────────────────────────────────────────────────────────────
# EMOTION
# ─────────────────────────────────────────────────────────────
@app.post("/predict/emotion", response_model=EmotionResponse)
def predict_emotion_route(input: TextInput):

    if not input.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    if emotion_pipeline is None:
        raise HTTPException(503, "Model not loaded")

    r = predict_emotion(
        input.text,
        emotion_pipeline,
        gender_pipeline,
        age_pipeline,
    )
    logger.info("Emotion prediction generated")

    return EmotionResponse(
        primary_emotion=r["primary_emotion"],
        emotion_emoji=r["emotion_emoji"],
        emotion_color=r["emotion_color"],
        emotion_confidence=r["emotion_confidence"],
        top_emotions=[EmotionItem(**e) for e in r["top_emotions"]],
        gender=r["gender"],
        gender_confidence=r["gender_confidence"],
        gender_scores=r["gender_scores"],
        age_group=r["age_group"],
        age_confidence=r["age_confidence"],
        age_scores=r["age_scores"],
        cleaned_text=r["cleaned_text"],
        original_text=input.text,
    )


# ─────────────────────────────────────────────────────────────
# BREAST CANCER
# ─────────────────────────────────────────────────────────────
@app.post("/predict/cancer", response_model=CancerResponse)
def predict_cancer_route(input: CancerInput):

    if not input.features:
        raise HTTPException(400, "Features cannot be empty")

    if cancer_pipeline is None:
        raise HTTPException(503, "Model not loaded")

    r = predict_cancer(input.features, cancer_pipeline)
    logger.info("Cancer prediction generated")

    return CancerResponse(
        prediction=r["prediction"],
        confidence=r["confidence"],
        malignant_probability=r["malignant_probability"],
        benign_probability=r["benign_probability"],
        risk_level=r["risk_level"],
        top_features=[FeatureImportance(**f) for f in r["top_features"]],
        is_malignant=r["is_malignant"],
    )


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
# PLANT DISEASE
@app.post("/predict/plant", response_model=PlantPredictionResponse)
async def predict_plant_route(
    image: UploadFile = File(..., description="Plant leaf image file"),
):
    content_type = (image.content_type or "").split(";", 1)[0].strip().lower()
    if content_type not in SUPPORTED_PLANT_IMAGE_MIME_TYPES:
        supported_types = ", ".join(sorted(SUPPORTED_PLANT_IMAGE_MIME_TYPES))
        raise HTTPException(
            400,
            f"Unsupported image MIME type. Supported types: {supported_types}",
        )

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(400, "Image file cannot be empty")

    if plant_predictor is None:
        raise HTTPException(503, "Plant disease model not loaded")

    try:
        result = predict_plant_disease_from_bytes(image_bytes, plant_predictor)
        logger.info("Plant disease prediction generated")
        return PlantPredictionResponse(**result)

    except PlantInferenceError as e:
        raise HTTPException(400, str(e))

    except Exception as e:
        logger.exception(f"Plant disease prediction failed: {e}")
        raise HTTPException(500, "Plant disease prediction failed")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
    )
