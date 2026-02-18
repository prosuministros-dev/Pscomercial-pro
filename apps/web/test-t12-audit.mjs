import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const ADMIN = 'bbe305e6-6343-4911-ad7d-c25a5ded4c36';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T12: Trazabilidad y Audit Trail ===');

// T12.4 Audit Trail
console.log('\n--- T12.4 Audit Logs ---');

// Create test audit entry
const { data: al1, error: e1 } = await c.from('audit_logs').insert({
  organization_id: ORG, user_id: ADMIN, action: 'create',
  entity_type: 'lead', entity_id: '00000000-0000-0000-0000-000000000001',
  metadata: { company_name: 'Test Company', source: 'web' }
}).select().single();
ok('T12.4.1 CREATE audit_log entry', !e1 && al1, e1?.message);

const { data: al2, error: e1b } = await c.from('audit_logs').insert({
  organization_id: ORG, user_id: ADMIN, action: 'update',
  entity_type: 'order', entity_id: '00000000-0000-0000-0000-000000000002',
  metadata: { old_status: 'created', new_status: 'in_purchase' }
}).select().single();
ok('T12.4.1b CREATE audit_log (update action)', !e1b && al2, e1b?.message);

// T12.4.2 Audit log has correct structure
if (al1) {
  ok('T12.4.2a user_id present', al1.user_id === ADMIN);
  ok('T12.4.2b action present', al1.action === 'create');
  ok('T12.4.2c entity_type present', al1.entity_type === 'lead');
  ok('T12.4.2d entity_id present', !!al1.entity_id);
  ok('T12.4.2e metadata present', al1.metadata && al1.metadata.company_name === 'Test Company');
  ok('T12.4.2f created_at auto-set', !!al1.created_at);
}

// T12.4.3 Query audit logs with filters
const { data: logs, error: e2 } = await c.from('audit_logs').select('*')
  .eq('organization_id', ORG).order('created_at', { ascending: false }).limit(20);
ok('T12.4.3 GET audit_logs list', !e2 && logs && logs.length > 0, e2?.message);
console.log('    Total audit logs:', logs?.length);

// Filter by entity_type
const { data: leadLogs, error: e3 } = await c.from('audit_logs').select('*')
  .eq('organization_id', ORG).eq('entity_type', 'lead');
ok('T12.4.3b Filter by entity_type=lead', !e3 && leadLogs && leadLogs.length > 0, e3?.message);

// Filter by action
const { data: updateLogs, error: e4 } = await c.from('audit_logs').select('*')
  .eq('organization_id', ORG).eq('action', 'update');
ok('T12.4.3c Filter by action=update', !e4 && updateLogs !== null, e4?.message);

// Filter by user
const { data: userLogs, error: e5 } = await c.from('audit_logs').select('*')
  .eq('organization_id', ORG).eq('user_id', ADMIN);
ok('T12.4.3d Filter by user_id', !e5 && userLogs && userLogs.length > 0, e5?.message);

// T12.2 Product Journey RPC
console.log('\n--- T12.2 Product Journey ---');
const { data: prods } = await c.from('products').select('id').eq('organization_id', ORG).eq('is_active', true).limit(1);
if (prods && prods.length > 0) {
  const { data: journey, error: eJ } = await c.rpc('get_product_journey', {
    p_product_id: prods[0].id, p_org_id: ORG
  });
  ok('T12.2.1 RPC get_product_journey', !eJ && journey, eJ?.message);
  ok('T12.2.2 Journey has events array', journey && Array.isArray(journey.events));
  console.log('    Events count:', journey?.events?.length || 0);
}

// Cleanup
console.log('\n--- Cleanup ---');
if (al1) await c.from('audit_logs').delete().eq('id', al1.id);
if (al2) await c.from('audit_logs').delete().eq('id', al2.id);

console.log('\n=== T12 Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
