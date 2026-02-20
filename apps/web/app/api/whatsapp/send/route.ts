import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';
import { decrypt } from '~/lib/encryption';
import { sendTextMessage, sendTemplateMessage } from '~/lib/whatsapp/send-message';

// --- Zod Schema ---
const sendMessageSchema = z.object({
  conversationId: z.string().uuid('conversationId debe ser un UUID valido'),
  message: z.string().min(1, 'message es requerido'),
  type: z.enum(['text', 'template']).optional().default('text'),
  templateName: z.string().optional(),
  templateParams: z.record(z.string()).optional(),
});

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message (manual agent chat).
 * Permission required: whatsapp:send
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'whatsapp:send');
    if (!allowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para enviar mensajes de WhatsApp' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos invalidos' },
        { status: 400 },
      );
    }

    const { conversationId, message, type, templateName, templateParams } = parsed.data;

    // ------------------------------------------------------------------
    // 1. Load conversation with its whatsapp_account
    // ------------------------------------------------------------------
    const { data: conversation, error: convError } = await client
      .from('whatsapp_conversations')
      .select(`
        *,
        whatsapp_account:whatsapp_accounts!whatsapp_conversations_whatsapp_account_id_fkey(*)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversacion no encontrada' },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // 2. Verify conversation belongs to user's organization
    // ------------------------------------------------------------------
    if (conversation.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Conversacion no encontrada' },
        { status: 404 },
      );
    }

    const account = conversation.whatsapp_account;
    if (!account || account.status !== 'active') {
      return NextResponse.json(
        { error: 'La cuenta de WhatsApp no esta activa' },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // 3. Decrypt access token
    // ------------------------------------------------------------------
    let accessToken: string;
    try {
      accessToken = decrypt(account.access_token);
    } catch (decryptError) {
      console.error('[whatsapp-send] Token decryption failed:', decryptError);
      return NextResponse.json(
        { error: 'Error al descifrar el token de acceso' },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 4. Send message via WhatsApp Cloud API
    // ------------------------------------------------------------------
    let waMessageId: string | null = null;
    let sendError: string | null = null;

    try {
      if (type === 'template') {
        if (!templateName) {
          return NextResponse.json(
            { error: 'templateName es requerido para mensajes de tipo template' },
            { status: 400 },
          );
        }

        const result = await sendTemplateMessage({
          phoneNumberId: account.phone_number_id,
          accessToken,
          to: conversation.customer_phone,
          templateName,
          templateParams: templateParams || {},
        });
        waMessageId = result.messageId;
      } else {
        const result = await sendTextMessage({
          phoneNumberId: account.phone_number_id,
          accessToken,
          to: conversation.customer_phone,
          text: message,
        });
        waMessageId = result.messageId;
      }
    } catch (err) {
      console.error('[whatsapp-send] Send failed:', err);
      sendError = err instanceof Error ? err.message : 'Error al enviar mensaje';
    }

    // ------------------------------------------------------------------
    // 5. Save outbound message to whatsapp_messages
    // ------------------------------------------------------------------
    const { data: savedMessage, error: insertError } = await client
      .from('whatsapp_messages')
      .insert({
        organization_id: user.organization_id,
        conversation_id: conversationId,
        wa_message_id: waMessageId,
        direction: 'outbound',
        sender_type: 'agent',
        sender_id: user.id,
        message_type: type === 'template' ? 'template' : 'text',
        content: message,
        template_name: type === 'template' ? templateName : null,
        template_params: type === 'template' ? templateParams : null,
        status: sendError ? 'failed' : 'sent',
        error_message: sendError,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[whatsapp-send] Message insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 6. Update conversation last_message_at
    // ------------------------------------------------------------------
    await client
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (sendError) {
      return NextResponse.json(
        { error: sendError, data: savedMessage },
        { status: 502 },
      );
    }

    return NextResponse.json({
      data: savedMessage,
      wa_message_id: waMessageId,
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/whatsapp/send');
  }
}
