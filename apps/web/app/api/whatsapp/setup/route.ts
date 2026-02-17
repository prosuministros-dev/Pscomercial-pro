import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { encrypt } from '~/lib/encryption';

// --- Zod Schema ---
const setupSchema = z.object({
  code: z.string().min(1, 'code es requerido'),
});

// --- Meta Graph API constants ---
const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

/**
 * POST /api/whatsapp/setup
 * Exchange Embedded Sign-Up OAuth code for a permanent token and save
 * the WhatsApp Business Account configuration.
 * Permission required: whatsapp:configure
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'whatsapp:configure');
    if (!allowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para configurar WhatsApp' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos invalidos' },
        { status: 400 },
      );
    }

    const { code } = parsed.data;

    // ------------------------------------------------------------------
    // 1. Validate required environment variables
    // ------------------------------------------------------------------
    const META_APP_ID = process.env.META_APP_ID;
    const META_APP_SECRET = process.env.META_APP_SECRET;
    const META_APP_TOKEN = process.env.META_APP_TOKEN;

    if (!META_APP_ID || !META_APP_SECRET || !META_APP_TOKEN) {
      console.error('[whatsapp-setup] Missing META_APP_ID, META_APP_SECRET, or META_APP_TOKEN env vars');
      return NextResponse.json(
        { error: 'Configuracion de Meta incompleta en el servidor' },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 2. Exchange code for access_token
    // ------------------------------------------------------------------
    const tokenUrl = new URL(`${META_GRAPH_URL}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', META_APP_ID);
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[whatsapp-setup] Token exchange failed:', tokenData);
      return NextResponse.json(
        { error: 'Error al intercambiar el codigo por token de acceso' },
        { status: 400 },
      );
    }

    const accessToken: string = tokenData.access_token;

    // ------------------------------------------------------------------
    // 3. Debug token to get WABA ID and Phone Number ID
    // ------------------------------------------------------------------
    const debugUrl = new URL(`${META_GRAPH_URL}/debug_token`);
    debugUrl.searchParams.set('input_token', accessToken);

    const debugRes = await fetch(debugUrl.toString(), {
      headers: { Authorization: `Bearer ${META_APP_TOKEN}` },
    });
    const debugData = await debugRes.json();

    if (!debugRes.ok || !debugData.data) {
      console.error('[whatsapp-setup] Token debug failed:', debugData);
      return NextResponse.json(
        { error: 'Error al verificar el token de acceso' },
        { status: 400 },
      );
    }

    // Extract WABA ID and Phone Number ID from granular_scopes
    const granularScopes = debugData.data.granular_scopes || [];
    let wabaId: string | null = null;
    let phoneNumberId: string | null = null;

    for (const scope of granularScopes) {
      if (scope.scope === 'whatsapp_business_management' && scope.target_ids?.length) {
        wabaId = scope.target_ids[0];
      }
      if (scope.scope === 'whatsapp_business_messaging' && scope.target_ids?.length) {
        phoneNumberId = scope.target_ids[0];
      }
    }

    if (!wabaId || !phoneNumberId) {
      console.error('[whatsapp-setup] Could not extract WABA or phone IDs from debug_token:', granularScopes);
      return NextResponse.json(
        { error: 'No se pudo obtener el WABA ID o Phone Number ID del token' },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // 4. Get phone display info
    // ------------------------------------------------------------------
    const phoneRes = await fetch(`${META_GRAPH_URL}/${phoneNumberId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const phoneData = await phoneRes.json();

    if (!phoneRes.ok) {
      console.error('[whatsapp-setup] Phone info fetch failed:', phoneData);
      return NextResponse.json(
        { error: 'Error al obtener informacion del numero de telefono' },
        { status: 400 },
      );
    }

    const displayPhone = phoneData.display_phone_number || phoneData.phone_number || phoneNumberId;
    const businessName = phoneData.verified_name || phoneData.display_phone_number || 'WhatsApp Business';

    // ------------------------------------------------------------------
    // 5. Encrypt access token
    // ------------------------------------------------------------------
    const encryptedToken = encrypt(accessToken);

    // ------------------------------------------------------------------
    // 6. Generate webhook verify token
    // ------------------------------------------------------------------
    const webhookVerifyToken = crypto.randomBytes(16).toString('hex');

    // ------------------------------------------------------------------
    // 7. Upsert whatsapp_accounts record
    // ------------------------------------------------------------------
    const { data: account, error: upsertError } = await client
      .from('whatsapp_accounts')
      .upsert(
        {
          organization_id: user.organization_id,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          display_phone: displayPhone,
          business_name: businessName,
          access_token: encryptedToken,
          webhook_verify_token: webhookVerifyToken,
          status: 'active',
          setup_completed_at: new Date().toISOString(),
          created_by: user.id,
          metadata: {
            token_type: tokenData.token_type || 'bearer',
            scopes: granularScopes,
          },
        },
        { onConflict: 'organization_id,waba_id' },
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[whatsapp-setup] Upsert error:', upsertError);
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 8. Subscribe to webhooks
    // ------------------------------------------------------------------
    const subscribeRes = await fetch(`${META_GRAPH_URL}/${wabaId}/subscribed_apps`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const subscribeData = await subscribeRes.json();

    if (!subscribeRes.ok) {
      console.error('[whatsapp-setup] Webhook subscription failed:', subscribeData);
      // Non-fatal: account is already saved, subscription can be retried
    }

    return NextResponse.json({
      data: {
        id: account.id,
        waba_id: account.waba_id,
        phone_number_id: account.phone_number_id,
        display_phone: account.display_phone,
        business_name: account.business_name,
        status: account.status,
        webhook_verify_token: webhookVerifyToken,
        webhook_subscribed: subscribeRes.ok,
      },
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/whatsapp/setup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
