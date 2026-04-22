# SmartAccess

Dashboard de monitoreo y gestión para dispositivos de control de acceso.

Este proyecto nació de la necesidad de centralizar y limpiar los registros (logs) que exportan los equipos de control de acceso (como barreras vehiculares y lectores faciales). El software de fábrica suele entregar archivos CSV difíciles de analizar de un vistazo, así que construimos este panel para procesar esos datos, guardarlos de forma estructurada y visualizarlos de manera clara.

### Qué hace el proyecto
- **Ingesta de datos**: Subes un CSV exportado del equipo y el sistema lo procesa, elimina duplicados (ruido de señal) y lo guarda en una base de datos local.
- **Visualización en tiempo real**: Un dashboard con el conteo de ingresos, salidas y usuarios activos del día.
- **Analíticas**: Gráficos de flujo por hora, uso de carriles, distribución por carrera/facultad y mapas de calor operativos para identificar horas pico.
- **Monitoreo de red**: Verifica si los dispositivos están en línea (online/offline) mediante consultas de red simples.
- **Gestión de datos**: Una sección para corregir tildes, espacios o errores tipográficos en los nombres de carreras y estudiantes.

### Tecnologías
- **Frontend**: React con Vite y Tailwind CSS v4.
- **Backend**: FastAPI+Python.
- **Base de datos**: PostgreSQL .

### Cómo ejecutarlo
1. **Requisitos**: Python 3.10+ y Node.js.
2. **Setup del Backend**:
   - Dependencias: `pip install fastapi uvicorn psycopg2-binary python-dotenv requests`
   - Servidor: `python main.py` (puerto 8000).
3. **Setup del Frontend**:
   - Instala los paquetes: `npm install`
   - Inicia el proyecto: `npm run dev`.

### Notas y limitaciones
- El procesador de datos está optimizado para el formato de exportación de eventos de dispositivos Hikvision.
- Aplicamos un filtro de "limpieza" que ignora registros repetidos de una misma persona en un intervalo de 5 minutos para evitar inflar las estadísticas.
- La base de datos se guarda por defecto en una carpeta local `.pgdata` (asegúrate de que esté en tu `.gitignore`).
