-- Sprint 4: Dashboard RPCs + indexes for commercial/operational dashboards

-- ============================================================================
-- 1) Indexes for dashboard performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_org_status
  ON orders(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_quotes_org_status_date
  ON quotes(organization_id, status, quote_date);

CREATE INDEX IF NOT EXISTS idx_pending_tasks_active
  ON order_pending_tasks(order_id, status)
  WHERE status NOT IN ('completed', 'cancelled');

-- ============================================================================
-- 2) RPC: get_commercial_pipeline
-- Returns: lead/quote counts by status, quotes by advisor, conversion, $ pipeline
-- ============================================================================
CREATE OR REPLACE FUNCTION get_commercial_pipeline(
  p_org_id uuid,
  p_from date DEFAULT (now() - interval '30 days')::date,
  p_to date DEFAULT now()::date,
  p_advisor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result jsonb;
  v_lead_counts jsonb;
  v_quote_counts jsonb;
  v_quotes_by_advisor jsonb;
  v_total_leads int;
  v_total_quotes int;
  v_total_orders int;
  v_pipeline_value numeric;
  v_conversion_rate numeric;
BEGIN
  -- Lead counts by status
  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
  INTO v_lead_counts
  FROM (
    SELECT status, count(*) as cnt
    FROM leads
    WHERE organization_id = p_org_id
      AND lead_date::date BETWEEN p_from AND p_to
      AND deleted_at IS NULL
      AND (p_advisor_id IS NULL OR assigned_to = p_advisor_id)
    GROUP BY status
  ) sub;

  SELECT count(*) INTO v_total_leads
  FROM leads
  WHERE organization_id = p_org_id
    AND lead_date::date BETWEEN p_from AND p_to
    AND deleted_at IS NULL
    AND (p_advisor_id IS NULL OR assigned_to = p_advisor_id);

  -- Quote counts by status
  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
  INTO v_quote_counts
  FROM (
    SELECT status, count(*) as cnt
    FROM quotes
    WHERE organization_id = p_org_id
      AND quote_date::date BETWEEN p_from AND p_to
      AND deleted_at IS NULL
      AND (p_advisor_id IS NULL OR advisor_id = p_advisor_id)
    GROUP BY status
  ) sub;

  SELECT count(*) INTO v_total_quotes
  FROM quotes
  WHERE organization_id = p_org_id
    AND quote_date::date BETWEEN p_from AND p_to
    AND deleted_at IS NULL
    AND (p_advisor_id IS NULL OR advisor_id = p_advisor_id);

  -- Quotes by advisor (top 10)
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_quotes_by_advisor
  FROM (
    SELECT
      p.full_name as advisor_name,
      count(*) as total_quotes,
      count(*) FILTER (WHERE q.status IN ('approved', 'pending_oc')) as won,
      COALESCE(sum(q.total) FILTER (WHERE q.status IN ('approved', 'pending_oc')), 0) as won_value
    FROM quotes q
    JOIN profiles p ON p.id = q.advisor_id
    WHERE q.organization_id = p_org_id
      AND q.quote_date::date BETWEEN p_from AND p_to
      AND q.deleted_at IS NULL
      AND (p_advisor_id IS NULL OR q.advisor_id = p_advisor_id)
    GROUP BY p.id, p.full_name
    ORDER BY won_value DESC
    LIMIT 10
  ) sub;

  -- Total orders + pipeline value
  SELECT count(*), COALESCE(sum(total), 0)
  INTO v_total_orders, v_pipeline_value
  FROM orders
  WHERE organization_id = p_org_id
    AND created_at::date BETWEEN p_from AND p_to
    AND deleted_at IS NULL
    AND status NOT IN ('cancelled')
    AND (p_advisor_id IS NULL OR advisor_id = p_advisor_id);

  -- Conversion rate: orders / leads (avoid div by zero)
  v_conversion_rate := CASE WHEN v_total_leads > 0
    THEN round((v_total_orders::numeric / v_total_leads::numeric) * 100, 1)
    ELSE 0 END;

  v_result := jsonb_build_object(
    'lead_counts', v_lead_counts,
    'quote_counts', v_quote_counts,
    'quotes_by_advisor', v_quotes_by_advisor,
    'total_leads', v_total_leads,
    'total_quotes', v_total_quotes,
    'total_orders', v_total_orders,
    'pipeline_value', v_pipeline_value,
    'conversion_rate', v_conversion_rate
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_commercial_pipeline(uuid, date, date, uuid) TO authenticated;

-- ============================================================================
-- 3) RPC: get_operational_dashboard
-- Returns: orders by status, $ invoiced, pending deliveries, orders per week
-- ============================================================================
CREATE OR REPLACE FUNCTION get_operational_dashboard(
  p_org_id uuid,
  p_from date DEFAULT (now() - interval '90 days')::date,
  p_to date DEFAULT now()::date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result jsonb;
  v_orders_by_status jsonb;
  v_orders_per_week jsonb;
  v_active_orders int;
  v_invoiced_total numeric;
  v_pending_deliveries int;
  v_completed_orders int;
BEGIN
  -- Orders by status
  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
  INTO v_orders_by_status
  FROM (
    SELECT status, count(*) as cnt
    FROM orders
    WHERE organization_id = p_org_id
      AND deleted_at IS NULL
      AND status != 'cancelled'
    GROUP BY status
  ) sub;

  -- Active orders (not completed, not cancelled)
  SELECT count(*) INTO v_active_orders
  FROM orders
  WHERE organization_id = p_org_id
    AND deleted_at IS NULL
    AND status NOT IN ('completed', 'cancelled');

  -- Completed orders in range
  SELECT count(*) INTO v_completed_orders
  FROM orders
  WHERE organization_id = p_org_id
    AND deleted_at IS NULL
    AND status = 'completed'
    AND completed_at::date BETWEEN p_from AND p_to;

  -- Total invoiced in range
  SELECT COALESCE(sum(i.total), 0)
  INTO v_invoiced_total
  FROM invoices i
  WHERE i.organization_id = p_org_id
    AND i.invoice_date BETWEEN p_from AND p_to
    AND i.status != 'cancelled';

  -- Pending deliveries
  SELECT count(*) INTO v_pending_deliveries
  FROM orders
  WHERE organization_id = p_org_id
    AND deleted_at IS NULL
    AND status IN ('in_logistics', 'partial_delivery');

  -- Orders per week (last 12 weeks)
  SELECT COALESCE(jsonb_agg(row_to_json(sub) ORDER BY sub.week_start), '[]'::jsonb)
  INTO v_orders_per_week
  FROM (
    SELECT
      date_trunc('week', created_at)::date as week_start,
      count(*) as order_count
    FROM orders
    WHERE organization_id = p_org_id
      AND created_at >= now() - interval '12 weeks'
      AND deleted_at IS NULL
      AND status != 'cancelled'
    GROUP BY date_trunc('week', created_at)
  ) sub;

  v_result := jsonb_build_object(
    'orders_by_status', v_orders_by_status,
    'orders_per_week', v_orders_per_week,
    'active_orders', v_active_orders,
    'completed_orders', v_completed_orders,
    'invoiced_total', v_invoiced_total,
    'pending_deliveries', v_pending_deliveries
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_operational_dashboard(uuid, date, date) TO authenticated;

-- ============================================================================
-- 4) RPC: get_semaforo_operativo
-- Returns: orders with computed 7-color semaforo based on pending tasks
-- ============================================================================
CREATE OR REPLACE FUNCTION get_semaforo_operativo(p_org_id uuid)
RETURNS TABLE (
  order_id uuid,
  order_number integer,
  customer_name varchar,
  advisor_name varchar,
  status varchar,
  total numeric,
  currency varchar,
  semaforo_color varchar,
  pending_task_count bigint,
  max_overdue_days numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id as order_id,
    o.order_number,
    c.business_name as customer_name,
    p.full_name as advisor_name,
    o.status,
    o.total,
    o.currency,
    -- 7-color semaforo logic
    CASE
      -- Black: any task blocked (critical priority + blocked status)
      WHEN EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id
          AND t.status = 'blocked'
      ) THEN 'black'::varchar
      -- Dark green: no pending tasks
      WHEN NOT EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id
          AND t.status NOT IN ('completed', 'cancelled')
      ) THEN 'dark_green'::varchar
      -- Fuchsia: >5 days overdue
      WHEN (
        SELECT MAX(EXTRACT(EPOCH FROM (now() - t.due_date)) / 86400)
        FROM order_pending_tasks t
        WHERE t.order_id = o.id
          AND t.status NOT IN ('completed', 'cancelled')
          AND t.due_date IS NOT NULL
          AND t.due_date < now()
      ) > 5 THEN 'fuchsia'::varchar
      -- Red: 3-5 days overdue
      WHEN (
        SELECT MAX(EXTRACT(EPOCH FROM (now() - t.due_date)) / 86400)
        FROM order_pending_tasks t
        WHERE t.order_id = o.id
          AND t.status NOT IN ('completed', 'cancelled')
          AND t.due_date IS NOT NULL
          AND t.due_date < now()
      ) >= 3 THEN 'red'::varchar
      -- Orange: 1-2 days overdue
      WHEN (
        SELECT MAX(EXTRACT(EPOCH FROM (now() - t.due_date)) / 86400)
        FROM order_pending_tasks t
        WHERE t.order_id = o.id
          AND t.status NOT IN ('completed', 'cancelled')
          AND t.due_date IS NOT NULL
          AND t.due_date < now()
      ) >= 1 THEN 'orange'::varchar
      -- Yellow: due within 24h
      WHEN EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id
          AND t.status NOT IN ('completed', 'cancelled')
          AND t.due_date IS NOT NULL
          AND t.due_date >= now()
          AND t.due_date < now() + interval '24 hours'
      ) THEN 'yellow'::varchar
      -- Green: tasks exist but all on time
      ELSE 'green'::varchar
    END as semaforo_color,
    (
      SELECT count(*)
      FROM order_pending_tasks t
      WHERE t.order_id = o.id
        AND t.status NOT IN ('completed', 'cancelled')
    ) as pending_task_count,
    COALESCE((
      SELECT MAX(EXTRACT(EPOCH FROM (now() - t.due_date)) / 86400)
      FROM order_pending_tasks t
      WHERE t.order_id = o.id
        AND t.status NOT IN ('completed', 'cancelled')
        AND t.due_date IS NOT NULL
        AND t.due_date < now()
    ), 0) as max_overdue_days,
    o.created_at
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  JOIN profiles p ON p.id = o.advisor_id
  WHERE o.organization_id = p_org_id
    AND o.deleted_at IS NULL
    AND o.status NOT IN ('completed', 'cancelled')
  ORDER BY
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM order_pending_tasks t
        WHERE t.order_id = o.id AND t.status = 'blocked'
      ) THEN 0
      ELSE 1
    END DESC,
    COALESCE((
      SELECT MAX(EXTRACT(EPOCH FROM (now() - t.due_date)) / 86400)
      FROM order_pending_tasks t
      WHERE t.order_id = o.id
        AND t.status NOT IN ('completed', 'cancelled')
        AND t.due_date < now()
    ), -999) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_semaforo_operativo(uuid) TO authenticated;

-- ============================================================================
-- 5) RPC: get_product_journey
-- Returns: product trace through quote → order → PO → shipment → invoice
-- ============================================================================
CREATE OR REPLACE FUNCTION get_product_journey(
  p_product_id uuid,
  p_org_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_events jsonb := '[]'::jsonb;
  v_record record;
BEGIN
  -- Quote items
  FOR v_record IN
    SELECT
      'quote'::text as event_type,
      q.quote_number::text as ref_number,
      qi.quantity,
      qi.unit_price,
      qi.total,
      q.currency,
      q.status as parent_status,
      q.quote_date as event_date,
      p.full_name as advisor_name,
      c.business_name as customer_name,
      q.id as parent_id,
      qi.id as item_id
    FROM quote_items qi
    JOIN quotes q ON q.id = qi.quote_id
    JOIN profiles p ON p.id = q.advisor_id
    JOIN customers c ON c.id = q.customer_id
    WHERE qi.product_id = p_product_id
      AND q.organization_id = p_org_id
      AND q.deleted_at IS NULL
    ORDER BY q.quote_date DESC
    LIMIT 50
  LOOP
    v_events := v_events || jsonb_build_object(
      'type', v_record.event_type,
      'ref_number', v_record.ref_number,
      'quantity', v_record.quantity,
      'unit_price', v_record.unit_price,
      'total', v_record.total,
      'currency', v_record.currency,
      'status', v_record.parent_status,
      'event_date', v_record.event_date,
      'advisor_name', v_record.advisor_name,
      'customer_name', v_record.customer_name,
      'parent_id', v_record.parent_id,
      'item_id', v_record.item_id
    );
  END LOOP;

  -- Order items
  FOR v_record IN
    SELECT
      'order'::text as event_type,
      o.order_number::text as ref_number,
      oi.quantity,
      oi.unit_price,
      oi.total,
      o.currency,
      o.status as parent_status,
      o.created_at as event_date,
      p.full_name as advisor_name,
      c.business_name as customer_name,
      o.id as parent_id,
      oi.id as item_id,
      oi.quantity_purchased,
      oi.quantity_received,
      oi.quantity_dispatched,
      oi.quantity_delivered
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN profiles p ON p.id = o.advisor_id
    JOIN customers c ON c.id = o.customer_id
    WHERE oi.product_id = p_product_id
      AND o.organization_id = p_org_id
      AND o.deleted_at IS NULL
    ORDER BY o.created_at DESC
    LIMIT 50
  LOOP
    v_events := v_events || jsonb_build_object(
      'type', v_record.event_type,
      'ref_number', v_record.ref_number,
      'quantity', v_record.quantity,
      'unit_price', v_record.unit_price,
      'total', v_record.total,
      'currency', v_record.currency,
      'status', v_record.parent_status,
      'event_date', v_record.event_date,
      'advisor_name', v_record.advisor_name,
      'customer_name', v_record.customer_name,
      'parent_id', v_record.parent_id,
      'item_id', v_record.item_id,
      'quantity_purchased', v_record.quantity_purchased,
      'quantity_received', v_record.quantity_received,
      'quantity_dispatched', v_record.quantity_dispatched,
      'quantity_delivered', v_record.quantity_delivered
    );
  END LOOP;

  -- Purchase order items
  FOR v_record IN
    SELECT
      'purchase_order'::text as event_type,
      po.po_number::text as ref_number,
      poi.quantity_ordered as quantity,
      poi.unit_cost as unit_price,
      poi.subtotal as total,
      po.currency,
      po.status as parent_status,
      po.created_at as event_date,
      s.business_name as supplier_name,
      po.id as parent_id,
      poi.id as item_id,
      poi.quantity_received
    FROM purchase_order_items poi
    JOIN purchase_orders po ON po.id = poi.purchase_order_id
    LEFT JOIN suppliers s ON s.id = po.supplier_id
    WHERE poi.product_id = p_product_id
      AND po.organization_id = p_org_id
    ORDER BY po.created_at DESC
    LIMIT 50
  LOOP
    v_events := v_events || jsonb_build_object(
      'type', v_record.event_type,
      'ref_number', v_record.ref_number,
      'quantity', v_record.quantity,
      'unit_price', v_record.unit_price,
      'total', v_record.total,
      'currency', v_record.currency,
      'status', v_record.parent_status,
      'event_date', v_record.event_date,
      'supplier_name', v_record.supplier_name,
      'parent_id', v_record.parent_id,
      'item_id', v_record.item_id,
      'quantity_received', v_record.quantity_received
    );
  END LOOP;

  -- Shipment items (via order_items)
  FOR v_record IN
    SELECT
      'shipment'::text as event_type,
      sh.shipment_number::text as ref_number,
      si.quantity_shipped as quantity,
      sh.status as parent_status,
      COALESCE(sh.dispatched_at, sh.created_at) as event_date,
      sh.carrier,
      sh.tracking_number,
      sh.id as parent_id,
      si.id as item_id
    FROM shipment_items si
    JOIN shipments sh ON sh.id = si.shipment_id
    JOIN order_items oi ON oi.id = si.order_item_id
    WHERE oi.product_id = p_product_id
      AND sh.organization_id = p_org_id
    ORDER BY sh.created_at DESC
    LIMIT 50
  LOOP
    v_events := v_events || jsonb_build_object(
      'type', v_record.event_type,
      'ref_number', v_record.ref_number,
      'quantity', v_record.quantity,
      'status', v_record.parent_status,
      'event_date', v_record.event_date,
      'carrier', v_record.carrier,
      'tracking_number', v_record.tracking_number,
      'parent_id', v_record.parent_id,
      'item_id', v_record.item_id
    );
  END LOOP;

  -- Invoice items (via order_items)
  FOR v_record IN
    SELECT
      'invoice'::text as event_type,
      inv.invoice_number as ref_number,
      ii.quantity,
      ii.unit_price,
      ii.total,
      inv.currency,
      inv.status as parent_status,
      inv.invoice_date::timestamptz as event_date,
      inv.id as parent_id,
      ii.id as item_id
    FROM invoice_items ii
    JOIN invoices inv ON inv.id = ii.invoice_id
    JOIN order_items oi ON oi.id = ii.order_item_id
    WHERE oi.product_id = p_product_id
      AND inv.organization_id = p_org_id
    ORDER BY inv.invoice_date DESC
    LIMIT 50
  LOOP
    v_events := v_events || jsonb_build_object(
      'type', v_record.event_type,
      'ref_number', v_record.ref_number,
      'quantity', v_record.quantity,
      'unit_price', v_record.unit_price,
      'total', v_record.total,
      'currency', v_record.currency,
      'status', v_record.parent_status,
      'event_date', v_record.event_date,
      'parent_id', v_record.parent_id,
      'item_id', v_record.item_id
    );
  END LOOP;

  RETURN jsonb_build_object('events', v_events);
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_journey(uuid, uuid) TO authenticated;
