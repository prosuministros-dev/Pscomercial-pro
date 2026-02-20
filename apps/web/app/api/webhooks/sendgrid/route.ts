import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

/**
 * SendGrid Event Webhook handler.
 *
 * POST /api/webhooks/sendgrid
 *   - Receives an array of event objects from SendGrid.
 *   - Maps event types to email_logs status values.
 *   - Updates the email_logs table via the admin Supabase client.
 *   - Always returns 200 so SendGrid does not retry.
 *
 * GET /api/webhooks/sendgrid
 *   - Simple health-check endpoint.
 */

// ---------------------------------------------------------------------------
// Event-type mapping
// ---------------------------------------------------------------------------

const EVENT_STATUS_MAP: Record<string, string | null> = {
  delivered: 'delivered',
  open: 'opened',
  bounce: 'bounced',
  dropped: 'bounced',
  spamreport: 'failed',
  unsubscribe: 'failed',
  // Temporary states we intentionally skip
  deferred: null,
  processed: null,
};

// ---------------------------------------------------------------------------
// Signature verification (optional – requires SENDGRID_WEBHOOK_SIGNING_KEY)
// ---------------------------------------------------------------------------

function verifySendGridSignature(
  publicKey: string,
  payload: string,
  signature: string,
  timestamp: string,
): boolean {
  try {
    const timestampPayload = timestamp + payload;
    const decodedSignature = Buffer.from(signature, 'base64');

    const verifier = crypto.createVerify('sha256');
    verifier.update(timestampPayload);
    verifier.end();

    return verifier.verify(
      {
        key: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      },
      decodedSignature,
    );
  } catch {
    // Verification is best-effort; if it fails we rely on HTTPS + the
    // obscurity of the webhook URL.
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip the `.filter…` suffix that SendGrid appends to sg_message_id.
 * Example: "abc123.filterdrecv-574bc8…" → "abc123"
 */
function cleanMessageId(rawId: string): string {
  const dotIndex = rawId.indexOf('.');
  return dotIndex === -1 ? rawId : rawId.substring(0, dotIndex);
}

// ---------------------------------------------------------------------------
// GET – health check
// ---------------------------------------------------------------------------

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

// ---------------------------------------------------------------------------
// POST – process SendGrid events
// ---------------------------------------------------------------------------

interface SendGridEvent {
  email?: string;
  timestamp?: number;
  event?: string;
  sg_message_id?: string;
  reason?: string;
  response?: string;
  type?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------------------------
    // 1. Read raw body (needed for signature verification)
    // ------------------------------------------------------------------
    const rawBody = await request.text();

    // ------------------------------------------------------------------
    // 2. Optional signature verification
    // ------------------------------------------------------------------
    const signingKey = process.env.SENDGRID_WEBHOOK_SIGNING_KEY;

    if (signingKey) {
      const signature =
        request.headers.get('x-twilio-email-event-webhook-signature') ?? '';
      const timestamp =
        request.headers.get('x-twilio-email-event-webhook-timestamp') ?? '';

      if (!signature || !timestamp) {
        console.warn(
          '[sendgrid-webhook] Missing signature headers – rejecting request.',
        );
        // Still return 200 so SendGrid does not endlessly retry a
        // misconfigured signature setup during development.
        return NextResponse.json({ error: 'Missing signature headers' });
      }

      const isValid = verifySendGridSignature(
        signingKey,
        rawBody,
        signature,
        timestamp,
      );

      if (!isValid) {
        console.warn(
          '[sendgrid-webhook] Invalid signature – rejecting request.',
        );
        return NextResponse.json({ error: 'Invalid signature' });
      }
    }

    // ------------------------------------------------------------------
    // 3. Parse events
    // ------------------------------------------------------------------
    let events: SendGridEvent[];

    try {
      events = JSON.parse(rawBody);
    } catch {
      console.error('[sendgrid-webhook] Failed to parse request body.');
      return NextResponse.json({ error: 'Invalid JSON' });
    }

    if (!Array.isArray(events)) {
      console.error('[sendgrid-webhook] Body is not an array.');
      return NextResponse.json({ error: 'Expected array' });
    }

    if (events.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    // ------------------------------------------------------------------
    // 4. Process events
    // ------------------------------------------------------------------
    const client = getSupabaseServerAdminClient();

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const event of events) {
      try {
        const eventType = event.event;
        const rawMessageId = event.sg_message_id;

        // Skip if we don't have the minimum fields
        if (!eventType || !rawMessageId) {
          skipped++;
          continue;
        }

        // Look up the mapped status
        const mappedStatus = EVENT_STATUS_MAP[eventType] ?? null;

        if (mappedStatus === null || mappedStatus === undefined) {
          // Event type we intentionally ignore (e.g. deferred, processed)
          skipped++;
          continue;
        }

        const messageId = cleanMessageId(rawMessageId);

        // Build update payload
        const updatePayload: Record<string, unknown> = {
          status: mappedStatus,
        };

        // Attach error info when applicable
        if (
          mappedStatus === 'bounced' ||
          mappedStatus === 'failed'
        ) {
          const reason =
            event.reason || event.response || `SendGrid event: ${eventType}`;
          updatePayload.error_message = reason;
        }

        const { error: updateError } = await client
          .from('email_logs')
          .update(updatePayload)
          .eq('sendgrid_message_id', messageId);

        if (updateError) {
          console.error(
            `[sendgrid-webhook] DB update error for message ${messageId}:`,
            updateError.message,
          );
          errors++;
        } else {
          processed++;
        }
      } catch (eventError) {
        console.error(
          '[sendgrid-webhook] Error processing event:',
          eventError instanceof Error ? eventError.message : eventError,
        );
        errors++;
      }
    }

    console.log(
      `[sendgrid-webhook] Batch complete – processed: ${processed}, skipped: ${skipped}, errors: ${errors}`,
    );

    // Always return 200 so SendGrid does not retry
    return NextResponse.json({ processed, skipped, errors });
  } catch (error) {
    console.error(
      '[sendgrid-webhook] Unhandled error:',
      error instanceof Error ? error.message : error,
    );

    // Always return 200 to prevent SendGrid retries
    return NextResponse.json({ error: 'Internal error', processed: 0 });
  }
}
