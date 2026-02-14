import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

// --- Zod Schemas ---
const markReadSchema = z.object({
  id: z.string().uuid().optional(),
  mark_all: z.boolean().optional(),
}).refine(data => data.id || data.mark_all, {
  message: 'Se requiere id o mark_all',
});

const createNotificationSchema = z.object({
  type: z.string().min(1, 'type es requerido'),
  title: z.string().min(1, 'title es requerido'),
  message: z.string().min(1, 'message es requerido'),
  entity_type: z.string().nullish(),
  entity_id: z.string().uuid().nullish(),
  action_url: z.string().nullish(),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  // user_id intentionally omitted - forced to current user to prevent privilege escalation
});

/**
 * GET /api/notifications
 * List notifications for current user
 * Query params: filter ('all'|'unread'), limit
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    let query = client
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = (data || []).filter((n: { is_read: boolean }) => !n.is_read).length;

    return NextResponse.json({
      data: data || [],
      unread_count: filter === 'unread' ? (count || 0) : unreadCount,
    });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/notifications
 * Mark notifications as read
 * Body: { id: string } or { mark_all: true }
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    if (parsed.data.mark_all) {
      const { error } = await client
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (parsed.data.id) {
      const { error } = await client
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', parsed.data.id)
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Create a self-notification (for current user only)
 * SECURITY: user_id is forced to current user to prevent privilege escalation.
 * System notifications (to other users) are created server-side in other routes.
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const body = await request.json();
    const parsed = createNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { type, title, message, entity_type, entity_id, action_url, priority } = parsed.data;

    const { data, error } = await client
      .from('notifications')
      .insert({
        organization_id: user.organization_id,
        user_id: user.id, // SECURITY: Always current user, never from body
        type,
        title,
        message,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        action_url: action_url || null,
        priority,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
