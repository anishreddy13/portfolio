# ml-backend/monitoring/drift_detector.py
"""
Drift Detector
==============
Runs every hour and checks if the model is degrading.

WHY DRIFT DETECTION:
--------------------
Models trained in January may perform poorly by March.
Language changes. New topics emerge. "ChatGPT" wasn't
in any training data before 2023.

Without monitoring, accuracy silently drops from
87% to 65% and you never know until users complain.

WHAT WE CHECK:
--------------
1. Confidence drift — are predictions less certain?
2. Sentiment distribution shift — has the ratio changed?
3. Low confidence rate — too many uncertain predictions?

WHAT HAPPENS ON DRIFT:
----------------------
1. Log drift report to Supabase
2. Trigger retraining (in CI/CD phase)
3. Alert visible on dashboard
"""

import asyncio
from datetime import datetime, timedelta
from collections import Counter
from utils.logger import get_logger
from services.supabase_service import supabase_service

logger = get_logger("drift_detector")


class DriftDetector:

    def __init__(self):
        # Baseline from training — expected distribution
        self.baseline = {
            "Positive": 0.45,
            "Neutral":  0.35,
            "Negative": 0.20,
        }
        self.min_confidence     = 60.0   # below this = uncertain
        self.drift_threshold    = 0.15   # 15% shift = drift
        self.min_sample_size    = 50     # need at least 50 predictions
        self.accuracy_threshold = 75.0   # below this = retrain needed

    # ─────────────────────────────────────────────────────────
    # FETCH RECENT PREDICTIONS
    # ─────────────────────────────────────────────────────────
    def fetch_recent_predictions(self, hours: int = 1):
        """
        Get last N hours of predictions from Supabase.
        """
        try:
            since = (
                datetime.utcnow() - timedelta(hours=hours)
            ).isoformat()

            response = (
                supabase_service.client
                .table("news_predictions")
                .select("sentiment, confidence, processed_at")
                .gte("processed_at", since)
                .execute()
            )

            return response.data or []

        except Exception as e:
            logger.exception(f"Failed to fetch predictions: {e}")
            return []

    # ─────────────────────────────────────────────────────────
    # CHECK CONFIDENCE DRIFT
    # ─────────────────────────────────────────────────────────
    def check_confidence_drift(self, predictions: list) -> dict:
        """
        Check if model confidence has dropped.
        """
        if not predictions:
            return {"drift": False, "avg_confidence": 0}

        confidences = [p["confidence"] for p in predictions]
        avg_confidence = sum(confidences) / len(confidences)

        low_confidence_count = sum(
            1 for c in confidences
            if c < self.min_confidence
        )
        low_confidence_rate = (
            low_confidence_count / len(confidences)
        ) * 100

        drift = avg_confidence < self.accuracy_threshold

        logger.info(
            f"Confidence check: avg={avg_confidence:.1f}% "
            f"low_rate={low_confidence_rate:.1f}%"
        )

        return {
            "drift":               drift,
            "avg_confidence":      round(avg_confidence, 2),
            "low_confidence_rate": round(low_confidence_rate, 2),
        }

    # ─────────────────────────────────────────────────────────
    # CHECK DISTRIBUTION DRIFT
    # ─────────────────────────────────────────────────────────
    def check_distribution_drift(self, predictions: list) -> dict:
        """
        Check if sentiment distribution has shifted
        compared to baseline.
        """
        if not predictions:
            return {"drift": False, "drift_score": 0}

        counts  = Counter(p["sentiment"] for p in predictions)
        total   = len(predictions)

        current_dist = {
            label: counts.get(label, 0) / total
            for label in ["Positive", "Neutral", "Negative"]
        }

        # Calculate max shift from baseline
        drift_score = max(
            abs(current_dist[label] - self.baseline[label])
            for label in self.baseline
        )

        drift = drift_score > self.drift_threshold

        logger.info(
            f"Distribution check: "
            f"current={current_dist} "
            f"drift_score={drift_score:.3f}"
        )

        return {
            "drift":        drift,
            "drift_score":  round(drift_score, 4),
            "distribution": current_dist,
        }

    # ─────────────────────────────────────────────────────────
    # RUN FULL DRIFT CHECK
    # ─────────────────────────────────────────────────────────
    def run_drift_check(self) -> dict:
        """
        Run complete drift analysis.
        Returns report dict.
        """
        logger.info("🔍 Running drift check...")

        predictions = self.fetch_recent_predictions(hours=1)

        if len(predictions) < self.min_sample_size:
            logger.info(
                f"Not enough data: {len(predictions)} < "
                f"{self.min_sample_size} samples"
            )
            return {
                "drift_detected": False,
                "reason":         "insufficient_data",
                "sample_size":    len(predictions),
            }

        confidence_result   = self.check_confidence_drift(predictions)
        distribution_result = self.check_distribution_drift(predictions)

        drift_detected = (
            confidence_result["drift"] or
            distribution_result["drift"]
        )

        action = (
            "retraining_triggered"
            if drift_detected
            else "no_action"
        )

        report = {
            "drift_detected":    drift_detected,
            "accuracy":          confidence_result["avg_confidence"],
            "drift_score":       distribution_result["drift_score"],
            "action_taken":      action,
            "sample_size":       len(predictions),
            "confidence_check":  confidence_result,
            "distribution_check": distribution_result,
        }

        # ── Save to Supabase ──────────────────────────────────
        try:
            supabase_service.insert(
                table="drift_reports",
                data={
                    "drift_detected": drift_detected,
                    "accuracy":       confidence_result["avg_confidence"],
                    "drift_score":    distribution_result["drift_score"],
                    "action_taken":   action,
                    "sample_size":    len(predictions),
                }
            )
            logger.info("Drift report saved to Supabase")

        except Exception as e:
            logger.exception(f"Failed to save drift report: {e}")

        if drift_detected:
            logger.warning(
                f"⚠️  DRIFT DETECTED — "
                f"accuracy={confidence_result['avg_confidence']:.1f}% "
                f"drift_score={distribution_result['drift_score']:.3f}"
            )
        else:
            logger.info("✅ No drift detected")

        return report

    # ─────────────────────────────────────────────────────────
    # CONTINUOUS MONITORING LOOP
    # ─────────────────────────────────────────────────────────
    async def start_monitoring(
        self,
        interval_minutes: int = 60
    ):
        """
        Run drift check every N minutes forever.
        """
        logger.info(
            f"🚀 Drift monitor started "
            f"(interval: {interval_minutes}min)"
        )

        while True:
            try:
                report = self.run_drift_check()

                logger.info(
                    f"Drift check complete: "
                    f"drift={report['drift_detected']}"
                )

            except Exception as e:
                logger.exception(f"Drift check failed: {e}")

            await asyncio.sleep(interval_minutes * 60)


# Singleton
drift_detector = DriftDetector()