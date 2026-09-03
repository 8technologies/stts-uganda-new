-- Renames the SR6 application "type" values to reflect the new category
-- names:
--   plant_breeder      -> basic_seed_producer   (middle tier)
--   basic_seed_breeder -> plant_breeder          (top tier)
--   seed_producer stays unchanged (bottom tier)
--
-- sr6_application_forms.type is a native MySQL ENUM, so the target values
-- must be added to the column definition before they can be written, and
-- writing a value that isn't in the list silently coerces to '' instead of
-- erroring (non-strict SQL mode) -- ask me how I know.

-- 1. Widen the enum so old and new values are valid during the migration.
ALTER TABLE sr6_application_forms
  MODIFY COLUMN type ENUM('plant_breeder','seed_producer','basic_seed_breeder','basic_seed_producer') NOT NULL;

-- 2. Rename plant_breeder -> basic_seed_producer first (frees up the
--    'plant_breeder' value so step 3 can claim it without colliding).
UPDATE sr6_application_forms
SET type = 'basic_seed_producer'
WHERE type = 'plant_breeder';

-- 3. Rename basic_seed_breeder -> plant_breeder.
UPDATE sr6_application_forms
SET type = 'plant_breeder'
WHERE type = 'basic_seed_breeder';

-- 4. Tighten the enum to the final clean set.
ALTER TABLE sr6_application_forms
  MODIFY COLUMN type ENUM('seed_producer','basic_seed_producer','plant_breeder') NOT NULL;
