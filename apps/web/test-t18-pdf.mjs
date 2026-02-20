import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const ADMIN = 'bbe305e6-6343-4911-ad7d-c25a5ded4c36';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T18: PDF Generation ===');

// Setup: ensure product + customer + quote + order exist
let prodId, custId, quoteId, orderId;

// Get or create product
const { data: prods } = await c.from('products').select('id').eq('organization_id', ORG).limit(1);
if (prods && prods.length > 0) { prodId = prods[0].id; }
else {
  const { data: np } = await c.from('products').insert({
    organization_id: ORG, sku: 'PROD-PDF-001', name: 'Producto PDF Test',
    unit_cost_usd: 100, unit_cost_cop: 400000, suggested_price_cop: 500000, currency: 'COP'
  }).select().single();
  prodId = np?.id;
}

// Get or create customer
const { data: custs } = await c.from('customers').select('id').eq('organization_id', ORG).limit(1);
if (custs && custs.length > 0) { custId = custs[0].id; }
else {
  const { data: nc } = await c.from('customers').insert({
    organization_id: ORG, business_name: 'Cliente PDF Test', nit: '900111222-3',
    industry: 'Tech', address: 'Calle 1', city: 'Bogota', phone: '3001234567',
    email: 'pdf@test.com', credit_status: 'approved'
  }).select().single();
  custId = nc?.id;
}

// Create quote for PDF test
const { data: q, error: qErr } = await c.from('quotes').insert({
  organization_id: ORG, customer_id: custId, advisor_id: ADMIN,
  quote_number: 99901, status: 'approved', currency: 'COP', payment_terms: 'Contado',
  subtotal: 5000000, tax_amount: 950000, total: 5950000,
  expires_at: '2026-06-01', validity_days: 30
}).select().single();
quoteId = q?.id;
if (qErr) console.log('    Quote error:', qErr.message);

if (quoteId) {
  const { error: qiErr } = await c.from('quote_items').insert({
    quote_id: quoteId, product_id: prodId, sku: 'PROD-PDF-001',
    description: 'Producto PDF Test', quantity: 10, unit_price: 500000,
    subtotal: 5000000, total: 5950000, tax_amount: 950000, cost_price: 400000
  });
  if (qiErr) console.log('    Quote item error:', qiErr.message);
}

// Create order for PDF test
const { data: o, error: oErr } = await c.from('orders').insert({
  organization_id: ORG, quote_id: quoteId, customer_id: custId, advisor_id: ADMIN,
  order_number: 99901, status: 'created', payment_terms: 'Contado',
  subtotal: 5000000, tax_amount: 950000, total: 5950000
}).select().single();
orderId = o?.id;
if (oErr) console.log('    Order error:', oErr.message);

if (orderId) {
  const { error: oiErr } = await c.from('order_items').insert({
    order_id: orderId, product_id: prodId, sku: 'PROD-PDF-001',
    description: 'Producto PDF Test', quantity: 10, unit_price: 500000,
    subtotal: 5000000, tax_amount: 950000, total: 5950000
  });
  if (oiErr) console.log('    Order item error:', oiErr.message);
}

// T18.1 PDF Quote data readiness
console.log('\n--- T18.1 PDF Quote ---');
ok('T18.1.1 Quote exists for PDF test', !!quoteId);

if (quoteId) {
  const { data: qDetail } = await c.from('quotes').select('*, customer:customers(business_name, nit, address, city), items:quote_items(*)').eq('id', quoteId).single();
  ok('T18.1.2 Quote has customer for PDF', !!qDetail?.customer);
  ok('T18.1.3 Quote has customer business_name', qDetail?.customer?.business_name?.length > 0);
  ok('T18.1.4 Quote has items for PDF', qDetail?.items && qDetail.items.length > 0);
  ok('T18.1.5 Quote has subtotal', qDetail?.subtotal !== null);
  ok('T18.1.6 Quote has total', qDetail?.total !== null);
  ok('T18.1.7 Quote has payment_terms', qDetail?.payment_terms?.length > 0);
  ok('T18.1.8 Quote has expires_at', !!qDetail?.expires_at);
  ok('T18.1.9 Quote has currency', !!qDetail?.currency);
}

// T18.2 PDF Order
console.log('\n--- T18.2 PDF Order ---');
ok('T18.2.1 Order exists for PDF test', !!orderId);

if (orderId) {
  const { data: oDetail } = await c.from('orders').select('*, customer:customers(business_name, nit), items:order_items(*)').eq('id', orderId).single();
  ok('T18.2.2 Order has customer for PDF', !!oDetail?.customer);
  ok('T18.2.3 Order has items for PDF', oDetail?.items && oDetail.items.length > 0);
  ok('T18.2.4 Order has total', oDetail?.total !== null);
  ok('T18.2.5 Order has payment_terms', oDetail?.payment_terms?.length > 0);
}

// T18.3 Organization branding for PDF
console.log('\n--- T18.3 Organization Branding ---');
const { data: org } = await c.from('organizations').select('*').eq('id', ORG).single();
ok('T18.3.1 Organization has name', org?.name?.length > 0);
ok('T18.3.2 Organization exists for branding', !!org);

// T18.4 Storage bucket for PDFs
console.log('\n--- T18.4 Storage ---');
const { data: buckets, error: eb } = await c.storage.listBuckets();
ok('T18.4.1 Storage buckets accessible', !eb, eb?.message);
if (buckets) {
  console.log('    Buckets:', buckets.map(b => b.name).join(', '));
  const hasDocBucket = buckets.some(b => b.name === 'documents');
  const hasPdfBucket = buckets.some(b => b.name === 'generated-pdfs');
  ok('T18.4.2 documents bucket exists', hasDocBucket);
  ok('T18.4.3 generated-pdfs bucket exists', hasPdfBucket);
}

// Cleanup test data
console.log('\n--- Cleanup ---');
if (orderId) {
  await c.from('order_items').delete().eq('order_id', orderId);
  await c.from('orders').delete().eq('id', orderId);
}
if (quoteId) {
  await c.from('quote_items').delete().eq('quote_id', quoteId);
  await c.from('quotes').delete().eq('id', quoteId);
}
console.log('    Cleaned up test data');

console.log('\n=== T18 Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
