# SmartAccess Reporting Framework

Plataforma profesional de análisis y gestión de reportes para sistemas de control de acceso. Este framework transforma registros crudos (CSV) en información analítica de alta fidelidad, respaldada por una arquitectura de base de datos relacional para escalabilidad a largo plazo.

## Características principales

### KPIs en Tiempo Real
Visualización instantánea de ingresos, salidas y usuarios únicos, servidos directamente desde PostgreSQL.

### Suite Analítica Avanzada
- **Flujo Horario**: Comparativa de ingresos vs salidas por hora.
- **Uso de Carriles**: Distribución de carga por punto de acceso.
- **Mapas de Calor**: Análisis de intensidad temporal (Hora vs Día).
- **Secuencias Individuales**: Seguimiento cronológico para auditorías detalladas.

### Fidelidad de Datos Dual
- **Resumen Ejecutivo**: Datos limpios y deduplicados para métricas operativas.
- **Bitácora de Auditoría**: Transparencia total con registros crudos sin procesar.

---

## Arquitectura

El sistema utiliza un stack moderno diseñado para manejar años de historial de logs:

1.  **Base de Datos**: PostgreSQL 16 (Instancia local aislada).
2.  **Backend API**: FastAPI (Motores de agregación SQL nativos).
3.  **Frontend**: React + TypeScript + Tailwind CSS (Vite).
4.  **Ingesta**: Python 3 con lógica de `UPSERT` incremental.

---

## Instalación y Configuración

### 1. Requisitos
- Python 3.10+
- Node.js & npm
- PostgreSQL (Cliente `psql` disponible en el sistema)

### 2. Configuración Inicial
Asegúrate de tener los archivos `.env` y `config.json` configurados en la raíz. El sistema inicializará su propia base de datos local en la primera ejecución.

---

## Uso Operativo

### Paso 1: Procesar nuevos datos
Coloca tus archivos `Transacciones_*.csv` en la raíz y sincroniza la base de datos:
```bash
./venv/bin/python data_processor.py
```

### Paso 2: Iniciar Servicios
Para levantar la base de datos y la API:
```bash
./start_backend.sh
```

### Paso 3: Visualizar Dashboard
En otra terminal, inicia la interfaz de usuario:
```bash
npm run dev
```

---

## Escalabilidad

Gracias a la migración a **PostgreSQL**, el sistema está preparado para:
- **Almacenamiento**: Millones de registros históricos.
- **Velocidad**: Consultas indexadas y paginación en servidor.
- **Integridad**: Prevención de duplicados mediante claves únicas compuestas.

---

## Stack Tecnológico
- **Core**: React, TypeScript, Vite.
- **Estilos**: Tailwind CSS v4.
- **Gráficos**: Recharts.
- **Backend**: FastAPI, SQLAlchemy, Psycopg2.
- **Base de Datos**: PostgreSQL.