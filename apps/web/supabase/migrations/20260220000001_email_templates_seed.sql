-- ============================================================================
-- PSCOMERCIAL-PRO - EMAIL TEMPLATES SEED & WHATSAPP LEAD RPC
-- Migration: 20260220000001_email_templates_seed.sql
-- Date: 2026-02-20
-- Description: Seeds 7 email template definitions into system_settings
--              and creates create_lead_from_whatsapp RPC
-- FASE: FASE-07 (Email Templates Architecture)
-- Dependencies: 20260212000001 (schema), 20260212000005 (business_functions),
--               20260213020001 (lead_consecutive), 20260213020002 (auto_assign_lead)
-- ============================================================================


-- ============================================================================
-- FUNCTION 1: seed_email_templates(p_org_id uuid)
-- Seeds 7 email template definitions as system_settings for an organization.
-- Uses ON CONFLICT to be idempotent (safe to re-run).
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_email_templates(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate organization exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization not found: %', p_org_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- ========================================================================
  -- Template 1: lead_assigned
  -- Notify advisor when a new lead is assigned to them
  -- ========================================================================
  INSERT INTO system_settings (organization_id, key, value, description)
  VALUES (
    p_org_id,
    'email_template:lead_assigned',
    jsonb_build_object(
      'subject', 'Nuevo lead asignado: {{lead_number}}',
      'html_body', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Lead Asignado</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:''Segoe UI'',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#161052 0%,#1a1462 50%,#00C8CF 100%);padding:32px 40px;text-align:center;">
              <img src="{{logo_url}}" alt="PROSUMINISTROS" height="40" style="height:40px;margin-bottom:8px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Nuevo Lead Asignado</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Hola <strong>{{advisor_name}}</strong>,
              </p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Se te ha asignado un nuevo lead. Por favor revisa los detalles y gestiona el contacto lo antes posible.
              </p>
              <!-- Lead Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fb;border-radius:8px;border:1px solid #e8eaed;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;width:140px;">N&uacute;mero de Lead</td>
                        <td style="padding:6px 0;color:#161052;font-size:15px;font-weight:600;">#{{lead_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Empresa</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{business_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Contacto</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{contact_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Tel&eacute;fono</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{phone}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Email</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{email}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Canal</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{channel}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;">Requerimiento</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{requirement}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="{{lead_url}}" style="display:inline-block;background-color:#00C8CF;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      Ver Lead
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:24px 40px;border-top:1px solid #e8eaed;">
              <p style="color:#999;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                Este es un mensaje autom&aacute;tico de <strong>PROSUMINISTROS</strong>.<br/>
                &copy; {{current_year}} PROSUMINISTROS S.A.S. Todos los derechos reservados.<br/>
                <a href="{{app_url}}" style="color:#00C8CF;text-decoration:none;">Acceder a la plataforma</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
      'variables', jsonb_build_array(
        'lead_number', 'advisor_name', 'business_name', 'contact_name',
        'phone', 'email', 'channel', 'requirement', 'lead_url',
        'logo_url', 'app_url', 'current_year'
      ),
      'description', 'Notificacion al asesor cuando se le asigna un nuevo lead. Se envia automaticamente tras la asignacion (manual o automatica).'
    ),
    'Plantilla de email: notificacion de lead asignado al asesor'
  )
  ON CONFLICT (organization_id, key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();

  -- ========================================================================
  -- Template 2: quote_proforma
  -- Send proforma/quote to client
  -- ========================================================================
  INSERT INTO system_settings (organization_id, key, value, description)
  VALUES (
    p_org_id,
    'email_template:quote_proforma',
    jsonb_build_object(
      'subject', 'Cotización {{quote_number}} - {{company_name}}',
      'html_body', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotizaci&oacute;n</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:''Segoe UI'',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#161052 0%,#1a1462 50%,#00C8CF 100%);padding:32px 40px;text-align:center;">
              <img src="{{logo_url}}" alt="PROSUMINISTROS" height="40" style="height:40px;margin-bottom:8px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Cotizaci&oacute;n #{{quote_number}}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Estimado/a <strong>{{contact_name}}</strong>,
              </p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Gracias por su inter&eacute;s en nuestros productos y servicios. Adjunto encontrar&aacute;
                la cotizaci&oacute;n solicitada con los detalles de su requerimiento.
              </p>
              <!-- Quote Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fb;border-radius:8px;border:1px solid #e8eaed;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;width:160px;">N&uacute;mero de Cotizaci&oacute;n</td>
                        <td style="padding:6px 0;color:#161052;font-size:15px;font-weight:600;">#{{quote_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Fecha</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{quote_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">V&aacute;lida hasta</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{valid_until}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Asesor comercial</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{advisor_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Subtotal</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{subtotal}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">IVA (19%)</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{tax_amount}}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 6px;color:#161052;font-size:14px;font-weight:700;border-top:1px solid #e0e0e0;">Total</td>
                        <td style="padding:8px 0 6px;color:#161052;font-size:18px;font-weight:700;border-top:1px solid #e0e0e0;">{{total_amount}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                {{custom_message}}
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="{{quote_url}}" style="display:inline-block;background-color:#00C8CF;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      Ver Cotizaci&oacute;n Completa
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#999;font-size:13px;line-height:1.5;margin:24px 0 0;text-align:center;">
                Esta cotizaci&oacute;n es v&aacute;lida hasta el <strong>{{valid_until}}</strong>.
                Si tiene alguna pregunta, no dude en contactarnos.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:24px 40px;border-top:1px solid #e8eaed;">
              <p style="color:#999;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                <strong>PROSUMINISTROS S.A.S.</strong><br/>
                {{company_address}}<br/>
                Tel: {{company_phone}} | {{company_email}}<br/>
                &copy; {{current_year}} Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
      'variables', jsonb_build_array(
        'quote_number', 'company_name', 'contact_name', 'quote_date',
        'valid_until', 'advisor_name', 'subtotal', 'tax_amount',
        'total_amount', 'custom_message', 'quote_url',
        'logo_url', 'company_address', 'company_phone', 'company_email', 'current_year'
      ),
      'description', 'Envio de cotizacion/proforma al cliente. Incluye resumen de montos y enlace para ver el detalle completo.'
    ),
    'Plantilla de email: envio de cotizacion/proforma al cliente'
  )
  ON CONFLICT (organization_id, key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();

  -- ========================================================================
  -- Template 3: quote_reminder
  -- Reminder that quote is about to expire
  -- ========================================================================
  INSERT INTO system_settings (organization_id, key, value, description)
  VALUES (
    p_org_id,
    'email_template:quote_reminder',
    jsonb_build_object(
      'subject', 'Tu cotización {{quote_number}} está por vencer',
      'html_body', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotizaci&oacute;n por Vencer</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:''Segoe UI'',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#161052 0%,#1a1462 50%,#00C8CF 100%);padding:32px 40px;text-align:center;">
              <img src="{{logo_url}}" alt="PROSUMINISTROS" height="40" style="height:40px;margin-bottom:8px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Cotizaci&oacute;n por Vencer</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Estimado/a <strong>{{contact_name}}</strong>,
              </p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Le recordamos que su cotizaci&oacute;n <strong>#{{quote_number}}</strong>
                vence el <strong>{{valid_until}}</strong>. Quedan <strong>{{days_remaining}} d&iacute;as</strong>
                para confirmar su pedido.
              </p>
              <!-- Alert Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px 20px;">
                    <p style="color:#856404;font-size:14px;margin:0;line-height:1.5;">
                      <strong>Importante:</strong> Los precios y disponibilidad indicados en la cotizaci&oacute;n
                      est&aacute;n garantizados hasta la fecha de vencimiento. Despu&eacute;s de esta fecha,
                      ser&aacute; necesario solicitar una nueva cotizaci&oacute;n.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Quote Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fb;border-radius:8px;border:1px solid #e8eaed;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;width:160px;">Cotizaci&oacute;n</td>
                        <td style="padding:6px 0;color:#161052;font-size:15px;font-weight:600;">#{{quote_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Total</td>
                        <td style="padding:6px 0;color:#161052;font-size:17px;font-weight:700;">{{total_amount}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Vence el</td>
                        <td style="padding:6px 0;color:#c0392b;font-size:15px;font-weight:600;">{{valid_until}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Asesor</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{advisor_name}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="{{quote_url}}" style="display:inline-block;background-color:#00C8CF;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      Ver Cotizaci&oacute;n
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="mailto:{{advisor_email}}?subject=Cotizaci%C3%B3n%20{{quote_number}}" style="color:#00C8CF;font-size:14px;text-decoration:none;">
                      Contactar a mi asesor
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:24px 40px;border-top:1px solid #e8eaed;">
              <p style="color:#999;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                <strong>PROSUMINISTROS S.A.S.</strong><br/>
                {{company_address}}<br/>
                Tel: {{company_phone}} | {{company_email}}<br/>
                &copy; {{current_year}} Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
      'variables', jsonb_build_array(
        'quote_number', 'contact_name', 'valid_until', 'days_remaining',
        'total_amount', 'advisor_name', 'advisor_email', 'quote_url',
        'logo_url', 'company_address', 'company_phone', 'company_email', 'current_year'
      ),
      'description', 'Recordatorio al cliente de que su cotizacion esta por vencer. Se envia automaticamente N dias antes del vencimiento (configurable via cron).'
    ),
    'Plantilla de email: recordatorio de cotizacion por vencer'
  )
  ON CONFLICT (organization_id, key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();

  -- ========================================================================
  -- Template 4: order_confirmation
  -- Order created confirmation
  -- ========================================================================
  INSERT INTO system_settings (organization_id, key, value, description)
  VALUES (
    p_org_id,
    'email_template:order_confirmation',
    jsonb_build_object(
      'subject', 'Pedido {{order_number}} creado exitosamente',
      'html_body', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmaci&oacute;n de Pedido</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:''Segoe UI'',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#161052 0%,#1a1462 50%,#00C8CF 100%);padding:32px 40px;text-align:center;">
              <img src="{{logo_url}}" alt="PROSUMINISTROS" height="40" style="height:40px;margin-bottom:8px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Pedido Confirmado</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <!-- Success Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#d4edda;border:1px solid #28a745;border-radius:8px;padding:16px 20px;text-align:center;">
                    <p style="color:#155724;font-size:16px;margin:0;font-weight:600;">
                      Su pedido ha sido creado exitosamente
                    </p>
                  </td>
                </tr>
              </table>
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Estimado/a <strong>{{contact_name}}</strong>,
              </p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Hemos recibido su pedido y estamos procesando su solicitud. A continuaci&oacute;n
                encontrar&aacute; los detalles de su orden.
              </p>
              <!-- Order Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fb;border-radius:8px;border:1px solid #e8eaed;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;width:160px;">N&uacute;mero de Pedido</td>
                        <td style="padding:6px 0;color:#161052;font-size:15px;font-weight:600;">#{{order_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Fecha del pedido</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{order_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Cotizaci&oacute;n origen</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">#{{quote_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Condici&oacute;n de pago</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{payment_terms}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Entrega estimada</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{estimated_delivery}}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 6px;color:#161052;font-size:14px;font-weight:700;border-top:1px solid #e0e0e0;">Total</td>
                        <td style="padding:8px 0 6px;color:#161052;font-size:18px;font-weight:700;border-top:1px solid #e0e0e0;">{{total_amount}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Su asesor <strong>{{advisor_name}}</strong> estar&aacute; pendiente del proceso y
                le notificar&aacute; cuando su pedido sea despachado.
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="{{order_url}}" style="display:inline-block;background-color:#00C8CF;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      Ver Detalle del Pedido
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:24px 40px;border-top:1px solid #e8eaed;">
              <p style="color:#999;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                <strong>PROSUMINISTROS S.A.S.</strong><br/>
                {{company_address}}<br/>
                Tel: {{company_phone}} | {{company_email}}<br/>
                &copy; {{current_year}} Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
      'variables', jsonb_build_array(
        'order_number', 'contact_name', 'order_date', 'quote_number',
        'payment_terms', 'estimated_delivery', 'total_amount',
        'advisor_name', 'order_url',
        'logo_url', 'company_address', 'company_phone', 'company_email', 'current_year'
      ),
      'description', 'Confirmacion al cliente de que su pedido fue creado exitosamente. Se envia al convertir una cotizacion aprobada en pedido.'
    ),
    'Plantilla de email: confirmacion de pedido creado'
  )
  ON CONFLICT (organization_id, key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();

  -- ========================================================================
  -- Template 5: shipment_tracking
  -- Shipment dispatched notification
  -- ========================================================================
  INSERT INTO system_settings (organization_id, key, value, description)
  VALUES (
    p_org_id,
    'email_template:shipment_tracking',
    jsonb_build_object(
      'subject', 'Tu pedido {{order_number}} está en camino',
      'html_body', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido en Camino</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:''Segoe UI'',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#161052 0%,#1a1462 50%,#00C8CF 100%);padding:32px 40px;text-align:center;">
              <img src="{{logo_url}}" alt="PROSUMINISTROS" height="40" style="height:40px;margin-bottom:8px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Pedido en Camino</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <!-- Info Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#cce5ff;border:1px solid #007bff;border-radius:8px;padding:16px 20px;text-align:center;">
                    <p style="color:#004085;font-size:16px;margin:0;font-weight:600;">
                      Su pedido ha sido despachado
                    </p>
                  </td>
                </tr>
              </table>
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Estimado/a <strong>{{contact_name}}</strong>,
              </p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Nos complace informarle que su pedido ha sido despachado y se encuentra en
                camino a la direcci&oacute;n de entrega indicada.
              </p>
              <!-- Shipment Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fb;border-radius:8px;border:1px solid #e8eaed;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;width:160px;">N&uacute;mero de Pedido</td>
                        <td style="padding:6px 0;color:#161052;font-size:15px;font-weight:600;">#{{order_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">N&uacute;mero de Despacho</td>
                        <td style="padding:6px 0;color:#161052;font-size:15px;font-weight:600;">{{shipment_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Transportadora</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{carrier_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Gu&iacute;a de rastreo</td>
                        <td style="padding:6px 0;color:#00C8CF;font-size:15px;font-weight:600;">{{tracking_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Fecha de despacho</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{shipment_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Entrega estimada</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{estimated_delivery}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Direcci&oacute;n de entrega</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{delivery_address}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="{{tracking_url}}" style="display:inline-block;background-color:#00C8CF;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      Rastrear Env&iacute;o
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="{{order_url}}" style="color:#00C8CF;font-size:14px;text-decoration:none;">
                      Ver detalle del pedido
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:24px 40px;border-top:1px solid #e8eaed;">
              <p style="color:#999;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                <strong>PROSUMINISTROS S.A.S.</strong><br/>
                {{company_address}}<br/>
                Tel: {{company_phone}} | {{company_email}}<br/>
                &copy; {{current_year}} Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
      'variables', jsonb_build_array(
        'order_number', 'contact_name', 'shipment_number', 'carrier_name',
        'tracking_number', 'shipment_date', 'estimated_delivery',
        'delivery_address', 'tracking_url', 'order_url',
        'logo_url', 'company_address', 'company_phone', 'company_email', 'current_year'
      ),
      'description', 'Notificacion al cliente cuando su pedido es despachado. Incluye numero de guia y enlace de rastreo de la transportadora.'
    ),
    'Plantilla de email: notificacion de despacho y rastreo'
  )
  ON CONFLICT (organization_id, key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();

  -- ========================================================================
  -- Template 6: invoice_notification
  -- Invoice available notification
  -- ========================================================================
  INSERT INTO system_settings (organization_id, key, value, description)
  VALUES (
    p_org_id,
    'email_template:invoice_notification',
    jsonb_build_object(
      'subject', 'Factura {{invoice_number}} disponible',
      'html_body', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura Disponible</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:''Segoe UI'',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#161052 0%,#1a1462 50%,#00C8CF 100%);padding:32px 40px;text-align:center;">
              <img src="{{logo_url}}" alt="PROSUMINISTROS" height="40" style="height:40px;margin-bottom:8px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Factura Disponible</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Estimado/a <strong>{{contact_name}}</strong>,
              </p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Le informamos que su factura est&aacute; disponible. A continuaci&oacute;n
                encontrar&aacute; los detalles y podr&aacute; descargarla desde nuestra plataforma.
              </p>
              <!-- Invoice Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fb;border-radius:8px;border:1px solid #e8eaed;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;width:160px;">N&uacute;mero de Factura</td>
                        <td style="padding:6px 0;color:#161052;font-size:15px;font-weight:600;">{{invoice_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Pedido relacionado</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">#{{order_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Fecha de emisi&oacute;n</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{invoice_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Fecha de vencimiento</td>
                        <td style="padding:6px 0;color:#c0392b;font-size:15px;font-weight:600;">{{due_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Subtotal</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{subtotal}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">IVA (19%)</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{tax_amount}}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 6px;color:#161052;font-size:14px;font-weight:700;border-top:1px solid #e0e0e0;">Total a Pagar</td>
                        <td style="padding:8px 0 6px;color:#161052;font-size:18px;font-weight:700;border-top:1px solid #e0e0e0;">{{total_amount}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Payment Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#e8f4fd;border:1px solid #b8daff;border-radius:8px;padding:16px 20px;">
                    <p style="color:#004085;font-size:13px;margin:0;line-height:1.5;">
                      <strong>Informaci&oacute;n de pago:</strong> {{payment_instructions}}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- CTA Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="{{invoice_url}}" style="display:inline-block;background-color:#00C8CF;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      Ver y Descargar Factura
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:24px 40px;border-top:1px solid #e8eaed;">
              <p style="color:#999;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                <strong>PROSUMINISTROS S.A.S.</strong><br/>
                {{company_address}}<br/>
                Tel: {{company_phone}} | {{company_email}}<br/>
                &copy; {{current_year}} Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
      'variables', jsonb_build_array(
        'invoice_number', 'contact_name', 'order_number', 'invoice_date',
        'due_date', 'subtotal', 'tax_amount', 'total_amount',
        'payment_instructions', 'invoice_url',
        'logo_url', 'company_address', 'company_phone', 'company_email', 'current_year'
      ),
      'description', 'Notificacion al cliente cuando una factura esta disponible. Incluye detalles de pago y enlace para descargar la factura electronica.'
    ),
    'Plantilla de email: notificacion de factura disponible'
  )
  ON CONFLICT (organization_id, key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();

  -- ========================================================================
  -- Template 7: quote_expired
  -- Quote has expired notification
  -- ========================================================================
  INSERT INTO system_settings (organization_id, key, value, description)
  VALUES (
    p_org_id,
    'email_template:quote_expired',
    jsonb_build_object(
      'subject', 'Cotización {{quote_number}} ha vencido',
      'html_body', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotizaci&oacute;n Vencida</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:''Segoe UI'',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#161052 0%,#1a1462 50%,#00C8CF 100%);padding:32px 40px;text-align:center;">
              <img src="{{logo_url}}" alt="PROSUMINISTROS" height="40" style="height:40px;margin-bottom:8px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Cotizaci&oacute;n Vencida</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Estimado/a <strong>{{contact_name}}</strong>,
              </p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Le informamos que la cotizaci&oacute;n <strong>#{{quote_number}}</strong>
                ha vencido el <strong>{{expired_date}}</strong>. Los precios y condiciones
                indicados en dicha cotizaci&oacute;n ya no est&aacute;n vigentes.
              </p>
              <!-- Expired Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#f8d7da;border:1px solid #dc3545;border-radius:8px;padding:16px 20px;text-align:center;">
                    <p style="color:#721c24;font-size:15px;margin:0;font-weight:600;">
                      Cotizaci&oacute;n #{{quote_number}} &mdash; Vencida el {{expired_date}}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Quote Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fb;border-radius:8px;border:1px solid #e8eaed;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;width:160px;">Cotizaci&oacute;n</td>
                        <td style="padding:6px 0;color:#999;font-size:15px;text-decoration:line-through;">#{{quote_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Total cotizado</td>
                        <td style="padding:6px 0;color:#999;font-size:15px;text-decoration:line-through;">{{total_amount}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#888;font-size:13px;">Asesor</td>
                        <td style="padding:6px 0;color:#333;font-size:15px;">{{advisor_name}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Si a&uacute;n est&aacute; interesado, puede solicitar una nueva cotizaci&oacute;n
                actualizada. Su asesor <strong>{{advisor_name}}</strong> estar&aacute; encantado de
                ayudarle con una propuesta actualizada.
              </p>
              <!-- CTA Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="mailto:{{advisor_email}}?subject=Nueva%20cotizaci%C3%B3n%20(ref%20{{quote_number}})" style="display:inline-block;background-color:#00C8CF;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      Solicitar Nueva Cotizaci&oacute;n
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="{{quote_url}}" style="color:#00C8CF;font-size:14px;text-decoration:none;">
                      Ver cotizaci&oacute;n vencida
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:24px 40px;border-top:1px solid #e8eaed;">
              <p style="color:#999;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                <strong>PROSUMINISTROS S.A.S.</strong><br/>
                {{company_address}}<br/>
                Tel: {{company_phone}} | {{company_email}}<br/>
                &copy; {{current_year}} Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
      'variables', jsonb_build_array(
        'quote_number', 'contact_name', 'expired_date', 'total_amount',
        'advisor_name', 'advisor_email', 'quote_url',
        'logo_url', 'company_address', 'company_phone', 'company_email', 'current_year'
      ),
      'description', 'Notificacion al cliente cuando su cotizacion ha vencido. Ofrece la opcion de solicitar una nueva cotizacion actualizada.'
    ),
    'Plantilla de email: notificacion de cotizacion vencida'
  )
  ON CONFLICT (organization_id, key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();

END;
$$;

COMMENT ON FUNCTION seed_email_templates(uuid) IS
'Seeds 7 email template definitions into system_settings for the given organization. Templates: lead_assigned, quote_proforma, quote_reminder, order_confirmation, shipment_tracking, invoice_notification, quote_expired. Idempotent via ON CONFLICT.';

GRANT EXECUTE ON FUNCTION seed_email_templates(uuid) TO authenticated;


-- ============================================================================
-- Seed templates for the demo organization (PROSUMINISTROS)
-- Organization ID: 00000000-0000-0000-0000-000000000001
-- ============================================================================

SELECT seed_email_templates('00000000-0000-0000-0000-000000000001');


-- ============================================================================
-- FUNCTION 2: create_lead_from_whatsapp(p_org_id, p_data, p_conversation_id, p_phone)
-- Creates a lead from WhatsApp chatbot data.
-- Uses generate_consecutive() for lead_number.
-- Links to WhatsApp conversation via source_conversation_id.
-- Auto-assigns using auto_assign_lead() if available.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_lead_from_whatsapp(
  p_org_id uuid,
  p_data jsonb,
  p_conversation_id uuid,
  p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_lead_number integer;
  v_assigned_to uuid;
  v_business_name text;
  v_contact_name text;
  v_email text;
  v_nit text;
  v_requirement text;
BEGIN
  -- ========================================================================
  -- 1. Validate inputs
  -- ========================================================================
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization not found: %', p_org_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF p_data IS NULL OR p_data = '{}'::jsonb THEN
    RAISE EXCEPTION 'p_data cannot be null or empty'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- ========================================================================
  -- 2. Extract fields from p_data with defaults
  -- ========================================================================
  v_business_name := COALESCE(p_data->>'business_name', p_data->>'empresa', 'Sin nombre');
  v_contact_name  := COALESCE(p_data->>'contact_name', p_data->>'nombre', 'Contacto WhatsApp');
  v_email         := COALESCE(p_data->>'email', p_data->>'correo', '');
  v_nit           := p_data->>'nit';
  v_requirement   := COALESCE(p_data->>'requirement', p_data->>'requerimiento', p_data->>'mensaje', 'Solicitud via WhatsApp');

  -- ========================================================================
  -- 3. Generate consecutive lead number
  -- Uses generate_consecutive() which is thread-safe via SELECT FOR UPDATE
  -- ========================================================================
  v_lead_number := generate_consecutive(p_org_id, 'lead');

  -- ========================================================================
  -- 4. Insert the lead
  -- ========================================================================
  INSERT INTO leads (
    organization_id,
    lead_number,
    business_name,
    nit,
    contact_name,
    phone,
    email,
    requirement,
    channel,
    status,
    source_conversation_id,
    lead_date
  )
  VALUES (
    p_org_id,
    v_lead_number,
    v_business_name,
    v_nit,
    v_contact_name,
    p_phone,
    v_email,
    v_requirement,
    'whatsapp',
    'created',
    p_conversation_id,
    now()
  )
  RETURNING id INTO v_lead_id;

  -- ========================================================================
  -- 5. Auto-assign the lead using auto_assign_lead()
  -- This function handles:
  --   - Finding the advisor with fewest pending leads (max 5)
  --   - Updating lead status to 'assigned'
  --   - Creating a notification for the assigned advisor
  --   - Logging the assignment in lead_assignments_log
  --   - If no advisor available, sets status to 'pending_assignment'
  -- ========================================================================
  BEGIN
    v_assigned_to := auto_assign_lead(v_lead_id);
  EXCEPTION
    WHEN OTHERS THEN
      -- If auto_assign_lead fails (e.g., no advisors available),
      -- the lead remains in 'created' status. Log but don't fail.
      RAISE WARNING 'auto_assign_lead failed for lead %: %', v_lead_id, SQLERRM;
      v_assigned_to := NULL;
  END;

  -- ========================================================================
  -- 6. Return the created lead data as JSONB
  -- ========================================================================
  RETURN jsonb_build_object(
    'id', v_lead_id,
    'lead_number', v_lead_number,
    'business_name', v_business_name,
    'contact_name', v_contact_name,
    'phone', p_phone,
    'email', v_email,
    'channel', 'whatsapp',
    'status', CASE
      WHEN v_assigned_to IS NOT NULL THEN 'assigned'
      ELSE 'created'
    END,
    'assigned_to', v_assigned_to,
    'source_conversation_id', p_conversation_id,
    'created_at', now()
  );
END;
$$;

COMMENT ON FUNCTION create_lead_from_whatsapp(uuid, jsonb, uuid, text) IS
'Creates a lead from WhatsApp chatbot data. Generates consecutive lead number, links to WhatsApp conversation, and auto-assigns to an advisor via load balancing. Returns JSONB with created lead details.

Parameters:
  p_org_id          - Organization UUID
  p_data            - JSONB with lead data: {business_name, contact_name, email, nit, requirement}
  p_conversation_id - UUID of the WhatsApp conversation that originated this lead
  p_phone           - Customer phone number from WhatsApp

p_data accepted keys (supports both English and Spanish):
  business_name / empresa     - Company name (default: "Sin nombre")
  contact_name / nombre       - Contact person name (default: "Contacto WhatsApp")
  email / correo              - Email address (default: "")
  nit                         - Tax ID (optional)
  requirement / requerimiento / mensaje - What the customer needs';

GRANT EXECUTE ON FUNCTION create_lead_from_whatsapp(uuid, jsonb, uuid, text) TO authenticated;


-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration adds:
--
-- 1. seed_email_templates(p_org_id uuid)
--    - Seeds 7 email templates into system_settings for the given org
--    - Templates: lead_assigned, quote_proforma, quote_reminder,
--      order_confirmation, shipment_tracking, invoice_notification, quote_expired
--    - Professional HTML with PROSUMINISTROS branding (#00C8CF cyan, #161052 navy)
--    - Responsive table-based layout for email client compatibility
--    - Idempotent via ON CONFLICT
--    - Auto-seeded for demo org (00000000-0000-0000-0000-000000000001)
--
-- 2. create_lead_from_whatsapp(p_org_id, p_data, p_conversation_id, p_phone)
--    - Creates lead from WhatsApp chatbot with thread-safe consecutive
--    - Links to WhatsApp conversation via source_conversation_id
--    - Sets channel = 'whatsapp'
--    - Auto-assigns using auto_assign_lead()
--    - Returns JSONB with created lead data
-- ============================================================================
