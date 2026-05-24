"""
Combined Worker Process
=======================
Runs THREE workers in ONE process:

1. data_ingestion    — RSS → Redis every 5min
2. prediction_worker — Redis → ML → Supabase
3. drift_detector    — Hourly drift monitoring
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
from monitoring.drift_detector import drift_detector
from utils.logger import get_logger

logger = get_logger("start_workers")


# ─────────────────────────────────────────────────────────────
# HEALTH SERVER (required by HF Spaces)
# ─────────────────────────────────────────────────────────────
class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"ML Workers Running")

    def log_message(self, format, *args):
        pass


def start_health_server():
    server = HTTPServer(("0.0.0.0", 7860), HealthHandler)
    logger.info("Health server running on port 7860")
    server.serve_forever()


# ─────────────────────────────────────────────────────────────
# INGESTION RUNNER
# ─────────────────────────────────────────────────────────────
async def run_ingestion():
    logger.info("🟢 Starting ingestion worker...")
    while True:
        try:
            await redis_service.connect()
            await news_ingestion.start_streaming(
                interval_seconds=300
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
    logger.info("🟢 Starting prediction worker...")
    await asyncio.sleep(5)
    while True:
        try:
            initialize_model()
            await run_prediction_worker()
        except Exception as e:
            logger.exception(
                f"Prediction crashed — restarting in 15s: {e}"
            )
            await asyncio.sleep(15)


# ─────────────────────────────────────────────────────────────
# DRIFT MONITORING RUNNER
# ─────────────────────────────────────────────────────────────
async def run_drift_monitor():
    logger.info("🟢 Starting drift monitor...")
    # Wait for predictions to accumulate first
    await asyncio.sleep(30)
    while True:
        try:
            await drift_detector.start_monitoring(
                interval_minutes=60
            )
        except Exception as e:
            logger.exception(
                f"Drift monitor crashed — restarting in 60s: {e}"
            )
            await asyncio.sleep(60)


# ─────────────────────────────────────────────────────────────
# GRACEFUL SHUTDOWN
# ─────────────────────────────────────────────────────────────
def handle_shutdown(sig, frame):
    logger.info(f"Shutdown signal ({sig}). Stopping...")
    sys.exit(0)


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
async def main():
    logger.info("🚀 ML Workers starting...")
    logger.info(
        "Workers: [ingestion] + [prediction] + [drift_monitor]"
    )

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT,  handle_shutdown)

    await asyncio.gather(
        run_ingestion(),
        run_prediction(),
        run_drift_monitor(),
    )


if __name__ == "__main__":
    health_thread = threading.Thread(
        target=start_health_server,
        daemon=True
    )
    health_thread.start()
    asyncio.run(main())