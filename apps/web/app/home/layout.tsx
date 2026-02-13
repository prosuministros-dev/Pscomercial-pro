import { use } from 'react';

import { DashboardLayout } from '~/components/dashboard/dashboard-layout';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

async function HomeLayout({ children }: React.PropsWithChildren) {
  // Ensure user is authenticated (redirects to login if not)
  use(Promise.all([requireUserInServerComponent()]));

  // PermissionProvider inside DashboardLayout handles client-side permission fetching
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default withI18n(HomeLayout);
