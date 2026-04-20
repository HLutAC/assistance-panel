from fastapi import FastAPI, Query, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import shutil
from dotenv import load_dotenv
from typing import List, Optional
import json
from datetime import datetime
import requests
from requests.auth import HTTPDigestAuth

# Cargar configuración de dispositivos desde JSON
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "devices.json")
with open(CONFIG_FILE, 'r') as f:
    DEVICES_CONFIG = json.load(f)

# Flattened list for status checks
ALL_IPS = [item['ip'] for group in DEVICES_CONFIG for item in group['items']]

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
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db_connection():
    # Usar ruta absoluta dinámica para el socket de PG
    default_host = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pgdata/tmp")
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "smartaccess_db"),
        user=os.getenv("DB_USER", "admin"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", default_host),
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

@app.get("/api/config/devices")
def get_devices_config():
    return DEVICES_CONFIG

@app.get("/api/config/escuelas")
def get_escuelas():
    conn = get_db_connection(); cur = conn.cursor()
    try:
        cur.execute("SELECT DISTINCT escuela FROM integrantes WHERE escuela IS NOT NULL AND escuela != '' ORDER BY escuela")
        return ["Todas"] + [r[0] for r in cur.fetchall()]
    finally:
        cur.close(); conn.close()

@app.get("/api/devices/status")
def get_devices_status():
    status = {}
    for ip in ALL_IPS:
        try:
            # Una petición simple para ver si responde el puerto 80
            requests.get(f"http://{ip}", timeout=0.8)
            status[ip] = "online"
        except requests.exceptions.RequestException:
            status[ip] = "offline"
    return status

@app.get("/api/summary")
def get_summary():
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Consulta base con limpieza de 5 minutos
        base_query = """
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        
        cur.execute(f"SELECT COUNT(*) as total FROM ({base_query}) as d")
        total_clean = cur.fetchone()['total']
        
        cur.execute("SELECT COUNT(*) as total_raw FROM eventos")
        total_raw = cur.fetchone()['total_raw']
        
        cur.execute(f"SELECT COUNT(*) as ingresos FROM ({base_query}) as d WHERE tipo_movimiento = 'INGRESO'")
        ingresos = cur.fetchone()['ingresos']
        
        cur.execute(f"SELECT COUNT(*) as salidas FROM ({base_query}) as d WHERE tipo_movimiento = 'SALIDA'")
        salidas = cur.fetchone()['salidas']
        
        cur.execute(f"SELECT COUNT(DISTINCT person_id) as usuarios FROM ({base_query}) as d")
        usuarios = cur.fetchone()['usuarios']
        
        return {
            "total_raw": total_raw, 
            "total_clean": total_clean, 
            "ingresos": ingresos, 
            "salidas": salidas, 
            "usuarios_unicos": usuarios,
            "eliminados": total_raw - total_clean
        }
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/hourly")
def get_hourly_chart():
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        base_query = """
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        query = f"SELECT EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM ({base_query}) as d GROUP BY hora ORDER BY hora;"
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
        base_query = """
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"SELECT carril as name, COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM ({base_query}) as d WHERE carril != 'Desconocido' GROUP BY carril;")
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/heatmap")
def get_heatmap_chart():
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        base_query = """
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"SELECT timestamp::date::text as fecha, EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) as value FROM ({base_query}) as d GROUP BY fecha, hora ORDER BY fecha DESC, hora LIMIT 500;")
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
            # En la secuencia individual TAMBIÉN aplicamos la limpieza de 5 minutos para que sea consistente con el resumen
            base_query = """
            WITH deduplicated AS (
                SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
                FROM eventos WHERE person_id = %s
            )
            SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
            """
            cur.execute(f"SELECT timestamp::text as t, CASE WHEN tipo_movimiento = 'INGRESO' THEN 1 ELSE -1 END as tipo, tipo_movimiento as label FROM ({base_query}) as d ORDER BY timestamp ASC, id ASC LIMIT 50;", (uid,))
            evts = cur.fetchall()
            sequences.append({"id": uid, "nombre": f"{user['nombre']} {user['apellido']}", "eventos": evts})
        return sequences
    finally:
        cur.close(); conn.close()

@app.get("/api/personas")
def get_personas(
    page: int = 1, 
    size: int = 50, 
    search: Optional[str] = None, 
    escuela: Optional[str] = None,
    person_id: Optional[str] = None,
    clean: bool = False
):
    offset = (page - 1) * size; conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Construcción dinámica de filtros
        query_parts = []
        params = []
        
        if search:
            query_parts.append("(nombre ILIKE %s OR apellido ILIKE %s OR id ILIKE %s)")
            params.extend([f"%{search}%"] * 3)
            
        if escuela and escuela != "Todas":
            query_parts.append("escuela = %s")
            params.append(escuela)
            
        if person_id:
            query_parts.append("id ILIKE %s")
            params.append(f"%{person_id}%")
            
        filter_sql = ""
        if query_parts:
            filter_sql = "WHERE " + " AND ".join(query_parts)
            
        # Obtener el total para paginación
        cur.execute(f"SELECT COUNT(*) FROM integrantes {filter_sql}", params)
        total = cur.fetchone()['count']
        
        # Consulta para obtener integrantes ordenados por su actividad más reciente
        query = f"""
            SELECT i.id as "ID", i.nombre as "Nombre", i.apellido as "Apellido", i.escuela as "Departamento",
            (SELECT MAX(timestamp) FROM eventos WHERE person_id = i.id) as last_activity
            FROM integrantes i
            {filter_sql}
            ORDER BY last_activity DESC NULLS LAST, i.nombre ASC
            LIMIT %s OFFSET %s
        """
        cur.execute(query, params + [size, offset])
        personas = cur.fetchall()
        
        # Lógica de limpieza condicional
        events_source = "eventos"
        if clean:
            events_source = """
            (WITH deduplicated AS (
                SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
                FROM eventos
            )
            SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes')
            """

        for p in personas:
            # Los eventos dentro de cada persona se ordenan de más reciente a más antiguo
            cur.execute(f"SELECT timestamp::date::text as f, timestamp::time::text as \"Hora\", tipo_movimiento as \"Movimiento\", carril as \"Carril\" FROM {events_source} as e WHERE person_id = %s ORDER BY timestamp DESC, id DESC", (p['ID'],))
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
