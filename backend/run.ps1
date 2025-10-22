# Windows PowerShell: create venv, install deps, run dev server
python -m venv .venv
./.venv/Scripts/Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
$env:PYTHONPATH = "$PWD"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
