#!/bin/bash
echo "🛑 Deteniendo servicios de SmartAccess..."

# 1. Detener Backend (FastAPI/Uvicorn)
PID_BACKEND=$(lsof -t -i :8000)
if [ ! -z "$PID_BACKEND" ]; then
    echo "Deteniendo FastAPI (PID: $PID_BACKEND)..."
    kill $PID_BACKEND
    sleep 1
fi

# 2. Detener Base de Datos (PostgreSQL)
if pg_ctl -D ./.pgdata status > /dev/null 2>&1; then
    echo "Deteniendo PostgreSQL de manera segura (Modo Fast)..."
    pg_ctl -D ./.pgdata -o "-p 5433 -k $PWD/.pgdata/tmp" stop -m fast
else
    echo "PostgreSQL ya está detenido."
fi

# 3. Limpieza de sockets huérfanos
if [ -d "./.pgdata/tmp" ]; then
    echo "Limpiando socket hooks en ./.pgdata/tmp..."
    rm -f ./.pgdata/tmp/.s.PGSQL.5433*
fi

echo "✅ Apagado completado exitosamente."
