import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { checkPermission } from '@kit/rbac/check-permission';

import { WhatsAppPageClient } from './_components/whatsapp-page-client';

export const metadata = {
  title: 'WhatsApp | Pscomercial',
  description: 'Canal de comunicación WhatsApp Business',
};

export default async function WhatsAppPage() {
  const client = getSupabaseServerClient();
  const result = await requireUser(client);

  if (result.error) {
    redirect(result.redirectTo);
  }

  const userId = result.data?.sub ?? result.data?.id;

  if (!userId) {
    redirect('/auth/sign-in');
  }

  /* ---- Permission check ---- */
  const canView = await checkPermission(userId, 'whatsapp:view');

  if (!canView) {
    redirect('/home');
  }

  /* ---- Check if WhatsApp Business is connected for this org ---- */
  const { data: profile } = await client
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  const organizationId = profile?.organization_id;

  let isConnected = false;
  let accountInfo: {
    phone_number?: string;
    display_name?: string;
    quality_rating?: string;
    connected_at?: string;
  } | null = null;

  if (organizationId) {
    const { data: account } = await client
      .from('whatsapp_accounts')
      .select('phone_number, display_name, quality_rating, created_at')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (account) {
      isConnected = true;
      accountInfo = {
        phone_number: account.phone_number,
        display_name: account.display_name,
        quality_rating: account.quality_rating,
        connected_at: account.created_at,
      };
    }
  }

  return (
    <WhatsAppPageClient
      isConnected={isConnected}
      organizationId={organizationId ?? ''}
      accountInfo={accountInfo}
    />
  );
}
