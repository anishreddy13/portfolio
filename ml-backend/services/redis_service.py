import json
import asyncio
from typing import AsyncGenerator, Optional

import redis.asyncio as redis

from utils.config import settings
from utils.logger import get_logger


logger = get_logger("redis_service")


class RedisService:
    """
    Centralized Redis Pub/Sub service.

    WHY THIS EXISTS:
    ----------------
    Redis is the REAL-TIME backbone of the ML system.

    It allows independent services to communicate instantly:

    RSS Fetcher
        ↓
    Redis Channel
        ↓
    Prediction Worker
        ↓
    Dashboard SSE
        ↓
    Drift Monitor

    This architecture is:
    - asynchronous
    - scalable
    - production-grade
    - loosely coupled
    """

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None

    # ─────────────────────────────────────────────────────────
    # CONNECT
    # ─────────────────────────────────────────────────────────
    async def connect(self):
        """
        Establish Redis connection.
        """

        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True
            )

            # Test connection
            await self.redis_client.ping()

            logger.info("✅ Connected to Redis")

        except Exception as e:
            logger.exception(
                f"❌ Redis connection failed: {e}"
            )
            raise

    # ─────────────────────────────────────────────────────────
    # CLOSE CONNECTION
    # ─────────────────────────────────────────────────────────
    async def close(self):
        """
        Close Redis connection cleanly.
        """

        try:
            if self.redis_client:
                await self.redis_client.close()

            logger.info("Redis connection closed")

        except Exception as e:
            logger.exception(
                f"Redis close error: {e}"
            )

    # ─────────────────────────────────────────────────────────
    # PUBLISH MESSAGE
    # ─────────────────────────────────────────────────────────
    async def publish(
        self,
        channel: str,
        data: dict
    ):
        """
        Publish JSON message to Redis channel.
        """

        try:
            if not self.redis_client:
                await self.connect()

            message = json.dumps(data)

            await self.redis_client.publish(
                channel,
                message
            )

            logger.info(
                f"Published message to '{channel}'"
            )

        except Exception as e:
            logger.exception(
                f"Publish failed on '{channel}': {e}"
            )

    # ─────────────────────────────────────────────────────────
    # SUBSCRIBE TO CHANNEL
    # ─────────────────────────────────────────────────────────
    async def subscribe(
        self,
        channel: str
    ) -> AsyncGenerator[dict, None]:
        """
        Subscribe to a Redis channel and stream messages.

        Used by:
        - prediction worker
        - SSE dashboard
        - monitoring services
        """

        try:
            if not self.redis_client:
                await self.connect()

            pubsub = self.redis_client.pubsub()

            await pubsub.subscribe(channel)

            logger.info(
                f"Subscribed to channel '{channel}'"
            )

            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0
                )

                if message:
                    try:
                        data = json.loads(message["data"])

                        yield data

                    except Exception as parse_error:
                        logger.exception(
                            f"Message parse error: {parse_error}"
                        )

                await asyncio.sleep(0.01)

        except Exception as e:
            logger.exception(
                f"Subscription failed for '{channel}': {e}"
            )

    # ─────────────────────────────────────────────────────────
    # SIMPLE HEALTH CHECK
    # ─────────────────────────────────────────────────────────
    async def health_check(self):
        """
        Verify Redis connectivity.
        """

        try:
            if not self.redis_client:
                await self.connect()

            pong = await self.redis_client.ping()

            return {
                "status": "healthy",
                "connected": pong
            }

        except Exception as e:
            logger.exception(
                f"Redis health check failed: {e}"
            )

            return {
                "status": "unhealthy",
                "connected": False,
                "error": str(e)
            }


# Singleton instance
redis_service = RedisService()