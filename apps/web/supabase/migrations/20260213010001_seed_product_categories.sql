-- Migration: Seed Product Categories (Verticales)
-- Date: 2026-02-13
-- Description: Insert default product categories for all organizations
-- Categories: ACCESORIOS, HARDWARE, OTROS, SERVICIOS, SOFTWARE

-- Insert default categories for all organizations
INSERT INTO product_categories (organization_id, name, slug, level, is_active, created_at, updated_at)
SELECT
  o.id as organization_id,
  category.name,
  category.slug,
  0 as level,
  true as is_active,
  now() as created_at,
  now() as updated_at
FROM organizations o
CROSS JOIN (
  VALUES
    ('ACCESORIOS', 'accesorios'),
    ('HARDWARE', 'hardware'),
    ('OTROS', 'otros'),
    ('SERVICIOS', 'servicios'),
    ('SOFTWARE', 'software')
) AS category(name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM product_categories pc
  WHERE pc.organization_id = o.id
  AND pc.slug = category.slug
);

-- Verify insertion
DO $$
DECLARE
  org_count integer;
  category_count integer;
  expected_count integer;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO category_count FROM product_categories;
  expected_count := org_count * 5; -- 5 categories per organization

  RAISE NOTICE 'Organizations: %, Categories inserted: %, Expected: %',
    org_count, category_count, expected_count;

  IF category_count < expected_count THEN
    RAISE WARNING 'Some categories may not have been inserted. Check for duplicates or conflicts.';
  END IF;
END $$;

COMMENT ON TABLE product_categories IS 'Product categories (verticales): ACCESORIOS, HARDWARE, OTROS, SERVICIOS, SOFTWARE';
