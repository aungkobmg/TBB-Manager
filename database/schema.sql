-- ============================================================
-- TBB OS — The Bra Boutique (Yangon)
-- Production MySQL Schema
-- Target: MySQL 8.0+
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','staff') NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
  ('business_name', 'The Bra Boutique (Yangon)'),
  ('phone', '09-xxxxxxxxx'),
  ('facebook', 'The Bra Boutique (Yangon)'),
  ('address', 'Yangon, Myanmar'),
  ('voucher_footer', 'Thank You For Shopping With Us!'),
  ('currency', 'MMK'),
  ('currency_symbol', 'K'),
  ('tax_rate', '0');

-- ------------------------------------------------------------
-- 3. bales
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bales` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bale_code` VARCHAR(20) NOT NULL,
  `purchase_date` DATE NOT NULL,
  `supplier_name` VARCHAR(150) NOT NULL,
  `bale_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `expected_qty` INT UNSIGNED NOT NULL DEFAULT 0,
  `actual_qty` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('Purchased','Processing','Completed','Closed') NOT NULL DEFAULT 'Purchased',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bales_code` (`bale_code`),
  KEY `idx_bales_status` (`status`),
  KEY `idx_bales_purchase_date` (`purchase_date`),
  KEY `idx_bales_supplier` (`supplier_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_code` VARCHAR(20) NOT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `brand` VARCHAR(100) NULL,
  `category` VARCHAR(100) NULL,
  `size` VARCHAR(50) NULL,
  `color` VARCHAR(50) NULL,
  `condition_grade` ENUM('A+','A','B') NOT NULL DEFAULT 'A',
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bale_id` INT UNSIGNED NULL,
  `status` ENUM('Available','Reserved','Sold','Cancelled') NOT NULL DEFAULT 'Available',
  `reserved_order_id` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_code` (`product_code`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_bale_id` (`bale_id`),
  KEY `idx_products_brand` (`brand`),
  KEY `idx_products_size` (`size`),
  KEY `idx_products_category` (`category`),
  KEY `idx_products_condition` (`condition_grade`),
  CONSTRAINT `fk_products_bale` FOREIGN KEY (`bale_id`) REFERENCES `bales`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `facebook_name` VARCHAR(150) NULL,
  `address` TEXT NULL,
  `township` VARCHAR(100) NULL,
  `city` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customers_name` (`name`),
  KEY `idx_customers_phone` (`phone`),
  KEY `idx_customers_facebook` (`facebook_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_number` VARCHAR(25) NOT NULL,
  `order_date` DATE NOT NULL,
  `order_time` TIME NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
  -- Immutable customer snapshot
  `customer_name_snapshot` VARCHAR(150) NOT NULL,
  `phone_snapshot` VARCHAR(30) NULL,
  `shipping_address_snapshot` TEXT NULL,
  -- Delivery
  `delivery_company` VARCHAR(100) NULL,
  `tracking_number` VARCHAR(100) NULL,
  -- Payment
  `payment_method` ENUM('KBZ Pay','Wave Pay','AYA Pay','COD') NOT NULL DEFAULT 'COD',
  `payment_status` ENUM('Paid','Unpaid','Partial') NOT NULL DEFAULT 'Unpaid',
  -- Financial
  `delivery_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  -- Status
  `order_status` ENUM('Pending','Confirmed','Packed','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  `cancel_reason` TEXT NULL,
  `cancelled_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_voucher` (`voucher_number`),
  KEY `idx_orders_customer_id` (`customer_id`),
  KEY `idx_orders_order_date` (`order_date`),
  KEY `idx_orders_status` (`order_status`),
  KEY `idx_orders_payment_method` (`payment_method`),
  KEY `idx_orders_payment_status` (`payment_status`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. order_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `product_code_snapshot` VARCHAR(20) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `line_total` DECIMAL(12,2) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_product_id` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. expenses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `expense_date` DATE NOT NULL,
  `category` ENUM('Bale Purchase','Delivery Cost','Packaging Cost','Miscellaneous') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `description` TEXT NULL,
  `reference` VARCHAR(200) NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_date` (`expense_date`),
  KEY `idx_expenses_category` (`category`),
  CONSTRAINT `fk_expenses_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. transactions (financial ledger)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_type` ENUM('sale','expense','refund','adjustment') NOT NULL,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` INT UNSIGNED NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `description` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transactions_type` (`transaction_type`),
  KEY `idx_transactions_date` (`created_at`),
  KEY `idx_transactions_reference` (`reference_type`, `reference_id`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. voucher_sequences (safe concurrent voucher generation)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `voucher_sequences` (
  `date_key` VARCHAR(6) NOT NULL COMMENT 'YYMMDD format',
  `last_number` INT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`date_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. product_movements (inventory audit trail)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_movements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `from_status` ENUM('Available','Reserved','Sold','Cancelled') NULL,
  `to_status` ENUM('Available','Reserved','Sold','Cancelled') NOT NULL,
  `order_id` INT UNSIGNED NULL,
  `reason` VARCHAR(200) NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_movements_product` (`product_id`),
  KEY `idx_movements_date` (`created_at`),
  CONSTRAINT `fk_movements_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  CONSTRAINT `fk_movements_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_movements_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. activity_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` INT UNSIGNED NULL,
  `description` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_logs_user` (`user_id`),
  KEY `idx_logs_action` (`action`),
  KEY `idx_logs_entity` (`entity_type`, `entity_id`),
  KEY `idx_logs_created_at` (`created_at`),
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. sessions (for PHP session tracking)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(128) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `last_activity` INT UNSIGNED NOT NULL,
  `payload` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_last_activity` (`last_activity`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DEFAULT ADMIN ACCOUNT
-- Username: admin
-- Password: admin123
-- Hash generated by PHP password_hash('admin123', PASSWORD_DEFAULT)
-- ============================================================
INSERT INTO `users` (`username`, `password_hash`, `role`) VALUES
  ('admin', '$2y$10$YourHashWillBeGeneratedByInstaller', 'admin');

-- NOTE: The password hash above is a placeholder.
-- The installer script will generate the real hash using PHP's password_hash().
