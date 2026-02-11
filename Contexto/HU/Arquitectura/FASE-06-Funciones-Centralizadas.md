# FASE 6: Funciones y Métodos Centralizados (RPC, Helpers, Sin Duplicidad)

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Principio:** Una función, un lugar. Sin duplicación.

---

## 1. CATÁLOGO DE FUNCIONES SQL (RPC)

### 1.1 Funciones de Negocio Core

| # | Función | Tipo | Descripción | Llamada desde |
|---|---------|------|-------------|---------------|
| 1 | `get_next_consecutive(org_id, entity_type)` | VOLATILE | Genera consecutivos thread-safe | API: crear lead/quote/order/PO/shipment |
| 2 | `calculate_quote_margin(quote_id)` | STABLE | Calcula margen % de cotización | API: al guardar/actualizar cotización |
| 3 | `validate_credit_limit(customer_id, amount)` | STABLE | Valida cupo de crédito | API: al crear cotización/pedido |
| 4 | `get_user_permissions(user_id)` | STABLE | Retorna permisos del usuario | Frontend: al cargar sesión |
| 5 | `has_permission(user_id, slug)` | STABLE | Verifica permiso específico | API: en cada operación |
| 6 | `get_user_primary_role(user_id)` | STABLE | Retorna rol principal | RLS: para data scope |
| 7 | `get_dashboard_summary(org_id, user_id, from, to)` | STABLE | Métricas del dashboard | Frontend: dashboard page |
| 8 | `auto_assign_lead(lead_id)` | VOLATILE | Asignación balanceada de lead | Trigger: al crear lead |
| 9 | `get_order_traceability(order_id)` | STABLE | Trazabilidad completa del pedido | Frontend: detalle pedido |
| 10 | `get_product_route(order_item_id)` | STABLE | Ruta del producto (HU-00020) | Frontend: visualización ruta |
| 11 | `update_order_quantities(order_item_id)` | VOLATILE | Recalcula cantidades del pedido | Trigger: al actualizar PO/shipment |
| 12 | `get_operational_dashboard(org_id)` | STABLE | Tablero operativo con semáforo | Frontend: tablero operativo |
| 13 | `seed_organization_roles(org_id)` | VOLATILE | Inicializa roles para nueva org | API: al crear organización |
| 14 | `get_trm_today(org_id)` | STABLE | Obtiene TRM vigente | API: al crear cotización |
| 15 | `check_quote_expiration_alerts(org_id)` | STABLE | Cotizaciones próximas a vencer | Cron: diario |

### 1.2 Funciones Helper (Auth/RLS)

| # | Función | Schema | Descripción |
|---|---------|--------|-------------|
| 1 | `auth.get_user_org_id()` | auth | Obtiene org_id del usuario actual |
| 2 | `auth.is_org_admin()` | auth | Verifica si es admin/gerente |
| 3 | `auth.is_commercial_manager()` | auth | Verifica si es gerente comercial+ |
| 4 | `auth.has_perm(slug)` | auth | Verifica permiso específico (RLS) |

### 1.3 Triggers

| # | Trigger | Tabla(s) | Evento | Descripción |
|---|---------|----------|--------|-------------|
| 1 | `set_updated_at` | TODAS | BEFORE UPDATE | Actualiza `updated_at = now()` |
| 2 | `audit_trail_trigger` | Tablas de negocio | AFTER INSERT/UPDATE/DELETE | Registra en `audit_logs` |
| 3 | `auto_assign_lead_trigger` | leads | AFTER INSERT | Asigna lead automáticamente |
| 4 | `notify_on_assignment` | leads | AFTER UPDATE (assigned_to) | Crea notificación al asesor |
| 5 | `notify_on_mention` | comments | AFTER INSERT | Crea notificaciones para @menciones |
| 6 | `update_order_item_quantities` | purchase_order_items, shipment_items | AFTER UPDATE | Recalcula cantidades en order_items |
| 7 | `update_customer_credit` | invoices | AFTER UPDATE (status=paid) | Actualiza crédito disponible |
| 8 | `set_traffic_light` | order_pending_tasks | BEFORE INSERT/UPDATE | Calcula semáforo automáticamente |

---

## 2. FUNCIONES SQL DETALLADAS

### 2.1 Auto-asignación de Leads

```sql
CREATE OR REPLACE FUNCTION auto_assign_lead(p_lead_id uuid)
RETURNS uuid AS $$
DECLARE
  v_org_id uuid;
  v_assigned_to uuid;
  v_auto_assign boolean;
BEGIN
  -- Obtener org_id del lead
  SELECT organization_id INTO v_org_id FROM leads WHERE id = p_lead_id;

  -- Verificar si auto-assign está habilitado
  SELECT (value->>'enabled')::boolean INTO v_auto_assign
  FROM system_settings
  WHERE organization_id = v_org_id AND key = 'lead_auto_assign';

  IF NOT COALESCE(v_auto_assign, true) THEN
    RETURN NULL; -- No auto-asignar
  END IF;

  -- Seleccionar asesor con menos leads pendientes
  SELECT p.id INTO v_assigned_to
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  JOIN roles r ON r.id = ur.role_id
  WHERE p.organization_id = v_org_id
    AND p.is_active = true
    AND p.is_available = true
    AND r.slug = 'asesor_comercial'
    AND r.is_active = true
    AND (
      SELECT COUNT(*)
      FROM leads l
      WHERE l.assigned_to = p.id
        AND l.status IN ('assigned', 'pending_assignment')
    ) < p.max_pending_leads
  ORDER BY (
    SELECT COUNT(*)
    FROM leads l
    WHERE l.assigned_to = p.id
      AND l.status IN ('assigned', 'pending_assignment')
  ) ASC, random()
  LIMIT 1;

  IF v_assigned_to IS NOT NULL THEN
    UPDATE leads
    SET assigned_to = v_assigned_to,
        assigned_at = now(),
        status = 'assigned'
    WHERE id = p_lead_id;

    -- Registrar en bitácora
    INSERT INTO lead_assignments_log (organization_id, lead_id, to_user_id, assignment_type)
    VALUES (v_org_id, p_lead_id, v_assigned_to, 'automatic');

    -- Crear notificación
    INSERT INTO notifications (organization_id, user_id, type, title, message, entity_type, entity_id, action_url)
    SELECT v_org_id, v_assigned_to, 'lead_assigned',
      'Nuevo lead asignado: ' || l.business_name,
      'Lead #' || l.lead_number || ' - ' || l.contact_name || ' (' || l.channel || ')',
      'lead', p_lead_id,
      '/leads/' || p_lead_id
    FROM leads l WHERE l.id = p_lead_id;
  END IF;

  RETURN v_assigned_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 Trazabilidad de Pedido

```sql
CREATE OR REPLACE FUNCTION get_order_traceability(p_order_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'order', (
      SELECT jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'status', o.status,
        'total', o.total,
        'created_at', o.created_at
      ) FROM orders o WHERE o.id = p_order_id
    ),
    'quote', (
      SELECT jsonb_build_object(
        'id', q.id,
        'quote_number', q.quote_number,
        'lead_id', q.lead_id
      ) FROM quotes q
      JOIN orders o ON o.quote_id = q.id
      WHERE o.id = p_order_id
    ),
    'status_history', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'from_status', h.from_status,
          'to_status', h.to_status,
          'changed_by', p.full_name,
          'notes', h.notes,
          'date', h.created_at
        ) ORDER BY h.created_at
      )
      FROM order_status_history h
      LEFT JOIN profiles p ON p.id = h.changed_by
      WHERE h.order_id = p_order_id
    ),
    'items', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'sku', oi.sku,
          'description', oi.description,
          'quantity', oi.quantity,
          'quantity_purchased', oi.quantity_purchased,
          'quantity_received', oi.quantity_received,
          'quantity_dispatched', oi.quantity_dispatched,
          'quantity_delivered', oi.quantity_delivered,
          'status', oi.item_status,
          'is_license', oi.is_license,
          'route_events', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'event_type', pre.event_type,
                'event_date', pre.event_date,
                'location', pre.location,
                'quantity', pre.quantity,
                'performed_by', prp.full_name,
                'notes', pre.notes
              ) ORDER BY pre.event_date
            )
            FROM product_route_events pre
            LEFT JOIN profiles prp ON prp.id = pre.performed_by
            WHERE pre.order_item_id = oi.id
          )
        )
      )
      FROM order_items oi
      WHERE oi.order_id = p_order_id
    ),
    'purchase_orders', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', po.id,
          'po_number', po.po_number,
          'supplier', s.name,
          'status', po.status,
          'total', po.total,
          'expected_delivery', po.expected_delivery_date
        )
      )
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.order_id = p_order_id
    ),
    'shipments', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', sh.id,
          'shipment_number', sh.shipment_number,
          'status', sh.status,
          'carrier', sh.carrier,
          'tracking_number', sh.tracking_number,
          'dispatched_at', sh.dispatched_at,
          'delivered_at', sh.actual_delivery
        )
      )
      FROM shipments sh
      WHERE sh.order_id = p_order_id
    ),
    'invoices', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', inv.id,
          'invoice_number', inv.invoice_number,
          'total', inv.total,
          'status', inv.status,
          'invoice_date', inv.invoice_date
        )
      )
      FROM invoices inv
      WHERE inv.order_id = p_order_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 2.3 Tablero Operativo con Semáforo

```sql
CREATE OR REPLACE FUNCTION get_operational_dashboard(p_org_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'pending_tasks', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'red', COUNT(*) FILTER (WHERE traffic_light = 'red'),
        'yellow', COUNT(*) FILTER (WHERE traffic_light = 'yellow'),
        'green', COUNT(*) FILTER (WHERE traffic_light = 'green'),
        'by_type', jsonb_object_agg(task_type, cnt)
      )
      FROM (
        SELECT task_type, COUNT(*) as cnt, traffic_light
        FROM order_pending_tasks
        WHERE organization_id = p_org_id
          AND status IN ('pending', 'in_progress')
        GROUP BY task_type, traffic_light
      ) sq
    ),
    'orders_by_status', (
      SELECT jsonb_agg(
        jsonb_build_object('status', status, 'count', cnt, 'total_value', total_val)
      )
      FROM (
        SELECT status, COUNT(*) as cnt, SUM(total) as total_val
        FROM orders
        WHERE organization_id = p_org_id
          AND status NOT IN ('completed', 'cancelled')
        GROUP BY status
      ) sq
    ),
    'overdue_tasks', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'title', t.title,
          'task_type', t.task_type,
          'due_date', t.due_date,
          'order_number', o.order_number,
          'assigned_to', p.full_name,
          'days_overdue', EXTRACT(DAY FROM now() - t.due_date)
        )
      )
      FROM order_pending_tasks t
      JOIN orders o ON o.id = t.order_id
      LEFT JOIN profiles p ON p.id = t.assigned_to
      WHERE t.organization_id = p_org_id
        AND t.status IN ('pending', 'in_progress')
        AND t.due_date < now()
      ORDER BY t.due_date ASC
      LIMIT 20
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## 3. HELPERS TYPESCRIPT (Frontend + Backend)

### 3.1 Catálogo de Utilidades Compartidas

```typescript
// packages/shared/src/lib/utils.ts

// Formateo de moneda
export function formatCurrency(amount: number, currency: 'COP' | 'USD' = 'COP'): string {
  return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'COP' ? 0 : 2,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(amount);
}

// Formateo de fecha
export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = new Date(date);
  if (format === 'relative') {
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  }
  return d.toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...(format === 'long' ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

// Colores por estado de entidad
export const STATUS_CONFIG: Record<string, Record<string, { label: string; color: string; bg: string }>> = {
  lead: {
    created: { label: 'Creado', color: 'text-blue-700', bg: 'bg-blue-100' },
    pending_assignment: { label: 'Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    assigned: { label: 'Asignado', color: 'text-purple-700', bg: 'bg-purple-100' },
    converted: { label: 'Convertido', color: 'text-green-700', bg: 'bg-green-100' },
    rejected: { label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100' },
  },
  quote: {
    draft: { label: 'Borrador', color: 'text-gray-700', bg: 'bg-gray-100' },
    offer_created: { label: 'Oferta Creada', color: 'text-blue-700', bg: 'bg-blue-100' },
    negotiation: { label: 'Negociación', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    risk: { label: 'En Riesgo', color: 'text-orange-700', bg: 'bg-orange-100' },
    pending_oc: { label: 'Pendiente OC', color: 'text-purple-700', bg: 'bg-purple-100' },
    approved: { label: 'Aprobada', color: 'text-green-700', bg: 'bg-green-100' },
    lost: { label: 'Perdida', color: 'text-red-700', bg: 'bg-red-100' },
    expired: { label: 'Vencida', color: 'text-gray-700', bg: 'bg-gray-100' },
  },
  order: {
    created: { label: 'Creado', color: 'text-blue-700', bg: 'bg-blue-100' },
    payment_pending: { label: 'Pago Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    payment_confirmed: { label: 'Pago Confirmado', color: 'text-green-700', bg: 'bg-green-100' },
    in_purchase: { label: 'En Compra', color: 'text-purple-700', bg: 'bg-purple-100' },
    in_logistics: { label: 'En Logística', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    delivered: { label: 'Entregado', color: 'text-teal-700', bg: 'bg-teal-100' },
    invoiced: { label: 'Facturado', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    completed: { label: 'Completado', color: 'text-green-800', bg: 'bg-green-200' },
    cancelled: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100' },
  },
};

// Generar query key para TanStack Query
export function createQueryKeys<T extends string>(entity: T) {
  return {
    all: [entity] as const,
    lists: () => [...createQueryKeys(entity).all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...createQueryKeys(entity).lists(), filters] as const,
    details: () => [...createQueryKeys(entity).all, 'detail'] as const,
    detail: (id: string) => [...createQueryKeys(entity).details(), id] as const,
  };
}
```

### 3.2 Zod Schemas Centralizados

```typescript
// packages/shared/src/lib/validators.ts
import { z } from 'zod';

// Schemas compartidos (usados en frontend Y backend)
export const createLeadSchema = z.object({
  business_name: z.string().min(1, 'Razón social requerida'),
  nit: z.string().min(1, 'NIT requerido'),
  contact_name: z.string().min(1, 'Nombre de contacto requerido'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Teléfono inválido'),
  email: z.string().email('Email inválido'),
  requirement: z.string().min(1, 'Requerimiento requerido'),
  channel: z.enum(['whatsapp', 'web', 'manual']),
  lead_date: z.string().datetime().optional(),
});

export const createQuoteSchema = z.object({
  customer_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  payment_terms: z.string().min(1, 'Forma de pago requerida'),
  currency: z.enum(['COP', 'USD']),
  validity_days: z.number().int().min(1).max(365).default(30),
  transport_included: z.boolean().default(false),
  transport_cost: z.number().min(0).default(0),
  items: z.array(z.object({
    product_id: z.string().uuid().optional(),
    sku: z.string().min(1),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().min(0),
    cost_price: z.number().min(0),
    discount_pct: z.number().min(0).max(100).default(0),
    tax_pct: z.number().min(0).max(100).default(19),
  })).min(1, 'Al menos un producto es requerido'),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  quote_id: z.string().uuid(),
  delivery_date: z.string().datetime(),
  delivery_address: z.string().min(1, 'Dirección requerida'),
  delivery_city: z.string().min(1, 'Ciudad requerida'),
  delivery_contact: z.string().min(1, 'Contacto requerido'),
  delivery_phone: z.string().min(1, 'Teléfono requerido'),
  delivery_schedule: z.string().optional(),
  dispatch_type: z.enum(['envio', 'retiro', 'mensajeria']),
  requires_advance_billing: z.boolean().default(false),
  notes: z.string().optional(),
});

// Re-export types
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
```

---

## 4. PRINCIPIO ANTI-DUPLICIDAD: MAPA DE RESPONSABILIDADES

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│   BASE DE DATOS      │   BACKEND (API)      │   FRONTEND           │
│   (SQL/RPC/Triggers) │   (Next.js Routes)   │   (React/TS)         │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Consecutivos         │ Llamar get_next_     │ Mostrar consecutivo  │
│ (get_next_consec.)   │ consecutive via RPC  │ recibido del API     │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Cálculo de margen    │ Llamar calculate_    │ Mostrar margen       │
│ (calculate_margin)   │ quote_margin via RPC │ Alerta si < mínimo   │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Validar crédito      │ Llamar validate_     │ Mostrar resultado    │
│ (validate_credit)    │ credit_limit via RPC │ Badge de crédito     │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Permisos (has_perm)  │ checkPermission()    │ useHasPermission()   │
│ Solo en RLS policies │ En cada API route    │ Solo para UI          │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Audit (trigger)      │ NO registra audit    │ NO registra audit    │
│ Automático en DB     │ (lo hace el trigger) │ (lo hace el trigger) │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ updated_at (trigger) │ NO setea updated_at  │ NO envía updated_at  │
│ Automático en DB     │ (lo hace el trigger) │ (no lo necesita)     │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Validar formato      │ Zod schema           │ Zod schema (MISMO)   │
│ CHECK constraints    │ validators.ts        │ validators.ts        │
│ (valores válidos)    │ (campos requeridos)  │ (campos requeridos)  │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ RLS (org isolation)  │ NO filtra por org_id │ NO filtra por org_id │
│ Automático en DB     │ (RLS lo hace)        │ (RLS lo hace)        │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

**Regla de oro:** Si una lógica ya existe en una capa, NO la replicas en otra. Solo la capa más cercana a los datos la implementa.

---

## 5. RESUMEN

| Métrica | Valor |
|---|---|
| **Funciones RPC (negocio)** | 15 |
| **Funciones helper (auth)** | 4 |
| **Triggers** | 8 |
| **Zod schemas** | 10+ |
| **TS helpers** | formatCurrency, formatDate, STATUS_CONFIG, createQueryKeys |
| **Principio** | Una función, un lugar, sin duplicación |
