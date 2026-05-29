from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from services.skill_extractor import SKILLS_TAXONOMY
from utils.logger import get_logger

logger = get_logger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "saved_models"
MODEL_PATH = MODEL_DIR / "skill_trend_model.pkl"

CATEGORY_MAP = {
    "languages": 0,
    "frontend": 1,
    "backend": 2,
    "ml_ai": 3,
    "devops": 4,
    "databases": 5,
    "data": 6,
    "tools": 7,
    "other": 8,
}
EMERGING_SKILLS = {"langchain", "llmops", "mlops", "rust", "kubernetes", "vector database", "pytorch", "fastapi", "typescript", "go", "golang"}
DECLINING_SKILLS = {"jquery", "angularjs", "svn", "perl", "flash", "grunt", "backbone"}

_MODEL_CACHE: Pipeline | None = None


def _skill_category(skill_name: str, skill_data: dict | None = None) -> str:
    try:
        explicit = (skill_data or {}).get("category")
        if explicit:
            return str(explicit).lower()
        normalized = skill_name.lower().strip()
        for category, skills in SKILLS_TAXONOMY.items():
            if normalized in {skill.lower() for skill in skills}:
                return category
    except Exception as exc:
        logger.exception("Failed to resolve skill category: %s", exc)
    return "other"


def build_feature_vector(skill_data: dict) -> np.ndarray:
    try:
        skill_name = str(skill_data.get("skill") or skill_data.get("skill_name") or "").lower().strip()
        category = _skill_category(skill_name, skill_data)
        category_encoded = CATEGORY_MAP.get(category, CATEGORY_MAP["other"])
        vector = np.array(
            [
                float(skill_data.get("demand_score") or 0.0),
                float(skill_data.get("velocity") or 0.0),
                float(skill_data.get("decay_score") or 0.0),
                float(skill_data.get("ai_risk") or 0.0),
                float(skill_data.get("salary_momentum") or 0.0),
                float(category_encoded),
                1.0 if skill_name in EMERGING_SKILLS else 0.0,
                1.0 if skill_name in DECLINING_SKILLS else 0.0,
            ],
            dtype=float,
        )
        return vector
    except Exception as exc:
        logger.exception("Failed to build skill trend feature vector: %s", exc)
        return np.zeros(8, dtype=float)


def _synthetic_training_data() -> list[dict]:
    rising = ["pytorch", "kubernetes", "mlops", "rust", "langchain", "llmops", "fastapi", "typescript", "golang"]
    declining = ["jquery", "angularjs", "svn", "perl", "flash", "grunt", "backbone"]
    stable = ["python", "javascript", "sql", "git", "docker"]
    data: list[dict] = []

    for skill in rising:
        data.append(
            {
                "skill": skill,
                "demand_score": 55,
                "velocity": 75,
                "decay_score": 0.08,
                "ai_risk": 0.12,
                "salary_momentum": 0.9,
                "trend_label": "rising",
            }
        )
    for skill in declining:
        data.append(
            {
                "skill": skill,
                "demand_score": 18,
                "velocity": 8,
                "decay_score": 0.82,
                "ai_risk": 0.82,
                "salary_momentum": 0.25,
                "trend_label": "declining",
            }
        )
    for skill in stable:
        data.append(
            {
                "skill": skill,
                "demand_score": 45,
                "velocity": 35,
                "decay_score": 0.3,
                "ai_risk": 0.45,
                "salary_momentum": 0.55,
                "trend_label": "stable",
            }
        )

    rng = np.random.default_rng(42)
    augmented: list[dict] = []
    for item in data:
        for _ in range(12):
            sample = item.copy()
            sample["demand_score"] = max(0, min(100, float(item["demand_score"]) + rng.normal(0, 8)))
            sample["velocity"] = max(0, min(100, float(item["velocity"]) + rng.normal(0, 10)))
            sample["decay_score"] = max(0, min(1, float(item["decay_score"]) + rng.normal(0, 0.06)))
            sample["ai_risk"] = max(0, min(1, float(item["ai_risk"]) + rng.normal(0, 0.08)))
            sample["salary_momentum"] = max(0, min(1, float(item["salary_momentum"]) + rng.normal(0, 0.08)))
            augmented.append(sample)
    return augmented


def train_model(training_data: list[dict]) -> Pipeline:
    try:
        data = training_data or _synthetic_training_data()
        features = np.vstack([build_feature_vector(item) for item in data])
        labels = np.array([item.get("trend_label", "stable") for item in data])
        model = Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                (
                    "classifier",
                    RandomForestClassifier(
                        n_estimators=80,
                        max_depth=8,
                        random_state=42,
                        class_weight="balanced",
                    ),
                ),
            ]
        )
        model.fit(features, labels)
        logger.info("Skill trend model trained with %s samples", len(data))
        return model
    except Exception as exc:
        logger.exception("Failed to train skill trend model: %s", exc)
        raise


def predict_trend(skill_name: str, skill_data: dict) -> dict:
    try:
        model = get_or_train_model()
        enriched = {"skill": skill_name.lower().strip(), **(skill_data or {})}
        features = build_feature_vector(enriched).reshape(1, -1)
        label = str(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))
        current_demand = float(enriched.get("demand_score") or 0)
        velocity = float(enriched.get("velocity") or 0)

        if label == "rising":
            predicted_6m = current_demand + max(8, velocity * 0.18)
            predicted_12m = current_demand + max(14, velocity * 0.32)
        elif label == "declining":
            decay = float(enriched.get("decay_score") or 0.4)
            predicted_6m = current_demand * (1 - min(decay * 0.25, 0.35))
            predicted_12m = current_demand * (1 - min(decay * 0.45, 0.6))
        else:
            predicted_6m = current_demand + (velocity * 0.04)
            predicted_12m = current_demand + (velocity * 0.08)

        return {
            "trend_label": label,
            "confidence": round(confidence, 4),
            "predicted_demand_6m": round(max(0, min(predicted_6m, 100)), 2),
            "predicted_demand_12m": round(max(0, min(predicted_12m, 100)), 2),
        }
    except Exception as exc:
        logger.exception("Skill trend prediction failed for %s: %s", skill_name, exc)
        return {
            "trend_label": "stable",
            "confidence": 0.0,
            "predicted_demand_6m": float((skill_data or {}).get("demand_score") or 0),
            "predicted_demand_12m": float((skill_data or {}).get("demand_score") or 0),
            "error": str(exc),
        }


def save_model(model: Pipeline, path: str = str(MODEL_PATH)):
    try:
        os.makedirs(Path(path).parent, exist_ok=True)
        joblib.dump(model, path)
        logger.info("Skill trend model saved to %s", path)
    except Exception as exc:
        logger.exception("Failed to save skill trend model: %s", exc)


def load_model(path: str = str(MODEL_PATH)) -> Pipeline | None:
    try:
        if not os.path.exists(path):
            return None
        return joblib.load(path)
    except Exception as exc:
        logger.exception("Failed to load skill trend model: %s", exc)
        return None


def get_or_train_model() -> Pipeline:
    global _MODEL_CACHE
    try:
        if _MODEL_CACHE is not None:
            return _MODEL_CACHE
        os.makedirs(MODEL_DIR, exist_ok=True)
        model = load_model(str(MODEL_PATH))
        if model is None:
            model = train_model(_synthetic_training_data())
            save_model(model, str(MODEL_PATH))
        _MODEL_CACHE = model
        return model
    except Exception as exc:
        logger.exception("Failed to get or train skill trend model: %s", exc)
        _MODEL_CACHE = train_model(_synthetic_training_data())
        return _MODEL_CACHE
