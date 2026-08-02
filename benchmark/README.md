# Enterprise Load Testing & Benchmarking Suite

This directory contains load generation profiles, baseline reports, and performance SLA target specifications for the **Enterprise AI Financial Analyst Platform**.

## Files

- `load_profile.json`: Pre-configured load generator profiles (Constant, Ramp-Up, Spike).
- `baseline_report.json`: Historical benchmark baseline for performance regression testing.
- `performance_targets.md`: Subsystem SLA target specifications and failure threshold criteria.

## Executing Benchmarks

Run load benchmarks directly via Python:
```python
from benchmark_engine import global_benchmark_engine

report = global_benchmark_engine.run(
    scenario_name="Full Platform Stress Test",
    target_subsystem="ALL",
    duration_sec=30
)
print(report.to_dict())
```
