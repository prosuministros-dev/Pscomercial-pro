import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const ADMIN = 'bbe305e6-6343-4911-ad7d-c25a5ded4c36';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T10.4: Reports API ===');

// T10.4 Saved Reports CRUD
console.log('\n--- T10.4 Saved Reports ---');

// T10.4.8 Create saved report
const { data: sr, error: e1 } = await c.from('saved_reports').insert({
  organization_id: ORG, user_id: ADMIN, name: 'Reporte Test E2E',
  report_type: 'leads', filters: { from: '2026-01-01', to: '2026-12-31' },
  is_shared: false
}).select().single();
ok('T10.4.8a POST saved_report', !e1 && sr, e1?.message);

let srId = null;
if (sr) {
  srId = sr.id;
  ok('T10.4.8b Report has name', sr.name === 'Reporte Test E2E');
  ok('T10.4.8c Report has type', sr.report_type === 'leads');
  ok('T10.4.8d Report has filters', sr.filters && sr.filters.from === '2026-01-01');

  // GET saved reports list
  const { data: srs, error: e2 } = await c.from('saved_reports').select('*').eq('organization_id', ORG);
  ok('T10.4.8e GET saved_reports list', !e2 && srs && srs.length > 0, e2?.message);

  // Delete saved report
  const { error: e3 } = await c.from('saved_reports').delete().eq('id', sr.id);
  ok('T10.4.8f DELETE saved_report', !e3, e3?.message);
  srId = null;
}

// Test all report types in saved_reports
const reportTypes = ['leads', 'quotes', 'orders', 'revenue', 'performance'];
for (const rt of reportTypes) {
  const { data: rp, error: eR } = await c.from('saved_reports').insert({
    organization_id: ORG, user_id: ADMIN, name: 'Test ' + rt,
    report_type: rt, filters: {}, is_shared: true
  }).select().single();
  ok('T10.4 Report type: ' + rt, !eR && rp, eR?.message);
  if (rp) await c.from('saved_reports').delete().eq('id', rp.id);
}

// T10.4 Dashboard widgets
console.log('\n--- T10.4 Dashboard Widgets ---');
const { data: dw, error: e4 } = await c.from('dashboard_widgets').select('*').eq('organization_id', ORG);
ok('T10.4.9 GET dashboard_widgets', !e4, e4?.message);
console.log('    Dashboard widgets:', dw?.length || 0);

// Cleanup
if (srId) await c.from('saved_reports').delete().eq('id', srId);

console.log('\n=== T10.4 Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
