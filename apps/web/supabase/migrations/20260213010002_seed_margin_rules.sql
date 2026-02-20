-- Migration: Seed Margin Rules
-- Date: 2026-02-13
-- Description: Insert default margin rules for all organizations and categories
-- Source: CONSOLIDADO-DOCUMENTOS-GENERALES sec. 1.5
-- Matrix: 5 categories × 7 payment types = 35 rules per organization

-- Payment type mapping:
-- ANTICIPADO, CONTRA ENTREGA → 'anticipated'
-- CRÉDITO 8/15/30 DÍAS → 'credit_30'
-- CRÉDITO 45 DÍAS → 'credit_45' (if exists) or 'credit_60'
-- CRÉDITO 60 DÍAS → 'credit_60'
-- CRÉDITO 90 DÍAS → 'credit_90' (if exists)

-- Margin rules matrix:
-- | Forma de Pago       | Accesorios | Hardware | Otros | Servicios | Software |
-- | ANTICIPADO          |     7%     |    7%    |   7%  |     7%    |    5%    |
-- | CONTRA ENTREGA      |     7%     |    7%    |   7%  |     7%    |    5%    |
-- | CRÉDITO 8 DÍAS      |     7%     |    7%    |   7%  |     7%    |    5%    |
-- | CRÉDITO 15 DÍAS     |     7%     |    7%    |   7%  |     7%    |    5%    |
-- | CRÉDITO 30 DÍAS     |     7%     |    7%    |   7%  |     7%    |    5%    |
-- | CRÉDITO 45 DÍAS     |     9%     |    9%    |   9%  |     9%    |    7%    |
-- | CRÉDITO 60 DÍAS     |    11%     |   11%    |  11%  |    11%    |    9%    |

-- Insert margin rules for all organizations and categories
INSERT INTO margin_rules (
  organization_id,
  category_id,
  payment_type,
  min_margin_pct,
  target_margin_pct,
  max_discount_pct,
  requires_approval_below,
  approval_role_slug,
  is_active,
  effective_from,
  created_at,
  updated_at
)
SELECT
  pc.organization_id,
  pc.id as category_id,
  rule.payment_type,
  rule.min_margin_pct,
  rule.target_margin_pct,
  5.00 as max_discount_pct, -- Default 5% max discount
  rule.min_margin_pct as requires_approval_below,
  'gerente_comercial' as approval_role_slug,
  true as is_active,
  CURRENT_DATE as effective_from,
  now() as created_at,
  now() as updated_at
FROM product_categories pc
CROSS JOIN (
  -- ACCESORIOS rules
  SELECT 'accesorios' as category_slug, 'anticipated' as payment_type, 7.00 as min_margin_pct, 10.00 as target_margin_pct
  UNION ALL
  SELECT 'accesorios', 'credit_30', 7.00, 10.00
  UNION ALL
  SELECT 'accesorios', 'credit_60', 11.00, 15.00

  -- HARDWARE rules
  UNION ALL
  SELECT 'hardware', 'anticipated', 7.00, 10.00
  UNION ALL
  SELECT 'hardware', 'credit_30', 7.00, 10.00
  UNION ALL
  SELECT 'hardware', 'credit_60', 11.00, 15.00

  -- OTROS rules
  UNION ALL
  SELECT 'otros', 'anticipated', 7.00, 10.00
  UNION ALL
  SELECT 'otros', 'credit_30', 7.00, 10.00
  UNION ALL
  SELECT 'otros', 'credit_60', 11.00, 15.00

  -- SERVICIOS rules
  UNION ALL
  SELECT 'servicios', 'anticipated', 7.00, 10.00
  UNION ALL
  SELECT 'servicios', 'credit_30', 7.00, 10.00
  UNION ALL
  SELECT 'servicios', 'credit_60', 11.00, 15.00

  -- SOFTWARE rules
  UNION ALL
  SELECT 'software', 'anticipated', 5.00, 8.00
  UNION ALL
  SELECT 'software', 'credit_30', 5.00, 8.00
  UNION ALL
  SELECT 'software', 'credit_60', 9.00, 12.00
) AS rule
WHERE pc.slug = rule.category_slug
AND pc.level = 0
AND NOT EXISTS (
  SELECT 1 FROM margin_rules mr
  WHERE mr.organization_id = pc.organization_id
  AND mr.category_id = pc.id
  AND mr.payment_type = rule.payment_type
  AND mr.is_active = true
);

-- Verify insertion
DO $$
DECLARE
  org_count integer;
  category_count integer;
  rule_count integer;
  expected_rules integer;
BEGIN
  SELECT COUNT(DISTINCT organization_id) INTO org_count FROM product_categories;
  SELECT COUNT(*) INTO category_count FROM product_categories WHERE level = 0;
  SELECT COUNT(*) INTO rule_count FROM margin_rules;

  -- Expected: organizations * 5 categories * 3 payment types = org_count * 15
  expected_rules := org_count * 15;

  RAISE NOTICE 'Organizations: %, Root Categories: %, Margin Rules: %, Expected: %',
    org_count, category_count, rule_count, expected_rules;

  IF rule_count < expected_rules THEN
    RAISE WARNING 'Some margin rules may not have been inserted. Check for duplicates or missing categories.';
  END IF;
END $$;

COMMENT ON TABLE margin_rules IS 'Margin rules by category and payment type. Min margins: 5-11% depending on category and payment terms.';
