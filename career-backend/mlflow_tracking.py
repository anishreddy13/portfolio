from __future__ import annotations

from pathlib import Path
from typing import Any

from utils.logger import get_logger

logger = get_logger(__name__)

try:
    import mlflow

    MLFLOW_AVAILABLE = True
except Exception as exc:
    mlflow = None
    MLFLOW_AVAILABLE = False
    logger.warning("MLflow unavailable, tracking disabled: %s", exc)

EXPERIMENT_NAME = "career-intelligence"


def _init_mlflow() -> bool:
    if not MLFLOW_AVAILABLE:
        return False
    try:
        tracking_dir = Path(__file__).resolve().parent / "mlruns"
        tracking_dir.mkdir(parents=True, exist_ok=True)
        mlflow.set_tracking_uri(str(tracking_dir))
        mlflow.set_experiment(EXPERIMENT_NAME)
        return True
    except Exception as exc:
        logger.warning("MLflow initialization failed, continuing without tracking: %s", exc)
        return False


def log_training_run(
    model_name: str,
    params: dict,
    metrics: dict,
    model_path: str | None = None,
):
    try:
        if not _init_mlflow():
            return
        with mlflow.start_run(run_name=f"{model_name}-training"):
            mlflow.set_tag("model_name", model_name)
            mlflow.log_params(params or {})
            mlflow.log_metrics(metrics or {})
            if model_path:
                mlflow.log_param("model_path", model_path)
    except Exception as exc:
        logger.warning("Failed to log MLflow training run: %s", exc)


def log_prediction(
    model_name: str,
    input_features: dict,
    prediction: dict,
    latency_ms: float,
):
    try:
        if not _init_mlflow():
            return
        with mlflow.start_run(run_name=f"{model_name}-prediction"):
            mlflow.set_tag("model_name", model_name)
            mlflow.set_tag("event_type", "prediction")
            mlflow.log_metric("latency_ms", latency_ms)
            for key, value in (input_features or {}).items():
                if isinstance(value, (str, int, float, bool)):
                    mlflow.log_param(f"input_{key}", value)
            for key, value in (prediction or {}).items():
                if isinstance(value, (int, float)):
                    mlflow.log_metric(f"prediction_{key}", value)
                elif isinstance(value, str):
                    mlflow.log_param(f"prediction_{key}", value)
    except Exception as exc:
        logger.warning("Failed to log MLflow prediction: %s", exc)


def log_scraper_run(
    source: str,
    jobs_fetched: int,
    skills_extracted: int,
    duration_ms: float,
):
    try:
        if not _init_mlflow():
            return
        with mlflow.start_run(run_name=f"{source}-scraper"):
            mlflow.set_tag("source", source)
            mlflow.log_metric("jobs_fetched", jobs_fetched)
            mlflow.log_metric("skills_extracted", skills_extracted)
            mlflow.log_metric("duration_ms", duration_ms)
    except Exception as exc:
        logger.warning("Failed to log MLflow scraper run: %s", exc)


def get_best_model_run(model_name: str) -> dict:
    try:
        if not _init_mlflow():
            return {}
        experiment = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
        if not experiment:
            return {}
        runs = mlflow.search_runs(
            experiment_ids=[experiment.experiment_id],
            filter_string=f"tags.model_name = '{model_name}'",
        )
        if runs.empty:
            return {}
        metric_columns = [column for column in runs.columns if column.startswith("metrics.")]
        sort_column = "metrics.accuracy" if "metrics.accuracy" in metric_columns else metric_columns[0] if metric_columns else None
        if sort_column:
            runs = runs.sort_values(sort_column, ascending=False)
        return runs.iloc[0].to_dict()
    except Exception as exc:
        logger.warning("Failed to fetch best MLflow run: %s", exc)
        return {}


def compare_model_versions(model_name: str) -> list:
    try:
        if not _init_mlflow():
            return []
        experiment = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
        if not experiment:
            return []
        runs = mlflow.search_runs(
            experiment_ids=[experiment.experiment_id],
            filter_string=f"tags.model_name = '{model_name}'",
        )
        if runs.empty:
            return []
        metric_columns = [column for column in runs.columns if column.startswith("metrics.")]
        sort_column = "metrics.accuracy" if "metrics.accuracy" in metric_columns else metric_columns[0] if metric_columns else "start_time"
        return runs.sort_values(sort_column, ascending=False).to_dict(orient="records")
    except Exception as exc:
        logger.warning("Failed to compare MLflow model versions: %s", exc)
        return []
