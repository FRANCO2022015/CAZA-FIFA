-- Run only on a restored COPY first. Additive, preserves all existing rows.
BEGIN;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS items_snapshot TEXT;
COMMIT;
-- Historical missing eFootball detail cannot be reconstructed from totals.
