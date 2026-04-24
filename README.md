# Assistance

Dashboard de monitoreo y gestión para dispositivos de control de acceso.

Este proyecto nació de la necesidad de centralizar y limpiar los registros (logs) que exportan los equipos de control de acceso (como barreras vehiculares, lectores faciales y demas dispositivos). El software de fábrica suele entregar archivos CSV difíciles de analizar de un vistazo, así que se construyo este panel para procesar esos datos, guardarlos de forma estructurada y visualizarlos de manera clara. Se utilizo un filtro de "limpieza" de registros repetidos de una misma persona en un intervalo de 5 minutos.

### Tecnologías
- **Frontend**: React con Vite y Tailwind CSS v4.
- **Backend**: FastAPI+Python.
- **Base de datos**: PostgreSQL .

### Cómo ejecutarlo
1. **Requisitos**: Python 3.10+ y Node.js.
2. **Setup del Backend**:
   - Dependencias: `pip install fastapi uvicorn psycopg2-binary python-dotenv requests`
   - Servidor: `python main.py`
3. **Setup del Frontend**:
   - Instala los paquetes: `npm install`
   - Inicia el proyecto: `npm run dev`