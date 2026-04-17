CREATE TABLE IF NOT EXISTS integrantes (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    escuela VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    person_id VARCHAR(50) REFERENCES integrantes(id),
    timestamp TIMESTAMP NOT NULL,
    tipo_movimiento VARCHAR(20),
    carril VARCHAR(50),
    source_file VARCHAR(255),
    UNIQUE(person_id, timestamp, tipo_movimiento, carril)
);
