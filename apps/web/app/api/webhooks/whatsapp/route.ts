import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { verifyWebhookSignature } from '~/lib/whatsapp/verify-signature';
import { processWithChatbot } from '~/lib/whatsapp/chatbot';
import { withRateLimit } from '~/lib/with-rate-limit';

// ---------------------------------------------------------------------------
// Types for Meta webhook payload
// ---------------------------------------------------------------------------

interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppChange[];
}

interface WhatsAppChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppIncomingMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: string;
}

interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  button?: { text: string; payload: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
}

interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/webhooks/whatsapp - Webhook verification
// ---------------------------------------------------------------------------

/**
 * Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge
 * to verify the webhook URL during setup.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && token === VERIFY_TOKEN) {
    console.log('[whatsapp-webhook] Verification successful');
    // Return challenge as plain text (Meta requirement)
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[whatsapp-webhook] Verification failed - token mismatch or missing params');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/whatsapp - Process incoming messages & status updates
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const limited = withRateLimit(request, { tier: 'webhook', prefix: 'webhook:whatsapp' });
  if (limited) return limited;

  try {
    // ------------------------------------------------------------------
    // 1. Verify webhook signature
    // ------------------------------------------------------------------
    const META_APP_SECRET = process.env.META_APP_SECRET;

    if (!META_APP_SECRET) {
      console.error('[whatsapp-webhook] META_APP_SECRET not configured');
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    if (!verifyWebhookSignature(rawBody, signature, META_APP_SECRET)) {
      console.warn('[whatsapp-webhook] Invalid webhook signature');
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // ------------------------------------------------------------------
    // 2. Parse webhook body
    // ------------------------------------------------------------------
    let payload: { object: string; entry: WhatsAppWebhookEntry[] };

    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[whatsapp-webhook] Failed to parse webhook body');
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Use admin client - no user session available in webhooks
    const adminClient = getSupabaseServerAdminClient();

    // ------------------------------------------------------------------
    // 3. Process each entry
    // ------------------------------------------------------------------
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const { metadata, messages, statuses, contacts } = change.value;
        const phoneNumberId = metadata.phone_number_id;

        // Find the whatsapp_account for this phone_number_id
        const { data: account, error: accountError } = await adminClient
          .from('whatsapp_accounts')
          .select('id, organization_id, access_token')
          .eq('phone_number_id', phoneNumberId)
          .eq('status', 'active')
          .single();

        if (accountError || !account) {
          console.warn(
            `[whatsapp-webhook] No active account for phone_number_id=${phoneNumberId}`,
          );
          continue;
        }

        // ---------------------------------------------------------------
        // 3a. Process incoming messages
        // ---------------------------------------------------------------
        if (messages && messages.length > 0) {
          const contactMap = new Map<string, string>();
          if (contacts) {
            for (const c of contacts) {
              contactMap.set(c.wa_id, c.profile.name);
            }
          }

          for (const msg of messages) {
            try {
              await processIncomingMessage(
                adminClient,
                account,
                msg,
                contactMap.get(msg.from) || null,
              );
            } catch (msgError) {
              console.error(
                `[whatsapp-webhook] Error processing message ${msg.id}:`,
                msgError instanceof Error ? msgError.message : msgError,
              );
            }
          }
        }

        // ---------------------------------------------------------------
        // 3b. Process status updates
        // ---------------------------------------------------------------
        if (statuses && statuses.length > 0) {
          for (const statusUpdate of statuses) {
            try {
              await processStatusUpdate(adminClient, statusUpdate);
            } catch (statusError) {
              console.error(
                `[whatsapp-webhook] Error processing status for ${statusUpdate.id}:`,
                statusError instanceof Error ? statusError.message : statusError,
              );
            }
          }
        }
      }
    }

    // Always respond 200 quickly (Meta requires < 20s response)
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error(
      '[whatsapp-webhook] Unhandled error:',
      error instanceof Error ? error.message : error,
    );
    // Always return 200 to prevent Meta retries
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// Helper: Process an incoming message
// ---------------------------------------------------------------------------

async function processIncomingMessage(
  adminClient: ReturnType<typeof getSupabaseServerAdminClient>,
  account: { id: string; organization_id: string; access_token: string },
  msg: WhatsAppIncomingMessage,
  contactName: string | null,
) {
  // 1. Find or create conversation
  const { data: existingConv } = await adminClient
    .from('whatsapp_conversations')
    .select('id, status')
    .eq('whatsapp_account_id', account.id)
    .eq('customer_phone', msg.from)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let conversationId: string;

  if (existingConv) {
    conversationId = existingConv.id;
  } else {
    // Create new conversation
    const { data: newConv, error: createError } = await adminClient
      .from('whatsapp_conversations')
      .insert({
        organization_id: account.organization_id,
        whatsapp_account_id: account.id,
        customer_phone: msg.from,
        customer_name: contactName,
        status: 'bot',
        conversation_type: 'inbound',
      })
      .select('id')
      .single();

    if (createError || !newConv) {
      console.error('[whatsapp-webhook] Failed to create conversation:', createError);
      return;
    }

    conversationId = newConv.id;
  }

  // 2. Extract message content
  const { content, messageType, mediaUrl } = extractMessageContent(msg);

  // 3. Save inbound message
  const { data: savedMessage, error: insertError } = await adminClient
    .from('whatsapp_messages')
    .insert({
      organization_id: account.organization_id,
      conversation_id: conversationId,
      wa_message_id: msg.id,
      direction: 'inbound',
      sender_type: 'customer',
      message_type: messageType,
      content,
      media_url: mediaUrl,
      status: 'delivered',
      metadata: { timestamp: msg.timestamp },
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[whatsapp-webhook] Failed to save message:', insertError);
    return;
  }

  // 4. Update conversation timestamps and contact name
  const updateData: Record<string, unknown> = {
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (contactName && !existingConv) {
    updateData.customer_name = contactName;
  }

  await adminClient
    .from('whatsapp_conversations')
    .update(updateData)
    .eq('id', conversationId);

  // 5. Process with chatbot (non-blocking, best-effort)
  try {
    await processWithChatbot({
      adminClient,
      accountId: account.id,
      organizationId: account.organization_id,
      conversationId,
      messageId: savedMessage.id,
      customerPhone: msg.from,
      customerName: contactName,
      messageContent: content || '',
      messageType,
      encryptedAccessToken: account.access_token,
    });
  } catch (chatbotError) {
    console.error(
      '[whatsapp-webhook] Chatbot processing error:',
      chatbotError instanceof Error ? chatbotError.message : chatbotError,
    );
  }
}

// ---------------------------------------------------------------------------
// Helper: Process a status update
// ---------------------------------------------------------------------------

async function processStatusUpdate(
  adminClient: ReturnType<typeof getSupabaseServerAdminClient>,
  statusUpdate: WhatsAppStatus,
) {
  const updateData: Record<string, unknown> = {
    status: statusUpdate.status,
  };

  if (statusUpdate.status === 'failed' && statusUpdate.errors?.length) {
    updateData.error_code = String(statusUpdate.errors[0].code);
    updateData.error_message = statusUpdate.errors[0].title;
  }

  const { error } = await adminClient
    .from('whatsapp_messages')
    .update(updateData)
    .eq('wa_message_id', statusUpdate.id);

  if (error) {
    console.error(
      `[whatsapp-webhook] Failed to update status for wa_message_id=${statusUpdate.id}:`,
      error.message,
    );
  }
}

// ---------------------------------------------------------------------------
// Helper: Extract content from different message types
// ---------------------------------------------------------------------------

function extractMessageContent(msg: WhatsAppIncomingMessage): {
  content: string | null;
  messageType: string;
  mediaUrl: string | null;
} {
  switch (msg.type) {
    case 'text':
      return {
        content: msg.text?.body || null,
        messageType: 'text',
        mediaUrl: null,
      };

    case 'image':
      return {
        content: msg.image?.caption || null,
        messageType: 'image',
        mediaUrl: msg.image?.id || null,
      };

    case 'document':
      return {
        content: msg.document?.caption || msg.document?.filename || null,
        messageType: 'document',
        mediaUrl: msg.document?.id || null,
      };

    case 'audio':
      return {
        content: null,
        messageType: 'audio',
        mediaUrl: msg.audio?.id || null,
      };

    case 'video':
      return {
        content: msg.video?.mime_type || null,
        messageType: 'video',
        mediaUrl: msg.video?.id || null,
      };

    case 'location':
      return {
        content: msg.location
          ? `${msg.location.latitude},${msg.location.longitude}${msg.location.name ? ` - ${msg.location.name}` : ''}`
          : null,
        messageType: 'location',
        mediaUrl: null,
      };

    case 'button':
      return {
        content: msg.button?.text || msg.button?.payload || null,
        messageType: 'button',
        mediaUrl: null,
      };

    case 'interactive':
      return {
        content:
          msg.interactive?.button_reply?.title ||
          msg.interactive?.list_reply?.title ||
          null,
        messageType: 'interactive',
        mediaUrl: null,
      };

    default:
      return {
        content: null,
        messageType: msg.type || 'unknown',
        mediaUrl: null,
      };
  }
}
