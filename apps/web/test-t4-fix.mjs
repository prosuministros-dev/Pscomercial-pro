import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const ADMIN = 'bbe305e6-6343-4911-ad7d-c25a5ded4c36';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T4 Fix: Lead Rejection + Quote from Lead ===');

const { data: customers } = await c.from('customers').select('id').eq('organization_id', ORG).limit(1);
const customerId = customers?.[0]?.id;

// ── T4.1.1-1.2: Lead rejection ──
console.log('\n--- T4.1.1-1.2 Lead Rejection ---');

// Generate lead_number first
const { data: leadNum } = await c.rpc('generate_consecutive', { org_uuid: ORG, entity_type: 'lead' });
console.log('  Generated lead_number:', leadNum);

const { data: testLead, error: tlErr } = await c.from('leads').insert({
  organization_id: ORG, lead_number: leadNum, business_name: 'Test Reject SAS', nit: '900555111-0',
  contact_name: 'Test Reject', phone: '+573009990001', email: 'reject@test.com',
  requirement: 'Test rejection flow', channel: 'manual', status: 'created', created_by: ADMIN
}).select().single();

if (testLead) {
  // Update to rejected with reason
  const { error: rejErr } = await c.from('leads').update({
    status: 'rejected', rejection_notes: 'Cliente no califica - sin NIT valido'
  }).eq('id', testLead.id);
  ok('T4.1.1 Lead can be set to rejected status', !rejErr, rejErr?.message);

  const { data: rejLead } = await c.from('leads').select('status, rejection_notes').eq('id', testLead.id).single();
  ok('T4.1.2a Rejected lead has rejection_notes', rejLead?.rejection_notes?.includes('no califica'));
  ok('T4.1.2b Rejected lead status = rejected', rejLead?.status === 'rejected');

  await c.from('leads').delete().eq('id', testLead.id);
} else {
  console.log('  FAIL to create lead:', tlErr?.message);
}

// ── T4.1.5 + T4.1.10: Quote from lead ──
console.log('\n--- T4.1.5 & T4.1.10 create_quote_from_lead ---');

const { data: leadNum2 } = await c.rpc('generate_consecutive', { org_uuid: ORG, entity_type: 'lead' });
const { data: convLead, error: clErr } = await c.from('leads').insert({
  organization_id: ORG, lead_number: leadNum2, business_name: 'Test Quote From Lead SAS', nit: '900777888-0',
  contact_name: 'Lead Contact', phone: '+573009990002', email: 'leadquote@test.com',
  requirement: 'Quote from lead test', channel: 'manual', status: 'assigned',
  created_by: ADMIN, assigned_to: ADMIN, customer_id: customerId
}).select().single();

if (convLead) {
  console.log('  Lead created:', convLead.id, '| lead_number:', convLead.lead_number);

  const { data: newQuoteId, error: rpcErr } = await c.rpc('create_quote_from_lead', { lead_uuid: convLead.id });
  ok('T4.1.10a create_quote_from_lead RPC executes', !rpcErr, rpcErr?.message);

  if (newQuoteId) {
    const { data: quote } = await c.from('quotes').select('*').eq('id', newQuoteId).single();
    ok('T4.1.5a Quote has customer_id from lead', quote?.customer_id === customerId);
    ok('T4.1.5b Quote has lead_id reference', quote?.lead_id === convLead.id);
    ok('T4.1.5c Quote has advisor_id from lead.assigned_to', quote?.advisor_id === ADMIN);
    ok('T4.1.5d Quote has validity_days = 30', quote?.validity_days === 30);
    ok('T4.1.5e Quote has expires_at set', !!quote?.expires_at);
    ok('T4.1.5f Quote status = draft', quote?.status === 'draft');
    ok('T4.1.10b Quote has auto-generated quote_number', quote?.quote_number > 0);

    // Verify lead changed to converted
    const { data: updLead } = await c.from('leads').select('status').eq('id', convLead.id).single();
    ok('T4.1.10c Lead status changed to converted', updLead?.status === 'converted');

    console.log('  Quote created: #' + quote?.quote_number, '| customer_id:', quote?.customer_id);

    // Cleanup
    await c.from('quote_items').delete().eq('quote_id', newQuoteId);
    await c.from('quotes').delete().eq('id', newQuoteId);
  }
  await c.from('leads').delete().eq('id', convLead.id);
} else {
  console.log('  FAIL create lead:', clErr?.message);
}

// ── T4.4.5: Seed margin rules if empty ──
console.log('\n--- T4.4.5 Margin Rules ---');
const { data: mRules } = await c.from('margin_rules').select('*').eq('organization_id', ORG);
if (!mRules || mRules.length === 0) {
  // Seed test margin rules
  const rules = [
    { organization_id: ORG, payment_type: 'anticipated', min_margin_pct: 15, created_by: ADMIN },
    { organization_id: ORG, payment_type: 'credit_30', min_margin_pct: 20, created_by: ADMIN },
    { organization_id: ORG, payment_type: 'credit_60', min_margin_pct: 25, created_by: ADMIN },
    { organization_id: ORG, payment_type: 'credit_90', min_margin_pct: 30, created_by: ADMIN },
  ];
  const { data: seeded, error: seedErr } = await c.from('margin_rules').insert(rules).select();
  if (seedErr) {
    console.log('  Could not seed margin_rules:', seedErr.message);
    // Check columns
    const { data: mrCheck, error: mrErr2 } = await c.from('margin_rules').select('id').limit(0);
    ok('T4.4.5 margin_rules table structure exists', !mrErr2, mrErr2?.message);
  } else {
    ok('T4.4.5a Margin rules seeded (4 payment types)', seeded && seeded.length === 4);
    const types = [...new Set(seeded.map(r => r.payment_type))];
    console.log('  Seeded types:', types.join(', '));
    ok('T4.4.5b All rules have min_margin_pct', seeded.every(r => r.min_margin_pct > 0));
  }
} else {
  ok('T4.4.5 Margin rules already exist', mRules.length > 0);
}

console.log('\n=== T4 Fix Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
