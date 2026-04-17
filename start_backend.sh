#!/bin/bash
echo "🚀 Iniciando Backend SmartAccess (PostgreSQL + FastAPI)..."
source ./venv/bin/activate
export DB_HOST=$(pwd)/.pgdata/tmp
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
