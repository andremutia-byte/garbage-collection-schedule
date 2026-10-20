-- Migration: 20261020000000_barangays_and_schedules.sql
-- Description:
-- 1. Create public.barangays table (id, name, created_at, updated_at)
-- 2. Seed all 86 official barangays of Butuan City
-- 3. Add barangay_id to public.addresses (nullable, FK)
-- 4. Add barangay_id to public.schedules (nullable, FK - NULL means city-wide / applies to all barangays)
-- 5. Enable RLS: public read for barangays and schedules; admin-only write

-- 1. Create barangays table
CREATE TABLE IF NOT EXISTS public.barangays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS on barangays
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;

-- Anyone can read barangays
DROP POLICY IF EXISTS "Allow public read access on barangays" ON public.barangays;
CREATE POLICY "Allow public read access on barangays"
    ON public.barangays FOR SELECT
    USING (true);

-- Only admins can write (insert, update, delete) to barangays
DROP POLICY IF EXISTS "Admins insert barangays" ON public.barangays;
CREATE POLICY "Admins insert barangays"
    ON public.barangays FOR INSERT
    WITH CHECK (public.auth_is_admin());

DROP POLICY IF EXISTS "Admins update barangays" ON public.barangays;
CREATE POLICY "Admins update barangays"
    ON public.barangays FOR UPDATE
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

DROP POLICY IF EXISTS "Admins delete barangays" ON public.barangays;
CREATE POLICY "Admins delete barangays"
    ON public.barangays FOR DELETE
    USING (public.auth_is_admin());

-- 3. Seed all 86 official barangays of Butuan City
INSERT INTO public.barangays (name)
VALUES
    ('Agao (Poblacion)'),
    ('Agusan Pequeño'),
    ('Ambago'),
    ('Amparo'),
    ('Ampayon'),
    ('Anticala'),
    ('Antongalon'),
    ('Aupagan'),
    ('Baan Km 3'),
    ('Baan Riverside (Poblacion)'),
    ('Babag'),
    ('Bading (Poblacion)'),
    ('Bancasi'),
    ('Banza'),
    ('Baobaoan'),
    ('Basag'),
    ('Bayanihan (Poblacion)'),
    ('Bilay'),
    ('Bitan-agan'),
    ('Bit-os'),
    ('Bobon'),
    ('Bonbon'),
    ('Bugabus'),
    ('Bugsukan'),
    ('Buhangin (Poblacion)'),
    ('Cabcabon'),
    ('Camayahan'),
    ('Dagohoy (Poblacion)'),
    ('Dankias'),
    ('De Oro'),
    ('Diego Silang (Poblacion)'),
    ('Don Francisco'),
    ('Doongan'),
    ('Dulag'),
    ('Dumalagan'),
    ('Florida'),
    ('Golden Ribbon (Poblacion)'),
    ('Holy Redeemer (Poblacion)'),
    ('Humabon (Poblacion)'),
    ('Imadejas (Poblacion)'),
    ('Jose Rizal (Poblacion)'),
    ('Kinamlutan'),
    ('Lapu-Lapu (Poblacion)'),
    ('Lemon'),
    ('Leon Kilat (Poblacion)'),
    ('Libertad'),
    ('Limaha (Poblacion)'),
    ('Los Angeles'),
    ('Lumbocan'),
    ('Maguinda'),
    ('Mahay'),
    ('Mahogany (Poblacion)'),
    ('Maibu'),
    ('Mandamo'),
    ('Manila de Bugabus'),
    ('Maon (Poblacion)'),
    ('Masao'),
    ('Maug'),
    ('New Society Village (Poblacion)'),
    ('Nong-nong'),
    ('Obrero (Poblacion)'),
    ('Ong Yiu (Poblacion)'),
    ('Pagatpatan'),
    ('Pangabugan'),
    ('Pianing'),
    ('Pigdaulan'),
    ('Pinamanculan'),
    ('Port Poyohon (Poblacion)'),
    ('Rajah Soliman (Poblacion)'),
    ('Salvacion'),
    ('San Ignacio (Poblacion)'),
    ('San Mateo'),
    ('San Vicente'),
    ('Santo Niño'),
    ('Sikatuna (Poblacion)'),
    ('Silongan (Poblacion)'),
    ('Sumile'),
    ('Sumilihon'),
    ('Tagabaca'),
    ('Taguibo'),
    ('Taligaman'),
    ('Tandang Sora (Poblacion)'),
    ('Tiniwisan'),
    ('Tungao'),
    ('Urduja (Poblacion)'),
    ('Villa Kananga')
ON CONFLICT (name) DO NOTHING;

-- 4. Add barangay_id to addresses
ALTER TABLE public.addresses
    ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_addresses_barangay_id
    ON public.addresses (barangay_id);

-- 5. Add barangay_id to schedules (NULL means city-wide / applies to all barangays)
ALTER TABLE public.schedules
    ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_schedules_barangay_id
    ON public.schedules (barangay_id);

-- 6. Ensure RLS on schedules: anyone can read, only admins/dispatchers can write
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow public read access on schedules" ON public.schedules;
CREATE POLICY "Allow public read access on schedules"
    ON public.schedules FOR SELECT
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins and Dispatchers insert schedules" ON public.schedules;
CREATE POLICY "Admins and Dispatchers insert schedules"
    ON public.schedules FOR INSERT
    WITH CHECK (public.auth_is_admin_or_dispatcher());

DROP POLICY IF EXISTS "Admins and Dispatchers update schedules" ON public.schedules;
CREATE POLICY "Admins and Dispatchers update schedules"
    ON public.schedules FOR UPDATE
    USING (public.auth_is_admin_or_dispatcher())
    WITH CHECK (public.auth_is_admin_or_dispatcher());

DROP POLICY IF EXISTS "Admins and Dispatchers delete schedules" ON public.schedules;
CREATE POLICY "Admins and Dispatchers delete schedules"
    ON public.schedules FOR DELETE
    USING (public.auth_is_admin_or_dispatcher());
