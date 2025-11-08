-- Migration: Add payment tracking fields to orders table
-- Date: 2025-11-07
-- Description: Adds MercadoPago integration fields

-- Add payment_id and preference_id columns to orders table if they don't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) NULL AFTER status,
ADD COLUMN IF NOT EXISTS preference_id VARCHAR(255) NULL AFTER payment_id;

-- Update payment_method column to support longer values if needed
ALTER TABLE orders
MODIFY COLUMN payment_method VARCHAR(50) DEFAULT 'mercadopago';

-- Create payment_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_provider VARCHAR(50) NOT NULL DEFAULT 'mercadopago',
  payment_id VARCHAR(255) NULL,
  status VARCHAR(50) NOT NULL,
  status_detail VARCHAR(255) NULL,
  transaction_amount DECIMAL(10, 2) NOT NULL,
  webhook_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payment_id (payment_id),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index to orders for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_preference_id ON orders(preference_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
