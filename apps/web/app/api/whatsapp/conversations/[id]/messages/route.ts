import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/whatsapp/conversations/[id]/messages
 * Lista paginada de mensajes de una conversacion de WhatsApp.
 * Los mensajes se devuelven en orden cronologico (mas antiguos primero).
 * Permission required: whatsapp:view
 *
 * Query params:
 *   - page (default 1)
 *   - limit (default 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'whatsapp:view');
    if (!allowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver mensajes de WhatsApp' },
        { status: 403 },
      );
    }

    const conversationId = params.id;

    // ------------------------------------------------------------------
    // 1. Verify conversation exists and belongs to user's organization
    // ------------------------------------------------------------------
    const { data: conversation, error: convError } = await client
      .from('whatsapp_conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', user.organization_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversacion no encontrada' },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // 2. Fetch paginated messages (oldest first)
    // ------------------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const { data: messages, error, count } = await client
      .from('whatsapp_messages')
      .select(
        `
        *,
        sender:profiles!whatsapp_messages_sender_id_fkey(
          id, full_name, email
        )
        `,
        { count: 'exact' },
      )
      .eq('conversation_id', conversationId)
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching WhatsApp messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ------------------------------------------------------------------
    // 3. Mark inbound messages as read (best-effort)
    // ------------------------------------------------------------------
    await client
      .from('whatsapp_messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .eq('direction', 'inbound')
      .eq('status', 'delivered');

    return NextResponse.json({
      data: messages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/whatsapp/conversations/[id]/messages');
  }
}
