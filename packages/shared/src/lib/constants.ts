/**
 * Pscomercial-pro Shared Constants
 * Reference: FASE-06 - Single source of truth for business constants
 * Values MUST match CHECK constraints in 20260212000001_business_schema.sql
 */

// Lead statuses (chk_lead_status)
export const LEAD_STATUSES = [
  'created',
  'pending_assignment',
  'assigned',
  'converted',
  'rejected',
  'pending_info',
] as const;

// Lead channels (chk_lead_channel)
export const LEAD_CHANNELS = ['whatsapp', 'web', 'manual'] as const;

// Quote statuses (chk_quote_status)
// Pipeline (4 Kanban columns): offer_created → negotiation → risk → pending_oc
// Terminal: converted, rejected, lost, expired
// Initial: draft
export const QUOTE_STATUSES = [
  'draft',
  'offer_created',
  'negotiation',
  'risk',
  'pending_oc',
  'converted',
  'rejected',
  'lost',
  'expired',
] as const;

// Order statuses (chk_order_status)
export const ORDER_STATUSES = [
  'created',
  'payment_pending',
  'payment_confirmed',
  'available_for_purchase',
  'in_purchase',
  'partial_delivery',
  'in_logistics',
  'delivered',
  'invoiced',
  'completed',
  'cancelled',
] as const;

// Purchase Order statuses (chk_po_status)
export const PURCHASE_ORDER_STATUSES = [
  'draft',
  'sent',
  'confirmed',
  'partial_received',
  'received',
  'cancelled',
] as const;

// Shipment statuses (chk_shipment_status)
export const SHIPMENT_STATUSES = [
  'preparing',
  'dispatched',
  'in_transit',
  'delivered',
  'returned',
] as const;

// Invoice statuses (chk_invoice_status)
export const INVOICE_STATUSES = [
  'pending',
  'paid',
  'partial',
  'overdue',
  'cancelled',
] as const;

// Payment types for margin rules (chk_payment_type)
export const PAYMENT_TYPES = [
  'anticipated',
  'credit_30',
  'credit_60',
  'credit_90',
] as const;

// Credit status (chk_credit_status)
export const CREDIT_STATUSES = [
  'pending',
  'approved',
  'blocked',
  'suspended',
] as const;

// Dispatch types (chk_dispatch_type)
export const DISPATCH_TYPES = ['envio', 'retiro', 'mensajeria'] as const;

// Priority levels (chk_priority)
export const PRIORITY_LEVELS = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

// Traffic light (chk_traffic_light)
export const TRAFFIC_LIGHTS = ['green', 'yellow', 'red'] as const;

// Role slugs - must match seed data
export const ROLE_SLUGS = [
  'super_admin',
  'gerente_general',
  'director_comercial',
  'gerente_comercial',
  'gerente_operativo',
  'asesor_comercial',
  'finanzas',
  'compras',
  'logistica',
  'jefe_bodega',
  'auxiliar_bodega',
  'facturacion',
] as const;

// Product categories / Verticals (5 per spec, matches seed data)
export const PRODUCT_CATEGORIES = [
  'Software',
  'Hardware',
  'Accesorios',
  'Servicios',
  'Otros',
] as const;

// Consecutive entity types (chk_consecutive_entity_type)
export const CONSECUTIVE_ENTITY_TYPES = [
  'lead',
  'quote',
  'order',
  'purchase_order',
  'shipment',
  'invoice',
] as const;

// Navigation module permissions (matching permission slugs in DB)
export const MODULE_PERMISSIONS = {
  dashboard: 'dashboard:read',
  leads: 'leads:read',
  quotes: 'quotes:read',
  orders: 'orders:read',
  finance: 'billing:read',
  formats: 'reports:read',
  whatsapp: 'whatsapp:read',
  admin: 'admin:read',
} as const;

// Type exports
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadChannel = (typeof LEAD_CHANNELS)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentType = (typeof PAYMENT_TYPES)[number];
export type CreditStatus = (typeof CREDIT_STATUSES)[number];
export type DispatchType = (typeof DISPATCH_TYPES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
export type TrafficLight = (typeof TRAFFIC_LIGHTS)[number];
export type RoleSlug = (typeof ROLE_SLUGS)[number];
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ConsecutiveEntityType = (typeof CONSECUTIVE_ENTITY_TYPES)[number];
