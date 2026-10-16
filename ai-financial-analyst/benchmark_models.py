"""
benchmark_models.py — Data Models for Enterprise Benchmark & Load Testing Engine

Defines LoadProfile, BenchmarkScenario, LatencyResult, ThroughputResult,
BenchmarkRun, BenchmarkReport, and BenchmarkStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class LoadPattern(str, Enum):
    CONSTANT = "CONSTANT"
    RAMP_UP = "RAMP_UP"
    SPIKE = "SPIKE"


@dataclass
class LoadProfile:
    """Load generator concurrency and duration configuration."""
    profile_id: str
    profile_name: str
    target_rps: int = 1000
    duration_seconds: int = 60
    concurrency: int = 50
    pattern: str = "CONSTANT"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "profile_id": self.profile_id,
            "profile_name": self.profile_name,
            "target_rps": self.target_rps,
            "duration_seconds": self.duration_seconds,
            "concurrency": self.concurrency,
            "pattern": self.pattern,
        }


@dataclass
class BenchmarkScenario:
    """Benchmark test scenario definition."""
    scenario_id: str
    scenario_name: str
    target_subsystem: str
    load_profile: LoadProfile

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "scenario_name": self.scenario_name,
            "target_subsystem": self.target_subsystem,
            "load_profile": self.load_profile.to_dict(),
        }


@dataclass
class LatencyResult:
    """Latency distribution percentiles result."""
    subsystem: str
    p50_ms: float
    p95_ms: float
    p99_ms: float
    max_ms: float
    min_ms: float = 0.5

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subsystem": self.subsystem,
            "p50_ms": round(self.p50_ms, 2),
            "p95_ms": round(self.p95_ms, 2),
            "p99_ms": round(self.p99_ms, 2),
            "max_ms": round(self.max_ms, 2),
            "min_ms": round(self.min_ms, 2),
        }


@dataclass
class ThroughputResult:
    """Throughput performance measurement result."""
    subsystem: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    requests_per_sec: float
    success_rate_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subsystem": self.subsystem,
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "requests_per_sec": round(self.requests_per_sec, 1),
            "success_rate_pct": round(self.success_rate_pct, 2),
        }


@dataclass
class BenchmarkRun:
    """Execution instance envelope of a benchmark run."""
    run_id: str
    scenario_id: str
    start_time: str
    end_time: str
    status: str = "COMPLETED"
    latency: Optional[LatencyResult] = None
    throughput: Optional[ThroughputResult] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "scenario_id": self.scenario_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "status": self.status,
            "latency": self.latency.to_dict() if self.latency else None,
            "throughput": self.throughput.to_dict() if self.throughput else None,
        }


@dataclass
class BenchmarkReport:
    """Consolidated benchmark evaluation report."""
    report_id: str
    run_id: str
    scenario_name: str
    timestamp: str
    latency: LatencyResult
    throughput: ThroughputResult
    deployment_tag: str = "v1.28.0"
    status: str = "PASSED"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "run_id": self.run_id,
            "scenario_name": self.scenario_name,
            "timestamp": self.timestamp,
            "latency": self.latency.to_dict(),
            "throughput": self.throughput.to_dict(),
            "deployment_tag": self.deployment_tag,
            "status": self.status,
        }


@dataclass
class BenchmarkStatistics:
    """Operational statistics for BenchmarkEngine."""
    total_runs_executed: int = 0
    baseline_p95_ms: float = 14.5
    current_p95_ms: float = 12.4
    max_throughput_rps: float = 3450.0
    overall_success_rate_pct: float = 99.99

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_runs_executed": self.total_runs_executed,
            "baseline_p95_ms": round(self.baseline_p95_ms, 2),
            "current_p95_ms": round(self.current_p95_ms, 2),
            "max_throughput_rps": round(self.max_throughput_rps, 1),
            "overall_success_rate_pct": round(self.overall_success_rate_pct, 2),
        }
