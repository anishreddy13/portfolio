# ml-backend/start_workers.py
"""
Combined Worker Process for Hugging Face Spaces
================================================

WHY SINGLE PROCESS:
-------------------
HF Spaces free tier gives us one container.
asyncio.gather() runs both workers as concurrent
coroutines — no threads, no multiprocessing,
no extra RAM overhead.

FLOW:
-----
start_workers.py
    ├── run_ingestion()    → RSS → Redis (every 5min)
    └── run_prediction()   → Redis → ML → Supabase

HUGGING FACE NOTE:
------------------
HF Spaces requires port 7860 to be bound.
We run a tiny health server on 7860 so HF
doesn't kill our container thinking it crashed.
"""

import asyncio
import signal
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

from services.redis_service import redis_service
from streaming.data_ingestion import news_ingestion
from workers.prediction_worker import (
    initialize_model,
    start_worker as run_prediction_worker,
)
from utils.logger import get_logger

logger = get_logger("start_workers")


# ─────────────────────────────────────────────────────────────
# HEALTH SERVER
# Required by Hugging Face Spaces —
# HF expects something on port 7860.
# Without this the Space gets killed.
# ─────────────────────────────────────────────────────────────
class HealthHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"ML Workers Running")

    def log_message(self, format, *args):
        # Suppress default HTTP logs — too noisy
        pass


def start_health_server():
    """
    Runs tiny HTTP server on port 7860 in a background thread.
    Required to keep HF Space alive.
    """
    server = HTTPServer(("0.0.0.0", 7860), HealthHandler)
    logger.info("Health server running on port 7860")
    server.serve_forever()


# ─────────────────────────────────────────────────────────────
# INGESTION RUNNER
# ─────────────────────────────────────────────────────────────
async def run_ingestion():
    """
    Connects Redis then starts RSS ingestion loop.
    Auto-restarts on crash.
    """
    logger.info("🟢 Starting ingestion worker...")

    while True:
        try:
            await redis_service.connect()
            await news_ingestion.start_streaming(
                interval_seconds=300  # 5 minutes
            )
        except Exception as e:
            logger.exception(
                f"Ingestion crashed — restarting in 15s: {e}"
            )
            await asyncio.sleep(15)


# ─────────────────────────────────────────────────────────────
# PREDICTION RUNNER
# ─────────────────────────────────────────────────────────────
async def run_prediction():
    """
    Loads model then starts prediction loop.
    Auto-restarts on crash.
    """
    logger.info("🟢 Starting prediction worker...")

    # Wait for ingestion to connect Redis first
    await asyncio.sleep(5)

    while True:
        try:
            initialize_model()
            await run_prediction_worker()
        except Exception as e:
            logger.exception(
                f"Prediction worker crashed — restarting in 15s: {e}"
            )
            await asyncio.sleep(15)


# ─────────────────────────────────────────────────────────────
# GRACEFUL SHUTDOWN
# ─────────────────────────────────────────────────────────────
def handle_shutdown(sig, frame):
    logger.info(
        f"Shutdown signal received ({sig}). Stopping workers..."
    )
    sys.exit(0)


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
async def main():
    logger.info("🚀 ML Workers starting on Hugging Face Spaces...")
    logger.info("Workers: [data_ingestion] + [prediction_worker]")

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT,  handle_shutdown)

    # Run both workers concurrently
    await asyncio.gather(
        run_ingestion(),
        run_prediction(),
    )


if __name__ == "__main__":
    # Start health server in background thread first
    health_thread = threading.Thread(
        target=start_health_server,
        daemon=True  # Dies when main process dies
    )
    health_thread.start()

    # Run async workers
    asyncio.run(main())