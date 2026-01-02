-- Add Boss Points columns to market_items table
-- This allows existing marketplace items to be redeemable with Boss Points

ALTER TABLE market_items
  ADD COLUMN redeemable_with_bp TINYINT(1) DEFAULT 0 COMMENT 'Can be purchased with Boss Points',
  ADD COLUMN bp_price INT DEFAULT NULL COMMENT 'Price in Boss Points (null if not redeemable)';

-- Add index for filtering redeemable items
CREATE INDEX idx_redeemable_bp ON market_items (redeemable_with_bp);

-- Boss Points Purchases Table (for tracking BP purchases separately from regular orders)
CREATE TABLE IF NOT EXISTS boss_points_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  market_item_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  points_spent INT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account (account_id),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
