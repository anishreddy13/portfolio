import re
from collections import Counter

from utils.logger import get_logger


logger = get_logger(__name__)

SKILLS_TAXONOMY = {
    "languages": [
        "python", "javascript", "typescript", "java", "go",
        "rust", "kotlin", "swift", "c++", "c#", "ruby",
        "scala", "r", "matlab", "bash", "shell",
    ],
    "frontend": [
        "react", "next.js", "vue", "angular", "svelte",
        "tailwind", "css", "html", "webpack", "vite",
        "redux", "graphql", "typescript",
    ],
    "backend": [
        "fastapi", "django", "flask", "node.js", "express",
        "spring", "rails", "laravel", "nestjs", "fiber",
    ],
    "ml_ai": [
        "pytorch", "tensorflow", "scikit-learn", "keras",
        "hugging face", "transformers", "langchain", "llm",
        "openai", "computer vision", "nlp", "bert", "gpt",
        "stable diffusion", "mlops", "llmops", "rag",
        "vector database", "embeddings", "fine-tuning",
        "reinforcement learning", "xgboost", "lightgbm",
    ],
    "devops": [
        "docker", "kubernetes", "aws", "gcp", "azure",
        "terraform", "ansible", "jenkins", "github actions",
        "ci/cd", "helm", "prometheus", "grafana", "datadog",
    ],
    "databases": [
        "postgresql", "mysql", "mongodb", "redis", "supabase",
        "firebase", "elasticsearch", "pinecone", "weaviate",
        "faiss", "sqlite", "dynamodb", "cassandra",
    ],
    "data": [
        "spark", "kafka", "airflow", "dbt", "snowflake",
        "bigquery", "pandas", "numpy", "polars", "dask",
    ],
    "tools": [
        "git", "linux", "jira", "confluence", "figma",
        "postman", "swagger", "mlflow", "wandb", "dvc",
    ],
}


def _skill_pattern(skill: str) -> re.Pattern:
    escaped = re.escape(skill.lower())
    if skill.lower() in {"c++", "c#", "ci/cd", "next.js", "node.js", "scikit-learn"}:
        return re.compile(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", re.IGNORECASE)
    return re.compile(rf"\b{escaped}\b", re.IGNORECASE)


def extract_skills_from_text(text: str) -> list[str]:
    try:
        normalized = (text or "").lower()
        matched: set[str] = set()
        for skills in SKILLS_TAXONOMY.values():
            for skill in skills:
                if _skill_pattern(skill).search(normalized):
                    matched.add(skill)
        return sorted(matched)
    except Exception as exc:
        logger.exception("Skill extraction failed: %s", exc)
        return []


def extract_skills_from_jobs(jobs: list[dict]) -> list[dict]:
    updated_jobs: list[dict] = []
    for job in jobs:
        try:
            text = f"{job.get('title', '')}\n{job.get('raw_text', '')}"
            updated = {**job, "skills": extract_skills_from_text(text)}
            updated_jobs.append(updated)
        except Exception as exc:
            logger.exception("Failed to extract skills for job: %s", exc)
            updated_jobs.append({**job, "skills": []})
    return updated_jobs


def compute_skill_frequency(jobs: list[dict]) -> dict:
    try:
        counter: Counter[str] = Counter()
        for job in jobs:
            for skill in set(job.get("skills", [])):
                counter[skill] += 1
        return dict(counter)
    except Exception as exc:
        logger.exception("Failed to compute skill frequency: %s", exc)
        return {}


def get_top_skills(jobs: list[dict], top_n: int = 50) -> list:
    try:
        total_jobs = max(len(jobs), 1)
        frequency = compute_skill_frequency(jobs)
        ranked = sorted(frequency.items(), key=lambda item: item[1], reverse=True)
        return [
            {
                "skill": skill,
                "count": count,
                "percentage": round((count / total_jobs) * 100, 2),
            }
            for skill, count in ranked[:top_n]
        ]
    except Exception as exc:
        logger.exception("Failed to rank top skills: %s", exc)
        return []
