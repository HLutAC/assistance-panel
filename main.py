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
import socket

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
        is_online = False
        # Intentamos conectar a los puertos más comunes (80 para ISAPI/Web, 8000 para SDK)
        for port in [80, 8000]:
            try:
                with socket.create_connection((ip, port), timeout=0.6):
                    is_online = True
                    break
            except (socket.timeout, ConnectionRefusedError, OSError):
                continue
        
        status[ip] = "online" if is_online else "offline"
    return status

@app.get("/api/devices/proxy/{ip}")
def device_proxy(ip: str, user: str = Query(...), password: str = Query(...)):
    """
    Checks if device is reachable with provided credentials.
    """
    try:
        url = f"http://{ip}/ISAPI/System/deviceInfo"
        response = requests.get(url, auth=requests.auth.HTTPBasicAuth(user, password), timeout=5)
        if response.status_code == 200:
            return {"status": "authenticated", "data": "Handshake OK"}
        else:
            return {"status": "failed", "code": response.status_code}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/summary")
def get_summary(fecha: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        params = []
        if fecha:
            date_filter = "WHERE timestamp::date = %s"
            params.append(fecha)
        else:
            date_filter = ""
            
        cur.execute("SELECT COUNT(*) as total FROM eventos")
        total_raw = cur.fetchone()['total']
        
        base_query_clean = f"""
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos {date_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        
        cur.execute(f"SELECT COUNT(*) as total FROM ({base_query_clean}) as d", params)
        total_clean = cur.fetchone()['total']
        
        cur.execute(f"SELECT COUNT(*) as total FROM ({base_query_clean}) as d WHERE tipo_movimiento = 'INGRESO'", params)
        ingresos = cur.fetchone()['total']
        
        cur.execute(f"SELECT COUNT(*) as total FROM ({base_query_clean}) as d WHERE tipo_movimiento = 'SALIDA'", params)
        salidas = cur.fetchone()['total']
        
        cur.execute(f"SELECT COUNT(DISTINCT person_id) as total FROM ({base_query_clean}) as d", params)
        usuarios = cur.fetchone()['total']
        
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
def get_hourly_chart(fecha: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        params = [fecha] if fecha else []
        date_filter = "WHERE timestamp::date = %s" if fecha else ""
        base_query = f"""
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos {date_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        query = f"SELECT EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM ({base_query}) as d GROUP BY hora ORDER BY hora;"
        cur.execute(query, params); results = cur.fetchall()
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
def get_lane_chart(fecha: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        params = [fecha] if fecha else []
        date_filter = "WHERE timestamp::date = %s" if fecha else ""
        base_query = f"""
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos {date_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"SELECT carril as name, COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM ({base_query}) as d WHERE carril != 'Desconocido' GROUP BY carril;", params)
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/pie")
def get_pie_chart(fecha: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        params = [fecha] if fecha else []
        date_filter = "WHERE timestamp::date = %s" if fecha else ""
        base_query = f"""
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos {date_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"SELECT COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM ({base_query}) as d", params)
        res = cur.fetchone()
        return [
            {"name": "Ingresos", "value": res['ingresos']},
            {"name": "Salidas", "value": res['salidas']}
        ]
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/heatmap")
def get_heatmap_chart(fecha: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        params = [fecha] if fecha else []
        date_filter = "WHERE timestamp::date = %s" if fecha else ""
        base_query = f"""
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos {date_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"SELECT timestamp::date::text as fecha, EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) as value FROM ({base_query}) as d GROUP BY fecha, hora ORDER BY fecha DESC, hora LIMIT 500;", params)
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/escuela")
def get_escuela_chart(fecha: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        params = [fecha] if fecha else []
        date_filter = "WHERE timestamp::date = %s" if fecha else ""
        base_query = f"""
        WITH deduplicated AS (
            SELECT e.*, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
            FROM eventos e {date_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"""
            SELECT i.escuela as name, COUNT(*) as value 
            FROM ({base_query}) as d 
            JOIN integrantes i ON d.person_id = i.id 
            WHERE i.escuela IS NOT NULL AND i.escuela != ''
            GROUP BY i.escuela 
            ORDER BY value DESC;
        """, params)
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/summary-stats")
def get_summary_stats(fecha: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        params = [fecha] if fecha else []
        date_filter = "WHERE timestamp::date = %s" if fecha else ""
        base_query = f"""
        WITH deduplicated AS (
            SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
            FROM eventos {date_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        # Peak Hour
        cur.execute(f"SELECT EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) as count FROM ({base_query}) as d GROUP BY hora ORDER BY count DESC LIMIT 1", params)
        peak = cur.fetchone()
        
        # Unique Users
        cur.execute(f"SELECT COUNT(DISTINCT person_id) as count FROM ({base_query}) as d", params)
        users = cur.fetchone()

        return {
            "peak_hour": f"{int(peak['hora'] or 0):02d}:00" if peak else "N/A",
            "unique_users": users['count'] if users else 0
        }
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
    fecha: Optional[str] = None,
    person_id: Optional[str] = None,
    clean: bool = False
):
    offset = (page - 1) * size; conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
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
            
        cur.execute(f"SELECT COUNT(*) as total FROM integrantes {filter_sql}", params)
        total = cur.fetchone()['total']
        
        cur.execute(f"SELECT id as \"ID\", nombre as \"Nombre\", apellido as \"Apellido\", escuela as \"escuela\" FROM integrantes {filter_sql} ORDER BY id ASC LIMIT %s OFFSET %s", (*params, size, offset))
        personas = cur.fetchall()
        
        for p in personas:
            events_source = "eventos"
            date_filter = ""
            event_params = [p['ID']]
            
            if fecha:
                date_filter = "AND timestamp::date = %s"
                event_params.append(fecha)

            if clean:
                events_source = f"""(
                    WITH deduplicated AS (
                        SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
                        FROM eventos WHERE person_id = %s {date_filter}
                    )
                    SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
                )"""
            else:
                events_source = f"(SELECT * FROM eventos WHERE person_id = %s {date_filter})"
            
            cur.execute(f"SELECT timestamp::date::text as f, timestamp::time::text as \"Hora\", tipo_movimiento as \"Movimiento\", carril as \"Carril\" FROM {events_source} as e ORDER BY timestamp DESC, id DESC", event_params)
            evts = cur.fetchall()
            
            grouped = {}
            for e in evts:
                d = e['f']
                if d not in grouped: grouped[d] = []
                grouped[d].append(e)
            p['EventosPorFecha'] = grouped
            
        return {"items": personas, "total": total, "page": page, "size": size}
    finally:
        cur.close(); conn.close()

@app.put("/api/personas/{id_persona}")
def update_persona(id_persona: int, data: dict):
    conn = get_db_connection(); cur = conn.cursor()
    try:
        nombre = data.get('Nombre')
        escuela = data.get('escuela')
        
        if not nombre or not escuela:
            raise HTTPException(status_code=400, detail="Nombre y Escuela son requeridos")
            
        cur.execute("UPDATE integrantes SET nombre = %s, escuela = %s WHERE id_persona = %s", (nombre, escuela, id_persona))
        conn.commit()
        return {"status": "success"}
    finally:
        cur.close(); conn.close()

@app.post("/api/personas/normalize-escuela")
def normalize_escuela(data: dict):
    conn = get_db_connection(); cur = conn.cursor()
    try:
        old_name = data.get('old_name')
        new_name = data.get('new_name')
        
        if not old_name or not new_name:
            raise HTTPException(status_code=400, detail="old_name y new_name son requeridos")
            
        cur.execute("UPDATE integrantes SET escuela = %s WHERE escuela = %s", (new_name, old_name))
        conn.commit()
        return {"status": "success", "updated_count": cur.rowcount}
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
