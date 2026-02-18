import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/whatsapp/conversations
 * Lista paginada de conversaciones de WhatsApp con filtros opcionales.
 * Permission required: whatsapp:view
 *
 * Query params:
 *   - page (default 1)
 *   - limit (default 20)
 *   - status: active | closed | bot | human_takeover
 *   - search: buscar por customer_name o customer_phone
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'whatsapp:view');
    if (!allowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver conversaciones de WhatsApp' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // ------------------------------------------------------------------
    // Build query with last message and unread count
    // ------------------------------------------------------------------
    let query = client
      .from('whatsapp_conversations')
      .select(
        `
        *,
        whatsapp_account:whatsapp_accounts!whatsapp_conversations_whatsapp_account_id_fkey(
          id, display_phone, business_name
        ),
        assigned_agent:profiles!whatsapp_conversations_assigned_agent_id_fkey(
          id, full_name, email
        ),
        customer:customers!whatsapp_conversations_customer_id_fkey(
          id, business_name
        ),
        lead:leads!whatsapp_conversations_lead_id_fkey(
          id, business_name, lead_number
        ),
        last_message:whatsapp_messages(
          id, content, message_type, direction, sender_type, status, created_at
        )
        `,
        { count: 'exact' },
      )
      .eq('organization_id', user.organization_id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, referencedTable: 'whatsapp_messages' })
      .limit(1, { referencedTable: 'whatsapp_messages' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`,
      );
    }

    const { data: conversations, error, count } = await query;

    if (error) {
      console.error('Error fetching WhatsApp conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ------------------------------------------------------------------
    // Fetch unread counts for each conversation
    // ------------------------------------------------------------------
    const conversationIds = (conversations || []).map((c) => c.id);
    let unreadMap: Record<string, number> = {};

    if (conversationIds.length > 0) {
      const { data: unreadData, error: unreadError } = await client
        .from('whatsapp_messages')
        .select('conversation_id', { count: 'exact', head: false })
        .in('conversation_id', conversationIds)
        .eq('direction', 'inbound')
        .eq('status', 'delivered');

      if (!unreadError && unreadData) {
        // Count per conversation
        for (const msg of unreadData) {
          const cId = msg.conversation_id;
          unreadMap[cId] = (unreadMap[cId] || 0) + 1;
        }
      }
    }

    // Enrich conversations with unread_count and flatten last_message
    const enriched = (conversations || []).map((conv) => ({
      ...conv,
      last_message: conv.last_message?.[0] || null,
      unread_count: unreadMap[conv.id] || 0,
    }));

    return NextResponse.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/whatsapp/conversations');
  }
}
