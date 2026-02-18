
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'tenant');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'overdue');

-- Create maintenance status enum
CREATE TYPE public.maintenance_status AS ENUM ('pending', 'in_progress', 'completed');

-- =====================
-- PROFILES TABLE
-- =====================
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================
-- USER ROLES TABLE
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================
-- PROPERTIES TABLE
-- =====================
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  price NUMERIC(10, 2) NOT NULL,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sqft NUMERIC(10, 2),
  property_type TEXT DEFAULT 'apartment',
  amenities TEXT[],
  images TEXT[],
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- =====================
-- RENTAL APPLICATIONS TABLE
-- =====================
CREATE TABLE public.rental_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  message TEXT,
  move_in_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- =====================
-- PAYMENTS TABLE
-- =====================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.rental_applications(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  month TEXT NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =====================
-- MAINTENANCE REQUESTS TABLE
-- =====================
CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status maintenance_status NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Check if current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- =====================
-- AUTO TIMESTAMP TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- AUTO CREATE PROFILE TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- RLS POLICIES: PROFILES
-- =====================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================
-- RLS POLICIES: USER_ROLES
-- =====================
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own role on signup" ON public.user_roles
  FOR INSERT WITH CHECK (user_id = auth.uid() AND role != 'admin');

-- =====================
-- RLS POLICIES: PROPERTIES
-- =====================
CREATE POLICY "Anyone can view available properties" ON public.properties
  FOR SELECT USING (is_available = true OR owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owners can insert properties" ON public.properties
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Owners can update own properties" ON public.properties
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owners can delete own properties" ON public.properties
  FOR DELETE USING (owner_id = auth.uid() OR public.is_admin());

-- =====================
-- RLS POLICIES: RENTAL_APPLICATIONS
-- =====================
CREATE POLICY "Tenants can view own applications" ON public.rental_applications
  FOR SELECT USING (
    tenant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Tenants can apply" ON public.rental_applications
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() AND public.has_role(auth.uid(), 'tenant')
  );

CREATE POLICY "Owners can update application status" ON public.rental_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Admin can delete applications" ON public.rental_applications
  FOR DELETE USING (public.is_admin() OR tenant_id = auth.uid());

-- =====================
-- RLS POLICIES: PAYMENTS
-- =====================
CREATE POLICY "Tenants and owners can view payments" ON public.payments
  FOR SELECT USING (
    tenant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rental_applications ra
      JOIN public.properties p ON ra.property_id = p.id
      WHERE ra.id = application_id AND p.owner_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Owners/Admin can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rental_applications ra
      JOIN public.properties p ON ra.property_id = p.id
      WHERE ra.id = application_id AND p.owner_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Owners/Admin can update payments" ON public.payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.rental_applications ra
      JOIN public.properties p ON ra.property_id = p.id
      WHERE ra.id = application_id AND p.owner_id = auth.uid()
    )
    OR public.is_admin()
  );

-- =====================
-- RLS POLICIES: MAINTENANCE_REQUESTS
-- =====================
CREATE POLICY "Tenants can view own requests" ON public.maintenance_requests
  FOR SELECT USING (
    tenant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Tenants can submit requests" ON public.maintenance_requests
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() AND public.has_role(auth.uid(), 'tenant')
  );

CREATE POLICY "Owners can update request status" ON public.maintenance_requests
  FOR UPDATE USING (
    tenant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Admin/Tenant can delete requests" ON public.maintenance_requests
  FOR DELETE USING (public.is_admin() OR tenant_id = auth.uid());
