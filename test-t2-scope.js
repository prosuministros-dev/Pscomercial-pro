const SUPABASE_URL = 'https://jmevnusslcdaldtzymax.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjEwNDcsImV4cCI6MjA4NjM5NzA0N30.CCGILUaLNsmwgT5MbffinKOpNJV0Jy5_0xg1yTNCOyg';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw';

async function login(email) {
  const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPscom2026!' })
  });
  return await r.json();
}

async function main() {
  const ORG1 = 'bee5aac6-a830-4857-b608-25b1985c8d82';
  const ORG2 = '03eb936e-3cff-4a91-a25f-efaf548f0527';
  const svcH = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

  const admin = await login('admin@prosutest.com');
  const asesor = await login('asesor1@prosutest.com');

  const mkLead = (org, num, name, email, assignedTo) => ({
    organization_id: org, lead_number: num,
    business_name: name, contact_name: 'Test', phone: '300' + num,
    email, requirement: 'Test', channel: 'manual', status: 'created',
    lead_date: new Date().toISOString(), created_by: admin.user.id,
    ...(assignedTo ? { assigned_to: assignedTo } : {})
  });

  // Create 3 leads
  const [l1, l2, l3] = await Promise.all([
    fetch(SUPABASE_URL + '/rest/v1/leads', { method: 'POST', headers: svcH, body: JSON.stringify(mkLead(ORG1, 9001, 'ORG1 Assigned', 'sc1@t.com', asesor.user.id)) }).then(r => r.json()),
    fetch(SUPABASE_URL + '/rest/v1/leads', { method: 'POST', headers: svcH, body: JSON.stringify(mkLead(ORG2, 9002, 'ORG2 Lead', 'sc2@t.com', null)) }).then(r => r.json()),
    fetch(SUPABASE_URL + '/rest/v1/leads', { method: 'POST', headers: svcH, body: JSON.stringify(mkLead(ORG1, 9003, 'ORG1 Unassigned', 'sc3@t.com', null)) }).then(r => r.json()),
  ]);

  const ids = [l1, l2, l3].flat().map(l => l && l.id).filter(Boolean);
  console.log('Created', ids.length, 'test leads');

  // Test admin (ORG1)
  const adminLeads = await (await fetch(SUPABASE_URL + '/rest/v1/leads?select=id,business_name,organization_id,assigned_to&order=lead_number', {
    headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + admin.access_token }
  })).json();

  // Test asesor (ORG1)
  const asesorLeads = await (await fetch(SUPABASE_URL + '/rest/v1/leads?select=id,business_name,organization_id,assigned_to&order=lead_number', {
    headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + asesor.access_token }
  })).json();

  console.log('');
  console.log('=== T2.4: DATA SCOPE TESTS ===');
  console.log('');

  const adminOrg1 = adminLeads.filter(l => l.organization_id === ORG1);
  const adminOrg2 = adminLeads.filter(l => l.organization_id === ORG2);

  console.log('1. ORG ISOLATION:');
  console.log('   Admin(ORG1) total:', adminLeads.length, '| ORG1:', adminOrg1.length, '| ORG2:', adminOrg2.length);
  const orgIsolationPass = adminOrg2.length === 0;
  console.log('   ' + (orgIsolationPass ? 'PASS' : 'FAIL') + ': No cross-org data leak');
  console.log('');

  console.log('2. ASESOR SCOPE:');
  const asesorAssigned = asesorLeads.filter(l => l.assigned_to === asesor.user.id);
  const asesorOther = asesorLeads.filter(l => l.assigned_to !== asesor.user.id);
  console.log('   Asesor(ORG1) total:', asesorLeads.length);
  console.log('   Asesor assigned:', asesorAssigned.length);
  console.log('   Asesor other:', asesorOther.length);

  if (asesorLeads.length === adminOrg1.length) {
    console.log('   INFO: Asesor sees ALL org leads (org-level RLS, not user-level)');
  } else if (asesorLeads.length === asesorAssigned.length) {
    console.log('   INFO: Asesor sees ONLY assigned leads (user-level RLS)');
  } else {
    console.log('   INFO: Asesor sees partial data');
  }

  // Cleanup
  for (const id of ids) {
    await fetch(SUPABASE_URL + '/rest/v1/leads?id=eq.' + id, { method: 'DELETE', headers: svcH });
  }
  console.log('\nCleaned up', ids.length, 'leads');
}
main().catch(e => console.error('ERROR:', e.message));
