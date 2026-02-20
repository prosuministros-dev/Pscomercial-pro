import { decrypt } from '~/lib/encryption';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = 'https://graph.facebook.com';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WhatsAppAccount {
  phone_number_id: string;
  /** AES-256-GCM encrypted access token (iv:authTag:ciphertext) */
  access_token: string;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface InteractiveMessage {
  type: 'button' | 'list';
  header?: { type: 'text'; text: string };
  body: { text: string };
  footer?: { text: string };
  action: Record<string, unknown>;
}

export interface TemplateParam {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  [key: string]: unknown;
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: string;
  index?: number;
  parameters: TemplateParam[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildUrl(phoneNumberId: string, endpoint = 'messages'): string {
  return `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${phoneNumberId}/${endpoint}`;
}

function buildHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Low-level fetch wrapper that decrypts the token, calls the Graph API,
 * and normalises the response into a `WhatsAppResult`.
 */
async function callGraphApi(
  waAccount: WhatsAppAccount,
  body: Record<string, unknown>,
): Promise<WhatsAppResult> {
  try {
    const token = decrypt(waAccount.access_token);
    const url = buildUrl(waAccount.phone_number_id);

    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        ...body,
      }),
    });

    const json = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const errorPayload = json.error as Record<string, unknown> | undefined;
      const errorMessage =
        (errorPayload?.message as string) ??
        `WhatsApp API error (${response.status})`;

      console.error('[WhatsApp] API error:', errorMessage, json);

      return { success: false, error: errorMessage };
    }

    // The messages endpoint returns { messages: [{ id: 'wamid.xxx' }] }
    const messages = json.messages as Array<{ id: string }> | undefined;
    const messageId = messages?.[0]?.id;

    return { success: true, messageId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error sending message';

    console.error('[WhatsApp] sendMessage exception:', message);

    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a plain text message to a WhatsApp number.
 *
 * @param waAccount - WhatsApp Business account credentials
 * @param to        - Recipient phone number in international format (e.g. "573001234567")
 * @param text      - Message body
 */
export async function sendTextMessage(
  waAccount: WhatsAppAccount,
  to: string,
  text: string,
): Promise<WhatsAppResult> {
  return callGraphApi(waAccount, {
    to,
    type: 'text',
    text: { body: text },
  });
}

/**
 * Send an interactive message (buttons or list) to a WhatsApp number.
 *
 * @param waAccount   - WhatsApp Business account credentials
 * @param to          - Recipient phone number
 * @param interactive - Interactive payload (type, body, action, etc.)
 */
export async function sendInteractiveMessage(
  waAccount: WhatsAppAccount,
  to: string,
  interactive: InteractiveMessage,
): Promise<WhatsAppResult> {
  return callGraphApi(waAccount, {
    to,
    type: 'interactive',
    interactive,
  });
}

/**
 * Send a pre-approved Meta template message.
 *
 * @param waAccount    - WhatsApp Business account credentials
 * @param to           - Recipient phone number
 * @param templateName - Name of the approved template
 * @param params       - Template component parameters
 */
export async function sendTemplateMessage(
  waAccount: WhatsAppAccount,
  to: string,
  templateName: string,
  params: TemplateComponent[],
): Promise<WhatsAppResult> {
  return callGraphApi(waAccount, {
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es' },
      components: params,
    },
  });
}

/**
 * Mark an incoming message as read (double blue check).
 *
 * @param waAccount - WhatsApp Business account credentials
 * @param messageId - The wamid of the incoming message
 */
export async function markMessageAsRead(
  waAccount: WhatsAppAccount,
  messageId: string,
): Promise<WhatsAppResult> {
  try {
    const token = decrypt(waAccount.access_token);
    const url = buildUrl(waAccount.phone_number_id);

    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });

    const json = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const errorPayload = json.error as Record<string, unknown> | undefined;
      const errorMessage =
        (errorPayload?.message as string) ??
        `WhatsApp API error (${response.status})`;

      console.error('[WhatsApp] markAsRead error:', errorMessage);

      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error marking as read';

    console.error('[WhatsApp] markAsRead exception:', message);

    return { success: false, error: message };
  }
}
