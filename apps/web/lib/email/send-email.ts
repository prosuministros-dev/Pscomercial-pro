import { getSupabaseServerClient } from '@kit/supabase/server-client';

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  attachments?: Array<{ content: string; filename: string; type: string }>;
  organizationId: string;
  entityType?: 'quote' | 'proforma' | 'order' | 'notification';
  entityId?: string;
}

interface SendEmailResult {
  success: boolean;
  emailLogId?: string;
  error?: string;
}

/**
 * Send email via SendGrid (if configured) and log to email_logs.
 * Graceful degradation: if SENDGRID_API_KEY is not set, logs with status 'queued'.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@prosuministros.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Prosuministros';
  const client = getSupabaseServerClient();

  try {
    let status: 'sent' | 'queued' | 'failed' = 'queued';
    let sendgridMessageId: string | undefined;
    let errorMessage: string | undefined;

    // Attempt SendGrid send if API key is configured
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg: Record<string, unknown> = {
          to: options.to,
          from: { email: fromEmail, name: fromName },
          subject: options.subject,
          html: options.html,
        };

        if (options.attachments?.length) {
          msg.attachments = options.attachments;
        }

        const [response] = await sgMail.default.send(msg as never);
        sendgridMessageId = response?.headers?.['x-message-id'] as string;
        status = 'sent';
      } catch (sgError) {
        console.error('SendGrid send failed:', sgError);
        status = 'failed';
        errorMessage = sgError instanceof Error ? sgError.message : 'SendGrid error';
      }
    }

    // Log to email_logs
    const { data: emailLog, error: logError } = await client
      .from('email_logs')
      .insert({
        organization_id: options.organizationId,
        to_email: options.to,
        to_name: options.toName || null,
        from_email: fromEmail,
        subject: options.subject,
        entity_type: options.entityType || null,
        entity_id: options.entityId || null,
        status,
        sendgrid_message_id: sendgridMessageId || null,
        error_message: errorMessage || null,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error logging email:', logError);
    }

    return {
      success: status === 'sent' || status === 'queued',
      emailLogId: emailLog?.id,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Error in sendEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
