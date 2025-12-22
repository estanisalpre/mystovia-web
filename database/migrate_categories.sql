-- =====================================================
-- MARKETPLACE CATEGORY MIGRATION
-- Actualiza el ENUM de category a las nuevas vocaciones
-- =====================================================

-- 1. Primero agregar columna temporal con el nuevo ENUM
ALTER TABLE `market_items`
ADD COLUMN `category_temp` ENUM('knight', 'paladin', 'sorcerer', 'druid', 'item') DEFAULT 'item'
AFTER `category`;

-- 2. Migrar los datos existentes a las nuevas categorías
UPDATE `market_items`
SET `category_temp` = CASE
  WHEN `category` = 'set_with_weapon' THEN 'item'
  WHEN `category` = 'set_without_weapon' THEN 'item'
  WHEN `category` = 'knight' THEN 'knight'
  WHEN `category` = 'paladin' THEN 'paladin'
  WHEN `category` = 'sorcerer' THEN 'sorcerer'
  WHEN `category` = 'druid' THEN 'druid'
  WHEN `category` = 'item' THEN 'item'
  ELSE 'item'
END;

-- 3. Eliminar la columna antigua
ALTER TABLE `market_items` DROP COLUMN `category`;

-- 4. Renombrar la nueva columna
ALTER TABLE `market_items`
CHANGE COLUMN `category_temp` `category` ENUM('knight', 'paladin', 'sorcerer', 'druid', 'item') DEFAULT 'item'
AFTER `image_url`;

-- 5. Recrear el índice de categoría
CREATE INDEX `idx_category` ON `market_items` (`category`);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver la estructura actualizada
SHOW COLUMNS FROM `market_items` LIKE 'category';

-- Ver los items con sus categorías actualizadas
SELECT id, name, category FROM `market_items`;
