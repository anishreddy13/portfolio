import os
from dataclasses import dataclass
from dotenv import load_dotenv

# Load .env — safe to call multiple times, subsequent calls are no-ops
load_dotenv()


@dataclass
class Settings:
    """
    Centralized application configuration.
    """

    # ─────────────────────────────────────────────────────────
    # APP
    # ─────────────────────────────────────────────────────────
    APP_NAME:    str  = os.getenv("APP_NAME",    "ML Production System")
    APP_VERSION: str  = os.getenv("APP_VERSION", "6.0.0")
    ENVIRONMENT: str  = os.getenv("ENVIRONMENT", "development")
    DEBUG:       bool = os.getenv("DEBUG", "False").lower() == "true"

    # ─────────────────────────────────────────────────────────
    # FASTAPI
    # ─────────────────────────────────────────────────────────
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 8000))
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

    # ─────────────────────────────────────────────────────────
    # SUPABASE
    # ─────────────────────────────────────────────────────────
    SUPABASE_URL:              str = os.getenv("SUPABASE_URL",              "")
    SUPABASE_ANON_KEY:         str = os.getenv("SUPABASE_ANON_KEY",         "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # ─────────────────────────────────────────────────────────
    # REDIS / UPSTASH
    # ─────────────────────────────────────────────────────────
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # ─────────────────────────────────────────────────────────
    # MLFLOW
    # ─────────────────────────────────────────────────────────
    MLFLOW_TRACKING_URI:    str = os.getenv("MLFLOW_TRACKING_URI",    "./mlruns")
    MLFLOW_EXPERIMENT_NAME: str = os.getenv("MLFLOW_EXPERIMENT_NAME", "tech-news-sentiment")

    # ─────────────────────────────────────────────────────────
    # GITHUB ACTIONS
    # ─────────────────────────────────────────────────────────
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_REPO:  str = os.getenv("GITHUB_REPO",  "")
    GITHUB_OWNER: str = os.getenv("GITHUB_OWNER", "")

    # ─────────────────────────────────────────────────────────
    # RENDER DEPLOYMENT
    # ─────────────────────────────────────────────────────────
    RENDER_DEPLOY_HOOK_URL: str = os.getenv("RENDER_DEPLOY_HOOK_URL", "")

    # ─────────────────────────────────────────────────────────
    # HUGGING FACE SPACE
    # ─────────────────────────────────────────────────────────
    SKIN_BACKEND_URL: str = os.getenv("SKIN_BACKEND_URL", "")

    # ─────────────────────────────────────────────────────────
    # RSS INGESTION
    # ─────────────────────────────────────────────────────────
    RSS_FETCH_INTERVAL_MINUTES: int = int(os.getenv("RSS_FETCH_INTERVAL_MINUTES", 5))

    # ─────────────────────────────────────────────────────────
    # DRIFT MONITORING
    # ─────────────────────────────────────────────────────────
    DRIFT_CHECK_INTERVAL_MINUTES: int   = int(os.getenv("DRIFT_CHECK_INTERVAL_MINUTES", 60))
    DRIFT_THRESHOLD:              float = float(os.getenv("DRIFT_THRESHOLD", 0.30))
    MINIMUM_MODEL_ACCURACY:       float = float(os.getenv("MINIMUM_MODEL_ACCURACY", 0.80))

    # ─────────────────────────────────────────────────────────
    # LOGGING
    # ─────────────────────────────────────────────────────────
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # ─────────────────────────────────────────────────────────
    # VALIDATION
    # ─────────────────────────────────────────────────────────
    def validate(self):
        """
        Warn about missing credentials but do NOT raise.

        WHY NON-FATAL:
        --------------
        Raising here crashes the app before FastAPI even starts,
        making it impossible to serve ML predictions even when
        only Supabase/Redis keys are wrong.

        The individual services (supabase_service, redis_service)
        handle their own unavailability gracefully.
        """

        warnings = []

        if not self.SUPABASE_URL:
            warnings.append("SUPABASE_URL")
        if not self.SUPABASE_ANON_KEY and not self.SUPABASE_SERVICE_ROLE_KEY:
            warnings.append("SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY")
        if not self.REDIS_URL:
            warnings.append("REDIS_URL")

        if warnings:
            import logging
            logging.getLogger("config").warning(
                f"⚠️  Missing .env variables: {warnings} "
                f"— dependent services will be unavailable"
            )

        return True

    def cors_origins(self):
        origins = [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]
        if not origins or "*" in origins:
            raise ValueError("ALLOWED_ORIGINS must contain explicit trusted origins; wildcards are not allowed.")
        return origins


# ✅ Singleton — never raises, so importing config is always safe
settings = Settings()
settings.validate()
