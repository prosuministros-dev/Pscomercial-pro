/**
 * Pscomercial-pro Shared Formatters
 * Reference: FASE-06 - Centralized formatting functions
 */

/**
 * Format a number as Colombian Pesos (COP)
 */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as US Dollars (USD)
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a date in Colombian locale (dd/mm/yyyy)
 */
export function formatDateCO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date with time in Colombian locale
 */
export function formatDateTimeCO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with thousands separator (Colombian style)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

/**
 * Format a NIT (Colombian tax ID) with verification digit
 * Input: "900123456" → Output: "900.123.456"
 */
export function formatNIT(nit: string): string {
  const clean = nit.replace(/\D/g, '');

  if (clean.length < 4) return clean;

  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format a phone number for display
 * Input: "3001234567" → Output: "300 123 4567"
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');

  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }

  return phone;
}

/**
 * Translate a status slug to a human-readable Spanish label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    // Lead statuses (chk_lead_status)
    created: 'Creado',
    pending_assignment: 'Pendiente Asignación',
    assigned: 'Asignado',
    converted: 'Convertido',
    rejected: 'Rechazado',
    pending_info: 'Pendiente Info',
    // Quote statuses (chk_quote_status)
    draft: 'Borrador',
    offer_created: 'Oferta Creada',
    negotiation: 'Negociación',
    risk: 'Riesgo',
    pending_oc: 'Pendiente OC',
    approved: 'Aprobada',
    lost: 'Perdida',
    expired: 'Vencida',
    // Order statuses (chk_order_status)
    payment_pending: 'Pago Pendiente',
    payment_confirmed: 'Pago Confirmado',
    available_for_purchase: 'Disponible para Compra',
    in_purchase: 'En Compra',
    partial_delivery: 'Entrega Parcial',
    in_logistics: 'En Logística',
    delivered: 'Entregado',
    invoiced: 'Facturado',
    completed: 'Completado',
    cancelled: 'Cancelado',
    // PO statuses (chk_po_status)
    sent: 'Enviada',
    confirmed: 'Confirmada',
    partial_received: 'Recibido Parcial',
    received: 'Recibido',
    // Shipment statuses (chk_shipment_status)
    preparing: 'En Preparación',
    dispatched: 'Despachado',
    in_transit: 'En Tránsito',
    returned: 'Devuelto',
    // Invoice statuses (chk_invoice_status)
    pending: 'Pendiente',
    paid: 'Pagada',
    partial: 'Pago Parcial',
    overdue: 'Vencida',
    // Generic
    active: 'Activo',
    inactive: 'Inactivo',
  };

  return labels[status] ?? status;
}

/**
 * Get a CSS color class for a status badge
 */
export function getStatusColor(status: string): string {
  const green =
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  const yellow =
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  const orange =
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
  const red =
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  const blue =
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  const purple =
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
  const gray =
    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';

  const colors: Record<string, string> = {
    // Positive / complete
    approved: green,
    completed: green,
    paid: green,
    delivered: green,
    received: green,
    active: green,
    converted: purple,
    invoiced: green,
    payment_confirmed: green,
    // In progress / warning
    assigned: blue,
    negotiation: yellow,
    in_purchase: yellow,
    partial_delivery: yellow,
    partial_received: yellow,
    partial: yellow,
    in_transit: yellow,
    in_logistics: yellow,
    risk: orange,
    overdue: orange,
    pending_info: yellow,
    pending_assignment: yellow,
    available_for_purchase: yellow,
    preparing: yellow,
    // Negative
    lost: red,
    rejected: red,
    cancelled: red,
    returned: red,
    expired: red,
    inactive: red,
    // Neutral / initial
    created: blue,
    draft: gray,
    sent: blue,
    confirmed: blue,
    pending: gray,
    payment_pending: gray,
    pending_oc: gray,
    offer_created: blue,
    dispatched: blue,
  };

  return colors[status] ?? gray;
}
