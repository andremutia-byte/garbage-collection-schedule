-- ==========================================
-- 0. Setup & Enums
-- ==========================================
CREATE TYPE user_role AS ENUM ('admin', 'dispatcher', 'collector', 'resident');
CREATE TYPE notification_pref AS ENUM ('email', 'sms', 'push', 'none');
CREATE TYPE schedule_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'custom');
CREATE TYPE route_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE pickup_status AS ENUM ('scheduled', 'completed', 'missed', 'skipped');
CREATE TYPE notification_type AS ENUM ('reminder', 'delay', 'missed', 'general');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

-- ==========================================
-- 1. Users & Roles (Tied to Clerk)
-- ==========================================
-- Clerk IDs are TEXT (e.g., 'user_2xyz...')
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Users can have multiple roles via composite PK (user_id, role)
CREATE TABLE public.user_roles (
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE public.resident_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    phone TEXT,
    notification_preference notification_pref NOT NULL DEFAULT 'email',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(user_id)
);

-- ==========================================
-- 2. Locations & Zones
-- ==========================================
CREATE TABLE public.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    -- If a zone is deleted, RESTRICT protects the addresses assigned to it
    zone_id UUID REFERENCES public.zones(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(street, city, postal_code)
);

-- Pivot table: Many-to-many users <-> addresses
CREATE TABLE public.user_addresses (
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    address_id UUID NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    relationship TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, address_id)
);

-- ==========================================
-- 3. Waste Types & Schedules
-- ==========================================
CREATE TABLE public.waste_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color_code TEXT, 
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The recurring rule
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE RESTRICT,
    waste_category_id UUID NOT NULL REFERENCES public.waste_categories(id) ON DELETE RESTRICT,
    frequency schedule_frequency NOT NULL DEFAULT 'weekly',
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ==========================================
-- 4. Operations (Routes & Pickups)
-- ==========================================
CREATE TABLE public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE RESTRICT,
    staff_id TEXT REFERENCES public.users(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    status route_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- The materialized individual events
CREATE TABLE public.pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_id UUID NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
    waste_category_id UUID NOT NULL REFERENCES public.waste_categories(id) ON DELETE RESTRICT,
    route_id UUID REFERENCES public.routes(id) ON DELETE RESTRICT,
    scheduled_date DATE NOT NULL,
    status pickup_status NOT NULL DEFAULT 'scheduled',
    completion_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    -- Prevent duplicate pickups for the same address, date, and waste type
    UNIQUE(address_id, scheduled_date, waste_category_id)
);

-- ==========================================
-- 5. Notifications
-- ==========================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    pickup_id UUID REFERENCES public.pickups(id) ON DELETE RESTRICT,
    type notification_type NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 6. Indexes
-- ==========================================
CREATE INDEX idx_pickups_scheduled_date ON public.pickups(scheduled_date);
CREATE INDEX idx_pickups_address_id ON public.pickups(address_id);
CREATE INDEX idx_pickups_route_id ON public.pickups(route_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_schedules_zone_id ON public.schedules(zone_id);
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX idx_user_addresses_address_id ON public.user_addresses(address_id);

-- ==========================================
-- 7. RLS Security Definer Functions
-- ==========================================
-- Uses (auth.jwt() ->> 'sub') to correctly extract the Clerk TEXT ID
CREATE OR REPLACE FUNCTION public.auth_is_admin_or_dispatcher()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = (auth.jwt() ->> 'sub') AND role IN ('admin', 'dispatcher')
    );
$$;

CREATE OR REPLACE FUNCTION public.auth_is_staff()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = (auth.jwt() ->> 'sub') AND role IN ('admin', 'dispatcher', 'collector')
    );
$$;

-- ==========================================
-- 8. Basic RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Admins and Dispatchers read all users" ON public.users FOR SELECT USING (public.auth_is_admin_or_dispatcher());
CREATE POLICY "Users read own user record" ON public.users FOR SELECT USING ((auth.jwt() ->> 'sub') = id);

-- user_roles
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Admins and Dispatchers read all roles" ON public.user_roles FOR SELECT USING (public.auth_is_admin_or_dispatcher());

-- resident_profiles
CREATE POLICY "Users read own profile" ON public.resident_profiles FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Staff read all profiles" ON public.resident_profiles FOR SELECT USING (public.auth_is_staff());

-- addresses
CREATE POLICY "Residents read linked addresses" ON public.addresses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_addresses WHERE address_id = public.addresses.id AND user_id = (auth.jwt() ->> 'sub'))
);
CREATE POLICY "Staff read all addresses" ON public.addresses FOR SELECT USING (public.auth_is_staff());

-- user_addresses
CREATE POLICY "Users read own address links" ON public.user_addresses FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Staff read all address links" ON public.user_addresses FOR SELECT USING (public.auth_is_staff());

-- zones, waste_categories, schedules
CREATE POLICY "Public read access to zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Public read access to categories" ON public.waste_categories FOR SELECT USING (true);
CREATE POLICY "Public read access to schedules" ON public.schedules FOR SELECT USING (true);

-- routes
CREATE POLICY "Collectors read assigned routes" ON public.routes FOR SELECT USING (staff_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Admins and Dispatchers read all routes" ON public.routes FOR SELECT USING (public.auth_is_admin_or_dispatcher());

-- pickups
CREATE POLICY "Residents read pickups for their addresses" ON public.pickups FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_addresses WHERE address_id = public.pickups.address_id AND user_id = (auth.jwt() ->> 'sub'))
);
CREATE POLICY "Collectors read pickups on assigned routes" ON public.pickups FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.routes WHERE id = public.pickups.route_id AND staff_id = (auth.jwt() ->> 'sub'))
);
CREATE POLICY "Admins and Dispatchers read all pickups" ON public.pickups FOR SELECT USING (public.auth_is_admin_or_dispatcher());

-- notifications
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Admins and Dispatchers read all notifications" ON public.notifications FOR SELECT USING (public.auth_is_admin_or_dispatcher());
