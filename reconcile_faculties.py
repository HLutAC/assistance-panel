import csv
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    # Usar ruta absoluta dinámica para el socket de PG
    default_host = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pgdata/tmp")
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "smartaccess_db"),
        user=os.getenv("DB_USER", "lut-bazzite"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", default_host),
        port=os.getenv("DB_PORT", "5433")
    )

def reconcile_data():
    csv_path = "Personal_information.csv"
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} no encontrado.")
        return

    print(f"Leyendo datos maestros de {csv_path}...")
    master_data = {}
    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = row.get('ID', '').strip()
            if pid:
                master_data[pid] = row.get('escuela', '').strip()

    print(f"Sincronizando {len(master_data)} registros con la base de datos...")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    updated_count = 0
    try:
        for pid, escuela in master_data.items():
            if not escuela: continue
            
            cur.execute(
                "UPDATE integrantes SET escuela = %s WHERE id = %s AND (escuela IS NULL OR escuela = '' OR escuela = 'Sin Facultad')",
                (escuela, pid)
            )
            if cur.rowcount > 0:
                updated_count += 1
        
        conn.commit()
        print(f"Sincronización completada. Se actualizaron {updated_count} integrantes.")
    except Exception as e:
        conn.rollback()
        print(f"Error durante la sincronización: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    reconcile_data()
