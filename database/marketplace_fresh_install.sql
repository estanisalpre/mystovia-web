-- =====================================================
-- MARKETPLACE FRESH INSTALL
-- ADVERTENCIA: Esto ELIMINA todas las tablas y datos existentes
-- =====================================================

-- Eliminar tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS `payment_logs`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `market_items`;

-- Ahora ejecutar el marketplace.sql completo
-- Puedes copiar y pegar el contenido de marketplace.sql aquí
-- o ejecutarlo después de este script
