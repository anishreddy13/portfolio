<div align="center">

# 🌿 Plant Disease Detection

**Production-grade leaf disease classifier with Grad-CAM visual explanations**

[![HF Spaces](https://img.shields.io/badge/HuggingFace-Live%20Demo-FFD21E?logo=huggingface)](https://huggingface.co/spaces/anishreddy13/plant-disease-fastapi)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com/)

> **97.84% accuracy** · 15 disease classes · 20,000+ training samples · EfficientNet-B0 · Grad-CAM

</div>

---

## What It Does

Classifies plant leaf images into **15 disease categories** (healthy + 14 diseases) with:

- 🎯 **Top-5 predictions** with confidence scores
- 🔥 **Grad-CAM heatmaps** — visual explanation of which leaf regions triggered the prediction
- 📷 **Webcam capture** — real-time inference from browser camera
- 📤 **Multipart image upload** — JPEG, PNG, WebP support
- 📊 **Local analytics** — inference time, confidence tracking
- 📚 **Swagger UI** — interactive API docs at `/docs`

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Accuracy | **97.84%** |
| Disease Classes | **15** |
| Training Samples | **20,000+** |
| Model Architecture | EfficientNet-B0 |
| Inference Engine | FastAPI multipart |
| Explainability | Grad-CAM |
| Deployment | HuggingFace Spaces (Docker) |

---

## Architecture

```
Browser / API Client
        │
        ▼
POST /predict/plant   ──→  plant_inference.py
POST /explain/plant   ──→  plant_inference.py (+ Grad-CAM layer)
        │
        ▼
┌────────────────────────────────────┐
│         EfficientNet-B0            │
│  (plant_model_state_dict_clean.pth)│
│                                    │
│  Input: 224×224 RGB tensor         │
│  Output: 15-class softmax          │
└────────────────────────────────────┘
        │
        ▼
Top-5 predictions + confidence scores
(+ Grad-CAM heatmap_base64 + overlay_base64)
```

---

## API Reference

### `POST /predict/plant`

Classifies a leaf image and returns top-5 disease predictions.

**Request** (multipart/form-data):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | ✅ | Leaf image (JPEG/PNG/WebP) |

**Response:**

```json
{
  "predictions": [
    { "class": "Tomato_Early_blight", "confidence": 0.9123 },
    { "class": "Tomato_healthy",      "confidence": 0.0521 }
  ],
  "top_class": "Tomato_Early_blight",
  "inference_ms": 42
}
```

**Example:**

```bash
curl -X POST "https://anishreddy13-plant-disease-fastapi.hf.space/predict/plant" \
  -F "image=@leaf.jpg;type=image/jpeg"
```

---

### `POST /explain/plant`

Returns the same prediction payload **plus** Grad-CAM visual explanations.

**Additional response fields:**

| Field | Description |
|-------|-------------|
| `heatmap_base64` | Raw Grad-CAM heatmap (base64 PNG) |
| `overlay_base64` | Grad-CAM overlaid on original image (base64 PNG) |
| `target_class` | Class used to generate the CAM |
| `model_inference_ms` | Model-only inference time |

**Example:**

```bash
curl -X POST "https://anishreddy13-plant-disease-fastapi.hf.space/explain/plant" \
  -F "image=@leaf.jpg;type=image/jpeg"
```

---

## Disease Classes

| # | Class |
|---|-------|
| 1 | Tomato Early Blight |
| 2 | Tomato Late Blight |
| 3 | Tomato Leaf Mold |
| 4 | Tomato Bacterial Spot |
| 5 | Tomato Septoria Leaf Spot |
| 6 | Potato Early Blight |
| 7 | Potato Late Blight |
| 8 | Corn Cercospora Leaf Spot |
| 9 | Corn Common Rust |
| 10 | Corn Northern Leaf Blight |
| 11 | Pepper Bacterial Spot |
| 12 | Strawberry Leaf Scorch |
| 13 | Apple Black Rot |
| 14 | Apple Cedar Apple Rust |
| 15 | Healthy (multi-crop) |

---

## Local Setup

```bash
cd hf_plant_api

# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app:app --host 0.0.0.0 --port 7860

# Open Swagger UI
open http://localhost:7860/docs
```

---

## Docker

```bash
# Build
docker build -t plant-disease-api .

# Run
docker run -p 7860:7860 plant-disease-api
```

---

## HuggingFace Spaces Deployment

This package is a **lightweight, standalone** deployment containing only:
- `plant_model_state_dict_clean.pth` — EfficientNet-B0 weights
- `plant_class_to_idx.json` — class label mapping
- `app.py` — FastAPI app
- `plant_inference.py` — inference + Grad-CAM logic

Excluded from this deployment (lives in `ml-backend/` instead):
- Sentiment, spam, emotion, and cancer models
- Redis, Supabase, workers, monitoring, and streaming services
- Training and preprocessing pipelines

---

## Full Training Pipeline (ml-backend)

The model was trained using `ml-backend/train_plant.py`:

```bash
cd ml-backend
python train_plant.py
# Outputs: plant_model_state_dict_clean.pth
```

---

## License

Part of the [Portfolio Platform](../README.md) · [MIT](../LICENSE)
