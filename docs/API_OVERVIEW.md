# Enterprise AI Financial Analyst — Core Subsystem API Reference

## 1. SecurityEngine (`security_engine.py`)
```python
from security_engine import global_security_engine

# Authenticate user principal
ok, user = global_security_engine.authenticate("sarah_quant", "tok-123")

# Authorize RBAC permission
allowed, reason = global_security_engine.authorize("QUANT_TRADER", "EXECUTE", "ORDER")

# Rotate Vault secret reference
secret_ref = global_security_engine.rotate_credentials("ALPACA_API_SECRET")
```

## 2. OrderManagementSystem (`order_management_system.py`)
```python
from order_management_system import global_order_management_system

# Submit market/limit order
parent_order = global_order_management_system.submit_order(
    symbol="AAPL",
    side="BUY",
    quantity=100.0,
    order_type="LIMIT",
    limit_price=182.50
)
```

## 3. ComplianceEngine (`compliance_engine.py`)
```python
from compliance_engine import global_compliance_engine

# Evaluate allocation decision before OMS
result = global_compliance_engine.evaluate(decision)
print(result.is_compliant, result.violations)
```

## 4. BenchmarkEngine (`benchmark_engine.py`)
```python
from benchmark_engine import global_benchmark_engine

# Run high-throughput load benchmark
report = global_benchmark_engine.run("Peak Load Run", target_subsystem="ALL", duration_sec=10)
print(report.latency.p95_ms, report.throughput.requests_per_sec)
```
