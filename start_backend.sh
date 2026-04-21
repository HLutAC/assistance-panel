#!/bin/bash
echo "Verificando Base de Datos PostgreSQL..."
if ! pg_ctl -D ./.pgdata -o "-p 5433 -k $PWD/.pgdata/tmp" status > /dev/null 2>&1; then
    echo "Starting local PostgreSQL instance..."
    pg_ctl -D ./.pgdata -l ./.pgdata/logfile -o "-p 5433 -k $PWD/.pgdata/tmp" start
    sleep 2
fi

echo "Iniciando Backend FastAPI..."
source ./venv/bin/activate
export DB_HOST=$PWD/.pgdata/tmp

# Iniciar FastAPI (El trap asegura que al cerrar el script, se intente cerrar lo demás)
# trap './stop_backend.sh' EXIT # Opcional: auto-stop al cerrar terminal

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
