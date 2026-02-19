-- Orders Page Redesign: 3 RPCs for Panel Principal, Control Pendientes, Tablero Operativo
-- Aligns with Figma template: 3 tabs, 7-color responsibility system, subprocess tracking

-- ============================================================================
-- RPC 1: get_panel_principal
-- Tab 1: Main panel with Tipo (fisico/intangible) and Estado (sin_pendientes/atencion/critico)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_panel_principal(p_org_id uuid)
RETURNS TABLE (
  order_id uuid,
  order_number integer,
  customer_name varchar,
  customer_id uuid,
  quote_number integer,
  tipo varchar,
  estado varchar,
  fecha_clave date,
  indicador_pendientes text,
  total numeric,
  currency varchar,
  status varchar,
  advisor_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.order_number,
    c.business_name AS customer_name,
    o.customer_id,
    q.quote_number,
    -- tipo: derived from order_items.is_license
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND (oi.is_license = false OR oi.is_license IS NULL)
      ) AND EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
      ) THEN 'intangible'::varchar
      ELSE 'fisico'::varchar
    END AS tipo,
    -- estado: derived from pending tasks
    CASE
      WHEN EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id
          AND t.status IN ('pending', 'in_progress')
          AND (t.due_date < now() OR t.priority = 'critical')
      ) THEN 'critico'::varchar
      WHEN EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id
          AND t.status IN ('pending', 'in_progress')
      ) THEN 'atencion_requerida'::varchar
      ELSE 'sin_pendientes'::varchar
    END AS estado,
    -- fecha_clave
    COALESCE(o.delivery_date::date, o.created_at::date) AS fecha_clave,
    -- indicador_pendientes
    COALESCE(
      (SELECT t.title FROM order_pending_tasks t
       WHERE t.order_id = o.id AND t.status IN ('pending', 'in_progress')
       ORDER BY (t.priority = 'critical') DESC, t.due_date ASC NULLS LAST LIMIT 1),
      CASE o.status
        WHEN 'completed' THEN 'Completado'
        WHEN 'delivered' THEN 'Entregado'
        WHEN 'invoiced' THEN 'Facturado'
        WHEN 'cancelled' THEN 'Cancelado'
        ELSE 'Sin pendientes'
      END
    ) AS indicador_pendientes,
    o.total,
    o.currency,
    o.status,
    COALESCE(p.full_name, p.email, '') AS advisor_name,
    o.created_at
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  LEFT JOIN quotes q ON q.id = o.quote_id
  LEFT JOIN profiles p ON p.id = o.advisor_id
  WHERE o.organization_id = p_org_id
    AND o.deleted_at IS NULL
  ORDER BY
    CASE
      WHEN o.status = 'cancelled' THEN 4
      WHEN EXISTS (SELECT 1 FROM order_pending_tasks t WHERE t.order_id = o.id AND t.status IN ('pending','in_progress') AND (t.due_date < now() OR t.priority = 'critical')) THEN 0
      WHEN EXISTS (SELECT 1 FROM order_pending_tasks t WHERE t.order_id = o.id AND t.status IN ('pending','in_progress')) THEN 1
      ELSE 2
    END,
    o.order_number DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_panel_principal(uuid) TO authenticated;

-- ============================================================================
-- RPC 2: get_control_pendientes
-- Tab 2: Pending orders checklist with severity, motivo, dias_restantes
-- ============================================================================
CREATE OR REPLACE FUNCTION get_control_pendientes(p_org_id uuid)
RETURNS TABLE (
  order_id uuid,
  order_number integer,
  customer_name varchar,
  tipo varchar,
  nivel_atencion varchar,
  motivo_pendiente text,
  fecha_clave date,
  dias_restantes integer,
  pending_count bigint,
  critical_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.order_number,
    c.business_name AS customer_name,
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND (oi.is_license = false OR oi.is_license IS NULL)
      ) AND EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
      ) THEN 'intangible'::varchar
      ELSE 'fisico'::varchar
    END AS tipo,
    -- nivel_atencion
    CASE
      WHEN EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id AND t.status IN ('pending', 'in_progress')
          AND (t.due_date < now() OR t.priority = 'critical')
      ) THEN 'critico'::varchar
      WHEN EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id AND t.status IN ('pending', 'in_progress')
      ) THEN 'atencion_requerida'::varchar
      ELSE 'sin_pendientes'::varchar
    END AS nivel_atencion,
    -- motivo_pendiente: most urgent task
    COALESCE(
      (SELECT t.title FROM order_pending_tasks t
       WHERE t.order_id = o.id AND t.status IN ('pending', 'in_progress')
       ORDER BY (t.priority = 'critical') DESC, t.due_date ASC NULLS LAST LIMIT 1),
      'Todo OK - Sin pendientes'
    ) AS motivo_pendiente,
    COALESCE(o.delivery_date::date, o.created_at::date) AS fecha_clave,
    -- dias_restantes (negative = overdue)
    EXTRACT(DAY FROM (
      COALESCE(o.delivery_date, o.created_at + interval '30 days') - now()
    ))::integer AS dias_restantes,
    (SELECT COUNT(*) FROM order_pending_tasks t
     WHERE t.order_id = o.id AND t.status IN ('pending', 'in_progress')) AS pending_count,
    (SELECT COUNT(*) FROM order_pending_tasks t
     WHERE t.order_id = o.id AND t.status IN ('pending', 'in_progress') AND t.priority = 'critical') AS critical_count
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  WHERE o.organization_id = p_org_id
    AND o.deleted_at IS NULL
    AND o.status NOT IN ('completed', 'cancelled')
  ORDER BY
    CASE
      WHEN EXISTS (SELECT 1 FROM order_pending_tasks t WHERE t.order_id = o.id AND t.status IN ('pending','in_progress') AND (t.due_date < now() OR t.priority = 'critical')) THEN 0
      WHEN EXISTS (SELECT 1 FROM order_pending_tasks t WHERE t.order_id = o.id AND t.status IN ('pending','in_progress')) THEN 1
      ELSE 2
    END,
    o.order_number DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_control_pendientes(uuid) TO authenticated;

-- ============================================================================
-- RPC 3: get_tablero_operativo
-- Tab 3: Dense operational table + executive kanban
-- 7-color responsibility system + 6 subprocess colors + 6 macro states
-- ============================================================================
CREATE OR REPLACE FUNCTION get_tablero_operativo(p_org_id uuid)
RETURNS TABLE (
  order_id uuid,
  order_number integer,
  customer_name varchar,
  supplier_name text,
  po_number integer,
  order_product text,
  order_quantity numeric,
  expected_delivery date,
  responsable_color varchar,
  novedades text,
  sub_rem varchar,
  sub_factura varchar,
  sub_transportadora varchar,
  sub_guia varchar,
  sub_crm varchar,
  sub_correo_uf varchar,
  total numeric,
  currency varchar,
  status varchar,
  macro_state varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.order_number,
    c.business_name AS customer_name,
    COALESCE(s_sup.name, 'Sin proveedor')::text AS supplier_name,
    po_latest.po_number,
    COALESCE(
      (SELECT oi.description FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.created_at LIMIT 1),
      'N/A'
    )::text AS order_product,
    COALESCE(
      (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id),
      0
    ) AS order_quantity,
    COALESCE(o.delivery_date::date, po_latest.expected_delivery_date::date) AS expected_delivery,

    -- responsable_color (7-color responsibility system)
    CASE
      -- rojo: critical/blocked tasks or payment overdue
      WHEN EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id AND t.status IN ('pending','in_progress')
          AND (t.priority = 'critical' OR t.traffic_light = 'red')
      ) OR o.payment_status = 'overdue'
        THEN 'rojo'::varchar
      -- verde-oscuro: completed
      WHEN o.status = 'completed'
        THEN 'verde-oscuro'::varchar
      -- azul: primarily license items
      WHEN NOT EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND (oi.is_license = false OR oi.is_license IS NULL)
      ) AND EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
      ) THEN 'azul'::varchar
      -- verde-claro: delivered/invoiced but not fully closed
      WHEN o.status IN ('delivered', 'invoiced')
        THEN 'verde-claro'::varchar
      -- naranja: items received, pending dispatch/delivery confirmation
      WHEN o.status IN ('partial_delivery', 'in_logistics')
        AND EXISTS (
          SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.status IN ('dispatched', 'in_transit')
        )
        THEN 'naranja'::varchar
      -- morado: in logistics, pending reception
      WHEN o.status IN ('partial_delivery', 'in_logistics')
        THEN 'morado'::varchar
      -- amarillo: purchase phase
      WHEN o.status IN ('created', 'payment_pending', 'payment_confirmed', 'available_for_purchase', 'in_purchase')
        THEN 'amarillo'::varchar
      ELSE 'amarillo'::varchar
    END AS responsable_color,

    -- novedades: most urgent pending task or status text
    COALESCE(
      (SELECT t.title FROM order_pending_tasks t
       WHERE t.order_id = o.id AND t.status IN ('pending', 'in_progress')
       ORDER BY (t.priority = 'critical') DESC, t.due_date ASC NULLS LAST LIMIT 1),
      CASE o.status
        WHEN 'completed' THEN 'Proceso completado'
        WHEN 'delivered' THEN 'Entregado, pendiente cierre'
        WHEN 'invoiced' THEN 'Facturado'
        ELSE 'Sin novedades'
      END
    )::text AS novedades,

    -- sub_rem (Remision): from shipments
    CASE
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.status = 'delivered') THEN 'verde-oscuro'::varchar
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.status IN ('dispatched', 'in_transit')) THEN 'verde-claro'::varchar
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.status = 'preparing') THEN 'morado'::varchar
      WHEN o.status IN ('in_logistics', 'partial_delivery') THEN 'naranja'::varchar
      ELSE NULL
    END AS sub_rem,

    -- sub_factura: from invoices
    CASE
      WHEN EXISTS (SELECT 1 FROM invoices inv WHERE inv.order_id = o.id AND inv.status = 'paid') THEN 'verde-oscuro'::varchar
      WHEN EXISTS (SELECT 1 FROM invoices inv WHERE inv.order_id = o.id AND inv.status = 'overdue') THEN 'rojo'::varchar
      WHEN EXISTS (SELECT 1 FROM invoices inv WHERE inv.order_id = o.id AND inv.status IN ('pending', 'partial')) THEN 'verde-claro'::varchar
      WHEN o.status IN ('delivered', 'invoiced', 'completed') THEN 'naranja'::varchar
      ELSE NULL
    END AS sub_factura,

    -- sub_transportadora: from shipments.carrier
    CASE
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.carrier IS NOT NULL AND sh.status = 'delivered') THEN 'verde-oscuro'::varchar
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.carrier IS NOT NULL AND sh.status IN ('dispatched', 'in_transit')) THEN 'verde-claro'::varchar
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.status = 'preparing') THEN 'naranja'::varchar
      ELSE NULL
    END AS sub_transportadora,

    -- sub_guia: from shipments.tracking_number
    CASE
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.tracking_number IS NOT NULL AND sh.status = 'delivered') THEN 'verde-oscuro'::varchar
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.tracking_number IS NOT NULL) THEN 'verde-claro'::varchar
      WHEN EXISTS (SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.tracking_number IS NULL AND sh.status != 'preparing') THEN 'naranja'::varchar
      ELSE NULL
    END AS sub_guia,

    -- sub_crm: from pending_tasks
    CASE
      WHEN o.status = 'completed' THEN 'verde-oscuro'::varchar
      WHEN EXISTS (SELECT 1 FROM order_pending_tasks t WHERE t.order_id = o.id AND t.status IN ('pending','in_progress') AND t.priority = 'critical') THEN 'rojo'::varchar
      WHEN EXISTS (SELECT 1 FROM order_pending_tasks t WHERE t.order_id = o.id AND t.status IN ('pending','in_progress')) THEN 'naranja'::varchar
      WHEN EXISTS (SELECT 1 FROM order_pending_tasks t WHERE t.order_id = o.id AND t.status = 'completed') THEN 'verde-claro'::varchar
      ELSE NULL
    END AS sub_crm,

    -- sub_correo_uf: for license orders
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.is_license = true) THEN NULL
      WHEN EXISTS (SELECT 1 FROM license_records lr WHERE lr.order_id = o.id AND lr.end_user_email IS NOT NULL AND lr.status = 'active') THEN 'verde-oscuro'::varchar
      WHEN EXISTS (SELECT 1 FROM license_records lr WHERE lr.order_id = o.id AND lr.status = 'pending') THEN 'naranja'::varchar
      WHEN o.status IN ('delivered', 'invoiced', 'completed') THEN 'amarillo'::varchar
      ELSE NULL
    END AS sub_correo_uf,

    o.total,
    o.currency,
    o.status,

    -- macro_state for executive kanban (6 states)
    CASE
      -- bloqueado: critical tasks or payment overdue
      WHEN EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id AND t.status IN ('pending','in_progress')
          AND (t.priority = 'critical' OR t.traffic_light = 'red')
      ) OR o.payment_status = 'overdue'
        THEN 'bloqueado'::varchar
      -- cerrado: completed/delivered/invoiced
      WHEN o.status IN ('completed', 'delivered', 'invoiced')
        THEN 'cerrado'::varchar
      -- en_bodega: items dispatched or in warehouse
      WHEN o.status IN ('partial_delivery', 'in_logistics')
        AND EXISTS (
          SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.status IN ('dispatched', 'in_transit')
        )
        THEN 'en_bodega'::varchar
      -- en_transporte: in logistics phase
      WHEN o.status IN ('partial_delivery', 'in_logistics')
        THEN 'en_transporte'::varchar
      -- en_proveedor: in purchase with POs sent/confirmed
      WHEN o.status = 'in_purchase'
        AND EXISTS (
          SELECT 1 FROM purchase_orders po2 WHERE po2.order_id = o.id AND po2.status IN ('sent', 'confirmed', 'partial_received')
        )
        THEN 'en_proveedor'::varchar
      -- en_compras: everything else (early stages)
      ELSE 'en_compras'::varchar
    END AS macro_state

  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  LEFT JOIN LATERAL (
    SELECT po2.po_number, po2.supplier_id, po2.expected_delivery_date
    FROM purchase_orders po2
    WHERE po2.order_id = o.id
    ORDER BY po2.created_at DESC LIMIT 1
  ) po_latest ON true
  LEFT JOIN suppliers s_sup ON s_sup.id = po_latest.supplier_id
  WHERE o.organization_id = p_org_id
    AND o.deleted_at IS NULL
    AND o.status != 'cancelled'
  ORDER BY o.order_number DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tablero_operativo(uuid) TO authenticated;
