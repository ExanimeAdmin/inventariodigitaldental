-- Crear tabla de productos si no existe
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    area VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    proveedor VARCHAR(255),
    fecha_caducidad DATE,
    fecha_recepcion DATE,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    stock_maximo INTEGER,
    observaciones TEXT,
    guardado BOOLEAN DEFAULT FALSE,
    clinica_id VARCHAR(50) NOT NULL,
    refrigeracion BOOLEAN DEFAULT FALSE,
    ubicacion VARCHAR(255),
    lote VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_clinica_id ON productos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_productos_area ON productos(area);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_fecha_caducidad ON productos(fecha_caducidad);

-- Insertar datos de ejemplo
INSERT INTO productos (
    nombre, descripcion, cantidad, precio, area, categoria, proveedor,
    fecha_caducidad, fecha_recepcion, stock_minimo, stock_maximo,
    observaciones, guardado, clinica_id, refrigeracion
) VALUES 
(
    'Anestesia local (Lidocaína 2%)',
    'Anestésico local para procedimientos dentales',
    15,
    45500,
    'Box 1',
    'Medicamento',
    'Laboratorio Dental Chile',
    '2025-12-31',
    '2024-01-15',
    5,
    30,
    'Mantener refrigerado',
    false,
    '1',
    true
),
(
    'Guantes de látex Maxter (caja)',
    'Guantes desechables para procedimientos',
    25,
    15990,
    'Almacenamiento',
    'Consumible',
    'Maxter Medical',
    '2026-06-30',
    '2024-02-01',
    10,
    50,
    'Usar con precaución en pacientes con alergia al látex',
    false,
    '1',
    false
),
(
    'Composite Z350 A2',
    'Material restaurador fotopolimerizable',
    8,
    75000,
    'Box 2',
    'Consumible',
    '3M ESPE',
    '2025-08-15',
    '2024-01-20',
    2,
    10,
    'Material restaurador de alta calidad',
    true,
    '1',
    true
),
(
    'Fresas de diamante troncocónicas',
    'Fresas para preparación cavitaria',
    12,
    25000,
    'Esterilización',
    'Instrumental',
    'Komet Dental',
    null,
    '2024-01-10',
    4,
    20,
    'Esterilizar después de cada uso',
    false,
    '1',
    false
),
(
    'Turbina dental NSK',
    'Pieza de mano de alta velocidad',
    2,
    320000,
    'Box 1',
    'Equipamiento',
    'NSK Dental',
    null,
    '2024-01-05',
    1,
    5,
    'Requiere mantenimiento periódico',
    true,
    '1',
    false
);
