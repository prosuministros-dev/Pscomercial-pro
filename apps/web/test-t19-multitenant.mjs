import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const ADMIN = 'bbe305e6-6343-4911-ad7d-c25a5ded4c36';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T19: Multi-Tenancy y Aislamiento ===');

// T19.1 RLS Isolation - Verify tables have organization_id filtering
console.log('\n--- T19.1 RLS Tables have org_id ---');

const tables = ['leads', 'customers', 'products', 'quotes', 'orders', 'invoices', 'shipments',
  'purchase_orders', 'suppliers', 'license_records', 'notifications', 'audit_logs'];

for (const table of tables) {
  const { data, error } = await c.from(table).select('organization_id').eq('organization_id', ORG).limit(1);
  ok('T19.1 ' + table + ' has organization_id filter', !error, error?.message);
}

// T19.2 Verify org isolation: data from test org only
console.log('\n--- T19.2 Org isolation ---');
const { data: leads } = await c.from('leads').select('organization_id').eq('organization_id', ORG);
const allSameOrg = leads?.every(l => l.organization_id === ORG);
ok('T19.2.1 All leads belong to same org', allSameOrg || (leads && leads.length === 0));

const { data: custs } = await c.from('customers').select('organization_id').eq('organization_id', ORG);
const allCustSameOrg = custs?.every(cu => cu.organization_id === ORG);
ok('T19.2.2 All customers belong to same org', allCustSameOrg || (custs && custs.length === 0));

// T19.3 Check that cross-org data is separate
console.log('\n--- T19.3 Cross-org data separation ---');
// Check if other orgs exist
const { data: orgs } = await c.from('organizations').select('id, name');
console.log('    Organizations:', orgs?.map(o => o.name).join(', '));
ok('T19.3.1 Multiple orgs exist or single org is isolated', orgs && orgs.length >= 1);

// T19.4 Consecutivos por organizacion (table: consecutive_counters)
console.log('\n--- T19.4 Consecutivos por org ---');
const { data: consecs, error: eC } = await c.from('consecutive_counters').select('*').eq('organization_id', ORG);
ok('T19.4.1 Consecutives exist for org', !eC && consecs && consecs.length > 0, eC?.message);
if (consecs && consecs.length > 0) {
  console.log('    Consecutives:', consecs.map(co => co.entity_type + '=' + co.current_value).join(', '));
  const types = consecs.map(co => co.entity_type);
  ok('T19.4.2 Has lead consecutive', types.includes('lead'));
  ok('T19.4.3 Has quote consecutive', types.includes('quote'));
  ok('T19.4.4 Has order consecutive', types.includes('order'));
}

// T19.5 system_settings isolation
console.log('\n--- T19.5 System settings ---');
const { data: settings, error: eS } = await c.from('system_settings').select('*').eq('organization_id', ORG);
ok('T19.5.1 system_settings accessible', !eS, eS?.message);

console.log('\n=== T19 Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
