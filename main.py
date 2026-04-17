from fastapi import FastAPI, Query, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import shutil
from dotenv import load_dotenv
from typing import List, Optional
from datetime import datetime

# Importar el procesador modular
from data_processor import process_file

load_dotenv()

app = FastAPI(title="SmartAccess API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directorio para archivos subidos
UPLOAD_DIR = "/home/lut-bazzite/Escritorio/Fortinet/informes/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "smartaccess_db"),
        user=os.getenv("DB_USER", "lut-bazzite"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", "/home/lut-bazzite/Escritorio/Fortinet/informes/.pgdata/tmp"),
        port=os.getenv("DB_PORT", "5433")
    )

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos CSV")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Procesar el archivo inmediatamente
        result = process_file(file_path)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/summary")
def get_summary():
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT COUNT(*) as total FROM eventos")
        total = cur.fetchone()['total']
        cur.execute("SELECT COUNT(*) as ingresos FROM eventos WHERE tipo_movimiento = 'INGRESO'")
        ingresos = cur.fetchone()['ingresos']
        cur.execute("SELECT COUNT(*) as salidas FROM eventos WHERE tipo_movimiento = 'SALIDA'")
        salidas = cur.fetchone()['salidas']
        cur.execute("SELECT COUNT(DISTINCT person_id) as usuarios FROM eventos")
        usuarios = cur.fetchone()['usuarios']
        return {"total_raw": total, "ingresos": ingresos, "salidas": salidas, "usuarios_unicos": usuarios}
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/hourly")
def get_hourly_chart():
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        query = "SELECT EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM eventos GROUP BY hora ORDER BY hora;"
        cur.execute(query); results = cur.fetchall()
        full_hourly = []
        res_map = {int(r['hora']): r for r in results}
        for h in range(24):
            if h in res_map:
                full_hourly.append({"hora": f"{h:02d}:00", "ingresos": res_map[h]['ingresos'], "salidas": res_map[h]['salidas']})
            else:
                full_hourly.append({"hora": f"{h:02d}:00", "ingresos": 0, "salidas": 0})
        return full_hourly
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/lane")
def get_lane_chart():
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT carril as name, COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM eventos WHERE carril != 'Desconocido' GROUP BY carril;")
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/heatmap")
def get_heatmap_chart():
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT timestamp::date::text as fecha, EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) as value FROM eventos GROUP BY fecha, hora ORDER BY fecha DESC, hora LIMIT 500;")
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/sequence")
def get_sequence_chart():
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT person_id, count(*) as count FROM eventos GROUP BY person_id ORDER BY count DESC LIMIT 10;")
        top_uids = cur.fetchall(); sequences = []
        for row in top_uids:
            uid = row['person_id']
            cur.execute("SELECT nombre, apellido FROM integrantes WHERE id = %s", (uid,))
            user = cur.fetchone()
            cur.execute("SELECT timestamp::text as t, CASE WHEN tipo_movimiento = 'INGRESO' THEN 1 ELSE -1 END as tipo, tipo_movimiento as label FROM eventos WHERE person_id = %s ORDER BY timestamp DESC LIMIT 50;", (uid,))
            evts = cur.fetchall()
            sequences.append({"id": uid, "nombre": f"{user['nombre']} {user['apellido']}", "eventos": evts})
        return sequences
    finally:
        cur.close(); conn.close()

@app.get("/api/personas")
def get_personas(page: int = 1, size: int = 50, search: Optional[str] = None):
    offset = (page - 1) * size; conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        filter_sql = ""
        params = []
        if search:
            filter_sql = "WHERE nombre ILIKE %s OR apellido ILIKE %s OR id ILIKE %s"
            params = [f"%{search}%"] * 3
        cur.execute(f"SELECT COUNT(*) FROM integrantes {filter_sql}", params)
        total = cur.fetchone()['count']
        cur.execute(f"SELECT id as \"ID\", nombre as \"Nombre\", apellido as \"Apellido\", escuela as \"Departamento\" FROM integrantes {filter_sql} ORDER BY nombre, apellido LIMIT %s OFFSET %s", params + [size, offset])
        personas = cur.fetchall()
        for p in personas:
            cur.execute("SELECT timestamp::date::text as f, timestamp::time::text as \"Hora\", tipo_movimiento as \"Movimiento\", carril as \"Carril\" FROM eventos WHERE person_id = %s ORDER BY timestamp DESC LIMIT 10", (p['ID'],))
            evts = cur.fetchall()
            p["EventosPorFecha"] = {}
            for e in evts:
                f = e['f']
                if f not in p["EventosPorFecha"]: p["EventosPorFecha"][f] = []
                p["EventosPorFecha"][f].append(e)
        return {"items": personas, "total": total, "page": page, "size": size}
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
