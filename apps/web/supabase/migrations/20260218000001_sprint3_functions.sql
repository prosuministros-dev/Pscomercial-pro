-- Sprint 3: Operativo Avanzado — Functions
-- RPC: get_order_traceability builds complete timeline for an order

CREATE OR REPLACE FUNCTION get_order_traceability(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_org uuid;
  v_order_org uuid;
  v_events jsonb := '[]'::jsonb;
  v_row record;
BEGIN
  -- Get caller org
  SELECT organization_id INTO v_caller_org
  FROM profiles WHERE id = auth.uid();

  -- Verify order belongs to caller org
  SELECT organization_id INTO v_order_org
  FROM orders WHERE id = p_order_id AND deleted_at IS NULL;

  IF v_order_org IS NULL OR v_order_org != v_caller_org THEN
    RETURN '[]'::jsonb;
  END IF;

  -- 1. Status changes
  FOR v_row IN
    SELECT
      osh.created_at AS ts,
      'status_change' AS event_type,
      'Cambio de estado: ' || COALESCE(osh.from_status, '(inicio)') || ' → ' || osh.to_status AS title,
      osh.notes AS description,
      p.display_name AS user_name,
      jsonb_build_object('from', osh.from_status, 'to', osh.to_status) AS meta
    FROM order_status_history osh
    LEFT JOIN profiles p ON p.id = osh.changed_by
    WHERE osh.order_id = p_order_id
    ORDER BY osh.created_at
  LOOP
    v_events := v_events || jsonb_build_object(
      'timestamp', v_row.ts,
      'type', v_row.event_type,
      'title', v_row.title,
      'description', v_row.description,
      'user_name', v_row.user_name,
      'metadata', v_row.meta
    );
  END LOOP;

  -- 2. Purchase orders
  FOR v_row IN
    SELECT
      po.created_at AS ts,
      'purchase_order' AS event_type,
      'OC-' || po.po_number || ' creada (' || s.name || ')' AS title,
      'Estado: ' || po.status || ' — Total: ' || po.total || ' ' || po.currency AS description,
      pr.display_name AS user_name,
      jsonb_build_object('po_id', po.id, 'status', po.status, 'supplier', s.name, 'total', po.total) AS meta
    FROM purchase_orders po
    LEFT JOIN suppliers s ON s.id = po.supplier_id
    LEFT JOIN profiles pr ON pr.id = po.created_by
    WHERE po.order_id = p_order_id
    ORDER BY po.created_at
  LOOP
    v_events := v_events || jsonb_build_object(
      'timestamp', v_row.ts,
      'type', v_row.event_type,
      'title', v_row.title,
      'description', v_row.description,
      'user_name', v_row.user_name,
      'metadata', v_row.meta
    );
  END LOOP;

  -- 3. PO item receptions
  FOR v_row IN
    SELECT
      poi.received_at AS ts,
      'reception' AS event_type,
      'Recepción: ' || poi.description || ' (' || poi.quantity_received || ' uds)' AS title,
      'OC-' || po.po_number AS description,
      pr.display_name AS user_name,
      jsonb_build_object('po_id', po.id, 'item', poi.description, 'qty', poi.quantity_received) AS meta
    FROM purchase_order_items poi
    JOIN purchase_orders po ON po.id = poi.purchase_order_id
    LEFT JOIN profiles pr ON pr.id = poi.received_by
    WHERE po.order_id = p_order_id
      AND poi.received_at IS NOT NULL
    ORDER BY poi.received_at
  LOOP
    v_events := v_events || jsonb_build_object(
      'timestamp', v_row.ts,
      'type', v_row.event_type,
      'title', v_row.title,
      'description', v_row.description,
      'user_name', v_row.user_name,
      'metadata', v_row.meta
    );
  END LOOP;

  -- 4. Shipments created
  FOR v_row IN
    SELECT
      sh.created_at AS ts,
      'shipment' AS event_type,
      'DSP-' || sh.shipment_number || ' creado (' || sh.dispatch_type || ')' AS title,
      COALESCE(sh.carrier, '') || CASE WHEN sh.tracking_number IS NOT NULL THEN ' — Guía: ' || sh.tracking_number ELSE '' END AS description,
      pr.display_name AS user_name,
      jsonb_build_object('shipment_id', sh.id, 'status', sh.status, 'carrier', sh.carrier) AS meta
    FROM shipments sh
    LEFT JOIN profiles pr ON pr.id = sh.created_by
    WHERE sh.order_id = p_order_id
    ORDER BY sh.created_at
  LOOP
    v_events := v_events || jsonb_build_object(
      'timestamp', v_row.ts,
      'type', v_row.event_type,
      'title', v_row.title,
      'description', v_row.description,
      'user_name', v_row.user_name,
      'metadata', v_row.meta
    );
  END LOOP;

  -- 5. Shipment deliveries
  FOR v_row IN
    SELECT
      sh.actual_delivery AS ts,
      'delivery' AS event_type,
      'DSP-' || sh.shipment_number || ' entregado' AS title,
      COALESCE('Recibió: ' || sh.received_by_name, '') AS description,
      NULL::text AS user_name,
      jsonb_build_object('shipment_id', sh.id, 'received_by', sh.received_by_name) AS meta
    FROM shipments sh
    WHERE sh.order_id = p_order_id
      AND sh.actual_delivery IS NOT NULL
    ORDER BY sh.actual_delivery
  LOOP
    v_events := v_events || jsonb_build_object(
      'timestamp', v_row.ts,
      'type', v_row.event_type,
      'title', v_row.title,
      'description', v_row.description,
      'user_name', v_row.user_name,
      'metadata', v_row.meta
    );
  END LOOP;

  -- 6. Invoices
  FOR v_row IN
    SELECT
      inv.created_at AS ts,
      'invoice' AS event_type,
      'Factura ' || inv.invoice_number || ' registrada' AS title,
      'Total: ' || inv.total || ' ' || inv.currency || ' — Estado: ' || inv.status AS description,
      pr.display_name AS user_name,
      jsonb_build_object('invoice_id', inv.id, 'status', inv.status, 'total', inv.total) AS meta
    FROM invoices inv
    LEFT JOIN profiles pr ON pr.id = inv.created_by
    WHERE inv.order_id = p_order_id
    ORDER BY inv.created_at
  LOOP
    v_events := v_events || jsonb_build_object(
      'timestamp', v_row.ts,
      'type', v_row.event_type,
      'title', v_row.title,
      'description', v_row.description,
      'user_name', v_row.user_name,
      'metadata', v_row.meta
    );
  END LOOP;

  -- 7. Licenses
  FOR v_row IN
    SELECT
      lr.created_at AS ts,
      'license' AS event_type,
      'Licencia ' || lr.license_type || COALESCE(' — ' || lr.vendor, '') AS title,
      'Estado: ' || lr.status || CASE WHEN lr.expiry_date IS NOT NULL THEN ' — Vence: ' || lr.expiry_date::text ELSE '' END AS description,
      pr.display_name AS user_name,
      jsonb_build_object('license_id', lr.id, 'type', lr.license_type, 'status', lr.status) AS meta
    FROM license_records lr
    LEFT JOIN profiles pr ON pr.id = lr.created_by
    WHERE lr.order_id = p_order_id
    ORDER BY lr.created_at
  LOOP
    v_events := v_events || jsonb_build_object(
      'timestamp', v_row.ts,
      'type', v_row.event_type,
      'title', v_row.title,
      'description', v_row.description,
      'user_name', v_row.user_name,
      'metadata', v_row.meta
    );
  END LOOP;

  -- Sort all events by timestamp
  SELECT jsonb_agg(elem ORDER BY (elem->>'timestamp')::timestamptz ASC)
  INTO v_events
  FROM jsonb_array_elements(v_events) AS elem;

  RETURN COALESCE(v_events, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_order_traceability(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_traceability(uuid) TO service_role;
