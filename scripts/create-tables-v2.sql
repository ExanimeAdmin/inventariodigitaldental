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

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_clinica_id ON productos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_area ON productos(area);
CREATE INDEX IF NOT EXISTS idx_productos_stock_minimo ON productos(cantidad, stock_minimo);
CREATE INDEX IF NOT EXISTS idx_productos_fecha_caducidad ON productos(fecha_caducidad);

-- Insertar datos de ejemplo si la tabla está vacía
INSERT INTO productos (
  nombre, descripcion, cantidad, precio, area, categoria, proveedor,
  fecha_caducidad, fecha_recepcion, stock_minimo, stock_maximo,
  observaciones, guardado, clinica_id, refrigeracion
) 
SELECT * FROM (VALUES
  ('Guantes de látex (caja)', 'Caja de 100 unidades', 5, 15990, 'Almacenamiento', 'Consumible', 'Proveedor Dental SA', '2025-12-31', '2024-01-15', 10, 50, 'Verificar alergia al látex', false, '1', false),
  ('Anestesia Lidocaína 2%', 'Carpules de anestesia local', 8, 45500, 'Box 1', 'Medicamento', 'Farmacia Dental', '2025-06-30', '2024-02-01', 5, 30, 'Mantener refrigerado', false, '1', true),
  ('Composite Z350 A2', 'Resina compuesta fotopolimerizable', 3, 75000, 'Box 2', 'Consumible', 'Dental Supply', '2026-03-15', '2024-01-20', 2, 10, 'Material restaurador', true, '1', false),
  ('Fresas de diamante', 'Set de fresas troncocónicas', 12, 25000, 'Esterilización', 'Instrumental', 'Instrumental Dental', NULL, '2024-01-10', 8, 25, 'Esterilizar después de cada uso', false, '1', false),
  ('Mascarillas quirúrgicas', 'Caja de 50 unidades', 2, 12000, 'Recepción', 'Consumible', 'Suministros Médicos', '2025-08-20', '2024-02-05', 5, 30, 'Uso obligatorio', false, '1', false)
) AS v(nombre, descripcion, cantidad, precio, area, categoria, proveedor, fecha_caducidad, fecha_recepcion, stock_minimo, stock_maximo, observaciones, guardado, clinica_id, refrigeracion)
WHERE NOT EXISTS (SELECT 1 FROM productos LIMIT 1);
