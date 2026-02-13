import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody } from '@kit/ui/page';
import { Tabs, TabsList, TabsTrigger } from '@kit/ui/tabs';

import { withI18n } from '~/lib/i18n/with-i18n';

async function AdminLayout({ children }: React.PropsWithChildren) {
  const client = getSupabaseServerClient();

  // Get the authenticated user
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Check if user has admin permissions
  const { data: userRoles } = await client
    .from('user_roles')
    .select(
      `
      role:roles (
        slug,
        role_permissions (
          permission:permissions (
            slug
          )
        )
      )
    `,
    )
    .eq('user_id', user.id);

  // Check if user has admin:manage_roles permission
  const hasAdminPermission = userRoles?.some((ur: any) =>
    ur.role?.role_permissions?.some((rp: any) =>
      ['admin:manage_roles', 'admin:manage_users', 'admin:view_audit'].includes(
        rp.permission?.slug,
      ),
    ),
  );

  if (!hasAdminPermission) {
    redirect('/home');
  }

  return (
    <>
      <PageBody>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">
              Manage roles, users, and view audit logs
            </p>
          </div>

          <Tabs defaultValue="roles" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="roles" asChild>
                <Link href="/home/admin/roles">Roles</Link>
              </TabsTrigger>
              <TabsTrigger value="users" asChild>
                <Link href="/home/admin/users">Users</Link>
              </TabsTrigger>
              <TabsTrigger value="audit" asChild>
                <Link href="/home/admin/audit">Audit Log</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {children}
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(AdminLayout);
