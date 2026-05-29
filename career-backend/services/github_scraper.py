from datetime import datetime, timezone

import httpx

from db.supabase_client import supabase
from utils.config import settings
from utils.logger import get_logger


logger = get_logger(__name__)

GITHUB_SEARCH_URL = "https://api.github.com/search/repositories"
LANGUAGES = ["Python", "TypeScript", "JavaScript", "Rust", "Go", "Java", "Kotlin", "Swift"]
TECH_KEYWORDS = [
    "react", "next", "fastapi", "django", "flask", "pytorch", "tensorflow",
    "llm", "rag", "langchain", "kubernetes", "docker", "terraform", "redis",
    "supabase", "postgres", "graphql", "rust", "go", "typescript",
]


def _headers() -> dict:
    headers = {"Accept": "application/vnd.github.v3+json"}
    if settings.github_token:
        headers["Authorization"] = f"token {settings.github_token}"
    return headers


async def fetch_trending_repos(
    language: str = "",
    since: str = "weekly",
) -> list[dict]:
    del since
    q = "stars:>100 pushed:>2024-01-01"
    if language:
        q += f" language:{language}"
    params = {"q": q, "sort": "stars", "order": "desc", "per_page": 30}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(GITHUB_SEARCH_URL, headers=_headers(), params=params)
            response.raise_for_status()
            repos = response.json().get("items", [])
            fetched_at = datetime.now(timezone.utc).isoformat()
            return [
                {
                    "repo_name": repo.get("full_name"),
                    "language": repo.get("language"),
                    "stars": repo.get("stargazers_count", 0),
                    "trend_score": min(round((repo.get("stargazers_count", 0) / 1000), 2), 100),
                    "description": repo.get("description") or "",
                    "fetched_at": fetched_at,
                }
                for repo in repos
            ]
    except Exception as exc:
        logger.exception("GitHub trending fetch failed for %s: %s", language or "overall", exc)
        return []


async def fetch_all_trending() -> list[dict]:
    combined: list[dict] = []
    seen: set[str] = set()
    for language in ["", *LANGUAGES]:
        repos = await fetch_trending_repos(language=language)
        for repo in repos:
            repo_name = repo.get("repo_name")
            if repo_name and repo_name not in seen:
                seen.add(repo_name)
                combined.append(repo)
    try:
        if combined:
            supabase.table("github_trending").upsert(combined, on_conflict="repo_name").execute()
            logger.info("Saved %s GitHub trending repositories", len(combined))
    except Exception as exc:
        logger.exception("Failed to save GitHub trending repositories: %s", exc)
    return combined


async def extract_tech_from_repos(repos: list) -> list[str]:
    try:
        found: set[str] = set()
        for repo in repos:
            text = f"{repo.get('repo_name', '')} {repo.get('description', '')}".lower()
            for keyword in TECH_KEYWORDS:
                if keyword in text:
                    found.add(keyword)
            if repo.get("language"):
                found.add(str(repo["language"]).lower())
        return sorted(found)
    except Exception as exc:
        logger.exception("Failed to extract technologies from repos: %s", exc)
        return []
