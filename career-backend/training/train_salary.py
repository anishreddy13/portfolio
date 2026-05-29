from __future__ import annotations

import os

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from mlflow_tracking import log_training_run
from models.salary_predictor import MODEL_PATH, _generate_synthetic_salary_data, save_model
from utils.logger import get_logger

logger = get_logger(__name__)


def _log_wandb(metrics: dict):
    try:
        if not os.getenv("WANDB_API_KEY"):
            return
        import wandb

        run = wandb.init(project="career-intelligence", job_type="train_salary", reinit=True)
        wandb.log(metrics)
        run.finish()
    except Exception as exc:
        logger.warning("WANDB salary logging skipped: %s", exc)


def run_training_pipeline() -> dict:
    try:
        x, y_inr, y_usd = _generate_synthetic_salary_data(800)
        x_train, x_test, y_inr_train, y_inr_test, y_usd_train, y_usd_test = train_test_split(
            x,
            y_inr,
            y_usd,
            test_size=0.2,
            random_state=42,
        )
        params = {
            "n_estimators": 100,
            "max_depth": 6,
            "learning_rate": 0.1,
            "objective": "reg:squarederror",
            "random_state": 42,
            "n_jobs": 1,
        }
        inr_model = XGBRegressor(**params)
        usd_model = XGBRegressor(**params)
        inr_model.fit(x_train, y_inr_train)
        usd_model.fit(x_train, y_usd_train)

        inr_pred = inr_model.predict(x_test)
        usd_pred = usd_model.predict(x_test)
        metrics = {
            "rmse": round(float(mean_squared_error(y_inr_test, inr_pred, squared=False)), 2),
            "usd_rmse": round(float(mean_squared_error(y_usd_test, usd_pred, squared=False)), 2),
            "r2_score": round(float(r2_score(y_inr_test, inr_pred)), 4),
            "usd_r2_score": round(float(r2_score(y_usd_test, usd_pred)), 4),
            "mae": round(float(mean_absolute_error(y_inr_test, inr_pred)), 2),
            "n_samples": len(x),
            "model_version": 2,
        }
        save_model({"inr": inr_model, "usd": usd_model}, str(MODEL_PATH))
        log_training_run("salary_model", params, metrics, str(MODEL_PATH))
        _log_wandb(metrics)
        print(f"Salary model trained: {metrics}")
        return {"status": "success", "metrics": metrics}
    except Exception as exc:
        logger.exception("Salary training pipeline failed: %s", exc)
        return {"status": "error", "message": str(exc)}


if __name__ == "__main__":
    run_training_pipeline()
