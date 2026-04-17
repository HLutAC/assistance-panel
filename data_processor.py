import csv
import sys
from datetime import datetime, timedelta
import os
import json

def load_env(file_path=".env"):
    env_vars = {}
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    env_vars[key] = value
    return env_vars

def process_data():
    # Cargar variables de entorno
    env = load_env()
    file_path = env.get("TRANSACTIONS_CSV", "Transacciones.csv")
    personal_info_path = env.get("PERSONAL_INFO_CSV", "Personal_information.csv")

    if not os.path.exists(file_path):
        print(f"Error: El archivo {file_path} no existe.")
        return

    # Cargar configuración (Mapeo de carriles)
    config_path = "config.json"
    mapping = {}
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            # Convertir listas a tuplas para el mapeo
            mapping = {k: tuple(v) for k, v in config.get("mapping", {}).items()}
    else:
        print("Error: No se encontró config.json")
        return

    print(f"Procesando archivo: {file_path}")
    
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
        print(f"Advertencia: No se encontró {personal_info_path}. Se usará el departamento original.")

    data = []
    skipped_metadata = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        header_index = -1
        for i, line in enumerate(lines):
            if line.startswith("Nombre;"):
                header_index = i
                break
        
        if header_index == -1:
            print("Error: No se encontró la cabecera del CSV.")
            return

        reader = csv.DictReader(lines[header_index:], delimiter=';')
        raw_rows = list(reader)
        total_raw = len(raw_rows)
        print(f"Total de registros encontrados: {total_raw}")

        # Limpieza y Mapeo Inicial
        processed_data = []
        for row in raw_rows:
            if not row.get('ID'): continue
            
            punto = row.get('Punto de control de asistencia', '').strip()
            carril, movimiento = mapping.get(punto, ("Desconocido", "Desconocido"))
            
            fecha_str = row.get('Fecha', '').strip()
            hora_str = row.get('Hora de registro de entrada', '').strip()
            
            if not fecha_str or not hora_str: continue

            try:
                dt_str = f"{fecha_str} {hora_str}"
                if len(hora_str) == 5: # HH:MM
                    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
                else: # HH:MM:SS
                    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                continue

            person_id = row.get('ID', '').strip()
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
                "Tipo de movimiento": movimiento,
                "Metodo": row.get('Método de verificación', '').strip(),
                "PuntoOriginal": punto
            })

        processed_data.sort(key=lambda x: (x['ID'], x['DateTime']))

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

        total_clean = len(clean_data)
        ingresos = len([r for r in clean_data if r['Tipo de movimiento'] == 'INGRESO'])
        salidas = len([r for r in clean_data if r['Tipo de movimiento'] == 'SALIDA'])
        usuarios_unicos = len(set(r['ID'] for r in clean_data))
        
        # Agregaciones para Gráficos
        hourly_map = {h: {"hora": f"{h:02d}:00", "ingresos": 0, "salidas": 0} for h in range(24)}
        for r in clean_data:
            h = r['DateTime'].hour
            if r['Tipo de movimiento'] == 'INGRESO':
                hourly_map[h]["ingresos"] += 1
            else:
                hourly_map[h]["salidas"] += 1
        hourly_chart = [hourly_map[h] for h in range(24)]

        carriles = sorted(set(r['Carril'] for r in clean_data))
        lane_chart = []
        for c in carriles:
            if c == 'Desconocido': continue
            lane_chart.append({
                "name": f"Carril {c}",
                "ingresos": len([r for r in clean_data if r['Carril'] == c and r['Tipo de movimiento'] == 'INGRESO']),
                "salidas": len([r for r in clean_data if r['Carril'] == c and r['Tipo de movimiento'] == 'SALIDA'])
            })

        pie_chart = [{"name": "Ingresos", "value": ingresos}, {"name": "Salidas", "value": salidas}]

        heatmap_raw = {}
        for r in clean_data:
            key = (r['Fecha'], r['DateTime'].hour)
            heatmap_raw[key] = heatmap_raw.get(key, 0) + 1
        
        heatmap_chart = []
        for (fecha, hora), count in heatmap_raw.items():
            f_display = "/".join(fecha.split("-")[1:][::-1])
            heatmap_chart.append({"fecha": f_display, "hora": hora, "value": count})

        user_names = {}
        for r in clean_data:
            user_names[r['ID']] = f"{r['Nombre']} {r['Apellido']}"

        sequence_chart = []
        for uid, name in list(user_names.items())[:10]:
            user_events = [r for r in clean_data if r['ID'] == uid]
            sequence_chart.append({
                "id": uid,
                "nombre": name,
                "eventos": [
                    {
                        "t": r['DateTime'].strftime("%Y-%m-%d %H:%M:%S"),
                        "tipo": 1 if r['Tipo de movimiento'] == 'INGRESO' else -1,
                        "label": r['Tipo de movimiento']
                    } for r in user_events
                ]
            })

        people_map = {}
        for r in clean_data:
            uid = r['ID']
            if uid not in people_map:
                people_map[uid] = {
                    "Nombre": r["Nombre"], "Apellido": r["Apellido"], "ID": r["ID"],
                    "Departamento": r["Departamento"], "EventosPorFecha": {}
                }
            fecha = r['Fecha']
            if fecha not in people_map[uid]["EventosPorFecha"]:
                people_map[uid]["EventosPorFecha"][fecha] = []
            people_map[uid]["EventosPorFecha"][fecha].append({
                "Hora": r["Hora"], "Movimiento": r["Tipo de movimiento"], "Carril": r["Carril"]
            })

        people_list = sorted(people_map.values(), key=lambda x: (x['Nombre'], x['Apellido']))

        dashboard_data = {
            "summary": {
                "total_raw": total_raw, "total_clean": total_clean, "ingresos": ingresos,
                "salidas": salidas, "usuarios_unicos": usuarios_unicos,
                "eliminados": total_raw - total_clean
            },
            "charts": {
                "hourly": hourly_chart, "lane": lane_chart, "pie": pie_chart,
                "heatmap": heatmap_chart, "sequence": sequence_chart
            },
            "personas": people_list 
        }

        output_json = 'src/data/dashboard_data.json'
        os.makedirs('src/data', exist_ok=True)
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

        print(f"Procesamiento completado con éxito. JSON generado en: {output_json}")

    except Exception as e:
        print(f"Error durante el procesamiento: {str(e)}")

if __name__ == "__main__":
    process_data()
