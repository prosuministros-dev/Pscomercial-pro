-- Fix: get_product_journey RPC references s.business_name but suppliers table uses "name"
-- Also handle NULL supplier gracefully

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

  -- Purchase order items (fix: suppliers.name, not business_name)
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
      s.name as supplier_name,
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
