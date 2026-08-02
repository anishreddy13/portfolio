#!/bin/bash
echo "Bootstrapping Enterprise Platform..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
npm install
python scripts/seed_demo_data.py
echo "Bootstrap complete."
