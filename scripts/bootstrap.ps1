Write-Host "Bootstrapping Enterprise Platform..."
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm install
python scripts\seed_demo_data.py
Write-Host "Bootstrap complete."
