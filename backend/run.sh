#!/usr/bin/env bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
export PYTHONPATH=$(pwd)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
