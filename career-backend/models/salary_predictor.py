from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
from xgboost import XGBRegressor

from utils.logger import get_logger

logger = get_logger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "saved_models"
MODEL_PATH = MODEL_DIR / "salary_model.pkl"

ML_SKILLS = {"pytorch", "tensorflow", "scikit-learn", "keras", "hugging face", "llm", "langchain", "mlops", "rag"}
CLOUD_SKILLS = {"aws", "gcp", "azure", "supabase", "firebase"}
DEVOPS_SKILLS = {"kubernetes", "docker", "terraform", "ansible", "jenkins", "github actions", "helm"}
FRONTEND_SKILLS = {"react", "next.js", "vue", "angular", "svelte", "tailwind", "typescript"}
BACKEND_SKILLS = {"fastapi", "django", "flask", "node.js", "express", "spring", "postgresql", "redis"}
HIGH_DEMAND = ML_SKILLS | CLOUD_SKILLS | DEVOPS_SKILLS | {"typescript", "fastapi", "rust", "go"}

_MODEL_CACHE: dict | None = None


def _experience_code(experience_level: str) -> int:
    level = experience_level.lower().strip()
    if level in {"senior", "lead", "principal", "staff"}:
        return 2
    if level in {"mid", "intermediate"}:
        return 1
    return 0


def _location_code(location: str) -> int:
    normalized = location.lower().strip()
    if "us" in normalized or "united states" in normalized or "usa" in normalized:
        return 1
    if "europe" in normalized or "uk" in normalized or "germany" in normalized:
        return 2
    if "remote" in normalized:
        return 3
    return 0


def _normalized_skills(skills: list[str]) -> set[str]:
    return {skill.lower().strip() for skill in skills if skill}


def build_salary_features(
    skills: list[str],
    experience_level: str,
    location: str,
) -> np.ndarray:
    try:
        skill_set = _normalized_skills(skills)
        demand_score = 75.0 if skill_set & HIGH_DEMAND else 42.0
        if skill_set & ML_SKILLS:
            demand_score += 8
        if skill_set & DEVOPS_SKILLS:
            demand_score += 6
        vector = np.array(
            [
                len(skill_set),
                1 if skill_set & ML_SKILLS else 0,
                1 if skill_set & CLOUD_SKILLS else 0,
                1 if skill_set & DEVOPS_SKILLS else 0,
                1 if skill_set & FRONTEND_SKILLS else 0,
                1 if skill_set & BACKEND_SKILLS else 0,
                _experience_code(experience_level),
                _location_code(location),
                min(demand_score, 100.0),
            ],
            dtype=float,
        )
        return vector
    except Exception as exc:
        logger.exception("Failed to build salary features: %s", exc)
        return np.zeros(9, dtype=float)


def _generate_synthetic_salary_data(n_samples: int = 700) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rng = np.random.default_rng(42)
    skill_pool = list(ML_SKILLS | CLOUD_SKILLS | DEVOPS_SKILLS | FRONTEND_SKILLS | BACKEND_SKILLS | {"python", "java", "git", "sql"})
    locations = ["india", "us", "europe", "remote"]
    levels = ["junior", "mid", "senior"]
    features, inr_targets, usd_targets = [], [], []

    for _ in range(n_samples):
        skills = list(rng.choice(skill_pool, size=int(rng.integers(3, 11)), replace=False))
        level = str(rng.choice(levels, p=[0.35, 0.4, 0.25]))
        location = str(rng.choice(locations, p=[0.55, 0.2, 0.1, 0.15]))
        vector = build_salary_features(skills, level, location)
        skill_set = _normalized_skills(skills)

        base_inr = 450_000 + (vector[0] * 40_000)
        base_usd = 65_000 + (vector[0] * 2_500)
        multiplier = 1 + (_experience_code(level) * 0.75)
        if skill_set & ML_SKILLS:
            multiplier += 0.35
        if skill_set & DEVOPS_SKILLS:
            multiplier += 0.22
        if skill_set & CLOUD_SKILLS:
            multiplier += 0.18
        if location == "us":
            base_usd += 45_000
            base_inr *= 1.35
        elif location == "europe":
            base_usd += 22_000
            base_inr *= 1.2
        elif location == "remote":
            base_usd += 12_000
            base_inr *= 1.15

        noise_inr = rng.normal(1.0, 0.13)
        noise_usd = rng.normal(1.0, 0.11)
        features.append(vector)
        inr_targets.append(max(300_000, base_inr * multiplier * noise_inr))
        usd_targets.append(max(45_000, base_usd * multiplier * noise_usd))

    return np.vstack(features), np.array(inr_targets), np.array(usd_targets)


def train_model() -> dict:
    try:
        x, y_inr, y_usd = _generate_synthetic_salary_data()
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
        inr_model.fit(x, y_inr)
        usd_model.fit(x, y_usd)
        logger.info("Salary models trained with %s synthetic samples", len(x))
        return {"inr": inr_model, "usd": usd_model}
    except Exception as exc:
        logger.exception("Failed to train salary model: %s", exc)
        raise


def _format_salary(currency: str, min_salary: float, max_salary: float) -> str:
    if currency == "INR":
        return f"₹{min_salary / 100000:.1f}L - ₹{max_salary / 100000:.1f}L per year"
    return f"${min_salary / 1000:.0f}k - ${max_salary / 1000:.0f}k per year"


def predict_salary(
    skills: list[str],
    experience_level: str = "mid",
    location: str = "india",
) -> dict:
    try:
        models = get_or_train_model()
        features = build_salary_features(skills, experience_level, location).reshape(1, -1)
        currency = "USD" if _location_code(location) in {1, 2, 3} else "INR"
        model = models["usd"] if currency == "USD" else models["inr"]
        median = float(model.predict(features)[0])
        min_salary = median * 0.85
        max_salary = median * 1.18
        return {
            "currency": currency,
            "min_salary": round(min_salary, 2),
            "max_salary": round(max_salary, 2),
            "median_salary": round(median, 2),
            "confidence": 0.78,
            "formatted": _format_salary(currency, min_salary, max_salary),
        }
    except Exception as exc:
        logger.exception("Salary prediction failed: %s", exc)
        return {
            "currency": "INR",
            "min_salary": 0.0,
            "max_salary": 0.0,
            "median_salary": 0.0,
            "confidence": 0.0,
            "formatted": "Unavailable",
            "error": str(exc),
        }


def get_salary_by_role(target_role: str) -> dict:
    role = target_role.lower()
    if "ml" in role or "ai" in role:
        return predict_salary(["python", "pytorch", "mlops", "aws"], "senior", "india")
    if "devops" in role:
        return predict_salary(["docker", "kubernetes", "aws", "terraform"], "mid", "india")
    if "frontend" in role:
        return predict_salary(["react", "next.js", "typescript", "tailwind"], "mid", "india")
    if "backend" in role:
        return predict_salary(["fastapi", "postgresql", "redis", "docker"], "mid", "india")
    return predict_salary(["python", "javascript", "git", "sql"], "mid", "india")


def save_model(model: dict, path: str = str(MODEL_PATH)):
    try:
        os.makedirs(Path(path).parent, exist_ok=True)
        joblib.dump(model, path)
        logger.info("Salary model saved to %s", path)
    except Exception as exc:
        logger.exception("Failed to save salary model: %s", exc)


def load_model(path: str = str(MODEL_PATH)) -> dict | None:
    try:
        if not os.path.exists(path):
            return None
        return joblib.load(path)
    except Exception as exc:
        logger.exception("Failed to load salary model: %s", exc)
        return None


def get_or_train_model() -> dict:
    global _MODEL_CACHE
    try:
        if _MODEL_CACHE is not None:
            return _MODEL_CACHE
        os.makedirs(MODEL_DIR, exist_ok=True)
        model = load_model(str(MODEL_PATH))
        if model is None:
            model = train_model()
            save_model(model, str(MODEL_PATH))
        _MODEL_CACHE = model
        return model
    except Exception as exc:
        logger.exception("Failed to get or train salary model: %s", exc)
        _MODEL_CACHE = train_model()
        return _MODEL_CACHE
