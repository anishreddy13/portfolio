from __future__ import annotations

import re
from datetime import datetime, timezone

from services.skill_extractor import extract_skills_from_text
from utils.logger import get_logger

logger = get_logger(__name__)


def extract_contact_info(text: str) -> dict:
    try:
        body = text or ""
        email = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", body)
        github = re.search(r"https?://(?:www\.)?github\.com/[A-Za-z0-9_.-]+/?", body, re.IGNORECASE)
        linkedin = re.search(r"https?://(?:www\.)?linkedin\.com/in/[A-Za-z0-9_.%-]+/?", body, re.IGNORECASE)
        phone = re.search(r"(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4}", body)
        return {
            "email": email.group(0) if email else "",
            "github": github.group(0) if github else "",
            "linkedin": linkedin.group(0) if linkedin else "",
            "phone": phone.group(0) if phone else "",
        }
    except Exception as exc:
        logger.exception("Failed to extract contact info: %s", exc)
        return {"email": "", "github": "", "linkedin": "", "phone": ""}


def extract_experience_level(text: str) -> str:
    try:
        body = (text or "").lower()
        if re.search(r"\b(5\+|5\s*\+\s*years|[5-9]\s*(?:\+)?\s*years|senior|lead|architect|principal|staff)\b", body):
            return "senior"
        if re.search(r"\b(2\s*[-–]\s*4\s*years|2\+?\s*years|3\+?\s*years|4\+?\s*years|mid\s*level|intermediate)\b", body):
            return "mid"
        if re.search(r"\b(fresher|0\s*[-–]\s*1\s*year|entry\s*level|junior|intern|graduate)\b", body):
            return "junior"
        return "mid"
    except Exception as exc:
        logger.exception("Failed to extract experience level: %s", exc)
        return "mid"


def extract_education(text: str) -> dict:
    try:
        body = text or ""
        degree_match = re.search(r"\b(B\.?\s?Tech|M\.?\s?Tech|B\.?\s?E\.?|M\.?\s?E\.?|BSc|MSc|MBA|PhD|Bachelor(?:'s)?|Master(?:'s)?)\b", body, re.IGNORECASE)
        field_match = re.search(
            r"\b(Computer Science|Data Science|Artificial Intelligence|Machine Learning|Information Technology|Electronics|Software Engineering|Business Administration)\b",
            body,
            re.IGNORECASE,
        )
        institution_match = re.search(
            r"(?:University|Institute|College|School)\s+of\s+[A-Za-z .]+|[A-Za-z .]+(?:University|Institute|College)",
            body,
            re.IGNORECASE,
        )
        return {
            "degree": degree_match.group(0).strip() if degree_match else "",
            "field": field_match.group(0).strip() if field_match else "",
            "institution": institution_match.group(0).strip() if institution_match else "",
        }
    except Exception as exc:
        logger.exception("Failed to extract education: %s", exc)
        return {"degree": "", "field": "", "institution": ""}


def extract_projects(text: str) -> list[str]:
    try:
        body = text or ""
        section_match = re.search(
            r"(?:Projects|Work|Experience)\s*:?\s*(.*?)(?:\n\s*(?:Education|Skills|Certifications|Achievements|Contact)\s*:|\Z)",
            body,
            re.IGNORECASE | re.DOTALL,
        )
        section = section_match.group(1) if section_match else body
        candidates = []
        for line in re.split(r"\n|•|- ", section):
            cleaned = re.sub(r"\s+", " ", line).strip(" .:-")
            if 20 <= len(cleaned) <= 220:
                candidates.append(cleaned)
            if len(candidates) >= 5:
                break
        return candidates[:5]
    except Exception as exc:
        logger.exception("Failed to extract projects: %s", exc)
        return []


def parse_resume(resume_text: str) -> dict:
    try:
        text = resume_text or ""
        return {
            "skills": extract_skills_from_text(text),
            "experience_level": extract_experience_level(text),
            "contact": extract_contact_info(text),
            "education": extract_education(text),
            "projects": extract_projects(text),
            "word_count": len(re.findall(r"\b\w+\b", text)),
            "parsed_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        logger.exception("Resume parsing failed: %s", exc)
        return {
            "skills": [],
            "experience_level": "mid",
            "contact": {"email": "", "github": "", "linkedin": "", "phone": ""},
            "education": {"degree": "", "field": "", "institution": ""},
            "projects": [],
            "word_count": 0,
            "parsed_at": datetime.now(timezone.utc).isoformat(),
            "error": str(exc),
        }
