import csv
import sys
from datetime import datetime, timedelta
import os
import json
import glob

def load_env(file_path=".env"):
    env_vars = {}
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    env_vars[key] = value
    return env_vars

def find_latest_csv(pattern="Transacciones_*.csv"):
    """
    Busca el archivo CSV más reciente que coincida con el patrón.
    Prioriza el orden alfabético (útil para nombres con fechas YYYY-MM-DD).
    """
    files = glob.glob(pattern)
    if not files:
        # Intentar buscar en subdirectorios nivel 1 si no hay en el actual
        files = glob.glob(f"*/{pattern}")
    
    if not files:
        return None
    
    # Ordenar por nombre descendente (asumiendo formato de fecha ISO)
    # y por fecha de modificación como fallback
    files.sort(key=lambda x: (os.path.basename(x), os.path.getmtime(x)), reverse=True)
    return files[0]

def process_data():
    # Cargar variables de entorno
    env = load_env()
    
    # Descubrimiento dinámico de archivo de transacciones
    env_file_path = env.get("TRANSACTIONS_CSV")
    if env_file_path and os.path.exists(env_file_path):
        file_path = env_file_path
        print(f"Usando archivo definido en .env: {file_path}")
    else:
        file_path = find_latest_csv()
        if not file_path:
            # Fallback legacy
            if os.path.exists("Transacciones.csv"):
                file_path = "Transacciones.csv"
            else:
                print("Error: No se encontró ningún archivo de transacciones (Transacciones_*.csv).")
                return
        print(f"Archivo detectado automáticamente: {file_path}")

    personal_info_path = env.get("PERSONAL_INFO_CSV", "Personal_information.csv")

    # Cargar configuración (Mapeo de carriles)
    config_path = "config.json"
    mapping = {}
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            mapping = {k: tuple(v) for k, v in config.get("mapping", {}).items()}
    else:
        print("Error: No se encontró config.json")
        return

    # Cargar información de personal (ID -> Escuela)
    personal_info = {}
    if os.path.exists(personal_info_path):
        try:
            with open(personal_info_path, 'r', encoding='utf-8', errors='ignore') as f:
                p_reader = csv.DictReader(f)
                for row in p_reader:
                    pid = row.get('ID', '').strip()
                    escuela = row.get('escuela', '').strip()
                    if pid:
                        personal_info[pid] = escuela if escuela and escuela != "#N/A" else "Visitante / Externo"
            print(f"Información de personal cargada: {len(personal_info)} registros.")
        except Exception as e:
            print(f"Advertencia: No se pudo cargar {personal_info_path}: {e}")
    else:
        print(f"Advertencia: No se encontró {personal_info_path}.")

    try:
        print(f"Leyendo datos de: {file_path}...")
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        header_index = -1
        for i, line in enumerate(lines):
            if line.startswith("Nombre;"):
                header_index = i
                break
        
        if header_index == -1:
            print("Error: No se encontró la cabecera 'Nombre;' en el CSV.")
            return

        reader = csv.DictReader(lines[header_index:], delimiter=';')
        raw_rows = list(reader)
        total_raw = len(raw_rows)
        print(f"Total de registros encontrados: {total_raw}")

        # Limpieza y Mapeo Inicial
        processed_data = []
        for row in raw_rows:
            person_id = row.get('ID', '').strip()
            if not person_id: continue
            
            punto = row.get('Punto de control de asistencia', '').strip()
            carril, movimiento = mapping.get(punto, ("Desconocido", "Desconocido"))
            
            fecha_str = row.get('Fecha', '').strip()
            hora_str = row.get('Hora de registro de entrada', '').strip()
            
            if not fecha_str or not hora_str: continue

            try:
                dt_str = f"{fecha_str} {hora_str}"
                # Intentar HH:MM:SS then HH:MM
                if len(hora_str) > 5:
                    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
                else:
                    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            except Exception:
                continue

            departamento_final = personal_info.get(person_id, row.get('Departamento', '').strip())

            processed_data.append({
                "Nombre": row.get('Nombre', '').strip(),
                "Apellido": row.get('Apellido', '').strip(),
                "ID": person_id,
                "Departamento": departamento_final,
                "Fecha": dt.strftime("%Y-%m-%d"),
                "Hora": dt.strftime("%H:%M:%S"),
                "DateTime": dt,
                "Carril": carril,
                "Tipo de movimiento": movimiento
            })

        processed_data.sort(key=lambda x: (x['ID'], x['DateTime']))

        # clean_data para estadísticas y gráficos (deduplicado)
        clean_data = []
        if processed_data:
            current_group = [processed_data[0]]
            for next_record in processed_data[1:]:
                prev = current_group[-1]
                if (next_record['ID'] == prev['ID'] and 
                    next_record['Tipo de movimiento'] == prev['Tipo de movimiento'] and 
                    (next_record['DateTime'] - prev['DateTime']).total_seconds() <= 300):
                    current_group.append(next_record)
                else:
                    clean_data.append(current_group[-1])
                    current_group = [next_record]
            clean_data.append(current_group[-1])

        # Agregaciones: Hourly
        hourly_map = {h: {"hora": f"{h:02d}:00", "ingresos": 0, "salidas": 0} for h in range(24)}
        for r in clean_data:
            h = r['DateTime'].hour
            if r['Tipo de movimiento'] == 'INGRESO':
                hourly_map[h]["ingresos"] += 1
            else:
                hourly_map[h]["salidas"] += 1
        hourly_chart = [hourly_map[h] for h in range(24)]

        # Agregaciones: Lane
        lane_stats = {}
        for r in clean_data:
            c = r['Carril']
            if c == 'Desconocido': continue
            if c not in lane_stats: lane_stats[c] = {"ingresos": 0, "salidas": 0}
            if r['Tipo de movimiento'] == 'INGRESO': lane_stats[c]["ingresos"] += 1
            else: lane_stats[c]["salidas"] += 1
        
        lane_chart = []
        for c in sorted(lane_stats.keys()):
            lane_chart.append({"name": f"Carril {c}", **lane_stats[c]})

        # Heatmap
        heatmap_raw = {}
        for r in clean_data:
            key = (r['Fecha'], r['DateTime'].hour)
            heatmap_raw[key] = heatmap_raw.get(key, 0) + 1
        
        heatmap_chart = []
        # Solo mostrar los últimos 7 días con actividad para el heatmap
        active_dates = sorted(set(fecha for fecha, _ in heatmap_raw.keys()), reverse=True)[:7]
        for fecha in sorted(active_dates):
            f_display = "/".join(fecha.split("-")[1:][::-1])
            for h in range(24):
                count = heatmap_raw.get((fecha, h), 0)
                heatmap_chart.append({"fecha": f_display, "hora": h, "value": count})

        # Top Usuarios para secuencia
        user_total_events = {}
        for r in clean_data:
            user_total_events[r['ID']] = user_total_events.get(r['ID'], 0) + 1
        
        top_uids = sorted(user_total_events.items(), key=lambda x: x[1], reverse=True)[:10]
        sequence_chart = []
        for uid, _ in top_uids:
            user_events = [r for r in clean_data if r['ID'] == uid]
            first_r = user_events[0]
            sequence_chart.append({
                "id": uid,
                "nombre": f"{first_r['Nombre']} {first_r['Apellido']}",
                "eventos": [
                    {
                        "t": r['DateTime'].strftime("%Y-%m-%d %H:%M:%S"),
                        "tipo": 1 if r['Tipo de movimiento'] == 'INGRESO' else -1,
                        "label": r['Tipo de movimiento']
                    } for r in user_events
                ]
            })

        def map_people(source_data):
            p_map = {}
            for r in source_data:
                uid = r['ID']
                if uid not in p_map:
                    p_map[uid] = {
                        "Nombre": r["Nombre"], "Apellido": r["Apellido"], "ID": r["ID"],
                        "Departamento": r["Departamento"], "EventosPorFecha": {}
                    }
                fecha = r['Fecha']
                if fecha not in p_map[uid]["EventosPorFecha"]:
                    p_map[uid]["EventosPorFecha"][fecha] = []
                p_map[uid]["EventosPorFecha"][fecha].append({
                    "Hora": r["Hora"], "Movimiento": r["Tipo de movimiento"], "Carril": r["Carril"]
                })
            return sorted(p_map.values(), key=lambda x: (x['Nombre'], x['Apellido']))

        dashboard_data = {
            "summary": {
                "total_raw": total_raw, 
                "total_clean": len(clean_data),
                "ingresos": len([r for r in clean_data if r['Tipo de movimiento'] == 'INGRESO']),
                "salidas": len([r for r in clean_data if r['Tipo de movimiento'] == 'SALIDA']),
                "usuarios_unicos": len(set(r['ID'] for r in clean_data)),
                "source_file": os.path.basename(file_path)
            },
            "charts": {
                "hourly": hourly_chart, "lane": lane_chart, 
                "pie": [
                    {"name": "Ingresos", "value": len([r for r in clean_data if r['Tipo de movimiento'] == 'INGRESO'])},
                    {"name": "Salidas", "value": len([r for r in clean_data if r['Tipo de movimiento'] == 'SALIDA'])}
                ],
                "heatmap": heatmap_chart, "sequence": sequence_chart
            },
            "personas": map_people(clean_data),
            "bitacora": map_people(processed_data)
        }

        output_json = 'src/data/dashboard_data.json'
        os.makedirs('src/data', exist_ok=True)
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

        print(f"Éxito: JSON generado en {output_json} usando {file_path}")

    except Exception as e:
        print(f"Error crítico: {str(e)}")

if __name__ == "__main__":
    process_data()
