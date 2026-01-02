-- Fix boss_points_purchases table - add missing market_item_id column if it doesn't exist
-- Run this if you get error: "Unknown column 'market_item_id' in 'field list'"

-- Check and add market_item_id column if missing
ALTER TABLE boss_points_purchases
  ADD COLUMN IF NOT EXISTS market_item_id INT NOT NULL DEFAULT 0 AFTER player_name;

-- Alternative for MySQL versions that don't support "IF NOT EXISTS" for columns:
-- First check if column exists, then run this if it doesn't:
-- ALTER TABLE boss_points_purchases ADD COLUMN market_item_id INT NOT NULL DEFAULT 0 AFTER player_name;
