-- =====================================================
-- MARKETPLACE MIGRATION
-- Migración para agregar weapon_options y selected_weapon_id
-- =====================================================

-- 1. Agregar columna weapon_options a market_items
ALTER TABLE `market_items`
ADD COLUMN `weapon_options` JSON NULL COMMENT 'Array of weapon options for set_with_weapon category: [{itemId: 2383, name: "Spike Sword", imageUrl: "..."}]'
AFTER `items_json`;

-- 2. Agregar columna selected_weapon_id a cart_items
ALTER TABLE `cart_items`
ADD COLUMN `selected_weapon_id` INT UNSIGNED NULL COMMENT 'Selected weapon ID for set_with_weapon items'
AFTER `quantity`;

-- 3. Eliminar el constraint UNIQUE que impide múltiples items del mismo producto
-- (Necesario si quieres permitir diferentes configuraciones de armas del mismo set)
ALTER TABLE `cart_items`
DROP INDEX `unique_cart_item`;

-- 4. Actualizar la categoría ENUM para incluir las nuevas categorías
-- IMPORTANTE: Esto requiere recrear la columna, así que primero guardamos los datos

-- Primero, agregar una columna temporal
ALTER TABLE `market_items`
ADD COLUMN `category_new` ENUM('set_with_weapon', 'set_without_weapon', 'item') DEFAULT 'item'
AFTER `category`;

-- Migrar los datos antiguos a las nuevas categorías
UPDATE `market_items`
SET `category_new` = CASE
  WHEN `category` = 'set' THEN 'set_without_weapon'
  WHEN `category` = 'item' THEN 'item'
  WHEN `category` = 'mount' THEN 'item'
  WHEN `category` = 'outfit' THEN 'item'
  WHEN `category` = 'premium' THEN 'item'
  ELSE 'item'
END;

-- Eliminar la columna antigua
ALTER TABLE `market_items` DROP COLUMN `category`;

-- Renombrar la nueva columna
ALTER TABLE `market_items`
CHANGE COLUMN `category_new` `category` ENUM('set_with_weapon', 'set_without_weapon', 'item') DEFAULT 'item'
AFTER `image_url`;

-- 5. (OPCIONAL) Actualizar el item de ejemplo del Paladin para que tenga weapon_options
UPDATE `market_items`
SET
  `category` = 'set_with_weapon',
  `weapon_options` = JSON_ARRAY(
    JSON_OBJECT('itemId', 2456, 'name', 'Bow'),
    JSON_OBJECT('itemId', 2455, 'name', 'Crossbow'),
    JSON_OBJECT('itemId', 8849, 'name', 'Modified Crossbow'),
    JSON_OBJECT('itemId', 8851, 'name', 'Royal Crossbow')
  )
WHERE `name` LIKE '%Paladin%' AND `category` = 'set_without_weapon';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar la estructura de market_items
SHOW COLUMNS FROM `market_items`;

-- Verificar la estructura de cart_items
SHOW COLUMNS FROM `cart_items`;

-- Ver todos los items con sus nuevas categorías
SELECT id, name, category, weapon_options FROM `market_items`;
