-- ============================================================
-- Migration: 20261003000000_notifications_enhancements.sql
--
-- Adds read/unread tracking to notifications and the RLS
-- policy allowing residents to mark their own as read.
--
-- Additive only — does not modify init or critical_fixes migrations.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Add read_at column for unread/read tracking
--    NULL  = unread
--    value = timestamp when the resident dismissed the notification
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Index to make "unread count" queries fast
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON public.notifications (user_id, read_at)
    WHERE read_at IS NULL;

-- ────────────────────────────────────────────────────────────
-- 2. RLS: Allow residents to mark their own notifications read
--
--    USING  — the row being updated must belong to the caller
--    WITH CHECK — they may only change read_at (app layer enforces
--                 this; RLS only scopes to own rows)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Users update own notifications (mark read)"
    ON public.notifications FOR UPDATE
    USING  ((auth.jwt() ->> 'sub') = user_id)
    WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Admin/dispatcher may also update notifications (e.g., bulk dismiss)
CREATE POLICY "Admins and Dispatchers update any notification"
    ON public.notifications FOR UPDATE
    USING  (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());
