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

def get_search_filter(search: Optional[str], params: list):
    if not search:
        return ""
    params.extend([f"%{search}%"] * 4)
    return "AND (i.nombre ILIKE %s OR i.apellido ILIKE %s OR i.id::text ILIKE %s OR i.escuela ILIKE %s)"

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
        for port in [80, 8000]:
            try:
                with socket.create_connection((ip, port), timeout=0.6):
                    is_online = True
                    break
            except (socket.timeout, ConnectionRefusedError, OSError):
                continue
        status[ip] = "online" if is_online else "offline"
    return status

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

@app.get("/api/events/drill-down")
def get_drill_down_events(
    hour: int, 
    fecha: Optional[str] = None, 
    search: Optional[str] = None,
    global_search: Optional[str] = None,
    page: int = 1,
    size: int = 20
):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        offset = (page - 1) * size
        params = [hour]
        date_filter = "AND timestamp::date = %s" if fecha else ""
        if fecha: params.append(fecha)
        
        s = search or global_search
        search_filter = get_search_filter(s, params)

        # Base query with deduplication logic
        base_query = f"""
            SELECT e.*, i.nombre, i.apellido, i.escuela,
                   LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
            FROM eventos e
            LEFT JOIN integrantes i ON e.person_id = i.id
            WHERE EXTRACT(HOUR FROM timestamp) = %s {date_filter} {search_filter}
        """

        # Count total after deduplication
        cur.execute(f"SELECT COUNT(*) as total FROM ({base_query}) as d WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'", params)
        total = cur.fetchone()['total']

        # Get paginated items
        query = f"""
            SELECT person_id, person_id as "ID", nombre, apellido, escuela, tipo_movimiento, carril, timestamp::text as t
            FROM ({base_query}) as d
            WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s;
        """
        cur.execute(query, (*params, size, offset))
        return {"items": cur.fetchall(), "total": total}
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/hourly-escuela")
def get_hourly_escuela_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)
            
        query = f"""
        SELECT 
            EXTRACT(HOUR FROM timestamp) as hora,
            i.escuela,
            COUNT(*) as value
        FROM eventos e
        JOIN integrantes i ON e.person_id = i.id
        WHERE tipo_movimiento = 'INGRESO' {date_filter} {search_filter}
        GROUP BY hora, i.escuela
        ORDER BY hora;
        """
        cur.execute(query, params)
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/duration-hourly-escuela")
def get_duration_hourly_escuela_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND e1.timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)
            
        query = f"""
        WITH durations AS (
            SELECT 
                e1.person_id,
                i.escuela,
                EXTRACT(HOUR FROM e1.timestamp) as hora_ingreso,
                EXTRACT(EPOCH FROM (e2.timestamp - e1.timestamp))/3600 as horas
            FROM eventos e1
            JOIN eventos e2 ON e1.person_id = e2.person_id 
                AND e2.timestamp > e1.timestamp 
                AND e2.timestamp - e1.timestamp < interval '14 hours'
            JOIN integrantes i ON e1.person_id = i.id
            WHERE e1.tipo_movimiento = 'INGRESO' 
              AND e2.tipo_movimiento = 'SALIDA'
              {date_filter} {search_filter}
        )
        SELECT 
            hora_ingreso as hora,
            escuela,
            AVG(horas) as value
        FROM durations
        GROUP BY hora, escuela
        ORDER BY hora;
        """
        cur.execute(query, params)
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/hourly")
def get_hourly_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)

        base_query = f"""
        WITH deduplicated AS (
            SELECT e.*, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
            FROM eventos e
            JOIN integrantes i ON e.person_id = i.id
            WHERE 1=1 {date_filter} {search_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        
        query = f"""
        SELECT 
            EXTRACT(HOUR FROM timestamp) as h,
            COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos,
            COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas
        FROM ({base_query}) as d
        GROUP BY h
        ORDER BY h;
        """
        cur.execute(query, params)
        res = cur.fetchall()
        
        data = []
        counts = {int(r['h']): r for r in res}
        for i in range(24):
            if i in counts:
                data.append({"hora": f"{i:02d}:00", "ingresos": counts[i]['ingresos'], "salidas": counts[i]['salidas']})
            else:
                data.append({"hora": f"{i:02d}:00", "ingresos": 0, "salidas": 0})
        return data
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/lane")
def get_lane_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)

        base_query = f"""
        WITH deduplicated AS (
            SELECT e.*, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
            FROM eventos e
            JOIN integrantes i ON e.person_id = i.id
            WHERE 1=1 {date_filter} {search_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"SELECT carril as name, COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM ({base_query}) as d WHERE carril != 'Desconocido' GROUP BY carril;", params)
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/pie")
def get_pie_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)

        base_query = f"""
        WITH deduplicated AS (
            SELECT e.*, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
            FROM eventos e
            JOIN integrantes i ON e.person_id = i.id
            WHERE 1=1 {date_filter} {search_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"SELECT COUNT(*) FILTER (WHERE tipo_movimiento = 'INGRESO') as ingresos, COUNT(*) FILTER (WHERE tipo_movimiento = 'SALIDA') as salidas FROM ({base_query}) as d", params)
        res = cur.fetchone()
        return [
            {"name": "Ingresos", "value": res['ingresos'] or 0},
            {"name": "Salidas", "value": res['salidas'] or 0}
        ]
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/heatmap")
def get_heatmap_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)

        base_query = f"""
        WITH deduplicated AS (
            SELECT e.*, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
            FROM eventos e
            JOIN integrantes i ON e.person_id = i.id
            WHERE 1=1 {date_filter} {search_filter}
        )
        SELECT * FROM deduplicated WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
        """
        cur.execute(f"SELECT timestamp::date::text as fecha, EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) as value FROM ({base_query}) as d GROUP BY fecha, hora ORDER BY fecha DESC, hora LIMIT 500;", params)
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/escuela")
def get_escuela_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)

        base_query = f"""
        WITH deduplicated AS (
            SELECT e.*, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
            FROM eventos e
            JOIN integrantes i ON e.person_id = i.id
            WHERE 1=1 {date_filter} {search_filter}
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

@app.get("/api/charts/duration")
def get_duration_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND e.timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)
        
        query = f"""
        WITH daily_trips AS (
            SELECT 
                e.person_id, 
                e.timestamp::date as fecha,
                MIN(e.timestamp) as start_time,
                MAX(e.timestamp) as end_time
            FROM eventos e
            JOIN integrantes i ON e.person_id = i.id
            WHERE 1=1 {date_filter} {search_filter}
            GROUP BY e.person_id, fecha
            HAVING MIN(e.timestamp) != MAX(e.timestamp)
        )
        SELECT 
            EXTRACT(HOUR FROM start_time) as hora,
            AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as avg_hours
        FROM daily_trips
        GROUP BY hora
        ORDER BY hora;
        """
        cur.execute(query, params); results = cur.fetchall()
        
        full_duration = []
        res_map = {int(r['hora']): r for r in results}
        for h in range(24):
            if h in res_map:
                full_duration.append({
                    "hora": f"{h:02d}:00", 
                    "horas": round(float(res_map[h]['avg_hours']), 2)
                })
            else:
                full_duration.append({"hora": f"{h:02d}:00", "horas": 0})
        return full_duration
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/duration-escuela")
def get_duration_escuela_chart(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND e.timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)
        
        query = f"""
        WITH user_daily_duration AS (
            SELECT 
                e.person_id, 
                e.timestamp::date as fecha,
                i.escuela,
                EXTRACT(EPOCH FROM (MAX(e.timestamp) - MIN(e.timestamp)))/3600 as hours
            FROM eventos e
            JOIN integrantes i ON e.person_id = i.id
            WHERE 1=1 {date_filter} {search_filter}
            GROUP BY e.person_id, fecha, i.escuela
            HAVING COUNT(*) > 1
        )
        SELECT 
            escuela as name,
            AVG(hours) as value
        FROM user_daily_duration
        GROUP BY escuela
        ORDER BY value DESC;
        """
        cur.execute(query, params)
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

@app.get("/api/charts/summary-stats")
def get_summary_stats(fecha: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "AND timestamp::date = %s" if fecha else ""
        params = []
        if fecha: params.append(fecha)
        search_filter = get_search_filter(search, params)

        base_query = f"""
        WITH deduplicated AS (
            SELECT e.*, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
            FROM eventos e
            JOIN integrantes i ON e.person_id = i.id
            WHERE 1=1 {date_filter} {search_filter}
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
        
        cur.execute(f"SELECT id as person_id, id as \"ID\", id as id_persona, nombre as \"Nombre\", apellido as \"Apellido\", escuela as \"escuela\" FROM integrantes {filter_sql} ORDER BY id ASC LIMIT %s OFFSET %s", (*params, size, offset))
        personas = cur.fetchall()
        
        for p in personas:
            events_source = "eventos"
            date_filter = ""
            event_params = [p['person_id']]
            
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
def update_persona(id_persona: str, data: dict):
    conn = get_db_connection(); cur = conn.cursor()
    try:
        nombre = data.get('Nombre')
        escuela = data.get('escuela')
        
        if not nombre or not escuela:
            raise HTTPException(status_code=400, detail="Nombre y Escuela son requeridos")
            
        cur.execute("UPDATE integrantes SET nombre = %s, escuela = %s WHERE id = %s", (nombre, escuela, id_persona))
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

@app.post("/api/data/archive")
def archive_old_data():
    """Mueve datos anteriores al 14 de abril a la tabla de archivo."""
    conn = get_db_connection(); cur = conn.cursor()
    try:
        # Asegurar que existe la tabla de archivo
        cur.execute("""
            CREATE TABLE IF NOT EXISTS eventos_archivo AS 
            SELECT * FROM eventos WHERE 1=0
        """)
        
        # Mover datos
        cur.execute("""
            WITH deleted AS (
                DELETE FROM eventos 
                WHERE timestamp < '2026-04-14'
                RETURNING *
            )
            INSERT INTO eventos_archivo SELECT * FROM deleted;
        """)
        conn.commit()
        return {"status": "success", "archived_count": cur.rowcount}
    finally:
        cur.close(); conn.close()

@app.get("/api/reports/individual")
def get_individual_report(person_id: str, fecha: Optional[str] = None):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT id, nombre, apellido, escuela FROM integrantes WHERE id = %s", (person_id,))
        person = cur.fetchone()
        if not person:
            return {"error": "Persona no encontrada"}
        
        date_filter = "AND timestamp::date = %s" if fecha else ""
        params = [person_id]
        if fecha: params.append(fecha)
        
        # Stats
        cur.execute(f"SELECT tipo_movimiento, COUNT(*) as total FROM eventos WHERE person_id = %s {date_filter} GROUP BY tipo_movimiento", params)
        stats_raw = cur.fetchall()
        stats = {"ingresos": 0, "salidas": 0}
        for s in stats_raw:
            if s['tipo_movimiento'] == 'INGRESO': stats['ingresos'] = s['total']
            if s['tipo_movimiento'] == 'SALIDA': stats['salidas'] = s['total']
            
        # Events (deduplicated)
        query = f"""
            WITH deduplicated AS (
                SELECT *, LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, id) as prev_ts
                FROM eventos WHERE person_id = %s {date_filter}
            )
            SELECT person_id, tipo_movimiento, carril, timestamp::text as t
            FROM deduplicated
            WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
            ORDER BY timestamp DESC
        """
        cur.execute(query, params)
        events = cur.fetchall()
        
        return {"person": person, "stats": stats, "events": events}
    finally:
        cur.close(); conn.close()

@app.get("/api/reports/global-events")
def get_global_report_events(fecha: Optional[str] = None, limit: int = 200):
    conn = get_db_connection(); cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        date_filter = "WHERE timestamp::date = %s" if fecha else ""
        params = [fecha] if fecha else []
        
        query = f"""
            WITH deduplicated AS (
                SELECT e.*, i.nombre, i.apellido, 
                       LAG(timestamp) OVER (PARTITION BY person_id, tipo_movimiento ORDER BY timestamp, e.id) as prev_ts
                FROM eventos e
                LEFT JOIN integrantes i ON e.person_id = i.id
                {date_filter}
            )
            SELECT person_id, nombre, apellido, tipo_movimiento, carril, timestamp::text as t
            FROM deduplicated
            WHERE prev_ts IS NULL OR timestamp - prev_ts > interval '5 minutes'
            ORDER BY timestamp DESC
            LIMIT %s
        """
        cur.execute(query, (*params, limit))
        return cur.fetchall()
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
