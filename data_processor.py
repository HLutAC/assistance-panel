import csv
import sys
from datetime import datetime, timedelta
import os
import json
import glob
import psycopg2
from psycopg2 import extras
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "smartaccess_db"),
            user=os.getenv("DB_USER", "lut-bazzite"),
            password=os.getenv("DB_PASSWORD", ""),
            host=os.getenv("DB_HOST", "/home/lut-bazzite/Escritorio/Fortinet/informes/.pgdata/tmp"),
            port=os.getenv("DB_PORT", "5433")
        )
        return conn
    except Exception as e:
        print(f"Error conectando a PostgreSQL: {e}")
        return None

def upsert_to_db(processed_data, source_file):
    conn = get_db_connection()
    if not conn: return
    cur = conn.cursor()
    try:
        # 1. Upsert Integrantes
        integrantes = []
        seen_ids = set()
        for r in processed_data:
            if r['ID'] not in seen_ids:
                integrantes.append((r['ID'], r['Nombre'], r['Apellido'], r['Departamento']))
                seen_ids.add(r['ID'])
        
        upsert_integrante_sql = """
        INSERT INTO integrantes (id, nombre, apellido, escuela)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            apellido = EXCLUDED.apellido,
            escuela = EXCLUDED.escuela;
        """
        extras.execute_batch(cur, upsert_integrante_sql, integrantes)
        
        # 2. Upsert Eventos
        eventos = []
        for r in processed_data:
            eventos.append((r['ID'], r['DateTime'], r['Tipo de movimiento'], r['Carril'], source_file))
        
        upsert_evento_sql = """
        INSERT INTO eventos (person_id, timestamp, tipo_movimiento, carril, source_file)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (person_id, timestamp, tipo_movimiento, carril) DO NOTHING;
        """
        extras.execute_batch(cur, upsert_evento_sql, eventos)
        conn.commit()
        print(f"Base de datos actualizada: {len(integrantes)} integrantes y {len(eventos)} eventos sincronizados.")
    except Exception as e:
        conn.rollback()
        print(f"Error sincronizando con PostgreSQL: {e}")
    finally:
        cur.close(); conn.close()

def process_file(file_path):
    if not os.path.exists(file_path):
        return {"error": f"Archivo no encontrado en {file_path}"}

    personal_info_path = os.getenv("PERSONAL_INFO_CSV", "Personal_information.csv")
    mapping = {}
    if os.path.exists("config.json"):
        with open("config.json", 'r', encoding='utf-8') as f:
            config = json.load(f)
            mapping = {k: tuple(v) for k, v in config.get("mapping", {}).items()}

    personal_info = {}
    if os.path.exists(personal_info_path):
        with open(personal_info_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = row.get('ID', '').strip()
                if pid: personal_info[pid] = row.get('escuela', '').strip()

    processed_data = []
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        header_index = next((i for i, l in enumerate(lines) if l.startswith("Nombre;")), -1)
        if header_index == -1: 
            return {"error": "Formato inválido: No se encontró la cabecera 'Nombre;'"}
        
        reader = csv.DictReader(lines[header_index:], delimiter=';')
        for row in reader:
            pid = row.get('ID', '').strip()
            if not pid: continue
            carril, mov = mapping.get(row.get('Punto de control de asistencia', '').strip(), ("Desconocido", "Desconocido"))
            dt_str = f"{row.get('Fecha')} {row.get('Hora de registro de entrada')}"
            try:
                dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S") if len(dt_str) > 16 else datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            except: continue
            processed_data.append({
                "Nombre": row.get('Nombre', '').strip(), "Apellido": row.get('Apellido', '').strip(),
                "ID": pid, "Departamento": personal_info.get(pid, row.get('Departamento', '').strip()),
                "Fecha": dt.strftime("%Y-%m-%d"), "Hora": dt.strftime("%H:%M:%S"),
                "DateTime": dt, "Carril": carril, "Tipo de movimiento": mov
            })

    if not processed_data:
        return {"error": "No se encontraron registros válidos."}

    processed_data.sort(key=lambda x: (x['ID'], x['DateTime']))
    upsert_to_db(processed_data, os.path.basename(file_path))
    return {"success": True, "records": len(processed_data), "source": os.path.basename(file_path)}

def find_latest_csv(pattern="Transacciones_*.csv"):
    files = glob.glob(pattern)
    if not files: files = glob.glob(f"*/{pattern}")
    if not files: return None
    files.sort(key=lambda x: (os.path.basename(x), os.path.getmtime(x)), reverse=True)
    return files[0]

def process_data():
    file_path = os.getenv("TRANSACTIONS_CSV")
    if not file_path or not os.path.exists(file_path):
        file_path = find_latest_csv()
    if not file_path:
        print("No se encontró archivo de transacciones.")
        return
    print(f"Procesando: {file_path}")
    result = process_file(file_path)
    if "error" in result:
        print(result["error"])
    else:
        print(f"Sincronización manual completada: {result['records']} registros.")

if __name__ == "__main__":
    process_data()
