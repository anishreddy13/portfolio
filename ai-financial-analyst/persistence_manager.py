"""
persistence_manager.py — Persistence & State Snapshot Subsystem

Provides central persistence and point-in-time state snapshot management for
PortfolioManager, PaperTradingEngine, Watchlist, and User Dashboard Preferences.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

from paper_trading_engine import PaperTradingEngine, global_paper_trading_engine
from persistence_models import (
    DashboardPreferences,
    OrderHistoryRecord,
    PersistenceStatistics,
    PortfolioSnapshot,
    UserSettings,
    WatchlistRecord,
)
from persistence_rules import (
    deserialize_orders,
    deserialize_portfolio,
    restore_snapshot,
    serialize_orders,
    serialize_portfolio,
    snapshot_portfolio,
    validate_snapshot,
)
from portfolio_manager import PortfolioManager, global_portfolio_manager

logger = logging.getLogger("persistence_manager")


class PersistenceManager:
    """Persistence & State Snapshot Subsystem.

    Usage::

        pm = PersistenceManager()
        pm.save("default")
        snap = pm.create_snapshot("default")
        pm.rollback_snapshot(snap.snapshot_id)
    """

    def __init__(
        self,
        portfolio_manager: Optional[PortfolioManager] = None,
        trading_engine: Optional[PaperTradingEngine] = None,
    ) -> None:
        self.portfolio_manager = portfolio_manager or global_portfolio_manager
        self.trading_engine = trading_engine or global_paper_trading_engine
        self._lock = threading.RLock()

        # In-memory snapshot store: snapshot_id -> PortfolioSnapshot
        self._snapshots: Dict[str, PortfolioSnapshot] = {}

        # Saved state per user: user_id -> serialized_dict
        self._saved_state: Dict[str, Dict[str, Any]] = {}

        # User settings per user: user_id -> UserSettings
        self._user_settings: Dict[str, UserSettings] = {"default": UserSettings()}

        # IAM Stores (In-Memory for now, to be integrated with DB later)
        self._iam_users: Dict[str, Any] = {}
        self._iam_organizations: Dict[str, Any] = {}
        self._iam_workspaces: Dict[str, Any] = {}


        # Operational Statistics
        self._save_count = 0
        self._load_count = 0
        self._autosaves = 0
        self._snapshot_count = 0
        self._total_save_time_ms = 0.0

        logger.info("PersistenceManager subsystem initialized.")

    # ─────────────────────────────────────────────
    # State Save & Load API
    # ─────────────────────────────────────────────

    def save(self, user_id: str = "default") -> bool:
        """Persist current PortfolioManager, PaperTradingEngine, and Watchlist state."""
        start_t = time.monotonic()
        uid = user_id.strip()

        with self._lock:
            try:
                port_summary = self.portfolio_manager.portfolio_summary(uid).to_dict()
                orders = [o.to_dict() for o in self.trading_engine.order_history()]

                state_payload = {
                    "user_id": uid,
                    "portfolio": port_summary,
                    "orders": orders,
                    "saved_at": datetime.now(timezone.utc).isoformat(),
                }

                self._saved_state[uid] = state_payload
                self._save_count += 1

                save_dur = (time.monotonic() - start_t) * 1000.0
                self._total_save_time_ms += save_dur

                logger.info("Persisted state for user '%s' in %.2fms.", uid, save_dur)
                return True
            except Exception as exc:
                logger.error("Failed saving state for user '%s': %s", uid, exc)
                return False

    def autosave(self, user_id: str = "default") -> bool:
        """Execute automated background autosave."""
        with self._lock:
            settings = self._user_settings.get(user_id, UserSettings())
            if not settings.auto_save:
                return False

            res = self.save(user_id)
            if res:
                self._autosaves += 1
            return res

    def load(self, user_id: str = "default") -> Dict[str, Any]:
        """Load persisted state for user."""
        uid = user_id.strip()
        with self._lock:
            self._load_count += 1
            state = self._saved_state.get(uid)
            if not state:
                logger.info("No saved state found for user '%s', returning live summary.", uid)
                port_summary = self.portfolio_manager.portfolio_summary(uid).to_dict()
                orders = [o.to_dict() for o in self.trading_engine.order_history()]
                return {"user_id": uid, "portfolio": port_summary, "orders": orders}

            return state

    def restore(self, user_id: str = "default") -> bool:
        """Restore persisted state back into live PortfolioManager."""
        uid = user_id.strip()
        with self._lock:
            state = self.load(uid)
            if not state or "portfolio" not in state:
                return False

            port_data = state["portfolio"]
            cash = port_data.get("cash_balance", 100000.0)

            # Re-initialize target portfolio
            port = self.portfolio_manager.create_portfolio(uid, "Restored Portfolio", initial_cash=cash)
            port.positions.clear()

            for pos_d in port_data.get("positions", []):
                sym = pos_d.get("symbol")
                qty = pos_d.get("quantity", 0)
                cost = pos_d.get("avg_cost_price", 100.0)
                if sym and qty > 0:
                    self.portfolio_manager.add_position(uid, sym, qty, cost)

            logger.info("Restored live portfolio state for user '%s'.", uid)
            return True

    # ─────────────────────────────────────────────
    # Point-in-Time Snapshot API
    # ─────────────────────────────────────────────

    def create_snapshot(self, user_id: str = "default") -> PortfolioSnapshot:
        """Create a point-in-time PortfolioSnapshot of portfolio & order state."""
        uid = user_id.strip()
        with self._lock:
            port_summary = self.portfolio_manager.portfolio_summary(uid).to_dict()
            orders = [o.to_dict() for o in self.trading_engine.order_history()]

            snap = snapshot_portfolio(port_summary, orders, user_id=uid)
            self._snapshots[snap.snapshot_id] = snap
            self._snapshot_count += 1

            logger.info("Created portfolio snapshot '%s' for user '%s'.", snap.snapshot_id, uid)
            return snap

    def rollback_snapshot(self, snapshot_id: str) -> bool:
        """Rollback live portfolio to a previous PortfolioSnapshot."""
        sid = snapshot_id.strip()
        with self._lock:
            snap = self._snapshots.get(sid)
            if not snap or not validate_snapshot(snap):
                logger.warning("Failed rollback: Snapshot '%s' not found or invalid.", sid)
                return False

            port_data, orders_data = restore_snapshot(snap)
            uid = snap.user_id

            cash = port_data.get("cash_balance", 100000.0)
            port = self.portfolio_manager.create_portfolio(uid, "Rolled Back Portfolio", initial_cash=cash)
            port.positions.clear()

            for pos_d in port_data.get("positions", []):
                sym = pos_d.get("symbol")
                qty = pos_d.get("quantity", 0)
                cost = pos_d.get("avg_cost_price", 100.0)
                if sym and qty > 0:
                    self.portfolio_manager.add_position(uid, sym, qty, cost)

            logger.info("Rolled back user '%s' state to snapshot '%s'.", uid, sid)
            return True

    def list_snapshots(self, user_id: str = "default") -> List[PortfolioSnapshot]:
        """Return list of snapshots created for user."""
        with self._lock:
            return [s for s in self._snapshots.values() if s.user_id == user_id]

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> PersistenceStatistics:
        """Return operational PersistenceStatistics snapshot."""
        with self._lock:
            avg_save = (self._total_save_time_ms / self._save_count) if self._save_count > 0 else 0.0
            return PersistenceStatistics(
                save_count=self._save_count,
                load_count=self._load_count,
                autosaves=self._autosaves,
                snapshot_count=self._snapshot_count,
                average_save_ms=avg_save,
            )


    # ─────────────────────────────────────────────
    # Identity & Access Management (IAM) API
    # ─────────────────────────────────────────────

    def save_users(self, users: List['User']) -> bool:
        with self._lock:
            self._iam_users = {u.user_id: u for u in users}
            return True

    def load_users(self) -> List['User']:
        with self._lock:
            return list(self._iam_users.values())

    def save_organizations(self, organizations: List['Organization']) -> bool:
        with self._lock:
            self._iam_organizations = {o.organization_id: o for o in organizations}
            return True

    def load_organizations(self) -> List['Organization']:
        with self._lock:
            return list(self._iam_organizations.values())

    def save_workspaces(self, workspaces: List['Workspace']) -> bool:
        with self._lock:
            self._iam_workspaces = {w.workspace_id: w for w in workspaces}
            return True

    def load_workspaces(self) -> List['Workspace']:
        with self._lock:
            return list(self._iam_workspaces.values())

    def save_preferences(self, user_id: str, prefs: Any) -> bool:
        with self._lock:
            self._user_settings[user_id] = prefs
            return True

    def load_preferences(self, user_id: str) -> Any:
        with self._lock:
            return self._user_settings.get(user_id)


# Shared global singleton instance
global_persistence_manager = PersistenceManager()
