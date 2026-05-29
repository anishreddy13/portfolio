import logging
import os
from logging.handlers import RotatingFileHandler


LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "career.log")
LOG_FORMAT = "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def get_logger(module_name: str) -> logging.Logger:
    os.makedirs(LOG_DIR, exist_ok=True)

    logger_instance = logging.getLogger(module_name)
    logger_instance.setLevel(logging.INFO)
    logger_instance.propagate = False

    if logger_instance.handlers:
        return logger_instance

    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=2_000_000,
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    logger_instance.addHandler(console_handler)
    logger_instance.addHandler(file_handler)

    return logger_instance


logger = get_logger(__name__)
