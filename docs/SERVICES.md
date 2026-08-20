# Service Catalog

| Service | Directory | Local command |
| --- | --- | --- |
| Web frontend | repository root | `npm run dev` |
| Core ML API | `ml-backend` | `uvicorn main:app --port 8000` |
| Skin API | `skin-backend` | `uvicorn main:app --port 8000` |
| Plant API | `hf_plant_api` | `uvicorn app:app --port 8000` |
| Career API | `career-backend` | `uvicorn main:app --port 8000` |
| Financial analyst | `ai-financial-analyst` | See its README |

Each Python service owns a dependency file and deployment artifact. Create a virtual environment per service; do not commit environments, models, datasets, or generated build outputs.

The `ai-financial-analyst`, `hf-career-space`, and `mlworkers` folders are independent Git repositories. Their remote URLs are not assumed here; configure valid submodule mappings or maintain a documented separate checkout workflow.
