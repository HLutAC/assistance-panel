# Access Control & Reporting Dashboard

Un panel de control de alto rendimiento diseñado para transformar los logs crudos de sistemas de acceso en inteligencia operativa accionable. Construido con una estética **Cloud Premium** y una arquitectura de seguridad descentralizada.

## ✨ Características Principales

- **KPIs en Tiempo Real**: Resumen dinámico de ingresos, salidas y usuarios únicos del día actual.
- **Analítica Avanzada**: 5 gráficos interactivos (Flujo horario, Uso de dispositivos, Heatmap temporal, Distribución global y Secuencias cronológicas).
- **Integración con Personal**: Cruce automático con bases de datos de personal para mostrar la afiliación/escuela de cada colaborador.
- **Historial Interactivo**: Navegación por fechas históricas con expansión de movimientos detallada.
- **Modo Impresión**: Optimizado para reportes en blanco y negro de alta legibilidad.

## 🏗️ Arquitectura del Sistema

El proyecto se divide en dos capas principales:

1. **Procesador de Datos (Python)**: Limpia, deduplica (ventana de 5 min) y enriquece los datos crudos de las fuentes CSV.
2. **Dashboard Frontend (React + TS + Vite)**: Una interfaz fluida y data-dense que visualiza los resultados procesados.

## 🔒 Seguridad y Configuración

Toda la información sensible está externalizada y protegida por `.gitignore`:

- **`.env`**: Define las rutas de los archivos CSV de transacciones y personal.
- **`config.json`**: Contiene el mapeo técnico de los dispositivos y puntos de control.

## 🚀 Guía de Inicio Rápido

### 1. Procesamiento de Datos
Asegúrate de tener tus archivos CSV en la ruta especificada en el `.env` y ejecuta:
```bash
python3 data_processor.py
```

### 2. Ejecución del Dashboard (Modo Desarrollo)
Instala las dependencias y arranca el servidor Vite:
```bash
npm install
npm run dev
```

### 3. Construcción para Producción
Genera los assets optimizados en la carpeta `dist`:
```bash
npm run build
```

## 🛠️ Stack Tecnológico
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React.
- **Visualización**: Recharts.
- **Backend**: Python 3.

---
© 2026 Admin Dashboard Suite - v3.0.0
