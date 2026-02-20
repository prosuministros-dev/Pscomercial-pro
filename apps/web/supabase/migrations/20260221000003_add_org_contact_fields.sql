-- Add contact/address fields to organizations for PDF generation
-- PDF templates (quote, proforma, order) need these fields for header

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tax_id varchar(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city varchar(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone varchar(30);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email varchar(255);

-- Copy nit to tax_id for existing orgs (nit is the Colombian tax ID)
UPDATE organizations SET tax_id = nit WHERE tax_id IS NULL;

-- Seed contact info for test org
UPDATE organizations SET
  address = 'Cra 15 #93-47 Of. 501',
  city = 'Bogotá',
  phone = '+571234567890',
  email = 'info@prosuministros.com'
WHERE id = 'bee5aac6-a830-4857-b608-25b1985c8d82';
