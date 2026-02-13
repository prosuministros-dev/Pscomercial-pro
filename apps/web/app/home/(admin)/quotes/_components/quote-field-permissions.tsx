'use client';

/**
 * Field-level permission configuration for quotes module
 * Maps permission slugs to field visibility/editability
 *
 * Based on the CONSOLIDADO matrix:
 * - Asesor Comercial: Can see/edit basic fields, cannot see margins/costs
 * - Gerente Comercial: Can see/edit all fields including margins
 * - Financiera: Can only edit credit_blocked field
 * - Admin: Full access
 */

export type FieldPermission = 'hidden' | 'readonly' | 'editable';

export interface QuoteFieldPermissions {
  customer_id: FieldPermission;
  contact_id: FieldPermission;
  quote_date: FieldPermission;
  validity_days: FieldPermission;
  status: FieldPermission;
  currency: FieldPermission;
  payment_terms: FieldPermission;
  transport_cost: FieldPermission;
  transport_included: FieldPermission;
  notes: FieldPermission;
  // Margin fields - restricted
  margin_pct: FieldPermission;
  cost_price: FieldPermission;
  // Credit block - Financiera only
  credit_blocked: FieldPermission;
  credit_block_reason: FieldPermission;
  // Closing dates
  estimated_close_month: FieldPermission;
  estimated_close_week: FieldPermission;
  estimated_billing_date: FieldPermission;
}

const ROLE_PERMISSIONS: Record<string, QuoteFieldPermissions> = {
  super_admin: {
    customer_id: 'editable',
    contact_id: 'editable',
    quote_date: 'editable',
    validity_days: 'editable',
    status: 'editable',
    currency: 'editable',
    payment_terms: 'editable',
    transport_cost: 'editable',
    transport_included: 'editable',
    notes: 'editable',
    margin_pct: 'editable',
    cost_price: 'editable',
    credit_blocked: 'editable',
    credit_block_reason: 'editable',
    estimated_close_month: 'editable',
    estimated_close_week: 'editable',
    estimated_billing_date: 'editable',
  },
  gerente_comercial: {
    customer_id: 'editable',
    contact_id: 'editable',
    quote_date: 'editable',
    validity_days: 'editable',
    status: 'editable',
    currency: 'editable',
    payment_terms: 'editable',
    transport_cost: 'editable',
    transport_included: 'editable',
    notes: 'editable',
    margin_pct: 'editable',
    cost_price: 'editable',
    credit_blocked: 'readonly',
    credit_block_reason: 'readonly',
    estimated_close_month: 'editable',
    estimated_close_week: 'editable',
    estimated_billing_date: 'editable',
  },
  asesor_comercial: {
    customer_id: 'editable',
    contact_id: 'editable',
    quote_date: 'readonly',
    validity_days: 'editable',
    status: 'readonly',
    currency: 'editable',
    payment_terms: 'editable',
    transport_cost: 'editable',
    transport_included: 'editable',
    notes: 'editable',
    margin_pct: 'hidden',
    cost_price: 'hidden',
    credit_blocked: 'readonly',
    credit_block_reason: 'readonly',
    estimated_close_month: 'editable',
    estimated_close_week: 'editable',
    estimated_billing_date: 'editable',
  },
  finanzas: {
    customer_id: 'readonly',
    contact_id: 'readonly',
    quote_date: 'readonly',
    validity_days: 'readonly',
    status: 'readonly',
    currency: 'readonly',
    payment_terms: 'readonly',
    transport_cost: 'readonly',
    transport_included: 'readonly',
    notes: 'readonly',
    margin_pct: 'readonly',
    cost_price: 'readonly',
    credit_blocked: 'editable',
    credit_block_reason: 'editable',
    estimated_close_month: 'readonly',
    estimated_close_week: 'readonly',
    estimated_billing_date: 'readonly',
  },
};

// Default permissions for any unlisted role
const DEFAULT_PERMISSIONS: QuoteFieldPermissions = {
  customer_id: 'readonly',
  contact_id: 'readonly',
  quote_date: 'readonly',
  validity_days: 'readonly',
  status: 'readonly',
  currency: 'readonly',
  payment_terms: 'readonly',
  transport_cost: 'readonly',
  transport_included: 'readonly',
  notes: 'readonly',
  margin_pct: 'hidden',
  cost_price: 'hidden',
  credit_blocked: 'readonly',
  credit_block_reason: 'readonly',
  estimated_close_month: 'readonly',
  estimated_close_week: 'readonly',
  estimated_billing_date: 'readonly',
};

export function getQuoteFieldPermissions(userRole: string): QuoteFieldPermissions {
  return ROLE_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS;
}

export function isFieldVisible(permissions: QuoteFieldPermissions, field: keyof QuoteFieldPermissions): boolean {
  return permissions[field] !== 'hidden';
}

export function isFieldEditable(permissions: QuoteFieldPermissions, field: keyof QuoteFieldPermissions): boolean {
  return permissions[field] === 'editable';
}
