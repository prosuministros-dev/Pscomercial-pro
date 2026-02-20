import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const BASE = 'http://localhost:3000';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T20: Performance y Cron Jobs ===');

// T20.3 Cron endpoints
console.log('\n--- T20.3 Cron endpoints ---');
const cronEndpoints = ['/api/cron/quote-expiry', '/api/cron/lead-followup', '/api/cron/license-alerts'];

for (const ep of cronEndpoints) {
  try {
    const res = await fetch(BASE + ep);
    // Without CRON_SECRET should return 401 or 500 (but not crash)
    ok('T20.3.8 ' + ep.split('/').pop() + ' rejects no-secret', res.status !== 200);
    console.log('    ' + ep.split('/').pop() + ': status ' + res.status);
  } catch (err) {
    ok('T20.3.8 ' + ep.split('/').pop() + ' rejects no-secret', false, 'fetch error: ' + err.message);
  }
}

// T20.1 Performance - measure DB query times
console.log('\n--- T20.1 API Response Times ---');
const queries = [
  { table: 'leads', label: 'leads', maxMs: 500 },
  { table: 'customers', label: 'customers', maxMs: 500 },
  { table: 'products', label: 'products', maxMs: 500 },
  { table: 'quotes', label: 'quotes', maxMs: 500 },
  { table: 'orders', label: 'orders', maxMs: 500 },
];

for (const q of queries) {
  const start = Date.now();
  const { data, error } = await c.from(q.table).select('id').eq('organization_id', ORG).limit(100);
  const elapsed = Date.now() - start;
  ok('T20.1 ' + q.label + ' <' + q.maxMs + 'ms', elapsed < q.maxMs, 'took ' + elapsed + 'ms');
  console.log('    ' + q.label + ': ' + elapsed + 'ms (' + (data?.length || 0) + ' rows)');
}

// Dashboard RPCs performance
const rpcTests = [
  { fn: 'get_commercial_pipeline', params: { p_org_id: ORG, p_from: '2026-01-01', p_to: '2026-12-31' }, maxMs: 1000 },
  { fn: 'get_operational_dashboard', params: { p_org_id: ORG, p_from: '2026-01-01', p_to: '2026-12-31' }, maxMs: 1000 },
  { fn: 'get_semaforo_operativo', params: { p_org_id: ORG }, maxMs: 1000 },
];

for (const rpc of rpcTests) {
  const start = Date.now();
  const { data, error } = await c.rpc(rpc.fn, rpc.params);
  const elapsed = Date.now() - start;
  ok('T20.1 RPC ' + rpc.fn + ' <' + rpc.maxMs + 'ms', !error && elapsed < rpc.maxMs, error?.message || ('took ' + elapsed + 'ms'));
  console.log('    ' + rpc.fn + ': ' + elapsed + 'ms');
}

// T20.2 Verify key indexes exist (check via information_schema)
console.log('\n--- T20.2 DB Indexes ---');
const { data: idxData, error: eIdx } = await c.rpc('get_commercial_pipeline', {
  p_org_id: ORG, p_from: '2026-01-01', p_to: '2026-12-31'
});
// Just verify RPCs work (index validation requires EXPLAIN which we can't do via PostgREST)
ok('T20.2.1 commercial_pipeline RPC functional', !eIdx && idxData);

console.log('\n=== T20 Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
