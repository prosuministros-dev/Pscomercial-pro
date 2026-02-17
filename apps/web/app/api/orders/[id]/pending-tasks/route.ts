import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

const createTaskSchema = z.object({
  order_item_id: z.string().uuid().optional(),
  task_type: z.enum(['purchase', 'reception', 'dispatch', 'delivery', 'billing', 'license_activation']),
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  due_date: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
});

const updateTaskSchema = z.object({
  task_id: z.string().uuid(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
});

/**
 * GET /api/orders/[id]/pending-tasks
 * List pending tasks for an order
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

    // Verify order belongs to org
    const { data: order } = await client
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { data, error } = await client
      .from('order_pending_tasks')
      .select(`
        *,
        assigned_user:profiles!order_pending_tasks_assigned_to_fkey(id, full_name)
      `)
      .eq('organization_id', user.organization_id)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending tasks:', error);
      return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/orders/[id]/pending-tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders/[id]/pending-tasks
 * Create a new pending task
 * Permission: orders:update
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear tareas' }, { status: 403 });
    }

    // Verify order belongs to org
    const { data: order } = await client
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Calculate traffic light based on due_date
    let trafficLight = 'green';
    if (parsed.data.due_date) {
      const dueDate = new Date(parsed.data.due_date);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 0) trafficLight = 'red';
      else if (daysUntilDue <= 3) trafficLight = 'yellow';
    }

    const { data, error } = await client
      .from('order_pending_tasks')
      .insert({
        organization_id: user.organization_id,
        order_id: orderId,
        order_item_id: parsed.data.order_item_id || null,
        task_type: parsed.data.task_type,
        title: parsed.data.title,
        description: parsed.data.description || null,
        priority: parsed.data.priority,
        traffic_light: trafficLight,
        due_date: parsed.data.due_date || null,
        assigned_to: parsed.data.assigned_to || null,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders/[id]/pending-tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/orders/[id]/pending-tasks
 * Update a pending task (status, priority, assignment)
 * Permission: orders:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar tareas' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Datos inválidos' }, { status: 400 });
    }

    // Verify task belongs to org and order
    const { data: task, error: taskError } = await client
      .from('order_pending_tasks')
      .select('id')
      .eq('id', parsed.data.task_id)
      .eq('organization_id', user.organization_id)
      .eq('order_id', orderId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.status) {
      updates.status = parsed.data.status;
      if (parsed.data.status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user.id;
      }
    }
    if (parsed.data.priority) updates.priority = parsed.data.priority;
    if (parsed.data.assigned_to) updates.assigned_to = parsed.data.assigned_to;

    const { error: updateError } = await client
      .from('order_pending_tasks')
      .update(updates)
      .eq('id', parsed.data.task_id);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: 'Error al actualizar tarea' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]/pending-tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
