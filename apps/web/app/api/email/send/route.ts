import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser, AuthError } from '~/lib/require-auth';
import { sendEmail } from '~/lib/email/send-email';

// --- Zod Schema ---
const sendEmailSchema = z.object({
  to: z.string().email('Dirección de email inválida'),
  toName: z.string().optional(),
  subject: z.string().min(1, 'subject es requerido'),
  html: z.string().optional(),
  templateKey: z.string().optional(),
  templateData: z.record(z.string()).optional(),
  entityType: z
    .enum(['quote', 'proforma', 'order', 'notification'])
    .optional(),
  entityId: z.string().uuid('entityId debe ser un UUID válido').optional(),
  attachments: z
    .array(
      z.object({
        content: z.string(),
        filename: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
});

/**
 * Replace all {{variable}} placeholders in a string with values from data.
 */
function applyTemplate(
  template: string,
  data: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return data[key] ?? match;
  });
}

/**
 * POST /api/email/send
 * Send an email using a template (from system_settings) or raw HTML.
 *
 * No specific permission check here — the calling routes are responsible
 * for verifying their own permissions before invoking this endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const body = await request.json();
    const parsed = sendEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const {
      to,
      toName,
      templateKey,
      templateData,
      entityType,
      entityId,
      attachments,
    } = parsed.data;

    let resolvedSubject = parsed.data.subject;
    let resolvedHtml = parsed.data.html;

    // --- Template resolution ---
    if (templateKey) {
      const settingKey = `email_template:${templateKey}`;

      const { data: setting, error: settingError } = await client
        .from('system_settings')
        .select('value')
        .eq('organization_id', user.organization_id)
        .eq('key', settingKey)
        .single();

      if (settingError || !setting) {
        return NextResponse.json(
          { error: `Plantilla de email no encontrada: ${templateKey}` },
          { status: 404 },
        );
      }

      const tpl = setting.value as {
        subject?: string;
        html_body?: string;
      };

      if (!tpl.html_body) {
        return NextResponse.json(
          { error: `Plantilla "${templateKey}" no tiene html_body` },
          { status: 400 },
        );
      }

      const vars = templateData ?? {};
      resolvedSubject = tpl.subject
        ? applyTemplate(tpl.subject, vars)
        : resolvedSubject;
      resolvedHtml = applyTemplate(tpl.html_body, vars);
    }

    // At this point we must have HTML content
    if (!resolvedHtml) {
      return NextResponse.json(
        {
          error:
            'Se requiere html o templateKey para enviar el email',
        },
        { status: 400 },
      );
    }

    // --- Send the email ---
    const result = await sendEmail({
      to,
      toName,
      subject: resolvedSubject,
      html: resolvedHtml,
      organizationId: user.organization_id,
      entityType,
      entityId,
      attachments,
    });

    return NextResponse.json({
      success: result.success,
      emailLogId: result.emailLogId,
      error: result.error,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('Error in POST /api/email/send:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al enviar email' },
      { status: 500 },
    );
  }
}
