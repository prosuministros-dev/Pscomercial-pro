-- BUG-012: Create lead_contacts table
-- API route /api/leads/[id]/contacts exists but table was never created

CREATE TABLE IF NOT EXISTS lead_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  position text,
  phone text,
  email text,
  is_primary boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead_id ON lead_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_org_id ON lead_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead_org ON lead_contacts(lead_id, organization_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_contacts_select" ON lead_contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "lead_contacts_insert" ON lead_contacts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "lead_contacts_update" ON lead_contacts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "lead_contacts_delete" ON lead_contacts
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Grant access to authenticated and service_role
GRANT ALL ON lead_contacts TO authenticated;
GRANT ALL ON lead_contacts TO service_role;
