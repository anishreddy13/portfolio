---
title: Plant Disease FastAPI
sdk: docker
app_port: 7860
pinned: false
---

# Plant Disease FastAPI

Lightweight Hugging Face Spaces deployment package for the plant disease model only.

Included:

- `plant_model_state_dict_clean.pth`
- `plant_class_to_idx.json`
- EfficientNet-B0 inference architecture
- FastAPI multipart image upload endpoint

Excluded:

- sentiment, spam, emotion, and cancer models
- Redis, Supabase, workers, monitoring, and streaming services
- training and preprocessing pipelines

## Endpoint

`POST /predict/plant`

Form field:

- `image`: required image file, supported MIME types are `image/jpeg`, `image/png`, and `image/webp`

Example:

```bash
curl -X POST "https://<space-host>/predict/plant" \
  -F "image=@leaf.jpg;type=image/jpeg"
```

Swagger UI is available at `/docs`.

## Grad-CAM Explanation Endpoint

`POST /explain/plant`

Uses the same multipart field:

- `image`: required image file, supported MIME types are `image/jpeg`, `image/png`, and `image/webp`

Returns the normal prediction payload plus:

- `heatmap_base64`
- `overlay_base64`
- `target_class`
- `model_inference_ms`

## Local Run

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 7860
```
