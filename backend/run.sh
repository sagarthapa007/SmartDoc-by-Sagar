#!/usr/bin/env bash
export PORT=8000
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --reload
