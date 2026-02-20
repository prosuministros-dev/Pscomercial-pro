const SUPABASE_URL = 'https://jmevnusslcdaldtzymax.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjEwNDcsImV4cCI6MjA4NjM5NzA0N30.CCGILUaLNsmwgT5MbffinKOpNJV0Jy5_0xg1yTNCOyg';
const headers = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY };

async function main() {
  // Check roles
  const roles = await (await fetch(SUPABASE_URL + '/rest/v1/roles?select=id,slug,name,organization_id,is_active&order=slug', { headers })).json();
  console.log('ROLES:', roles.length);
  roles.forEach(r => console.log(`  ${r.slug} | org: ${r.organization_id?.substring(0,8)} | active: ${r.is_active}`));

  // Check permissions
  const perms = await (await fetch(SUPABASE_URL + '/rest/v1/permissions?select=id,slug&limit=5', { headers })).json();
  console.log('\nPERMISSIONS:', Array.isArray(perms) ? 'count=' + perms.length : JSON.stringify(perms));

  // Check role_permissions
  const rp = await (await fetch(SUPABASE_URL + '/rest/v1/role_permissions?select=id,role_id,permission_id&limit=5', { headers })).json();
  console.log('ROLE_PERMISSIONS:', Array.isArray(rp) ? 'count=' + rp.length : JSON.stringify(rp));

  // Check user_roles
  const ur = await (await fetch(SUPABASE_URL + '/rest/v1/user_roles?select=id,user_id,role_id&limit=20', { headers })).json();
  console.log('USER_ROLES:', Array.isArray(ur) ? 'count=' + ur.length : JSON.stringify(ur));
}
main().catch(console.error);
