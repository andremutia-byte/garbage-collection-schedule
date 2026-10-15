-- Migration: 20261015000000_fix_address_uniqueness.sql
-- Description: Ensure address uniqueness rule supports multi-unit properties and optimize address lookups.
-- Compatibility: PostgreSQL 15+ (Supabase)

-- 1. Check for existing duplicate records before applying/verifying constraint
DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT street, unit, city, postal_code
        FROM public.addresses
        GROUP BY street, unit, city, postal_code
        HAVING COUNT(*) > 1
    ) sub;

    IF dup_count > 0 THEN
        RAISE WARNING 'Found % duplicate address groups in public.addresses.', dup_count;
    END IF;
END $$;

-- 2. Drop obsolete constraint without unit if it still exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'addresses_street_city_postal_code_key'
          AND conrelid = 'public.addresses'::regclass
    ) THEN
        ALTER TABLE public.addresses DROP CONSTRAINT addresses_street_city_postal_code_key;
    END IF;
END $$;

-- 3. Ensure the multi-unit uniqueness constraint exists
-- NULLS NOT DISTINCT ensures that records with NULL unit are treated as equal,
-- preventing duplicate registrations of single-family homes, while allowing
-- distinct multi-unit dwellings (e.g., 'Apt 1' vs 'Apt 2').
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'addresses_street_unit_city_postal_code_key'
          AND conrelid = 'public.addresses'::regclass
    ) THEN
        ALTER TABLE public.addresses
            ADD CONSTRAINT addresses_street_unit_city_postal_code_key
            UNIQUE NULLS NOT DISTINCT (street, unit, city, postal_code);
    END IF;
END $$;

-- 4. Create composite lookup index for performance on address search & deduplication queries
CREATE INDEX IF NOT EXISTS idx_addresses_street_city_postal_unit
    ON public.addresses (street, city, postal_code, unit);
