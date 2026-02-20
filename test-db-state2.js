const SUPABASE_URL = 'https://jmevnusslcdaldtzymax.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjEwNDcsImV4cCI6MjA4NjM5NzA0N30.CCGILUaLNsmwgT5MbffinKOpNJV0Jy5_0xg1yTNCOyg';
const headers = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY };

async function main() {
  // ALL role_permissions with role and permission details
  const rp = await (await fetch(SUPABASE_URL + '/rest/v1/role_permissions?select=id,role_id,permission_id,role:roles(slug,organization_id),permission:permissions(slug)', { headers })).json();
  console.log('ALL ROLE_PERMISSIONS (' + rp.length + '):');
  rp.forEach(r => console.log(`  role: ${r.role?.slug} (org: ${r.role?.organization_id?.substring(0,8)}) -> perm: ${r.permission?.slug}`));

  // All permissions
  const perms = await (await fetch(SUPABASE_URL + '/rest/v1/permissions?select=id,slug&order=slug', { headers })).json();
  console.log('\nALL PERMISSIONS (' + perms.length + '):');
  perms.forEach(p => console.log('  ' + p.slug));

  // User roles for admin@prosutest.com
  const ur = await (await fetch(SUPABASE_URL + '/rest/v1/user_roles?select=id,user_id,role:roles(slug,organization_id)&user_id=eq.bbe305e6-6343-4911-ad7d-c25a5ded4c36', { headers })).json();
  console.log('\nADMIN USER_ROLES:', JSON.stringify(ur));
}
main().catch(console.error);
