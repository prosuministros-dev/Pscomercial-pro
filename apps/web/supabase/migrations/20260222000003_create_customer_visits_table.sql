-- 1. Create customer_visits table
CREATE TABLE IF NOT EXISTS public.customer_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  advisor_id uuid NOT NULL REFERENCES public.profiles(id),
  visit_date timestamptz NOT NULL,
  visit_type varchar(20) NOT NULL CHECK (visit_type IN ('presencial', 'virtual', 'telefonica')),
  status varchar(20) NOT NULL DEFAULT 'realizada' CHECK (status IN ('programada', 'realizada', 'cancelada')),
  observations text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_customer_visits_org ON public.customer_visits(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer ON public.customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_advisor ON public.customer_visits(advisor_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_date ON public.customer_visits(visit_date DESC);

-- 3. RLS
ALTER TABLE public.customer_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read visits from their org"
  ON public.customer_visits FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert visits for their org"
  ON public.customer_visits FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update visits from their org"
  ON public.customer_visits FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete visits from their org"
  ON public.customer_visits FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 4. Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_visits TO authenticated;

-- 5. Add last_interaction_at to customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz;

-- 6. Create visits permissions
INSERT INTO public.permissions (id, module, action, slug, description)
VALUES
  (gen_random_uuid(), 'visits', 'read', 'visits:read', 'Ver visitas de clientes'),
  (gen_random_uuid(), 'visits', 'create', 'visits:create', 'Registrar visitas a clientes'),
  (gen_random_uuid(), 'visits', 'read_all', 'visits:read_all', 'Ver todas las visitas (no solo las propias)')
ON CONFLICT (slug) DO NOTHING;

-- 7. Assign visits permissions to roles that have customers:read
INSERT INTO public.role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), rp.role_id, p.id
FROM public.permissions p
CROSS JOIN (
  SELECT DISTINCT rp2.role_id
  FROM public.role_permissions rp2
  JOIN public.permissions p2 ON p2.id = rp2.permission_id
  WHERE p2.slug = 'customers:read'
) rp
WHERE p.slug IN ('visits:read', 'visits:create', 'visits:read_all')
ON CONFLICT DO NOTHING;

-- 8. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
