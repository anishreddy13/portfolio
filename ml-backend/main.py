from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uvicorn
from model import predict_sentiment, load_model

MODEL_PATH = "sentiment_model.pkl"
pipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError("Model not found. Run: python train.py first")
    pipeline = load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")
    yield
    print("Shutting down...")

app = FastAPI(
    title="Sentiment Analysis API",
    description="ML-powered sentiment analysis — no external APIs",
    version="1.0.0",
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

@app.get("/")
def root():
    return {
        "message": "Sentiment Analysis API is running",
        "status": "healthy",
        "model": "TF-IDF + Logistic Regression",
        "dataset": "Tweet Eval (HuggingFace datasets)"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": pipeline is not None
    }

@app.post("/predict", response_model=SentimentResponse)
def predict(input: TextInput):
    if not input.text or len(input.text.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )
    if len(input.text) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Text too long. Max 1000 characters."
        )
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded yet"
        )

    result = predict_sentiment(input.text, pipeline)

    return SentimentResponse(
        sentiment=result['sentiment'],
        confidence=result['confidence'],
        scores=result['scores'],
        cleaned_text=result['cleaned_text'],
        original_text=input.text
    )

@app.post("/predict/batch")
def predict_batch(inputs: list[TextInput]):
    if len(inputs) > 10:
        raise HTTPException(
            status_code=400,
            detail="Max 10 texts per batch"
        )
    results = []
    for item in inputs:
        result = predict_sentiment(item.text, pipeline)
        results.append({
            "original_text": item.text,
            **result
        })
    return {"results": results}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )