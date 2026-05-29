from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone

import numpy as np
from sklearn.metrics import accuracy_score
from sklearn.model_selection import cross_val_score, train_test_split

from db.supabase_client import get_skill_trends, insert_scraper_log
from mlflow_tracking import log_training_run
from models.skill_trend_model import (
    MODEL_PATH,
    _synthetic_training_data,
    build_feature_vector,
    save_model,
    train_model,
)
from utils.logger import get_logger

logger = get_logger(__name__)


def _label_real_trend(item: dict) -> str:
    velocity = float(item.get("velocity") or 0)
    decay = float(item.get("decay_score") or 0)
    if decay > 0.6:
        return "declining"
    if velocity > 35 and decay < 0.35:
        return "rising"
    return "stable"


def _log_wandb(metrics: dict):
    try:
        if not os.getenv("WANDB_API_KEY"):
            return
        import wandb

        run = wandb.init(project="career-intelligence", job_type="train_trend", reinit=True)
        wandb.log(metrics)
        run.finish()
    except Exception as exc:
        logger.warning("WANDB trend logging skipped: %s", exc)


async def run_training_pipeline() -> dict:
    try:
        real_trends = await get_skill_trends(200)
        if len(real_trends) > 20:
            training_data = [{**item, "trend_label": _label_real_trend(item)} for item in real_trends]
            data_source = "supabase"
        else:
            training_data = _synthetic_training_data()
            data_source = "synthetic"

        model = train_model(training_data)
        x = np.vstack([build_feature_vector(item) for item in training_data])
        y = np.array([item.get("trend_label", "stable") for item in training_data])
        cv_score = float(np.mean(cross_val_score(model, x, y, cv=3)))
        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)
        model.fit(x_train, y_train)
        accuracy = float(accuracy_score(y_test, model.predict(x_test)))
        save_model(model, str(MODEL_PATH))

        metrics = {
            "accuracy": round(accuracy, 4),
            "cross_val_score": round(cv_score, 4),
            "n_training_samples": len(training_data),
            "model_version": 2,
        }
        log_training_run("skill_trend_model", {"data_source": data_source}, metrics, str(MODEL_PATH))
        _log_wandb(metrics)

        await insert_scraper_log(
            {
                "job_type": "train_trend_model",
                "status": "success",
                "message": f"Trend model trained from {data_source}",
                "items_processed": len(training_data),
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        print(f"Trend model trained: {metrics}")
        return {"status": "success", "metrics": metrics, "data_source": data_source}
    except Exception as exc:
        logger.exception("Trend training pipeline failed: %s", exc)
        await insert_scraper_log(
            {
                "job_type": "train_trend_model",
                "status": "error",
                "message": str(exc),
                "items_processed": 0,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {"status": "error", "message": str(exc)}


if __name__ == "__main__":
    asyncio.run(run_training_pipeline())
