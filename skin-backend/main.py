from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os

from skin_model import predict_skin_cancer, load_skin_model

MODEL_PATH = "skin_model.pth"

# Explicit trusted origins only; wildcards are rejected by the security contract.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,https://anishreddy.me,https://anishreddy13.github.io"
    ).split(",")
    if origin.strip()
]
if not ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
    raise RuntimeError("ALLOWED_ORIGINS must contain explicit trusted origins; wildcards are not allowed.")

skin_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global skin_model
    if not os.path.exists(MODEL_PATH):
        print(f"⚠️  {MODEL_PATH} not found — /predict/skin will return 503")
    else:
        try:
            skin_model = load_skin_model(MODEL_PATH)
            print("✅ Skin cancer model loaded!")
        except Exception as e:
            print(f"❌ Failed to load skin model: {e}")
    yield


app = FastAPI(
    title="Skin Cancer Detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class SkinImageInput(BaseModel):
    image: str


@app.get("/")
def root():
    return {
        "service": "Skin Cancer Detection API",
        "version": "1.0.0",
        "status": "healthy",
        "model_loaded": skin_model is not None,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": skin_model is not None,
    }


@app.post("/predict/skin")
def predict_skin(input: SkinImageInput):
    if not input.image:
        raise HTTPException(400, "Image cannot be empty")

    if skin_model is None:
        raise HTTPException(503, "Model not loaded")

    try:
        result = predict_skin_cancer(input.image, skin_model)
        return result
    except Exception as e:
        raise HTTPException(400, f"Prediction failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=7860)
