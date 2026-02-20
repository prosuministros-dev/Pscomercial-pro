# FASE 7: Integraciones Externas (WhatsApp Meta + Embedded Sign-Up, SendGrid)

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Perspectivas:** Arquitecto | Fullstack Dev | Business Analyst

---

## 1. WHATSAPP BUSINESS PLATFORM (Meta)

### 1.1 Arquitectura General

```
┌────────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│ Cliente final   │ ←→  │ WhatsApp Cloud API      │ ←→  │ Pscomercial  │
│ (WhatsApp)     │     │ (Meta servers)           │     │ (Webhook)    │
└────────────────┘     └─────────────────────────┘     └──────────────┘
                                                              │
                       ┌─────────────────────────┐            │
                       │ Embedded Sign-Up SDK     │ ──────────┘
                       │ (Onboarding de cada org) │
                       └─────────────────────────┘
```

### 1.2 Componentes de Integración

| Componente | Propósito | Implementación |
|------------|-----------|----------------|
| **Embedded Sign-Up** | Cada org conecta su propio WhatsApp Business | SDK en frontend (iframe Meta) |
| **Webhook** | Recibir mensajes entrantes | API Route `/api/webhooks/whatsapp` |
| **Cloud API** | Enviar mensajes salientes | Desde API Routes (fetch a Graph API) |
| **Templates** | Mensajes pre-aprobados por Meta | Gestión en panel admin |
| **Chatbot** | Flujo conversacional automático | State machine en webhook handler |

### 1.3 Embedded Sign-Up SDK (MANDATORIO)

Cada organización debe poder conectar su propio número de WhatsApp Business usando el Embedded Sign-Up SDK de Meta.

```tsx
// components/whatsapp/embedded-signup.tsx
'use client';
import { useEffect, useRef } from 'react';

interface EmbeddedSignupProps {
  onComplete: (data: {
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
    displayPhone: string;
    businessName: string;
  }) => void;
}

export function WhatsAppEmbeddedSignup({ onComplete }: EmbeddedSignupProps) {
  const fbLoginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar Facebook SDK
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    script.onload = () => {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID!,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const launchEmbeddedSignup = () => {
    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const { code } = response.authResponse;
          // Enviar código al backend para intercambiar por token permanente
          exchangeCodeForToken(code).then(onComplete);
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID!, // Config de Embedded Signup
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {
            // Pre-rellenar datos del negocio
            business: {
              name: organizationName,
              // ...
            },
          },
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="p-6 border rounded-lg text-center">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
        <h3>Conectar WhatsApp Business</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Conecta tu número de WhatsApp Business para recibir y enviar mensajes
          directamente desde Pscomercial.
        </p>
        <Button onClick={launchEmbeddedSignup} className="bg-green-600 hover:bg-green-700">
          Conectar con WhatsApp
        </Button>
      </div>
    </div>
  );
}
```

### 1.4 Backend: Intercambio de Token

```typescript
// api/whatsapp/setup/route.ts
export async function POST(request: Request) {
  const { code } = await request.json();
  const auth = await checkPermission('whatsapp:configure');
  if (!auth.allowed) return new Response('Forbidden', { status: 403 });

  // 1. Intercambiar código por access_token
  const tokenResponse = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `client_id=${process.env.META_APP_ID}&` +
    `client_secret=${process.env.META_APP_SECRET}&` +
    `code=${code}`,
    { method: 'GET' }
  );
  const { access_token } = await tokenResponse.json();

  // 2. Obtener WABA ID y Phone Number ID
  const debugResponse = await fetch(
    `https://graph.facebook.com/v21.0/debug_token?input_token=${access_token}`,
    { headers: { Authorization: `Bearer ${process.env.META_APP_TOKEN}` } }
  );
  const debugData = await debugResponse.json();
  const wabaId = debugData.data.granular_scopes
    .find((s: any) => s.scope === 'whatsapp_business_management')?.target_ids?.[0];
  const phoneNumberId = debugData.data.granular_scopes
    .find((s: any) => s.scope === 'whatsapp_business_messaging')?.target_ids?.[0];

  // 3. Obtener número de teléfono display
  const phoneResponse = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const phoneData = await phoneResponse.json();

  // 4. Guardar en la base de datos (encriptar token)
  const supabase = await createClient();
  await supabase.from('whatsapp_accounts').upsert({
    organization_id: auth.organizationId,
    waba_id: wabaId,
    phone_number_id: phoneNumberId,
    display_phone: phoneData.display_phone_number,
    business_name: phoneData.verified_name,
    access_token: encrypt(access_token), // AES-256 encryption
    webhook_verify_token: generateVerifyToken(),
    status: 'active',
    setup_completed_at: new Date().toISOString(),
  });

  // 5. Suscribir al webhook
  await fetch(
    `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );

  return Response.json({ success: true });
}
```

### 1.5 Webhook Handler: Mensajes Entrantes

```typescript
// api/webhooks/whatsapp/route.ts

// POST: Procesar mensajes y status updates
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verificar firma (X-Hub-Signature-256)
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifyWebhookSignature(body, signature, process.env.META_APP_SECRET!)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Responder 200 inmediatamente (Meta requiere <20s)
  const responsePromise = processWebhookAsync(body);

  return new Response('OK', { status: 200 });
}

async function processWebhookAsync(body: any) {
  const supabase = createServiceClient();

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;

      if (value.messages) {
        for (const message of value.messages) {
          await handleIncomingMessage(supabase, value, message);
        }
      }

      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(supabase, status);
        }
      }
    }
  }
}

async function handleIncomingMessage(supabase: any, value: any, message: any) {
  const phoneNumberId = value.metadata.phone_number_id;

  // 1. Encontrar la cuenta de WhatsApp
  const { data: waAccount } = await supabase
    .from('whatsapp_accounts')
    .select('id, organization_id, access_token')
    .eq('phone_number_id', phoneNumberId)
    .single();

  if (!waAccount) return;

  // 2. Buscar o crear conversación
  let { data: conversation } = await supabase
    .from('whatsapp_conversations')
    .select('id, status, intent')
    .eq('whatsapp_account_id', waAccount.id)
    .eq('customer_phone', message.from)
    .eq('status', 'active')
    .maybeSingle();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from('whatsapp_conversations')
      .insert({
        organization_id: waAccount.organization_id,
        whatsapp_account_id: waAccount.id,
        customer_phone: message.from,
        customer_name: value.contacts?.[0]?.profile?.name,
        status: 'active',
        conversation_type: 'bot',
      })
      .select()
      .single();
    conversation = newConv;
  }

  // 3. Guardar mensaje
  await supabase.from('whatsapp_messages').insert({
    organization_id: waAccount.organization_id,
    conversation_id: conversation.id,
    wa_message_id: message.id,
    direction: 'inbound',
    sender_type: 'customer',
    message_type: message.type,
    content: message.text?.body || message.interactive?.button_reply?.title || '',
    media_url: message.image?.url || message.document?.url || null,
  });

  // 4. Procesar con chatbot (state machine)
  await processBotResponse(supabase, waAccount, conversation, message);
}
```

### 1.6 Chatbot State Machine

```typescript
// lib/whatsapp/chatbot.ts
type BotState = 'welcome' | 'capture_company' | 'capture_nit' | 'capture_contact' |
  'capture_phone' | 'capture_email' | 'capture_requirement' | 'confirmation' | 'completed';

async function processBotResponse(
  supabase: any,
  waAccount: any,
  conversation: any,
  message: any
) {
  // Obtener estado actual de la conversación
  const state: BotState = conversation.metadata?.bot_state || 'welcome';
  const collectedData = conversation.metadata?.collected_data || {};

  let nextState: BotState = state;
  let responseText = '';

  switch (state) {
    case 'welcome':
      // Detectar intención
      const text = message.text?.body?.toLowerCase() || '';
      if (text.includes('1') || text.includes('cotización') || text.includes('cotizacion')) {
        nextState = 'capture_company';
        responseText = 'Perfecto 👍 Para continuar, necesito algunos datos básicos de tu empresa:\n\n1️⃣ *Razón social o nombre de la empresa:*';
      } else {
        // Enviar menú de bienvenida
        await sendInteractiveMessage(waAccount, message.from, {
          type: 'button',
          body: { text: '👋 ¡Hola! Bienvenido a *PROSUMINISTROS* 🧰\nTu aliado en hardware, software y servicios IT.\n\nPor favor cuéntame qué deseas hacer hoy:' },
          action: {
            buttons: [
              { type: 'reply', reply: { id: '1', title: 'Solicitar cotización' } },
              { type: 'reply', reply: { id: '2', title: 'Estado de pedido' } },
              { type: 'reply', reply: { id: '3', title: 'Asesoría comercial' } },
            ],
          },
        });
        return;
      }
      break;

    case 'capture_company':
      collectedData.business_name = message.text?.body;
      nextState = 'capture_nit';
      responseText = '2️⃣ *Número de NIT o identificación:*';
      break;

    case 'capture_nit':
      collectedData.nit = message.text?.body;
      nextState = 'capture_contact';
      responseText = '3️⃣ *Nombre del contacto principal:*';
      break;

    case 'capture_contact':
      collectedData.contact_name = message.text?.body;
      nextState = 'capture_email';
      responseText = '4️⃣ *Correo electrónico de contacto:*';
      break;

    case 'capture_email':
      // Validar email
      if (!isValidEmail(message.text?.body)) {
        responseText = '⚠️ El formato del correo no es válido. Revisa y escríbelo nuevamente:';
        break;
      }
      collectedData.email = message.text?.body;
      nextState = 'capture_requirement';
      responseText = 'Gracias 🙌\nPor último, confirma el *motivo de tu contacto*:';
      break;

    case 'capture_requirement':
      collectedData.requirement = message.text?.body;
      nextState = 'completed';

      // CREAR LEAD AUTOMÁTICAMENTE
      const { data: lead } = await supabase.rpc('create_lead_from_whatsapp', {
        p_org_id: waAccount.organization_id,
        p_data: collectedData,
        p_conversation_id: conversation.id,
        p_phone: message.from,
      });

      responseText = `¡Excelente, ${collectedData.contact_name}! 🎉\nYa registramos tu solicitud con el código *LEAD-${lead?.lead_number}*.\n\nMuy pronto uno de nuestros asesores se pondrá en contacto contigo.\n\n¡Gracias por confiar en *PROSUMINISTROS*! 🚀💙`;
      break;
  }

  // Enviar respuesta
  if (responseText) {
    await sendTextMessage(waAccount, message.from, responseText);
  }

  // Actualizar estado de conversación
  await supabase
    .from('whatsapp_conversations')
    .update({
      metadata: { bot_state: nextState, collected_data: collectedData },
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversation.id);
}
```

### 1.7 Envío de Mensajes (Salientes)

```typescript
// lib/whatsapp/send-message.ts
export async function sendTextMessage(
  waAccount: { phone_number_id: string; access_token: string },
  to: string,
  text: string
) {
  const token = decrypt(waAccount.access_token);

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${waAccount.phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  );

  return response.json();
}

export async function sendTemplateMessage(
  waAccount: any,
  to: string,
  templateName: string,
  params: Record<string, string>
) {
  const token = decrypt(waAccount.access_token);

  return fetch(
    `https://graph.facebook.com/v21.0/${waAccount.phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es' },
          components: [
            {
              type: 'body',
              parameters: Object.entries(params).map(([_, value]) => ({
                type: 'text',
                text: value,
              })),
            },
          ],
        },
      }),
    }
  );
}
```

---

## 2. SENDGRID (Email Transaccional y Masivo)

### 2.1 Arquitectura

```
┌──────────────┐     ┌────────────┐     ┌──────────────┐
│ Pscomercial  │ ──→ │ SendGrid   │ ──→ │ Cliente      │
│ (API Route)  │     │ API v3     │     │ (Email)      │
└──────────────┘     └─────┬──────┘     └──────────────┘
                           │
                           ▼
                    ┌────────────┐
                    │ Webhook    │ ──→ Actualizar email_logs
                    │ (events)   │
                    └────────────┘
```

### 2.2 Configuración

```typescript
// lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';

// Inicializar con la API key de la organización
export function getSendGridClient(apiKey: string) {
  sgMail.setApiKey(apiKey);
  return sgMail;
}

// Función centralizada para enviar emails
export async function sendEmail(params: {
  supabase: any;
  organizationId: string;
  to: string;
  toName?: string;
  subject: string;
  html?: string;
  templateId?: string;
  dynamicData?: Record<string, any>;
  entityType?: string;
  entityId?: string;
}) {
  const { supabase, organizationId, ...emailParams } = params;

  // 1. Obtener configuración de SendGrid de la organización
  const { data: settings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('organization_id', organizationId)
    .in('key', ['sendgrid_api_key', 'sendgrid_from_email', 'company_info'])
    .then((res: any) => ({
      data: Object.fromEntries(res.data?.map((s: any) => [s.key, s.value]) ?? []),
    }));

  const apiKey = decrypt(settings.sendgrid_api_key);
  const fromEmail = settings.sendgrid_from_email;

  const sg = getSendGridClient(apiKey);

  // 2. Preparar mensaje
  const msg: any = {
    to: emailParams.to,
    from: { email: fromEmail, name: settings.company_info?.name || 'PROSUMINISTROS' },
    subject: emailParams.subject,
  };

  if (emailParams.templateId) {
    msg.templateId = emailParams.templateId;
    msg.dynamicTemplateData = emailParams.dynamicData;
  } else {
    msg.html = emailParams.html;
  }

  // 3. Enviar
  try {
    const [response] = await sg.send(msg);

    // 4. Registrar en email_logs
    await supabase.from('email_logs').insert({
      organization_id: organizationId,
      to_email: emailParams.to,
      to_name: emailParams.toName,
      from_email: fromEmail,
      subject: emailParams.subject,
      template_id: emailParams.templateId,
      entity_type: emailParams.entityType,
      entity_id: emailParams.entityId,
      status: 'sent',
      sendgrid_message_id: response.headers['x-message-id'],
      sent_at: new Date().toISOString(),
    });

    return { success: true, messageId: response.headers['x-message-id'] };
  } catch (error: any) {
    // Registrar error
    await supabase.from('email_logs').insert({
      organization_id: organizationId,
      to_email: emailParams.to,
      from_email: fromEmail,
      subject: emailParams.subject,
      entity_type: emailParams.entityType,
      entity_id: emailParams.entityId,
      status: 'failed',
      error_message: error.message,
    });

    throw error;
  }
}
```

### 2.3 Casos de Uso de Email

| Caso | Template | Trigger |
|------|----------|---------|
| Lead asignado (notif asesor) | `lead_assigned` | Auto: al asignar lead |
| Cotización al cliente | `quote_proforma` | Manual: botón "Enviar" |
| Recordatorio cotización | `quote_reminder` | Cron: x días antes de vencer |
| Pedido creado (confirm.) | `order_confirmation` | Auto: al crear pedido |
| Despacho en camino | `shipment_tracking` | Auto: al despachar |
| Factura disponible | `invoice_notification` | Auto: al registrar factura |
| Alerta cotización vencida | `quote_expired` | Cron: al vencer |

### 2.4 Envío Masivo (Bulk)

```typescript
// api/email/bulk/route.ts
export async function POST(request: Request) {
  const { recipients, templateId, dynamicData, entityType } = await request.json();
  const auth = await checkPermission('reports:export');

  if (recipients.length > 1000) {
    // Procesar en background
    const { data: job } = await supabase.from('background_jobs').insert({
      type: 'bulk_email',
      payload: { recipients, templateId, dynamicData, entityType },
      status: 'pending',
      total_items: recipients.length,
    }).select().single();

    await supabase.functions.invoke('process-bulk-email', { body: { jobId: job.id } });

    return Response.json({ status: 'processing', jobId: job.id });
  }

  // Enviar en batches de 100 (límite de SendGrid)
  const batches = chunk(recipients, 100);
  for (const batch of batches) {
    await sendBulkEmail(batch, templateId, dynamicData);
  }

  return Response.json({ status: 'sent', count: recipients.length });
}
```

---

## 3. VARIABLES DE ENTORNO REQUERIDAS

```env
# Meta / WhatsApp
NEXT_PUBLIC_META_APP_ID=123456789
META_APP_SECRET=abc123...
META_APP_TOKEN=EAAabc... # System User Token
NEXT_PUBLIC_META_CONFIG_ID=789... # Embedded Signup Config ID
WHATSAPP_VERIFY_TOKEN=my-verify-token-123

# SendGrid
# (Se almacena por organización en system_settings, encriptado)
# Para el webhook:
SENDGRID_WEBHOOK_SIGNING_KEY=abc123...

# Encryption
ENCRYPTION_KEY=32-byte-hex-key-for-aes-256...
```

---

## 4. RESUMEN

| Integración | Protocolo | Auth | Almacenamiento |
|---|---|---|---|
| **WhatsApp** | REST (Graph API v21.0) | OAuth + Embedded Sign-Up | Token encriptado en `whatsapp_accounts` |
| **SendGrid** | REST (API v3) | API Key por organización | Key encriptada en `system_settings` |
| **Webhooks** | POST + firma HMAC | X-Hub-Signature-256 / Signing Key | Procesados y guardados en DB |
