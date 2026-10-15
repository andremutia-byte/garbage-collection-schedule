-- Migration: 20261015010000_resilient_user_sync.sql
-- Description: Improve sync_clerk_user() to safely handle email conflicts from re-registered accounts.

CREATE OR REPLACE FUNCTION public.sync_clerk_user(
    p_clerk_id TEXT,
    p_email    TEXT
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
    INSERT INTO public.users (id, email, created_at, updated_at, deleted_at)
    VALUES (p_clerk_id, p_email, NOW(), NOW(), NULL)
    ON CONFLICT (id) DO UPDATE
        SET email      = EXCLUDED.email,
            updated_at = NOW(),
            -- Reactivate if the account was previously soft-deleted
            deleted_at = NULL;

    -- Assign default 'resident' role if the user has no roles yet.
    -- This does NOT downgrade staff who already have admin/dispatcher/collector.
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (p_clerk_id, 'resident', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Ensure execution permissions
REVOKE EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT) TO service_role;
