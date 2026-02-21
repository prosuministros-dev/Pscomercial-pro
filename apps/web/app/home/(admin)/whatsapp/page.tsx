import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { requireUser } from '~/lib/require-auth';
import { WhatsAppPageClient } from './_components/whatsapp-page-client';

export const metadata = {
  title: 'WhatsApp | Pscomercial',
  description: 'Canal de comunicación WhatsApp Business',
};

export default async function WhatsAppPage() {
  const client = getSupabaseServerClient();

  let user;
  try {
    user = await requireUser(client);
  } catch {
    redirect('/auth/sign-in');
  }

  /* ---- Check if WhatsApp Business is connected for this org ---- */
  let isConnected = false;
  let accountInfo: {
    phone_number?: string;
    display_name?: string;
    quality_rating?: string;
    connected_at?: string;
  } | null = null;

  const { data: account } = await client
    .from('whatsapp_accounts')
    .select('display_phone, business_name, quality_rating, created_at')
    .eq('organization_id', user.organization_id)
    .maybeSingle();

  if (account) {
    isConnected = true;
    accountInfo = {
      phone_number: account.display_phone,
      display_name: account.business_name,
      quality_rating: account.quality_rating,
      connected_at: account.created_at,
    };
  }

  return (
    <WhatsAppPageClient
      isConnected={isConnected}
      organizationId={user.organization_id}
      accountInfo={accountInfo}
    />
  );
}
