from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os

from skin_model import predict_skin_cancer, load_skin_model

MODEL_PATH = "skin_model.pth"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

if not ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
    raise RuntimeError("ALLOWED_ORIGINS must contain explicit trusted origins; wildcards are not allowed.")

app = FastAPI(
    title="Skin Cancer Detection API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

skin_model = None


class SkinImageInput(BaseModel):
    image: str


@app.on_event("startup")
def startup_event():
    global skin_model

    if not os.path.exists(MODEL_PATH):
        raise RuntimeError("skin_model.pth not found")

    skin_model = load_skin_model(MODEL_PATH)

    print("✅ Skin cancer model loaded!")


@app.get("/")
def root():
    return {
        "message": "Skin Cancer Detection API",
        "status": "healthy"
    }


@app.post("/predict/skin")
def predict_skin(input: SkinImageInput):
    global skin_model

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
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
