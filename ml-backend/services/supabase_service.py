from supabase import create_client
from utils.config import settings
from utils.logger import get_logger


logger = get_logger("supabase_service")


class SupabaseService:

    def __init__(self):

        self.client = None
        self._connected = False

        self._connect()

    # ─────────────────────────────────────────────
    # CONNECT
    # ─────────────────────────────────────────────
    def _connect(self):

        try:

            self.client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )

            self._connected = True

            logger.info(
                "✅ Supabase connection established"
            )

        except Exception as e:

            logger.exception(
                f"❌ Failed to connect to Supabase: {e}"
            )

            self.client = None
            self._connected = False

    # ─────────────────────────────────────────────
    # AVAILABILITY CHECK
    # ─────────────────────────────────────────────
    def _is_available(self):

        return (
            self.client is not None
            and self._connected
        )

    # ─────────────────────────────────────────────
    # HEALTH CHECK
    # ─────────────────────────────────────────────
    def health_check(self):

        if not self._is_available():

            return {
                "status": "unavailable",
                "connected": False
            }

        try:

            response = (
                self.client
                .table("news_predictions")
                .select("*")
                .limit(1)
                .execute()
            )

            return {
                "status": "healthy",
                "connected": True
            }

        except Exception as e:

            logger.exception(
                f"Health check failed: {e}"
            )

            return {
                "status": "error",
                "connected": False
            }

    # ─────────────────────────────────────────────
    # INSERT
    # ─────────────────────────────────────────────
    def insert(self, table: str, data: dict):

        if not self._is_available():

            logger.warning(
                "Supabase unavailable — insert skipped"
            )

            return None

        try:

            response = (
                self.client
                .table(table)
                .insert(data)
                .execute()
            )

            return response.data

        except Exception as e:

            logger.exception(
                f"Insert failed: {e}"
            )

            return None

    # ─────────────────────────────────────────────
    # FETCH RECENT
    # ─────────────────────────────────────────────
    def fetch_recent(
        self,
        table: str,
        limit: int = 10
    ):

        if not self._is_available():

            return []

        try:

            response = (
                self.client
                .table(table)
                .select("*")
                .order(
                    "id",
                    desc=True
                )
                .limit(limit)
                .execute()
            )

            return response.data

        except Exception as e:

            logger.exception(
                f"Fetch failed: {e}"
            )

            return []

    # ─────────────────────────────────────────────
    # DELETE
    # ─────────────────────────────────────────────
    def delete(
        self,
        table: str,
        record_id: int
    ):

        if not self._is_available():

            return None

        try:

            response = (
                self.client
                .table(table)
                .delete()
                .eq("id", record_id)
                .execute()
            )

            return response.data

        except Exception as e:

            logger.exception(
                f"Delete failed: {e}"
            )

            return None


# ─────────────────────────────────────────────
# SINGLETON INSTANCE
# ─────────────────────────────────────────────
supabase_service = SupabaseService()