import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody } from '@kit/ui/page';
import { checkPermission } from '@kit/rbac/check-permission';
import { withI18n } from '~/lib/i18n/with-i18n';
import { FinancePageClient } from './_components/finance-page-client';

async function FinancePage() {
  const client = getSupabaseServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Check permission
  const allowed = await checkPermission(user.id, 'finance:read');
  if (!allowed) {
    redirect('/home');
  }

  return (
    <PageBody>
      <FinancePageClient />
    </PageBody>
  );
}

export default withI18n(FinancePage);
