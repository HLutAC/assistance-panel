import csv
import sys
from datetime import datetime, timedelta
import os

def process_hikvision(file_path):
    if not os.path.exists(file_path):
        print(f"Error: El archivo {file_path} no existe.")
        return

    # Cargar información de personal (ID -> Escuela)
    personal_info = {}
    personal_info_path = "Personal_information.csv"
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

    # Mapeo de carriles
    mapping = {
        "Carril 01-REC. FACIAL INGRESO 01": ("01", "INGRESO"),
        "Carril 01-Cardreader 01": ("01", "INGRESO"),
        "Carril 01-REC. FACIAL SALIDA 01": ("01", "SALIDA"),
        "Carril 01-Cardreader 02": ("01", "SALIDA"),
        "Carril 02-REC. FACIAL INGRESO 02": ("02", "INGRESO"),
        "Carril 02-Cardreader 01": ("02", "INGRESO"),
        "Carril 02-REC. FACIAL SALIDA 02": ("02", "SALIDA"),
        "Carril 02-Cardreader 02": ("02", "SALIDA")
    }

    data = []
    skipped_metadata = 0
    
    # Intentar detectar el inicio de los datos
    # El archivo tiene metadatos al inicio
    # Buscamos la línea que empieza con "Nombre"
    
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
            if not row.get('ID'): continue # Saltar líneas vacías
            
            punto = row.get('Punto de control de asistencia', '').strip()
            carril, movimiento = mapping.get(punto, ("Desconocido", "Desconocido"))
            
            # Estandarizar fecha y hora
            fecha_str = row.get('Fecha', '').strip()
            hora_str = row.get('Hora de registro de entrada', '').strip()
            
            if not fecha_str or not hora_str: continue

            try:
                # Asumimos formato YYYY-MM-DD y HH:MM o HH:MM:SS
                dt_str = f"{fecha_str} {hora_str}"
                if len(hora_str) == 5: # HH:MM
                    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
                else: # HH:MM:SS
                    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
            except Exception as e:
                # Intentar otros formatos si falla
                continue

            # Cruzar con información académica
            person_id = row.get('ID', '').strip()
            # Si el ID está en personal_info, usamos la escuela. Si no, usamos el departamento del CSV original.
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

        # Ordenar por ID y Cronología para deduplicación global por persona
        processed_data.sort(key=lambda x: (x['ID'], x['DateTime']))

        # Deduplicación por proximidad (1 minuto)
        clean_data = []
        if processed_data:
            current_group = [processed_data[0]]
            
            for next_record in processed_data[1:]:
                prev = current_group[-1]
                
                # Reglas de duplicado: Mismo ID + Mismo Movimiento + Proximidad (<= 5 min)
                # Ignoramos Carril para evitar doble marcación en carriles contiguos
                if (next_record['ID'] == prev['ID'] and 
                    next_record['Tipo de movimiento'] == prev['Tipo de movimiento'] and 
                    (next_record['DateTime'] - prev['DateTime']).total_seconds() <= 300):
                    current_group.append(next_record)
                else:
                    # Consolidar grupo (tomar el ÚLTIMO como representativo por petición del usuario)
                    clean_data.append(current_group[-1])
                    current_group = [next_record]
            
            clean_data.append(current_group[-1]) # Ultimo grupo

        # Métricas
        total_clean = len(clean_data)
        ingresos = len([r for r in clean_data if r['Tipo de movimiento'] == 'INGRESO'])
        salidas = len([r for r in clean_data if r['Tipo de movimiento'] == 'SALIDA'])
        usuarios_unicos = len(set(r['ID'] for r in clean_data))
        
        # Reporte
        report = []
        report.append("# Reporte Analítico de Tránsito - Hikvision")
        report.append(f"\nGenerado el: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        report.append("\n## 1. Resumen General")
        report.append(f"- **Transacciones Brutas:** {total_raw}")
        report.append(f"- **Transacciones Limpias (después de deduplicar):** {total_clean}")
        report.append(f"- **Total de Ingresos:** {ingresos}")
        report.append(f"- **Total de Salidas:** {salidas}")
        report.append(f"- **Total de Personas Únicas:** {usuarios_unicos}")
        report.append(f"- **Registros Eliminados (Duplicados/Ruidos):** {total_raw - total_clean}")

        report.append("\n## 2. Análisis por Carril")
        carriles = sorted(set(r['Carril'] for r in clean_data))
        for c in carriles:
            c_ingresos = len([r for r in clean_data if r['Carril'] == c and r['Tipo de movimiento'] == 'INGRESO'])
            c_salidas = len([r for r in clean_data if r['Carril'] == c and r['Tipo de movimiento'] == 'SALIDA'])
            report.append(f"### Carril {c}")
            report.append(f"  - Ingresos: {c_ingresos}")
            report.append(f"  - Salidas: {c_salidas}")
            report.append(f"  - Total Tránsito: {c_ingresos + c_salidas}")

        report.append("\n## 3. Análisis Temporal (Horas Pico)")
        horas = {}
        for r in clean_data:
            h = r['DateTime'].hour
            horas[h] = horas.get(h, 0) + 1
        
        sorted_horas = sorted(horas.items(), key=lambda x: x[1], reverse=True)
        report.append("- **Top 3 Horas de mayor actividad:**")
        for h, count in sorted_horas[:3]:
            report.append(f"  - {h:02d}:00 - {h:02d}:59: {count} accesos")

        report.append("\n## 4. Usuarios con mayor tránsito")
        user_names = {}
        user_counts = {}
        for r in clean_data:
            user_counts[r['ID']] = user_counts.get(r['ID'], 0) + 1
            user_names[r['ID']] = f"{r['Nombre']} {r['Apellido']}"
        
        top_users = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)
        report.append("- **Top 5 Personas:**")
        for uid, count in top_users[:5]:
            report.append(f"  - {user_names[uid]} (ID: {uid}): {count} transacciones")

        report.append("\n## 5. Notas y Observaciones")
        if any(r['Carril'] == 'Desconocido' for r in clean_data):
            report.append("- SE DETECTARON PUNTOS DE CONTROL NO MAPEADOS.")
        report.append("- Se aplicó deduplicación Cross-Lane de 5 minutos, tomando el último evento registrado.")

        # Guardar resultados
        with open('reporte_hikvision.md', 'w', encoding='utf-8') as f:
            f.write("\n".join(report))
        
        # Agrupar por Persona (ID) y luego por Fecha
        people_map = {}
        for r in clean_data:
            uid = r['ID']
            if uid not in people_map:
                people_map[uid] = {
                    "Nombre": r["Nombre"],
                    "Apellido": r["Apellido"],
                    "ID": r["ID"],
                    "Departamento": r["Departamento"],
                    "EventosPorFecha": {} # Diccionario: { "2026-04-15": [ {Hora, Mov, Carril}, ... ], ... }
                }
            
            fecha = r['Fecha']
            if fecha not in people_map[uid]["EventosPorFecha"]:
                people_map[uid]["EventosPorFecha"][fecha] = []
            
            people_map[uid]["EventosPorFecha"][fecha].append({
                "Hora": r["Hora"],
                "Movimiento": r["Tipo de movimiento"],
                "Carril": r["Carril"]
            })

        # Convertir a lista y ordenar por nombre
        people_list = sorted(people_map.values(), key=lambda x: (x['Nombre'], x['Apellido']))

        # --- Agregaciones para Gráficos ---
        
        # 1. Flujo por hora (0-23)
        hourly_map = {h: {"hora": f"{h:02d}:00", "ingresos": 0, "salidas": 0} for h in range(24)}
        for r in clean_data:
            h = r['DateTime'].hour
            if r['Tipo de movimiento'] == 'INGRESO':
                hourly_map[h]["ingresos"] += 1
            else:
                hourly_map[h]["salidas"] += 1
        hourly_chart = [hourly_map[h] for h in range(24)]

        # 2. Uso por carril
        lane_chart = []
        for c in carriles:
            if c == 'Desconocido': continue
            lane_chart.append({
                "name": f"Carril {c}",
                "ingresos": len([r for r in clean_data if r['Carril'] == c and r['Tipo de movimiento'] == 'INGRESO']),
                "salidas": len([r for r in clean_data if r['Carril'] == c and r['Tipo de movimiento'] == 'SALIDA'])
            })

        # 3. Comparación Ingress vs Egress (Pie)
        pie_chart = [
            {"name": "Ingresos", "value": ingresos},
            {"name": "Salidas", "value": salidas}
        ]

        # 4. Heatmap (Hora vs Fecha)
        heatmap_raw = {} # (fecha, hora) -> count
        for r in clean_data:
            key = (r['Fecha'], r['DateTime'].hour)
            heatmap_raw[key] = heatmap_raw.get(key, 0) + 1
        
        heatmap_chart = []
        for (fecha, hora), count in heatmap_raw.items():
            # Formatear fecha para legibilidad (DD/MM)
            f_display = "/".join(fecha.split("-")[1:][::-1])
            heatmap_chart.append({"fecha": f_display, "hora": hora, "value": count})

        # 5. Secuencia Temporal (Top 10 Usuarios)
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

        # Guardar resultados en JSON para el Dashboard
        dashboard_data = {
            "summary": {
                "total_raw": total_raw,
                "total_clean": total_clean,
                "ingresos": ingresos,
                "salidas": salidas,
                "usuarios_unicos": usuarios_unicos,
                "eliminados": total_raw - total_clean
            },
            "charts": {
                "hourly": hourly_chart,
                "lane": lane_chart,
                "pie": pie_chart,
                "heatmap": heatmap_chart,
                "sequence": sequence_chart
            },
            "personas": people_list 
        }

        import json
        output_json = 'src/data/dashboard_data.json'
        os.makedirs('src/data', exist_ok=True)
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

        print(f"JSON para dashboard generado: {output_json}")

    except Exception as e:
        print(f"Error durante el procesamiento: {str(e)}")

if __name__ == "__main__":
    file_path = "Transacciones_2026-04-01_2026-04-30.csv"
    process_hikvision(file_path)
