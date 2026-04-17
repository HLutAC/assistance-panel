# Access Control & Reporting Dashboard

Este proyecto permite transformar registros crudos de sistemas de control de acceso en información útil para el análisis operativo. Está diseñado para trabajar con datos exportados (CSV) de sistemas como Hikvision y convertirlos en visualizaciones claras y reportes utilizables.

## Características principales

### KPIs diarios
Muestra un resumen rápido de ingresos, salidas y cantidad de personas únicas en el día seleccionado.

### Visualización de datos
Incluye gráficos orientados al análisis detallado:
- **Flujo de personas por hora**: Identificación de horas pico.
- **Uso de carriles/dispositivos**: Análisis de carga por punto de acceso.
- **Heatmap de actividad (hora vs día)**: Relación entre frecuencia horaria y diaria.
- **Distribución general de ingresos y salidas**: Balance de ingresos y salidas.
- **Secuencia temporal de eventos por persona**: Registro cronológico de movimientos.

### Funcionalidades adicionales
- **Integración con datos de personal**: Cruce de registros con bases externas para identificar área, escuela o afiliación.
- **Histórico navegable**: Consulta de fechas anteriores y revisión del detalle de movimientos.
- **Modo impresión**: Vista simplificada diseñada para exportar o imprimir reportes de forma legible.

---

## Arquitectura
El sistema está dividido en dos componentes principales:

### 1. Procesamiento de datos (Python)
Se encarga de la lógica de limpieza y estructuración:
- Limpieza de datos crudos.
- Eliminación de duplicados mediante una ventana de tiempo definida.
- Estandarización de formatos de fecha y texto.
- Enriquecimiento de la información (asignación de carril y tipo de movimiento).

### 2. Dashboard (React + TypeScript + Vite)
Interfaz de usuario que consume los datos procesados y los presenta mediante gráficos interactivos y tablas de análisis.

---

## Configuración
Los archivos sensibles y configuraciones locales no están versionados en el repositorio:

- **.env**: Define las rutas de entrada para los archivos CSV de transacciones y personal.
- **config.json**: Contiene el mapeo de identificadores de dispositivos a nombres de carriles y tipos de movimiento.

Asegúrate de configurar estos archivos antes de ejecutar el proyecto.

---

## Uso

### 1. Procesar los datos
Coloca los archivos CSV en las rutas definidas y ejecuta el script de procesamiento:
```bash
python3 data_processor.py
```
Esto generará el dataset limpio necesario para alimentar el dashboard.

### 2. Ejecutar el dashboard (desarrollo)
Para iniciar el entorno de desarrollo:
```bash
npm install
npm run dev
```

### 3. Construir para producción
Para generar los archivos listos para despliegue:
```bash
npm run build
```
Los archivos finales se ubicarán en la carpeta `dist`.

---

## Stack tecnológico
- **Frontend**: React, TypeScript, Vite, Tailwind CSS.
- **Visualización**: Recharts.
- **Procesamiento de datos**: Python 3 (Pandas).