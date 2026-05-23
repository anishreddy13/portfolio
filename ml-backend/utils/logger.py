import logging
import os
from logging.handlers import RotatingFileHandler
from utils.config import settings


# ─────────────────────────────────────────────────────────────
# LOG DIRECTORY
# ─────────────────────────────────────────────────────────────
LOG_DIR = "logs"

if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)


# ─────────────────────────────────────────────────────────────
# LOG FORMAT
# ─────────────────────────────────────────────────────────────
LOG_FORMAT = (
    "%(asctime)s | "
    "%(levelname)s | "
    "%(name)s | "
    "%(message)s"
)

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


# ─────────────────────────────────────────────────────────────
# LOGGER FACTORY
# ─────────────────────────────────────────────────────────────
def get_logger(name: str) -> logging.Logger:
    """
    Create and configure a reusable logger.

    WHY THIS EXISTS:
    ----------------
    Real-time ML systems are extremely difficult to debug
    without structured logging.

    We will later use logs for:
    - RSS ingestion monitoring
    - Redis pub/sub debugging
    - SSE connection debugging
    - Drift detection alerts
    - CI/CD monitoring
    - Deployment diagnostics
    - Model reload tracking

    FEATURES:
    ---------
    - console logging
    - rotating file logging
    - timestamped logs
    - service-based loggers
    - production-safe formatting
    """

    logger = logging.getLogger(name)

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    logger.setLevel(settings.LOG_LEVEL)

    formatter = logging.Formatter(
        LOG_FORMAT,
        datefmt=DATE_FORMAT
    )

    # ─────────────────────────────────────────────────────────
    # CONSOLE HANDLER
    # ─────────────────────────────────────────────────────────
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # ─────────────────────────────────────────────────────────
    # FILE HANDLER
    # ─────────────────────────────────────────────────────────
    file_handler = RotatingFileHandler(
        filename=f"{LOG_DIR}/{name}.log",
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=3,
        encoding="utf-8"
    )

    file_handler.setFormatter(formatter)

    # ─────────────────────────────────────────────────────────
    # ADD HANDLERS
    # ─────────────────────────────────────────────────────────
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    logger.propagate = False

    return logger