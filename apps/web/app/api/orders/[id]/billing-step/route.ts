import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { getUserRoleSlugs, canEditBillingStep, getBillingStepNotifyTarget } from '~/lib/rbac/get-user-role-slugs';
import { notifyAreaTeam, createNotification } from '~/lib/notifications/create-notification';

type BillingStep = 'request' | 'approval' | 'remission' | 'invoice';

const STEP_VALUES: Record<BillingStep, string[]> = {
  request: ['not_required', 'required'],
  approval: ['pending', 'approved', 'rejected'],
  remission: ['not_generated', 'generated'],
  invoice: ['not_generated', 'generated'],
};

const STEP_COLUMNS: Record<BillingStep, string> = {
  request: 'adv_billing_request',
  approval: 'adv_billing_approval',
  remission: 'adv_billing_remission',
  invoice: 'adv_billing_invoice',
};

const STEP_LABELS: Record<BillingStep, string> = {
  request: 'Solicitud',
  approval: 'Aprobación',
  remission: 'Remisión',
  invoice: 'Factura',
};

// Steps must proceed sequentially
const STEP_ORDER: BillingStep[] = ['request', 'approval', 'remission', 'invoice'];

const updateBillingStepSchema = z.object({
  step: z.enum(['request', 'approval', 'remission', 'invoice']),
  value: z.string().min(1),
});

/**
 * GET /api/orders/[id]/billing-step
 * Get current billing step statuses
 * Permission: orders:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data: order, error } = await client
      .from('orders')
      .select(`
        id, requires_advance_billing,
        adv_billing_request, adv_billing_request_at, adv_billing_request_by,
        adv_billing_approval, adv_billing_approval_at, adv_billing_approval_by,
        adv_billing_remission, adv_billing_remission_at, adv_billing_remission_by,
        adv_billing_invoice, adv_billing_invoice_at, adv_billing_invoice_by
      `)
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Get user's roles to determine what they can edit
    const roleSlugs = await getUserRoleSlugs(user.id);
    const editableSteps = STEP_ORDER.filter((step) => canEditBillingStep(roleSlugs, step));

    return NextResponse.json({ ...order, editableSteps });
  } catch (error) {
    console.error('Error in GET /api/orders/[id]/billing-step:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/orders/[id]/billing-step
 * Update a specific billing step value
 * Permission: orders:manage_billing + role-based per step
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:manage_billing');
    if (!allowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para gestionar facturación' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = updateBillingStepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { step, value } = parsed.data;

    // Validate value is allowed for step
    const allowedValues = STEP_VALUES[step];
    if (!allowedValues.includes(value)) {
      return NextResponse.json(
        { error: `Valor "${value}" no válido para el paso ${STEP_LABELS[step]}` },
        { status: 400 },
      );
    }

    // Check role-based permission for this specific step
    const roleSlugs = await getUserRoleSlugs(user.id);
    if (!canEditBillingStep(roleSlugs, step)) {
      return NextResponse.json(
        { error: `Tu rol no tiene permiso para editar el paso: ${STEP_LABELS[step]}` },
        { status: 403 },
      );
    }

    // Fetch order to verify org + check current state
    const { data: order, error: fetchError } = await client
      .from('orders')
      .select('id, organization_id, order_number, requires_advance_billing, advisor_id, adv_billing_request, adv_billing_approval, adv_billing_remission, adv_billing_invoice')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (!order.requires_advance_billing) {
      return NextResponse.json(
        { error: 'Este pedido no requiere facturación anticipada' },
        { status: 400 },
      );
    }

    // Validate sequential order: previous steps must be in "done" state
    const stepIdx = STEP_ORDER.indexOf(step);
    for (let i = 0; i < stepIdx; i++) {
      const prevStep = STEP_ORDER[i]!;
      const prevCol = STEP_COLUMNS[prevStep] as keyof typeof order;
      const prevVal = order[prevCol] as string;
      // Each previous step must be in its "completed" state
      if (prevStep === 'request' && prevVal !== 'required') {
        return NextResponse.json(
          { error: `Debe completarse primero: ${STEP_LABELS[prevStep]}` },
          { status: 400 },
        );
      }
      if (prevStep === 'approval' && prevVal !== 'approved') {
        return NextResponse.json(
          { error: `Debe completarse primero: ${STEP_LABELS[prevStep]}` },
          { status: 400 },
        );
      }
      if ((prevStep === 'remission' || prevStep === 'invoice') && prevVal !== 'generated') {
        return NextResponse.json(
          { error: `Debe completarse primero: ${STEP_LABELS[prevStep]}` },
          { status: 400 },
        );
      }
    }

    // Build update
    const colName = STEP_COLUMNS[step];
    const updateData: Record<string, unknown> = {
      [colName]: value,
      [`${colName}_at`]: new Date().toISOString(),
      [`${colName}_by`]: user.id,
    };

    const { error: updateError } = await client
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating billing step:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el paso de facturación' },
        { status: 500 },
      );
    }

    // Send notifications to target area
    const targetRoles = getBillingStepNotifyTarget(step);
    for (const role of targetRoles) {
      await notifyAreaTeam(order.organization_id, role, {
        type: 'billing_step_change',
        title: `Facturación: ${STEP_LABELS[step]}`,
        message: `Pedido #${order.order_number} - ${STEP_LABELS[step]}: ${value}`,
        entityType: 'order',
        entityId: orderId,
        actionUrl: `/home/orders?id=${orderId}`,
      });
    }

    // For invoice step, also notify the assigned advisor
    if (step === 'invoice' && order.advisor_id) {
      await createNotification({
        organizationId: order.organization_id,
        userId: order.advisor_id,
        type: 'billing_step_change',
        title: 'Factura Generada',
        message: `La factura del pedido #${order.order_number} ha sido generada`,
        entityType: 'order',
        entityId: orderId,
        actionUrl: `/home/orders?id=${orderId}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]/billing-step:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
