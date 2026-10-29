from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import torch
    torch.set_num_threads(int(os.getenv("TORCH_NUM_THREADS", "1")))
    from plant_inference import (
        PlantDiseasePredictor,
        PlantInferenceError,
        explain_plant_disease_from_bytes,
        load_plant_predictor,
        predict_plant_disease_from_bytes,
    )
except (ImportError, ModuleNotFoundError):
    class PlantInferenceError(ValueError):
        pass

    class PlantDiseasePredictor:
        pass

    def load_plant_predictor(*args, **kwargs):
        return None

    def predict_plant_disease_from_bytes(*args, **kwargs):
        raise PlantInferenceError("PyTorch and torchvision not installed in this environment.")

    def explain_plant_disease_from_bytes(*args, **kwargs):
        raise PlantInferenceError("PyTorch and torchvision not installed in this environment.")


APP_DIR = Path(__file__).resolve().parent
MODEL_DIR = APP_DIR / "models" / "plant_disease"
PLANT_MODEL_PATH = MODEL_DIR / "plant_model_state_dict_clean.pth"
PLANT_MAPPING_PATH = MODEL_DIR / "plant_class_to_idx.json"
SUPPORTED_PLANT_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

# Authorship paths
AUTHORSHIP_BUNDLE_PATH = APP_DIR / "authorship_bundle_v1.pkl"
BENCHMARK_RESULTS_PATH = APP_DIR / "authorship" / "benchmark_results.json"
try:
    from authorship.config import TRAINING_WORD_COUNT_MIN, TRAINING_WORD_COUNT_MAX
except ImportError:
    TRAINING_WORD_COUNT_MIN = 266
    TRAINING_WORD_COUNT_MAX = 5958

plant_predictor: PlantDiseasePredictor | None = None
authorship_bundle: Any = None


# ── Plant Disease Models ───────────────────────────────────────────────────────
class PlantPredictionItem(BaseModel):
    class_name: str
    display_name: str
    confidence: float
    status: str


class PlantPredictionResponse(BaseModel):
    predicted_class: str
    predicted_display_name: str
    confidence_score: float
    status: str
    is_healthy: bool
    top_5_predictions: List[PlantPredictionItem]


class PlantExplanationResponse(BaseModel):
    prediction: PlantPredictionResponse
    heatmap_base64: str
    overlay_base64: str
    target_class: str
    model_inference_ms: int


# ── Authorship Models ─────────────────────────────────────────────────────────
class AuthorshipInput(BaseModel):
    text: str


class ModelPredictionDetail(BaseModel):
    model_name: str
    predicted_label: str
    predicted_class: int
    ai_probability: float
    human_probability: float
    confidence: float
    score_type: str


class ConsensusSummary(BaseModel):
    majority_vote_label: str
    majority_vote_class: int
    ai_votes: int
    human_votes: int
    mean_ai_probability: float
    agreement: str


class TokenAttribution(BaseModel):
    feature: str
    tfidf: float
    coefficient: float
    contribution: float
    direction: str


class AuthorshipResponse(BaseModel):
    model_version: str
    text_length_chars: int
    text_length_words: int
    predictions: Dict[str, ModelPredictionDetail]
    consensus: ConsensusSummary
    length_warning: Optional[str] = None
    explanations: List[TokenAttribution] = []
    limitations_disclaimer: str


# ── Application Lifespan ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global plant_predictor, authorship_bundle

    # 1. Plant Disease Predictor
    try:
        if PLANT_MODEL_PATH.exists() and PLANT_MAPPING_PATH.exists():
            plant_predictor = load_plant_predictor(
                checkpoint_path=PLANT_MODEL_PATH,
                mapping_path=PLANT_MAPPING_PATH,
            )
            print("✅ Plant disease model loaded successfully")
        else:
            plant_predictor = None
            print(f"⚠️ Plant model files missing at {PLANT_MODEL_PATH}")
    except Exception as exc:
        plant_predictor = None
        print(f"⚠️ Plant disease model loading failed: {exc}")

    # 2. Authorship Multi-Model Bundle
    try:
        if AUTHORSHIP_BUNDLE_PATH.exists():
            from authorship.model import AuthorshipBundle
            authorship_bundle = AuthorshipBundle.load(AUTHORSHIP_BUNDLE_PATH)
            print("✅ Authorship multi-model bundle loaded successfully")
        else:
            authorship_bundle = None
            print(f"⚠️ Authorship bundle missing at {AUTHORSHIP_BUNDLE_PATH}")
    except Exception as exc:
        authorship_bundle = None
        print(f"⚠️ Authorship bundle loading failed: {exc}")

    yield


app = FastAPI(
    title="Plant Disease & AI Authorship Inference API",
    description="Multi-model inference API for Plant Disease Detection and AI Authorship & Robustness analysis.",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS Configuration ────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,https://www.anishreddy.online,https://anishreddy.online,https://anishreddy.me,https://anishreddy13.github.io"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ── Common Endpoints ──────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "plant-disease-inference",
        "status": "ok",
        "endpoints": {
            "plant_predict": "/predict/plant",
            "plant_explain": "/explain/plant",
            "authorship_predict": "/predict/authorship",
            "authorship_benchmark": "/benchmark/authorship",
        },
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "plant_model": plant_predictor is not None,
        "authorship_model": authorship_bundle is not None,
    }


# ── Plant Disease Endpoints ───────────────────────────────────────────────────
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
        return PlantPredictionResponse(**result)
    except PlantInferenceError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, "Plant disease prediction failed") from exc


@app.post("/explain/plant", response_model=PlantExplanationResponse)
async def explain_plant_route(
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
        result = explain_plant_disease_from_bytes(image_bytes, plant_predictor)
        return PlantExplanationResponse(**result)
    except PlantInferenceError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, "Plant disease explanation failed") from exc


# ── Authorship & Robustness Lab Endpoints ─────────────────────────────────────
@app.post("/predict/authorship", response_model=AuthorshipResponse)
def predict_authorship_route(input: AuthorshipInput):
    # Reject empty or whitespace-only input
    if not input.text or not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty or whitespace only.")

    # Max length ~40,000 characters
    if len(input.text) > 40000:
        raise HTTPException(
            status_code=400,
            detail="Text exceeds maximum allowed length of 40,000 characters."
        )

    if authorship_bundle is None:
        raise HTTPException(status_code=503, detail="Authorship model bundle not loaded on server.")

    try:
        raw_result = authorship_bundle.predict_single(input.text)
        explanations_raw = authorship_bundle.explain(input.text, top_k=6)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Authorship inference failed: {exc}")

    # Check observed training distribution text length
    words_count = raw_result["text_length_words"]
    length_warning = None
    if words_count < TRAINING_WORD_COUNT_MIN:
        length_warning = (
            f"Input text has {words_count} words, which is below the observed "
            f"training distribution minimum (~{TRAINING_WORD_COUNT_MIN} words). Short texts may "
            "exhibit higher classification variance."
        )
    elif words_count > TRAINING_WORD_COUNT_MAX:
        length_warning = (
            f"Input text has {words_count} words, which exceeds the observed "
            f"training distribution maximum (~{TRAINING_WORD_COUNT_MAX:,} words)."
        )

    model_name_map = {
        "naive_bayes": "Multinomial Naive Bayes",
        "logistic_regression": "Logistic Regression",
        "calibrated_svm": "Calibrated Linear SVM",
    }
    score_type_map = {
        "naive_bayes": "multinomial_posterior_probability",
        "logistic_regression": "logistic_sigmoid_probability",
        "calibrated_svm": "platt_calibrated_probability",
    }

    formatted_predictions = {}
    for key, pred in raw_result["predictions"].items():
        predicted_label = "AI-generated" if pred["predicted_class"] == 1 else "Human-written"
        formatted_predictions[key] = ModelPredictionDetail(
            model_name=model_name_map.get(key, key),
            predicted_label=predicted_label,
            predicted_class=pred["predicted_class"],
            ai_probability=pred["ai_probability"],
            human_probability=pred["human_probability"],
            confidence=pred["confidence"],
            score_type=score_type_map.get(key, "estimated_probability"),
        )

    raw_consensus = raw_result["consensus"]
    majority_label = "AI-generated" if raw_consensus["consensus_label"] == "AI" else "Human-written"
    majority_class = 1 if majority_label == "AI-generated" else 0
    agreement_str = (
        "unanimous"
        if (raw_consensus["ai_votes"] == 3 or raw_consensus["human_votes"] == 3)
        else "disagreement"
    )

    consensus_obj = ConsensusSummary(
        majority_vote_label=majority_label,
        majority_vote_class=majority_class,
        ai_votes=raw_consensus["ai_votes"],
        human_votes=raw_consensus["human_votes"],
        mean_ai_probability=raw_consensus["mean_ai_probability"],
        agreement=agreement_str,
    )

    explanations = [
        TokenAttribution(
            feature=exp["feature"],
            tfidf=exp["tfidf"],
            coefficient=exp["coefficient"],
            contribution=exp["contribution"],
            direction=exp["direction"],
        )
        for exp in explanations_raw
    ]

    return AuthorshipResponse(
        model_version=authorship_bundle.metadata.get("version", "1.0.0"),
        text_length_chars=raw_result["text_length_chars"],
        text_length_words=raw_result["text_length_words"],
        predictions=formatted_predictions,
        consensus=consensus_obj,
        length_warning=length_warning,
        explanations=explanations,
        limitations_disclaimer=(
            "Predictions are empirical machine-learning estimates based on stylistic "
            "and n-gram patterns, not definitive proof of human or AI authorship."
        ),
    )


@app.get("/benchmark/authorship")
def get_authorship_benchmark():
    if not os.path.exists(BENCHMARK_RESULTS_PATH):
        raise HTTPException(
            status_code=404,
            detail="Benchmark results not found on server."
        )
    try:
        with open(BENCHMARK_RESULTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse benchmark results file."
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=7860)
