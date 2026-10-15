-- Migration: Completely remove Zone feature
-- Description: Drops zone_id from addresses, schedules, and routes, and drops the public.zones table.

-- 1. Remove zone_id from addresses
ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_zone_id_fkey;
ALTER TABLE public.addresses DROP COLUMN IF EXISTS zone_id;

-- 2. Remove zone_id from schedules
DROP INDEX IF EXISTS public.idx_schedules_zone_id;
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_zone_id_fkey;
ALTER TABLE public.schedules DROP COLUMN IF EXISTS zone_id;

-- 3. Remove zone_id from routes
ALTER TABLE public.routes DROP CONSTRAINT IF EXISTS routes_zone_id_fkey;
ALTER TABLE public.routes DROP COLUMN IF EXISTS zone_id;

-- 4. Drop zones table (CASCADE cleans up policies and references)
DROP TABLE IF EXISTS public.zones CASCADE;
