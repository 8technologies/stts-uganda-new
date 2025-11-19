-- SQL schema for Planting Returns (SR8)
-- MySQL 8.x / MariaDB-compatible
-- Adjust referenced table names/types (users, crops, varieties) to your environment.

CREATE TABLE IF NOT EXISTS planting_returns (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sr8_number VARCHAR(50) NOT NULL,

  -- Actor references
  created_by VARCHAR(64) NULL,
  inspector_id VARCHAR(64) NULL,

  -- Grower/applicant
  applicant_name VARCHAR(255) NULL,
  grower_number VARCHAR(64) NULL,
  contact_phone VARCHAR(64) NULL,

  -- Field
  garden_number VARCHAR(64) NULL,
  field_name VARCHAR(255) NULL,
  district VARCHAR(128) NULL,
  subcounty VARCHAR(128) NULL,
  parish VARCHAR(128) NULL,
  village VARCHAR(128) NULL,
  gps_lat DECIMAL(10,7) NULL,
  gps_lng DECIMAL(10,7) NULL,

  -- Crop & variety
  crop_id BIGINT UNSIGNED NULL,
  variety_id BIGINT UNSIGNED NULL,
  seed_class VARCHAR(64) NULL,

  -- Planting & production
  area_ha DECIMAL(10,2) NULL,
  date_sown DATE NULL,
  expected_harvest DATE NULL,
  seed_source VARCHAR(255) NULL,
  seed_lot_code VARCHAR(128) NULL,
  intended_merchant VARCHAR(255) NULL,
  seed_rate_per_ha VARCHAR(64) NULL,

  -- Workflow
  status ENUM('pending','assigned','approved','rejected','halted','recommended') NOT NULL DEFAULT 'pending',
  status_comment TEXT NULL,
  scheduled_visit_date DATE NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sr8_number (sr8_number),
  KEY idx_status (status),
  KEY idx_created_by (created_by),
  KEY idx_inspector (inspector_id),
  KEY idx_crop (crop_id),
  KEY idx_variety (variety_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional FKs (uncomment and adjust types/table names to match your DB)
-- ALTER TABLE planting_returns
--   ADD CONSTRAINT fk_pr_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
--   ADD CONSTRAINT fk_pr_inspector FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
--   ADD CONSTRAINT fk_pr_crop FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL,
--   ADD CONSTRAINT fk_pr_variety FOREIGN KEY (variety_id) REFERENCES crop_varieties(id) ON DELETE SET NULL;

-- Inspection reporting (per visit). Optional but recommended for Step 5.
CREATE TABLE IF NOT EXISTS planting_return_inspections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  planting_return_id BIGINT UNSIGNED NOT NULL,
  inspector_id VARCHAR(64) NULL,
  visit_date DATE NULL,
  report TEXT NULL,
  variety_identity VARCHAR(255) NULL,
  spacing VARCHAR(64) NULL,
  isolation_distance VARCHAR(64) NULL,
  crop_condition TEXT NULL,
  recommendation ENUM('none','approve','reject','halt') NOT NULL DEFAULT 'none',
  status ENUM('draft','submitted','reviewed') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pri_return (planting_return_id),
  CONSTRAINT fk_pri_return FOREIGN KEY (planting_return_id) REFERENCES planting_returns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

