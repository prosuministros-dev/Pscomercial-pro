-- ============================================================================
-- PSCOMERCIAL-PRO - SPRINT 2: ORDER FUNCTIONS
-- Migration: 20260216000001_sprint2_order_functions.sql
-- Date: 2026-02-16
-- Description:
--   1. create_order_from_quote(p_quote_id) - Creates order from approved quote
--   2. update_order_status(p_order_id, p_new_status, p_notes) - Status transitions
-- ============================================================================


-- ============================================================================
-- 1. create_order_from_quote(p_quote_id uuid) RETURNS uuid
-- Creates an order from an approved quote, copying all items.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_order_from_quote(p_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_org uuid;
  v_quote record;
  v_order_id uuid;
  v_order_number integer;
  v_existing_order uuid;
BEGIN
  -- Authenticate caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Get caller organization
  SELECT organization_id INTO v_caller_org
  FROM profiles
  WHERE id = v_caller_id;

  IF v_caller_org IS NULL THEN
    RAISE EXCEPTION 'User profile not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Get quote details
  SELECT * INTO v_quote
  FROM quotes
  WHERE id = p_quote_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found: %', p_quote_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Verify quote belongs to caller's organization
  IF v_quote.organization_id != v_caller_org THEN
    RAISE EXCEPTION 'Quote does not belong to your organization'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Verify quote status allows order creation
  IF v_quote.status NOT IN ('approved', 'pending_oc', 'offer_created', 'negotiation') THEN
    RAISE EXCEPTION 'Quote status "%" does not allow order creation. Must be approved or pending_oc.', v_quote.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Check if an order already exists for this quote
  SELECT id INTO v_existing_order
  FROM orders
  WHERE quote_id = p_quote_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'An order already exists for this quote (order_id: %)', v_existing_order
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Verify margin is approved (if margin was below minimum)
  IF v_quote.margin_pct IS NOT NULL AND v_quote.margin_approved = false THEN
    -- Check if there's a pending or rejected approval
    PERFORM 1 FROM quote_approvals
    WHERE quote_id = p_quote_id
      AND status = 'pending';
    IF FOUND THEN
      RAISE EXCEPTION 'Quote has a pending margin approval. Cannot create order until approved.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Generate order number
  v_order_number := generate_consecutive(v_quote.organization_id, 'order');

  -- Create the order
  INSERT INTO orders (
    organization_id,
    order_number,
    quote_id,
    customer_id,
    advisor_id,
    status,
    payment_status,
    payment_terms,
    currency,
    subtotal,
    tax_amount,
    total,
    created_by
  )
  VALUES (
    v_quote.organization_id,
    v_order_number,
    p_quote_id,
    v_quote.customer_id,
    v_quote.advisor_id,
    'created',
    'pending',
    v_quote.payment_terms,
    v_quote.currency,
    v_quote.subtotal,
    v_quote.tax_amount,
    v_quote.total,
    v_caller_id
  )
  RETURNING id INTO v_order_id;

  -- Copy quote items to order items
  INSERT INTO order_items (
    order_id,
    quote_item_id,
    product_id,
    sku,
    description,
    quantity,
    unit_price,
    subtotal,
    tax_amount,
    total,
    item_status
  )
  SELECT
    v_order_id,
    qi.id,
    qi.product_id,
    qi.sku,
    qi.description,
    qi.quantity,
    qi.unit_price,
    qi.subtotal,
    qi.tax_amount,
    qi.total,
    'pending'
  FROM quote_items qi
  WHERE qi.quote_id = p_quote_id
  ORDER BY qi.sort_order;

  -- Create initial status history record
  INSERT INTO order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    notes
  )
  VALUES (
    v_order_id,
    NULL,
    'created',
    v_caller_id,
    'Pedido creado desde cotizacion #' || v_quote.quote_number
  );

  -- Update quote status to pending_oc
  UPDATE quotes
  SET status = 'pending_oc',
      updated_at = now()
  WHERE id = p_quote_id
    AND status NOT IN ('pending_oc');

  RETURN v_order_id;
END;
$$;

COMMENT ON FUNCTION create_order_from_quote IS
'Creates a new order from an approved quote. Copies all items, generates consecutive order number (#20000+), creates initial status history, and marks quote as pending_oc.';

GRANT EXECUTE ON FUNCTION create_order_from_quote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_from_quote(uuid) TO service_role;


-- ============================================================================
-- 2. update_order_status(p_order_id uuid, p_new_status text, p_notes text)
-- Validates status transition and creates history record.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_org uuid;
  v_order record;
  v_current_status text;
  v_valid_transition boolean := false;
BEGIN
  -- Authenticate caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Get caller organization
  SELECT organization_id INTO v_caller_org
  FROM profiles
  WHERE id = v_caller_id;

  -- Get order details
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Verify order belongs to caller's organization
  IF v_order.organization_id != v_caller_org THEN
    RAISE EXCEPTION 'Order does not belong to your organization'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_current_status := v_order.status;

  -- Cannot transition from terminal states
  IF v_current_status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot change status of a % order', v_current_status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Validate status transition
  v_valid_transition := CASE
    -- From created
    WHEN v_current_status = 'created' AND p_new_status IN ('payment_pending', 'available_for_purchase', 'cancelled') THEN true
    -- From payment_pending
    WHEN v_current_status = 'payment_pending' AND p_new_status IN ('payment_confirmed', 'cancelled') THEN true
    -- From payment_confirmed
    WHEN v_current_status = 'payment_confirmed' AND p_new_status IN ('available_for_purchase', 'cancelled') THEN true
    -- From available_for_purchase
    WHEN v_current_status = 'available_for_purchase' AND p_new_status IN ('in_purchase', 'cancelled') THEN true
    -- From in_purchase
    WHEN v_current_status = 'in_purchase' AND p_new_status IN ('partial_delivery', 'in_logistics', 'cancelled') THEN true
    -- From partial_delivery
    WHEN v_current_status = 'partial_delivery' AND p_new_status IN ('in_logistics', 'cancelled') THEN true
    -- From in_logistics
    WHEN v_current_status = 'in_logistics' AND p_new_status IN ('delivered', 'cancelled') THEN true
    -- From delivered
    WHEN v_current_status = 'delivered' AND p_new_status IN ('invoiced', 'cancelled') THEN true
    -- From invoiced
    WHEN v_current_status = 'invoiced' AND p_new_status IN ('completed') THEN true
    ELSE false
  END;

  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'Invalid status transition: "%" -> "%"', v_current_status, p_new_status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Update order status
  UPDATE orders
  SET
    status = p_new_status,
    completed_at = CASE WHEN p_new_status = 'completed' THEN now() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END,
    cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN p_notes ELSE cancellation_reason END,
    payment_status = CASE WHEN p_new_status = 'payment_confirmed' THEN 'confirmed' ELSE payment_status END,
    updated_at = now()
  WHERE id = p_order_id;

  -- Create status history record
  INSERT INTO order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    notes
  )
  VALUES (
    p_order_id,
    v_current_status,
    p_new_status,
    v_caller_id,
    p_notes
  );

END;
$$;

COMMENT ON FUNCTION update_order_status IS
'Updates order status with validation of allowed transitions. Creates audit trail in order_status_history. Handles special cases: cancelled sets cancelled_at, completed sets completed_at, payment_confirmed updates payment_status.';

GRANT EXECUTE ON FUNCTION update_order_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status(uuid, text, text) TO service_role;


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
