---
title: Skin Cancer Api
emoji: 🔬
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
---

# 🔬 Skin Cancer Detection API

**7-class dermoscopy CNN — FastAPI + ResNet-18**

## Endpoints

- `GET /` — Health check
- `GET /health` — Model load status
- `POST /predict/skin` — Classify a skin lesion image (base64)

## Request

```json
{ "image": "<base64-encoded-image>" }
```

## Classes

| Code | Name | Risk |
|------|------|------|
| mel | Melanoma | Cancerous |
| bcc | Basal Cell Carcinoma | Cancerous |
| akiec | Actinic Keratoses | Cancerous |
| nv | Melanocytic Nevi | Benign |
| bkl | Benign Keratosis | Benign |
| df | Dermatofibroma | Benign |
| vasc | Vascular Lesion | Benign |
