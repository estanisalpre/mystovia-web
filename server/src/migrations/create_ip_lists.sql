-- IP Whitelist table for admin access
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  description VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  UNIQUE KEY unique_ip (ip_address),
  INDEX idx_ip_active (ip_address, is_active),
  FOREIGN KEY (created_by) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- IP Blacklist table for blocking IPs (rate limiting, abuse, etc.)
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  reason VARCHAR(255),
  blocked_until TIMESTAMP NULL,
  is_permanent TINYINT(1) DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  UNIQUE KEY unique_ip (ip_address),
  INDEX idx_ip_active (ip_address, is_active),
  INDEX idx_blocked_until (blocked_until),
  FOREIGN KEY (created_by) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- IP Access log for auditing admin access
CREATE TABLE IF NOT EXISTS ip_access_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  account_id INT,
  endpoint VARCHAR(255),
  action VARCHAR(50),
  was_allowed TINYINT(1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_account (account_id),
  INDEX idx_created (created_at),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
