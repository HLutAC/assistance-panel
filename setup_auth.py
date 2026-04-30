import psycopg2
import os
import bcrypt
from dotenv import load_dotenv


load_dotenv()


def get_db_connection():
    default_host = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pgdata/tmp")
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "smartaccess_db"),
        user=os.getenv("DB_USER", "lut-bazzite"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", default_host),
        port=os.getenv("DB_PORT", "5433")
    )

def setup_auth():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Crear tabla de usuarios
        cur.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                nombre_completo TEXT
            );
        """)
        
        # 2. Verificar si existe admin
        cur.execute("SELECT id FROM usuarios WHERE username = 'admin';")
        if not cur.fetchone():
            print("Creando usuario administrador por defecto...")
            password = "admin123".encode('utf-8')
            hashed_pw = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')
            cur.execute("""
                INSERT INTO usuarios (username, hashed_password, nombre_completo)
                VALUES (%s, %s, %s);
            """, ("admin", hashed_pw, "Administrador del Sistema"))
            print("Usuario 'admin' creado con éxito (pass: admin123).")

        else:
            print("El usuario 'admin' ya existe.")
            
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    setup_auth()
