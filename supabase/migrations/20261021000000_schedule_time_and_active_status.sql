-- Migration: 20261021000000_schedule_time_and_active_status.sql
-- Description:
-- 1. Add collection_time to public.schedules (e.g. '06:00 AM – 09:00 AM')
-- 2. Add is_active to public.schedules (default true)
-- 3. Add composite indexes for barangay-specific schedule lookups
-- 4. Preserve all existing schedules, addresses, and pickups

-- 1. Add collection_time and is_active to schedules
ALTER TABLE public.schedules
    ADD COLUMN IF NOT EXISTS collection_time TEXT NOT NULL DEFAULT '06:00 AM – 09:00 AM',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Add indexes for high performance schedule queries
CREATE INDEX IF NOT EXISTS idx_schedules_is_active
    ON public.schedules (is_active);

CREATE INDEX IF NOT EXISTS idx_schedules_barangay_active
    ON public.schedules (barangay_id, is_active)
    WHERE deleted_at IS NULL;

-- 3. Ensure public read policy includes active non-deleted schedules
DROP POLICY IF EXISTS "Allow public read access on schedules" ON public.schedules;
CREATE POLICY "Allow public read access on schedules"
    ON public.schedules FOR SELECT
    USING (deleted_at IS NULL);
