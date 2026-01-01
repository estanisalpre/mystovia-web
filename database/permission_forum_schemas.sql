-- ============================================
-- SCHEMAS PARA SISTEMA COMPLETO
-- ============================================

-- ============================================
-- TABLA: ROLES Y PERMISOS
-- ============================================

-- Tabla de permisos disponibles
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación entre group_id y permisos
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_role_permission` (`group_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: FORO
-- ============================================

-- Categorías del foro
CREATE TABLE IF NOT EXISTS `forum_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `order_position` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Temas/Posts del foro
CREATE TABLE IF NOT EXISTS `forum_topics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `is_pinned` BOOLEAN DEFAULT FALSE,
  `is_locked` BOOLEAN DEFAULT FALSE,
  `views_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `forum_categories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`author_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_author` (`author_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios en temas del foro
CREATE TABLE IF NOT EXISTS `forum_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `topic_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`topic_id`) REFERENCES `forum_topics`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`author_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_topic` (`topic_id`),
  INDEX `idx_author` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Votaciones en temas del foro (+1, -1)
CREATE TABLE IF NOT EXISTS `forum_topic_votes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `topic_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `vote` TINYINT NOT NULL COMMENT '-1 for downvote, 1 for upvote',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`topic_id`) REFERENCES `forum_topics`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_topic_vote` (`topic_id`, `user_id`),
  INDEX `idx_topic` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: NOTICIAS
-- ============================================

-- Categorías de noticias
CREATE TABLE IF NOT EXISTS `news_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Noticias (solo lectura para usuarios, administrable)
CREATE TABLE IF NOT EXISTS `news` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT,
  `author_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `image_url` VARCHAR(500),
  `is_published` BOOLEAN DEFAULT FALSE,
  `views_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` TIMESTAMP NULL,
  FOREIGN KEY (`category_id`) REFERENCES `news_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`author_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_published` (`is_published`, `published_at`),
  INDEX `idx_author` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Votaciones en noticias (solo +1)
CREATE TABLE IF NOT EXISTS `news_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `news_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_news_like` (`news_id`, `user_id`),
  INDEX `idx_news` (`news_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: WIKI
-- ============================================

-- Categorías de la wiki
CREATE TABLE IF NOT EXISTS `wiki_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `order_position` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Artículos de la wiki
CREATE TABLE IF NOT EXISTS `wiki_articles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `content` TEXT NOT NULL,
  `author_id` INT NOT NULL,
  `is_published` BOOLEAN DEFAULT FALSE,
  `views_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `wiki_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`author_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_published` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: FAQS
-- ============================================

-- Categorías de FAQs
CREATE TABLE IF NOT EXISTS `faq_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `order_position` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preguntas frecuentes
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT,
  `question` VARCHAR(500) NOT NULL,
  `answer` TEXT NOT NULL,
  `order_position` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `faq_categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: DESCARGAS
-- ============================================

-- Tipos de descargas
CREATE TABLE IF NOT EXISTS `download_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `order_position` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Archivos de descarga
CREATE TABLE IF NOT EXISTS `downloads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `version` VARCHAR(50),
  `file_url` VARCHAR(500) NOT NULL,
  `file_size` BIGINT COMMENT 'Size in bytes',
  `download_count` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `download_categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: REGLAS
-- ============================================

-- Secciones de reglas
CREATE TABLE IF NOT EXISTS `rule_sections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `order_position` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reglas del servidor
CREATE TABLE IF NOT EXISTS `rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `order_position` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`section_id`) REFERENCES `rule_sections`(`id`) ON DELETE SET NULL,
  INDEX `idx_section` (`section_id`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: SOPORTE/CONTACTO
-- ============================================

-- Tickets de soporte
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Respuestas a tickets
CREATE TABLE IF NOT EXISTS `support_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `responder_id` INT,
  `message` TEXT NOT NULL,
  `is_staff_response` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`responder_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
  INDEX `idx_ticket` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS INICIALES: PERMISOS
-- ============================================

INSERT INTO `permissions` (`name`, `description`) VALUES
('view_admin_panel', 'Acceso al panel de administración'),
('manage_marketplace', 'Administrar productos del marketplace'),
('manage_users', 'Administrar usuarios y roles'),
('manage_forum', 'Administrar foro (moderar, editar, eliminar)'),
('manage_news', 'Crear y administrar noticias'),
('manage_wiki', 'Crear y administrar artículos de wiki'),
('manage_downloads', 'Administrar archivos de descarga'),
('manage_rules', 'Administrar reglas del servidor'),
('manage_faqs', 'Administrar preguntas frecuentes'),
('manage_support', 'Administrar tickets de soporte'),
('write_forum', 'Escribir y comentar en el foro'),
('vote_forum', 'Votar en temas del foro'),
('like_news', 'Dar like a noticias')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================
-- ASIGNACIÓN DE PERMISOS POR ROL
-- ============================================

-- Group ID 10: SUPER ADMIN - Acceso total
INSERT INTO `role_permissions` (`group_id`, `permission_id`)
SELECT 10, `id` FROM `permissions`
ON DUPLICATE KEY UPDATE `group_id` = VALUES(`group_id`);

-- Group ID 6: ADMIN FORO - Solo gestión de foro
INSERT INTO `role_permissions` (`group_id`, `permission_id`)
SELECT 6, `id` FROM `permissions` WHERE `name` IN (
  'view_admin_panel',
  'manage_forum',
  'write_forum',
  'vote_forum'
)
ON DUPLICATE KEY UPDATE `group_id` = VALUES(`group_id`);

-- Usuarios normales (otros group_ids): Permisos básicos
-- Nota: Esto se puede ajustar según los group_id específicos que tengas
-- Por ejemplo, para group_id 1 (usuarios normales):
INSERT INTO `role_permissions` (`group_id`, `permission_id`)
SELECT 1, `id` FROM `permissions` WHERE `name` IN (
  'write_forum',
  'vote_forum',
  'like_news'
)
ON DUPLICATE KEY UPDATE `group_id` = VALUES(`group_id`);

-- ============================================
-- DATOS INICIALES: CATEGORÍAS
-- ============================================

-- Categorías de foro por defecto
INSERT INTO `forum_categories` (`name`, `description`, `order_position`) VALUES
('General', 'Discusiones generales sobre el servidor', 1),
('Soporte Técnico', 'Ayuda con problemas técnicos', 2),
('Sugerencias', 'Comparte tus ideas para mejorar el servidor', 3),
('Comercio', 'Compra y venta entre jugadores', 4),
('Off-Topic', 'Temas fuera del juego', 5);

-- Categorías de noticias
INSERT INTO `news_categories` (`name`, `slug`) VALUES
('Actualizaciones', 'updates'),
('Eventos', 'events'),
('Mantenimiento', 'maintenance'),
('Anuncios', 'announcements');

-- Categorías de wiki
INSERT INTO `wiki_categories` (`name`, `slug`, `description`, `order_position`) VALUES
('Primeros Pasos', 'getting-started', 'Guías para nuevos jugadores', 1),
('Clases y Vocaciones', 'classes', 'Información sobre las diferentes clases', 2),
('Quests', 'quests', 'Guías de misiones', 3),
('Items y Equipamiento', 'items', 'Información sobre items y equipamiento', 4),
('Criaturas', 'creatures', 'Bestiario del servidor', 5),
('Mapas', 'maps', 'Mapas y ubicaciones importantes', 6);

-- Categorías de FAQs
INSERT INTO `faq_categories` (`name`, `order_position`) VALUES
('Cuenta y Registro', 1),
('Gameplay', 2),
('Problemas Técnicos', 3),
('Donaciones y Premium', 4),
('Reglas y Sanciones', 5);

-- Categorías de descargas
INSERT INTO `download_categories` (`name`, `description`, `order_position`) VALUES
('Cliente del Juego', 'Descarga el cliente oficial del servidor', 1),
('Mapas', 'Mapas actualizados del servidor', 2),
('Herramientas', 'Utilidades y herramientas útiles', 3);

-- Secciones de reglas
INSERT INTO `rule_sections` (`name`, `order_position`) VALUES
('Reglas Generales', 1),
('Reglas de Comportamiento', 2),
('Reglas de Comercio', 3),
('Reglas de PvP', 4),
('Sanciones', 5);

-- added
ALTER TABLE accounts ADD COLUMN creation INT UNSIGNED NOT NULL DEFAULT UNIX_TIMESTAMP();

-- ============================================
-- MIGRACIÓN: Agregar character_id al foro
-- ============================================

-- Agregar character_id a forum_topics
ALTER TABLE forum_topics ADD COLUMN character_id INT NULL AFTER author_id;
ALTER TABLE forum_topics ADD INDEX idx_character (character_id);

-- Agregar character_id a forum_comments
ALTER TABLE forum_comments ADD COLUMN character_id INT NULL AFTER author_id;
ALTER TABLE forum_comments ADD INDEX idx_character (character_id);

-- ============================================
-- MIGRACIÓN: Actualizar posts existentes con character_id
-- Asigna el primer personaje disponible del usuario a posts antiguos
-- ============================================

-- Actualizar forum_topics existentes que no tienen character_id
UPDATE forum_topics ft
SET ft.character_id = (
  SELECT p.id FROM players p
  WHERE p.account_id = ft.author_id
    AND p.deleted = 0
  ORDER BY p.id ASC
  LIMIT 1
)
WHERE ft.character_id IS NULL;

-- Actualizar forum_comments existentes que no tienen character_id
UPDATE forum_comments fc
SET fc.character_id = (
  SELECT p.id FROM players p
  WHERE p.account_id = fc.author_id
    AND p.deleted = 0
  ORDER BY p.id ASC
  LIMIT 1
)
WHERE fc.character_id IS NULL;

-- ============================================
-- TABLA: STREAMING ACCOUNTS (Twitch, YouTube, Kick)
-- ============================================

CREATE TABLE IF NOT EXISTS `user_streaming_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `account_id` INT NOT NULL,
  `platform` ENUM('twitch', 'youtube', 'kick') NOT NULL,
  `platform_user_id` VARCHAR(100),
  `platform_username` VARCHAR(100) NOT NULL,
  `platform_display_name` VARCHAR(100),
  `platform_profile_image` VARCHAR(500),
  `access_token` TEXT,
  `refresh_token` TEXT,
  `token_expires_at` TIMESTAMP NULL,
  `is_live` BOOLEAN DEFAULT FALSE,
  `last_live_check` TIMESTAMP NULL,
  `stream_title` VARCHAR(255),
  `stream_game` VARCHAR(100),
  `viewer_count` INT DEFAULT 0,
  `is_verified` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_platform_account` (`account_id`, `platform`),
  UNIQUE KEY `unique_platform_user` (`platform`, `platform_user_id`),
  INDEX `idx_platform` (`platform`),
  INDEX `idx_is_live` (`is_live`),
  INDEX `idx_account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;