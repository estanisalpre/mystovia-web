-- Agregar columna recovery_key a la tabla accounts
ALTER TABLE accounts
ADD COLUMN recovery_key VARCHAR(16) DEFAULT NULL AFTER `key`,
ADD UNIQUE INDEX idx_recovery_key (recovery_key);

-- Nota: La recovery_key se genera automáticamente al registrar una cuenta nueva
-- Formato: 16 caracteres alfanuméricos en mayúscula (ej: A1B2C3D4E5F6G7H8)
