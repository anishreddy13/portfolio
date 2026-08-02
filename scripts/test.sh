#!/usr/bin/env bash
set -e

echo "=== 1. Executing Python Unit Tests ==="
python -m unittest discover -s testing/unit -p "test_*.py"

echo "=== 2. Executing End-to-End Integration Tests ==="
python -m unittest discover -s testing/integration -p "test_*.py"

echo "=== 3. Executing Performance Benchmark Tests ==="
python -m unittest discover -s testing/performance -p "test_*.py"

echo "=== All Tests Passed Successfully! ==="
