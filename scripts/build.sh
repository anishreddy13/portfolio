#!/usr/bin/env bash
set -e

echo "=== 1. Compiling Python Engine Modules ==="
python -m py_compile ai-financial-analyst/*.py

echo "=== 2. Building Next.js Production Web Application ==="
npm run build

echo "=== Build Completed Successfully! ==="
