const SUPABASE_URL = 'https://jmevnusslcdaldtzymax.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjEwNDcsImV4cCI6MjA4NjM5NzA0N30.CCGILUaLNsmwgT5MbffinKOpNJV0Jy5_0xg1yTNCOyg';

async function main() {
  // 1. Login
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@prosutest.com', password: 'TestPscom2026!' })
  });
  const authData = await authRes.json();

  if (!authData.access_token) {
    console.error('Auth failed:', authData);
    return;
  }

  const userId = authData.user.id;
  const token = authData.access_token;
  console.log('USER_ID:', userId);
  console.log('TOKEN:', token.substring(0, 50) + '...');

  // 2. Call get_user_permissions RPC
  const permsRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_permissions`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_user_id: userId })
  });
  const permsData = await permsRes.json();

  console.log('\nPERMISSIONS STATUS:', permsRes.status);
  if (permsRes.ok) {
    console.log('PERMISSIONS COUNT:', permsData.length);
    console.log('PERMISSIONS:', permsData.map(p => p.permission_slug).join(', '));
  } else {
    console.log('PERMISSIONS ERROR:', JSON.stringify(permsData));
  }

  // 3. Check role_permissions count
  const rpRes = await fetch(`${SUPABASE_URL}/rest/v1/role_permissions?select=*,role:roles(slug),permission:permissions(slug)&limit=5`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token}`,
    }
  });
  console.log('\nROLE_PERMISSIONS STATUS:', rpRes.status);
  const rpData = await rpRes.json();
  console.log('ROLE_PERMISSIONS SAMPLE:', JSON.stringify(rpData).substring(0, 500));
}

main().catch(console.error);
