import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

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

    if (body.mark_all) {
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

    if (!body.id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const { error } = await client
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Create a notification (internal use)
 * Body: { user_id, type, title, message, entity_type?, entity_id?, action_url?, priority? }
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const body = await request.json();

    if (!body.user_id || !body.type || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'user_id, type, title, message son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('notifications')
      .insert({
        organization_id: user.organization_id,
        user_id: body.user_id,
        type: body.type,
        title: body.title,
        message: body.message,
        entity_type: body.entity_type || null,
        entity_id: body.entity_id || null,
        action_url: body.action_url || null,
        priority: body.priority || 'normal',
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
