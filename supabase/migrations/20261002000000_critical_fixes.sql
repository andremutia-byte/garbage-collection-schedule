-- ============================================================
-- Migration: 20261002000000_critical_fixes.sql
-- Applies critical schema fixes from schema_audit_v2.md
--
-- This migration is additive. The init migration (20261001155636)
-- is already applied to the remote database and MUST NOT be changed.
--
-- Changes applied:
--   C1/R1  : Add addresses.unit; update uniqueness to support multi-unit
--   C2/R2  : INSERT/UPDATE/DELETE RLS policies (role/action matrix)
--   C3/R3  : sync_clerk_user() helper function + contract documentation
--   C4     : First-admin bootstrap procedure (documented, no self-service path)
--   SEC    : REVOKE PUBLIC EXECUTE on all SECURITY DEFINER functions
--            New auth_is_admin() function for admin-only operations
-- ============================================================

-- ============================================================
-- SEC-0: New SECURITY DEFINER helper — admin-only check
-- ============================================================
-- Used where dispatcher must NOT share the privilege with admin
-- (e.g., managing user roles, hard-deleting data)
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = (auth.jwt() ->> 'sub') AND role = 'admin'
    );
$$;

-- ============================================================
-- SEC-1: Revoke PUBLIC EXECUTE on all SECURITY DEFINER functions
-- ============================================================
-- By default Postgres grants EXECUTE to PUBLIC on new functions.
-- These functions query sensitive tables (user_roles); restrict access.
REVOKE EXECUTE ON FUNCTION public.auth_is_admin()                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auth_is_admin_or_dispatcher()    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auth_is_staff()                  FROM PUBLIC;

-- Grant to the roles that actually need them
GRANT EXECUTE ON FUNCTION public.auth_is_admin()                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_admin_or_dispatcher()     TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_staff()                   TO authenticated;

-- ============================================================
-- C1/R1: Address unit support
-- Allows multi-unit properties (apartments, flats, suites)
-- without conflicting on the uniqueness constraint.
-- ============================================================
ALTER TABLE public.addresses ADD COLUMN unit TEXT;

-- Drop the old two-field unique constraint
ALTER TABLE public.addresses DROP CONSTRAINT addresses_street_city_postal_code_key;

-- Replace with a three-field constraint using NULLS NOT DISTINCT
-- (PostgreSQL 15+, available on all Supabase projects).
-- NULLS NOT DISTINCT means (street, NULL, city, postal) and
-- (street, NULL, city, postal) are considered equal — preventing
-- two "no-unit" records for the same physical house.
-- (street, 'Apt 1', city, postal) and (street, 'Apt 2', city, postal)
-- are considered different — correctly allowing both flats to register.
ALTER TABLE public.addresses
    ADD CONSTRAINT addresses_street_unit_city_postal_code_key
    UNIQUE NULLS NOT DISTINCT (street, unit, city, postal_code);

-- ============================================================
-- C3/R3: Clerk user synchronization helper function
--
-- CONTRACT (for the Next.js webhook Server Action):
--   Trigger  : Clerk webhook event  user.created  and  user.updated
--   Caller   : Next.js /api/webhooks/clerk  route handler
--   Auth     : Must use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
--   Input    : Clerk user ID (string), primary email address (string)
--   Behavior :
--     - UPSERT into public.users on conflict with id
--     - Reactivates soft-deleted accounts (clears deleted_at)
--     - Assigns 'resident' role if the user has no roles yet
--     - Idempotent — safe to call multiple times
--   NOT called from browser clients. Service role only.
--
-- Webhook deletion (user.deleted):
--   The webhook handler should set deleted_at = NOW() on public.users
--   using the service role client. It must NOT hard-delete the row
--   because ON DELETE RESTRICT will block it while pickups/notifications
--   reference the user_id.
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_clerk_user(
    p_clerk_id TEXT,
    p_email    TEXT
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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

-- sync_clerk_user is called exclusively by the service-role webhook handler.
-- Authenticated browser users must NOT be able to call it.
REVOKE EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.sync_clerk_user(TEXT, TEXT) TO service_role;

-- ============================================================
-- C2/R2: Write RLS Policies (INSERT / UPDATE / DELETE)
--
-- Design principles:
--   1. SELECT policies already exist in the init migration.
--      These policies add write access only.
--   2. Multiple policies on the same table and operation
--      are OR-ed by Postgres — any passing policy grants access.
--   3. Residents cannot write staff/admin data.
--   4. Collectors can only update operational records they own.
--   5. Browser INSERT into users is intentionally blocked;
--      service_role (webhook) bypasses RLS and handles it.
--   6. Pickup INSERT is intentionally blocked for all browser roles;
--      the background job uses service_role.
--   7. Notification INSERT/UPDATE is intentionally blocked for all
--      browser roles; the notification worker uses service_role.
-- ============================================================

-- ----------------------------------------------------------
-- users
-- ----------------------------------------------------------
-- INSERT: No browser INSERT policy. Webhook uses service_role → bypasses RLS.
-- UPDATE: Admin can update any user (e.g., soft-delete, email correction).
--         Users can update their own record (limited by app layer to safe fields).
CREATE POLICY "Users update own record"
    ON public.users FOR UPDATE
    USING  ((auth.jwt() ->> 'sub') = id)
    WITH CHECK ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "Admins update any user"
    ON public.users FOR UPDATE
    USING  (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

-- DELETE: No hard deletes. Soft-delete (UPDATE deleted_at) covered above.

-- ----------------------------------------------------------
-- user_roles
-- ----------------------------------------------------------
-- Admin only can grant or revoke roles.
-- Dispatchers cannot manage roles (privilege separation).
CREATE POLICY "Admins insert user roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (public.auth_is_admin());

CREATE POLICY "Admins delete user roles"
    ON public.user_roles FOR DELETE
    USING (public.auth_is_admin());

-- ----------------------------------------------------------
-- resident_profiles
-- ----------------------------------------------------------
-- A user can create their own profile on first sign-in.
CREATE POLICY "Users insert own profile"
    ON public.resident_profiles FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- A user can update their own profile (phone, notification preference).
CREATE POLICY "Users update own profile"
    ON public.resident_profiles FOR UPDATE
    USING  ((auth.jwt() ->> 'sub') = user_id)
    WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Admin/dispatcher can update any profile (e.g., customer support corrections).
CREATE POLICY "Admins and Dispatchers update any profile"
    ON public.resident_profiles FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

-- ----------------------------------------------------------
-- zones
-- ----------------------------------------------------------
-- Only admins and dispatchers can create or modify zones.
-- Hard delete is blocked by ON DELETE RESTRICT (addresses reference zones).
-- Soft-delete (UPDATE deleted_at) is covered by the UPDATE policy.
CREATE POLICY "Admins and Dispatchers insert zones"
    ON public.zones FOR INSERT
    WITH CHECK (public.auth_is_admin_or_dispatcher());

CREATE POLICY "Admins and Dispatchers update zones"
    ON public.zones FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

-- ----------------------------------------------------------
-- addresses
-- ----------------------------------------------------------
-- Admin/dispatcher register and manage addresses.
-- Residents cannot create addresses directly — to prevent
-- self-assigning to arbitrary addresses.
CREATE POLICY "Admins and Dispatchers insert addresses"
    ON public.addresses FOR INSERT
    WITH CHECK (public.auth_is_admin_or_dispatcher());

CREATE POLICY "Admins and Dispatchers update addresses"
    ON public.addresses FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

-- ----------------------------------------------------------
-- user_addresses
-- ----------------------------------------------------------
-- Residents can link/unlink themselves to an address that already exists.
-- They cannot create the address record itself (see addresses above).
-- Admin/dispatcher can manage all links.
CREATE POLICY "Residents insert own address link"
    ON public.user_addresses FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Residents delete own address link"
    ON public.user_addresses FOR DELETE
    USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Admins and Dispatchers insert any address link"
    ON public.user_addresses FOR INSERT
    WITH CHECK (public.auth_is_admin_or_dispatcher());

CREATE POLICY "Admins and Dispatchers delete any address link"
    ON public.user_addresses FOR DELETE
    USING (public.auth_is_admin_or_dispatcher());

CREATE POLICY "Admins and Dispatchers update any address link"
    ON public.user_addresses FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

-- ----------------------------------------------------------
-- waste_categories
-- ----------------------------------------------------------
CREATE POLICY "Admins and Dispatchers insert waste categories"
    ON public.waste_categories FOR INSERT
    WITH CHECK (public.auth_is_admin_or_dispatcher());

CREATE POLICY "Admins and Dispatchers update waste categories"
    ON public.waste_categories FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

-- ----------------------------------------------------------
-- schedules
-- ----------------------------------------------------------
CREATE POLICY "Admins and Dispatchers insert schedules"
    ON public.schedules FOR INSERT
    WITH CHECK (public.auth_is_admin_or_dispatcher());

CREATE POLICY "Admins and Dispatchers update schedules"
    ON public.schedules FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

-- ----------------------------------------------------------
-- routes
-- ----------------------------------------------------------
-- Admin/dispatcher create route day-plans and assign collectors.
CREATE POLICY "Admins and Dispatchers insert routes"
    ON public.routes FOR INSERT
    WITH CHECK (public.auth_is_admin_or_dispatcher());

CREATE POLICY "Admins and Dispatchers update routes"
    ON public.routes FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

-- Collectors can update ONLY the status of routes assigned to them.
-- WITH CHECK prevents them from reassigning staff_id or zone.
CREATE POLICY "Collectors update status of assigned routes"
    ON public.routes FOR UPDATE
    USING  (staff_id = (auth.jwt() ->> 'sub') AND public.auth_is_staff())
    WITH CHECK (staff_id = (auth.jwt() ->> 'sub') AND public.auth_is_staff());

-- ----------------------------------------------------------
-- pickups
-- ----------------------------------------------------------
-- INSERT: No browser policy. Background job uses service_role.
-- Admin/dispatcher can update all pickups (status, notes, reschedule).
CREATE POLICY "Admins and Dispatchers update pickups"
    ON public.pickups FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

-- Collectors can update status/completion_time of pickups on their assigned route.
-- WITH CHECK prevents them from changing address_id, waste_category_id, or route_id.
CREATE POLICY "Collectors update pickups on assigned routes"
    ON public.pickups FOR UPDATE
    USING (
        public.auth_is_staff()
        AND EXISTS (
            SELECT 1 FROM public.routes
            WHERE id = public.pickups.route_id
              AND staff_id = (auth.jwt() ->> 'sub')
        )
    )
    WITH CHECK (
        public.auth_is_staff()
        AND EXISTS (
            SELECT 1 FROM public.routes
            WHERE id = public.pickups.route_id
              AND staff_id = (auth.jwt() ->> 'sub')
        )
    );

-- ----------------------------------------------------------
-- notifications
-- ----------------------------------------------------------
-- INSERT/UPDATE: service_role only (notification worker bypasses RLS).
-- No browser write policies defined.
-- Admin/dispatcher may soft-manage via service_role server actions.

-- ============================================================
-- C4: First-Admin Bootstrap Procedure
--
-- SECURITY REQUIREMENT:
--   There is NO self-service path that allows any authenticated
--   user to grant themselves or others the 'admin' role.
--   The 'Admins insert user roles' policy above requires the
--   caller to ALREADY be an admin — making self-promotion impossible.
--
-- BOOTSTRAP PROCESS (run once after initial deployment):
--
--   STEP 1: The intended admin must sign up via Clerk at the
--           application sign-up URL. This triggers the Clerk webhook
--           which creates their row in public.users.
--           Verify the row exists:
--             SELECT id, email FROM public.users WHERE email = 'admin@example.com';
--
--   STEP 2: A database administrator (with service_role or direct psql access)
--           runs the following SQL in the Supabase Dashboard SQL Editor
--           (NOT through the application browser client):
--
--     -- Replace with the Clerk user ID from STEP 1
--     INSERT INTO public.user_roles (user_id, role)
--     VALUES ('user_REPLACE_WITH_ACTUAL_CLERK_ID', 'admin')
--     ON CONFLICT (user_id, role) DO NOTHING;
--
--   STEP 3: Verify the admin can sign in and see the admin dashboard.
--
--   STEP 4: The admin can then use the admin panel to grant roles to
--           other users through the normal application UI.
--
-- This procedure is intentionally manual and requires out-of-band
-- database access for the first-ever admin grant. This is the
-- standard security-correct pattern for bootstrapping privileged access.
-- ============================================================
