-- SQL schema for Planting Return Field Inspections (SR10)
-- MySQL 8.x / MariaDB-compatible
-- These tables power the GraphQL types in server/graphql/plantingInspections.*

-- Stages catalogue per crop
-- One row per inspection stage for a given crop.
-- The application reads these records to initialize a planting return's inspection timeline.
CREATE TABLE IF NOT EXISTS crop_inspection_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  crop_id BIGINT UNSIGNED NOT NULL,
  stage_name VARCHAR(255) NOT NULL,
  `order` INT NOT NULL,
  required TINYINT(1) NOT NULL DEFAULT 0,
  period_after_planting_days INT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_crop (crop_id),
  KEY idx_crop_order (crop_id, `order`),
  CONSTRAINT uq_crop_stage UNIQUE (crop_id, `order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional improvements (uncomment as needed)
-- 1) If you want JSON type for the report payload instead of TEXT:
--    ALTER TABLE planting_return_inspections
--    MODIFY COLUMN report JSON NULL;
--
-- 2) Index for faster timeline queries by visit_date (due date):
--    CREATE INDEX idx_pri_visit_date ON planting_return_inspections (visit_date);
--
-- 3) If you prefer to enforce uniqueness of a stage per planting return at DB level,
--    add a dedicated inspection_type_id column and keep it in sync with report JSON:
--    ALTER TABLE planting_return_inspections ADD COLUMN inspection_type_id BIGINT UNSIGNED NULL AFTER planting_return_id;
--    CREATE UNIQUE INDEX uq_pr_stage ON planting_return_inspections (planting_return_id, inspection_type_id);
--    -- and update your resolver to set inspection_type_id on insert/update.

