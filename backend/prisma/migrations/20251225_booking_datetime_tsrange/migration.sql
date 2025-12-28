-- Migration: Convert booking dates to timestamp and enforce strict overlap with tsrange
-- Context: Africa/Casablanca business hours 09:00–17:00
-- Rule for legacy date-only rows:
--   - date_debut becomes at 09:00:00 (local business start)
--   - date_fin   becomes at 17:00:00 (local business end)
-- This is a single, consistent rule across all legacy rows.

BEGIN;

-- Ensure required extension for GiST index on ranges (btree_gist not needed for tsrange, but gist is default)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) Convert columns from DATE to TIMESTAMP WITHOUT TIME ZONE
-- Note: We store naive timestamps; API enforces Africa/Casablanca time consistently.
ALTER TABLE "booking"
  ALTER COLUMN "date_debut" TYPE timestamp WITHOUT TIME ZONE
    USING ("date_debut"::date + time '09:00:00'),
  ALTER COLUMN "date_fin" TYPE timestamp WITHOUT TIME ZONE
    USING ("date_fin"::date + time '17:00:00');

-- 2) Drop previous overlap constraint if it exists (on daterange)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'booking_no_overlap_per_variant'
      AND conrelid = 'booking'::regclass
  ) THEN
    ALTER TABLE "booking" DROP CONSTRAINT booking_no_overlap_per_variant;
  END IF;
END$$;

-- 3) Add strict overlap prevention with tsrange, inclusive bounds '[]'
-- Using '[]' makes the end bound inclusive, so a new booking starting exactly at previous end time overlaps (blocked).
ALTER TABLE "booking"
  ADD CONSTRAINT booking_no_overlap_per_variant
  EXCLUDE USING gist (
    "variante_car_id" WITH =,
    tsrange("date_debut", "date_fin", '[]') WITH &&
  )
  WHERE ("status_name" <> 'ANNULE');

COMMIT;

