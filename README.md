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
- **Frontend**: React con Vite y Tailwind CSS v4. Usamos Recharts para los gráficos y Lucide para la iconografía.
- **Backend**: FastAPI (Python) para los endpoints y el procesamiento de archivos.
- **Base de datos**: PostgreSQL para el almacenamiento persistente.

### Cómo ejecutarlo
1. **Requisitos**: Python 3.10+ y Node.js.
2. **Setup del Backend**:
   - Instala las dependencias: `pip install fastapi uvicorn psycopg2-binary python-dotenv requests`
   - Inicia el servidor: `python main.py` (escucha en el puerto 8000).
3. **Setup del Frontend**:
   - Instala los paquetes: `npm install`
   - Inicia el proyecto: `npm run dev` (abre `localhost:5173` en tu navegador).

### Notas y limitaciones
- El procesador de datos está optimizado para el formato de exportación de eventos de dispositivos Hikvision.
- Aplicamos un filtro de "limpieza" que ignora registros repetidos de una misma persona en un intervalo de 5 minutos para evitar inflar las estadísticas.
- La base de datos se guarda por defecto en una carpeta local `.pgdata` (asegúrate de que esté en tu `.gitignore`).

### Estado
El proyecto es funcional y estable para el uso diario. Todavía hay margen de mejora en el rendimiento cuando se cargan archivos con cientos de miles de registros a la vez, pero para el flujo normal de una institución funciona perfectamente.

### Licencia
Uso libre para fines académicos y personales.