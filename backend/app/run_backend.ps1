# PowerShell helper to run FastAPI
$ErrorActionPreference = "Stop"
$HERE = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $HERE\backend

if (-not (Test-Path ".venv")) {
  python -m venv .venv
}

& .\.venv\Scripts\pip install -U pip
& .\.venv\Scripts\pip install -r requirements.txt

$env:PYTHONPATH = "$($PWD)"
& .\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
