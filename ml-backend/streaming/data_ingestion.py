import asyncio
import feedparser
from datetime import datetime
from typing import List, Dict

from services.redis_service import redis_service
from utils.logger import get_logger


logger = get_logger("data_ingestion")


# ─────────────────────────────────────────────────────────────
# RSS SOURCES
# ─────────────────────────────────────────────────────────────
RSS_FEEDS = [
    {
        "name": "TechCrunch",
        "url": "https://techcrunch.com/feed/",
        "category": "technology"
    },
    {
        "name": "The Verge",
        "url": "https://www.theverge.com/rss/index.xml",
        "category": "technology"
    },
    {
        "name": "Wired",
        "url": "https://www.wired.com/feed/rss",
        "category": "technology"
    },
    {
        "name": "Ars Technica",
        "url": "https://feeds.arstechnica.com/arstechnica/index",
        "category": "technology"
    }
]


# ─────────────────────────────────────────────────────────────
# INGESTION SERVICE
# ─────────────────────────────────────────────────────────────
class RealtimeNewsIngestion:
    """
    Continuously ingests live RSS headlines
    and publishes them into Redis.

    FLOW:
    -----
    RSS Feed
        ↓
    Redis Channel
        ↓
    Prediction Worker
        ↓
    Dashboard
    """

    def __init__(self):
        self.seen_titles = set()

    # ─────────────────────────────────────────────────────────
    # FETCH SINGLE FEED
    # ─────────────────────────────────────────────────────────
    async def fetch_feed(
        self,
        source: Dict
    ) -> List[Dict]:

        try:
            logger.info(
                f"Fetching {source['name']}"
            )

            feed = feedparser.parse(
                source["url"]
            )

            headlines = []

            for entry in feed.entries[:10]:

                title = entry.get(
                    "title",
                    ""
                ).strip()

                link = entry.get(
                    "link",
                    ""
                )

                summary = entry.get(
                    "summary",
                    ""
                )

                if not title:
                    continue

                # Avoid duplicates
                #if title in self.seen_titles:
                   # continue

                #self.seen_titles.add(title)

                headlines.append({
                    "title": title,
                    "summary": summary,
                    "link": link,
                    "source": source["name"],
                    "category": source["category"],
                    "timestamp": (
                        datetime.utcnow().isoformat()
                    )
                })

            logger.info(
                f"{source['name']} → "
                f"{len(headlines)} new headlines"
            )

            return headlines

        except Exception as e:
            logger.exception(
                f"Feed fetch failed "
                f"({source['name']}): {e}"
            )

            return []

    # ─────────────────────────────────────────────────────────
    # PUBLISH HEADLINES
    # ─────────────────────────────────────────────────────────
    async def publish_headlines(
        self,
        headlines: List[Dict]
    ):

        for headline in headlines:

            try:
                await redis_service.publish(
                    channel="news_headlines",
                    data=headline
                )

                logger.info(
                    f"Published headline: "
                    f"{headline['title'][:60]}"
                )

            except Exception as e:
                logger.exception(
                    f"Headline publish failed: {e}"
                )

    # ─────────────────────────────────────────────────────────
    # RUN SINGLE INGESTION CYCLE
    # ─────────────────────────────────────────────────────────
    async def ingestion_cycle(self):

        logger.info(
            "Starting ingestion cycle"
        )

        tasks = [
            self.fetch_feed(feed)
            for feed in RSS_FEEDS
        ]

        results = await asyncio.gather(
            *tasks
        )

        all_headlines = []

        for headlines in results:
            all_headlines.extend(headlines)

        logger.info(
            f"Collected "
            f"{len(all_headlines)} headlines"
        )

        await self.publish_headlines(
            all_headlines
        )

    # ─────────────────────────────────────────────────────────
    # CONTINUOUS STREAMING LOOP
    # ─────────────────────────────────────────────────────────
    async def start_streaming(
        self,
        interval_seconds: int = 60
    ):
        """
        Continuously fetch RSS feeds forever.
        """

        logger.info(
            "🚀 Realtime ingestion started"
        )

        while True:

            try:
                await self.ingestion_cycle()

            except Exception as e:
                logger.exception(
                    f"Ingestion cycle failed: {e}"
                )

            logger.info(
                f"Sleeping "
                f"{interval_seconds}s"
            )

            await asyncio.sleep(
                interval_seconds
            )


# Singleton
news_ingestion = RealtimeNewsIngestion()


# ─────────────────────────────────────────────────────────────
# MANUAL TEST ENTRYPOINT
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":

    async def run():
        await redis_service.connect()

        await news_ingestion.start_streaming(
            interval_seconds=60
        )

    asyncio.run(run())