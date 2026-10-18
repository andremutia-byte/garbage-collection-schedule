-- Migration: 20261018000000_resident_contact_number.sql
-- Description: Add resident contact number to public.users and update sync_clerk_user()

-- 1. Add nullable phone column to public.users
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Ensure public.resident_profiles also has phone column (idempotent)
ALTER TABLE public.resident_profiles
    ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Drop existing 2-arg sync_clerk_user to avoid signature ambiguity
DROP FUNCTION IF EXISTS public.sync_clerk_user(TEXT, TEXT);

-- 4. Update sync_clerk_user to support optional p_phone without overwriting existing numbers
CREATE OR REPLACE FUNCTION public.sync_clerk_user(
    p_clerk_id TEXT,
    p_email    TEXT,
    p_phone    TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- If another user record (e.g. an old deleted/abandoned account) holds this email,
    -- release it by appending an archived suffix so the active Clerk ID can claim the email.
    UPDATE public.users
    SET email = email || '_archived_' || substr(id, 1, 8),
        updated_at = NOW()
    WHERE email = p_email AND id <> p_clerk_id;

    -- Upsert the user record
    -- If p_phone is NULL or empty, preserve the existing phone number in public.users
    INSERT INTO public.users (id, email, phone, created_at, updated_at, deleted_at)
    VALUES (
        p_clerk_id,
        p_email,
        CASE WHEN p_phone IS NOT NULL AND trim(p_phone) <> '' THEN trim(p_phone) ELSE NULL END,
        NOW(),
        NOW(),
        NULL
    )
    ON CONFLICT (id) DO UPDATE
        SET email      = EXCLUDED.email,
            phone      = CASE 
                           WHEN EXCLUDED.phone IS NOT NULL AND trim(EXCLUDED.phone) <> '' THEN EXCLUDED.phone 
                           ELSE public.users.phone 
                         END,
            updated_at = NOW(),
            -- Reactivate if the account was previously soft-deleted
            deleted_at = NULL;

    -- Ensure resident_profiles row exists without overwriting existing phone if p_phone is empty
    INSERT INTO public.resident_profiles (user_id, phone, created_at, updated_at)
    VALUES (
        p_clerk_id,
        CASE WHEN p_phone IS NOT NULL AND trim(p_phone) <> '' THEN trim(p_phone) ELSE NULL END,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
        SET phone = CASE 
                      WHEN EXCLUDED.phone IS NOT NULL AND trim(EXCLUDED.phone) <> '' THEN EXCLUDED.phone 
                      ELSE public.resident_profiles.phone 
                    END,
            updated_at = NOW();

    -- Assign default 'resident' role if the user has no roles yet.
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (p_clerk_id, 'resident', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Ensure execution permissions
REVOKE EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT, TEXT) TO service_role;
