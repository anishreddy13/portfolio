from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

from plant_inference import (
    PlantDiseasePredictor,
    PlantInferenceError,
    explain_plant_disease_from_bytes,
    load_plant_predictor,
    predict_plant_disease_from_bytes,
)


APP_DIR = Path(__file__).resolve().parent
MODEL_DIR = APP_DIR / "models" / "plant_disease"
PLANT_MODEL_PATH = MODEL_DIR / "plant_model_state_dict_clean.pth"
PLANT_MAPPING_PATH = MODEL_DIR / "plant_class_to_idx.json"
SUPPORTED_PLANT_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

torch.set_num_threads(int(os.getenv("TORCH_NUM_THREADS", "1")))

plant_predictor: PlantDiseasePredictor | None = None


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    global plant_predictor
    plant_predictor = load_plant_predictor(
        checkpoint_path=PLANT_MODEL_PATH,
        mapping_path=PLANT_MAPPING_PATH,
    )
    yield


app = FastAPI(
    title="Plant Disease Inference API",
    description="Inference-only FastAPI service for PlantVillage disease classification.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
def root():
    return {
        "service": "plant-disease-inference",
        "status": "ok",
        "endpoint": "/predict/plant",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "plant_model": plant_predictor is not None,
    }


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
