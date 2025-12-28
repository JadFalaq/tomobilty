-- Enable required extension for exclusion constraints on BTree + range
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Ensure new column exists (handled by Prisma migration for schema change)
-- Add exclusion constraint to prevent overlapping bookings per variant (excluding cancelled)
ALTER TABLE "booking"
  ADD CONSTRAINT booking_no_overlap_per_variant
  EXCLUDE USING gist (
    "variante_car_id" WITH =,
    daterange("date_debut", "date_fin", '[]') WITH &&
  )
  WHERE ("status_name" <> 'ANNULE');

