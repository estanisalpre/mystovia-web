-- =====================================================
-- MARKETPLACE SCHEMA
-- Sistema de tienda para OTServer
-- =====================================================

-- Tabla de items/sets del mercado
CREATE TABLE IF NOT EXISTS `market_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `image_url` VARCHAR(255),
  `category` ENUM('set_with_weapon', 'set_without_weapon', 'item') DEFAULT 'item',
  `is_active` TINYINT(1) DEFAULT 1,
  `stock` INT DEFAULT -1 COMMENT '-1 means unlimited stock',
  `featured` TINYINT(1) DEFAULT 0,
  `items_json` JSON COMMENT 'Array of items included in this product: [{itemId: 2160, count: 100, name: "Crystal Coin"}]',
  `weapon_options` JSON NULL COMMENT 'Array of weapon options for set_with_weapon category: [{itemId: 2383, name: "Spike Sword", imageUrl: "..."}]',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_active_featured` (`is_active`, `featured`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de carrito de compras (temporal)
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_id` INT(11) NOT NULL,
  `market_item_id` INT UNSIGNED NOT NULL,
  `quantity` INT DEFAULT 1,
  `selected_weapon_id` INT UNSIGNED NULL COMMENT 'Selected weapon ID for set_with_weapon items',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`market_item_id`) REFERENCES `market_items`(`id`) ON DELETE CASCADE,
  INDEX `idx_account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_id` INT(11) NOT NULL,
  `player_id` INT(11) NULL COMMENT 'Character that will receive the items',
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'processing', 'approved', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  `payment_method` VARCHAR(50) DEFAULT 'mercadopago',
  `payment_id` VARCHAR(100) COMMENT 'MercadoPago payment ID',
  `preference_id` VARCHAR(100) COMMENT 'MercadoPago preference ID',
  `delivered_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE SET NULL,
  INDEX `idx_account` (`account_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_id` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de items por orden
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `market_item_id` INT UNSIGNED NULL,
  `quantity` INT DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL COMMENT 'Price at the time of purchase',
  `item_name` VARCHAR(100) NOT NULL COMMENT 'Snapshot of item name',
  `items_json` JSON COMMENT 'Snapshot of items included',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`market_item_id`) REFERENCES `market_items`(`id`) ON DELETE SET NULL,
  INDEX `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de registro de pagos
CREATE TABLE IF NOT EXISTS `payment_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `payment_provider` VARCHAR(50) DEFAULT 'mercadopago',
  `payment_id` VARCHAR(100),
  `status` VARCHAR(50),
  `status_detail` VARCHAR(100),
  `transaction_amount` DECIMAL(10, 2),
  `webhook_data` JSON COMMENT 'Full webhook payload from payment provider',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_payment_id` (`payment_id`),
  INDEX `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- DATOS DE EJEMPLO (SEED DATA)
-- =====================================================

-- Sets de ejemplo
INSERT INTO `market_items` (`name`, `description`, `price`, `category`, `featured`, `items_json`, `weapon_options`) VALUES
('Knight Starter Pack', 'El set perfecto para comenzar tu aventura como Knight. Incluye equipo completo sin arma.', 399.00, 'set_without_weapon', 1,
  JSON_ARRAY(
    JSON_OBJECT('itemId', 2160, 'count', 100, 'name', 'Crystal Coin'),
    JSON_OBJECT('itemId', 2463, 'count', 1, 'name', 'Plate Armor'),
    JSON_OBJECT('itemId', 2478, 'count', 1, 'name', 'Brass Legs'),
    JSON_OBJECT('itemId', 2643, 'count', 1, 'name', 'Leather Boots')
  ),
  NULL
),
('Paladin Starter Pack + Weapon', 'Todo lo que necesitas para empezar como Paladin. Incluye set completo y arma a elección.', 499.00, 'set_with_weapon', 1,
  JSON_ARRAY(
    JSON_OBJECT('itemId', 2160, 'count', 100, 'name', 'Crystal Coin'),
    JSON_OBJECT('itemId', 2464, 'count', 1, 'name', 'Chain Armor'),
    JSON_OBJECT('itemId', 2648, 'count', 1, 'name', 'Chain Legs'),
    JSON_OBJECT('itemId', 2643, 'count', 1, 'name', 'Leather Boots')
  ),
  JSON_ARRAY(
    JSON_OBJECT('itemId', 2456, 'name', 'Bow'),
    JSON_OBJECT('itemId', 2455, 'name', 'Crossbow'),
    JSON_OBJECT('itemId', 8849, 'name', 'Modified Crossbow'),
    JSON_OBJECT('itemId', 8851, 'name', 'Royal Crossbow')
  )
),
('Mage Starter Pack', 'Set ideal para Sorcerer y Druid sin arma mágica.', 399.00, 'set_without_weapon', 1,
  JSON_ARRAY(
    JSON_OBJECT('itemId', 2160, 'count', 100, 'name', 'Crystal Coin'),
    JSON_OBJECT('itemId', 2656, 'count', 1, 'name', 'Blue Robe'),
    JSON_OBJECT('itemId', 2468, 'count', 1, 'name', 'Studded Legs'),
    JSON_OBJECT('itemId', 2643, 'count', 1, 'name', 'Leather Boots')
  ),
  NULL
),
('Leather Boots', 'Botas de cuero para protección básica.', 50.00, 'item', 0,
  JSON_ARRAY(
    JSON_OBJECT('itemId', 2643, 'count', 1, 'name', 'Leather Boots')
  ),
  NULL
),
('Plate Armor', 'Armadura de placas para Knights.', 150.00, 'item', 0,
  JSON_ARRAY(
    JSON_OBJECT('itemId', 2463, 'count', 1, 'name', 'Plate Armor')
  ),
  NULL
),
('Crystal Coins x100', 'Pack de 100 Crystal Coins.', 99.00, 'item', 0,
  JSON_ARRAY(
    JSON_OBJECT('itemId', 2160, 'count', 100, 'name', 'Crystal Coin')
  ),
  NULL
);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de items activos con stock disponible
CREATE OR REPLACE VIEW `active_market_items` AS
SELECT
  mi.*,
  COALESCE(SUM(oi.quantity), 0) as total_sold
FROM market_items mi
LEFT JOIN order_items oi ON mi.id = oi.market_item_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('approved', 'delivered')
WHERE mi.is_active = 1
  AND (mi.stock = -1 OR mi.stock > 0)
GROUP BY mi.id;

-- Vista de órdenes con detalles
CREATE OR REPLACE VIEW `order_details` AS
SELECT
  o.id,
  o.account_id,
  a.email as account_email,
  o.player_id,
  p.name as player_name,
  o.total_amount,
  o.status,
  o.payment_method,
  o.payment_id,
  o.created_at,
  o.delivered_at,
  COUNT(oi.id) as total_items
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
LEFT JOIN players p ON o.player_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;
