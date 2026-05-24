import asyncio
from datetime import datetime

from model import load_model, predict_sentiment

from services.redis_service import redis_service
from services.supabase_service import supabase_service

from utils.logger import get_logger


logger = get_logger("prediction_worker")


# ─────────────────────────────────────────────────────────────
# MODEL
# ─────────────────────────────────────────────────────────────
MODEL_PATH = "sentiment_model.pkl"

sentiment_pipeline = None


# ─────────────────────────────────────────────────────────────
# LOAD MODEL
# ─────────────────────────────────────────────────────────────
def initialize_model():
    global sentiment_pipeline

    sentiment_pipeline = load_model(
        MODEL_PATH
    )

    logger.info(
        "✅ Sentiment model loaded"
    )


# ─────────────────────────────────────────────────────────────
# PROCESS SINGLE HEADLINE
# ─────────────────────────────────────────────────────────────
async def process_headline(headline: dict):

    try:
        title = headline.get(
            "title",
            ""
        )

        summary = headline.get(
            "summary",
            ""
        )

        combined_text = (
            f"{title}. {summary}"
        )

        logger.info(
            f"Processing headline: "
            f"{title[:80]}"
        )

        # ─────────────────────────────────────────────────────
        # RUN SENTIMENT PREDICTION
        # ─────────────────────────────────────────────────────
        prediction = predict_sentiment(
            combined_text,
            sentiment_pipeline
        )

        result = {
            "title": title,
            "summary": summary,
            "source": headline.get("source"),
            "category": headline.get("category"),
            "link": headline.get("link"),

            "sentiment": prediction[
                "sentiment"
            ],

            "confidence": prediction[
                "confidence"
            ],

            "scores": prediction[
                "scores"
            ],

            "processed_at": (
                datetime.utcnow().isoformat()
            )
        }

        logger.info(
            f"Prediction complete → "
            f"{result['sentiment']}"
        )

        # ─────────────────────────────────────────────────────
        # STORE IN SUPABASE
        # ─────────────────────────────────────────────────────
        try:
            inserted = (
                supabase_service.insert(
                    table="news_predictions",
                    data=result
                )
            )

            logger.info(
                f"Saved to Supabase"
            )

        except Exception as db_error:
            logger.exception(
                f"Supabase insert failed: "
                f"{db_error}"
            )

        # ─────────────────────────────────────────────────────
        # PUBLISH RESULT EVENT
        # ─────────────────────────────────────────────────────
        await redis_service.publish(
            channel="predictions",
            data=result
        )

        logger.info(
            "Published prediction event"
        )

    except Exception as e:
        logger.exception(
            f"Headline processing failed: {e}"
        )


# ─────────────────────────────────────────────────────────────
# MAIN WORKER LOOP
# ─────────────────────────────────────────────────────────────
async def start_worker():

    logger.info(
        "🚀 Prediction worker started"
    )

    await redis_service.connect()

    async for headline in redis_service.subscribe(
        "news_headlines"
    ):

        try:
            await process_headline(
                headline
            )

        except Exception as e:
            logger.exception(
                f"Worker loop error: {e}"
            )


# ─────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":

    asyncio.run(start_worker())