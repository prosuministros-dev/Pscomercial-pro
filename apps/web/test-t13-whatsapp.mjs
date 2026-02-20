import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const ADMIN = 'bbe305e6-6343-4911-ad7d-c25a5ded4c36';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T13: WhatsApp & Email Integration ===');

// T13.1 WhatsApp DB tables exist
console.log('\n--- T13.1 WhatsApp Tables ---');
const { data: wa, error: e1 } = await c.from('whatsapp_accounts').select('*').eq('organization_id', ORG);
ok('T13.1.1 whatsapp_accounts table accessible', !e1, e1?.message);
console.log('    WhatsApp accounts:', wa?.length || 0);

const { data: wc, error: e2 } = await c.from('whatsapp_conversations').select('*').eq('organization_id', ORG).limit(5);
ok('T13.1.2 whatsapp_conversations table accessible', !e2, e2?.message);

const { data: wm, error: e3 } = await c.from('whatsapp_messages').select('*').eq('organization_id', ORG).limit(5);
ok('T13.1.3 whatsapp_messages table accessible', !e3, e3?.message);

// T13.2 WhatsApp account setup prerequisite
console.log('\n--- T13.2 WhatsApp Account ---');
// Create a test WA account first (required for conversations)
const { data: waAcct, error: e4 } = await c.from('whatsapp_accounts').insert({
  organization_id: ORG,
  waba_id: 'TEST_WABA_001',
  phone_number_id: 'TEST_PHONE_001',
  display_phone: '+573001112233',
  business_name: 'Test Business WA',
  access_token: 'test_access_token_encrypted',
  webhook_verify_token: 'test_verify_token',
  status: 'active'
}).select().single();
ok('T13.2.1 CREATE whatsapp_account', !e4 && waAcct, e4?.message);

if (waAcct) {
  ok('T13.2.2 Account has waba_id', waAcct.waba_id === 'TEST_WABA_001');
  ok('T13.2.3 Account has phone_number_id', waAcct.phone_number_id === 'TEST_PHONE_001');
  ok('T13.2.4 Account status=active', waAcct.status === 'active');

  // T13.3 Conversation CRUD
  console.log('\n--- T13.3 Conversation CRUD ---');
  const { data: conv, error: e5 } = await c.from('whatsapp_conversations').insert({
    organization_id: ORG,
    whatsapp_account_id: waAcct.id,
    customer_phone: '+573001234567',
    customer_name: 'Test Contact E2E',
    status: 'active',
    conversation_type: 'bot'
  }).select().single();
  ok('T13.3.1 CREATE conversation', !e5 && conv, e5?.message);

  if (conv) {
    ok('T13.3.2 Conversation has customer_phone', conv.customer_phone === '+573001234567');
    ok('T13.3.3 Conversation has status=active', conv.status === 'active');
    ok('T13.3.4 Conversation has type=bot', conv.conversation_type === 'bot');

    // Test conversation statuses
    const statuses = ['active', 'closed', 'bot', 'human_takeover'];
    for (const st of statuses) {
      const { error: eU } = await c.from('whatsapp_conversations').update({ status: st }).eq('id', conv.id);
      ok('T13.3.5 Status: ' + st, !eU, eU?.message);
    }

    // Test conversation types
    const types = ['bot', 'human', 'mixed'];
    for (const tp of types) {
      const { error: eT } = await c.from('whatsapp_conversations').update({ conversation_type: tp }).eq('id', conv.id);
      ok('T13.3.6 Type: ' + tp, !eT, eT?.message);
    }

    // Test intents
    const intents = ['quote_request', 'order_status', 'advisory', 'other'];
    for (const intent of intents) {
      const { error: eI } = await c.from('whatsapp_conversations').update({ intent }).eq('id', conv.id);
      ok('T13.3.7 Intent: ' + intent, !eI, eI?.message);
    }

    // T13.4 Message CRUD
    console.log('\n--- T13.4 Message CRUD ---');
    const { data: msg, error: e6 } = await c.from('whatsapp_messages').insert({
      organization_id: ORG,
      conversation_id: conv.id,
      direction: 'inbound',
      sender_type: 'customer',
      message_type: 'text',
      content: 'Hola, necesito cotizacion'
    }).select().single();
    ok('T13.4.1 CREATE message', !e6 && msg, e6?.message);

    if (msg) {
      ok('T13.4.2 Message has direction=inbound', msg.direction === 'inbound');
      ok('T13.4.3 Message has sender_type=customer', msg.sender_type === 'customer');
      ok('T13.4.4 Message has message_type=text', msg.message_type === 'text');
      ok('T13.4.5 Message has content', msg.content === 'Hola, necesito cotizacion');
      await c.from('whatsapp_messages').delete().eq('id', msg.id);
    }

    // Test message types
    const msgTypes = ['text', 'image', 'document', 'audio', 'video', 'template', 'interactive', 'location'];
    for (const mt of msgTypes) {
      const { data: tm, error: etm } = await c.from('whatsapp_messages').insert({
        organization_id: ORG, conversation_id: conv.id,
        direction: 'inbound', sender_type: 'customer', message_type: mt,
        content: 'Test ' + mt
      }).select().single();
      ok('T13.4.6 MsgType: ' + mt, !etm && tm, etm?.message);
      if (tm) await c.from('whatsapp_messages').delete().eq('id', tm.id);
    }

    // Test sender types
    const senderTypes = ['customer', 'bot', 'agent'];
    for (const st of senderTypes) {
      const { data: sm, error: esm } = await c.from('whatsapp_messages').insert({
        organization_id: ORG, conversation_id: conv.id,
        direction: st === 'customer' ? 'inbound' : 'outbound',
        sender_type: st, message_type: 'text', content: 'Test sender ' + st
      }).select().single();
      ok('T13.4.7 SenderType: ' + st, !esm && sm, esm?.message);
      if (sm) await c.from('whatsapp_messages').delete().eq('id', sm.id);
    }

    // Directions
    for (const dir of ['inbound', 'outbound']) {
      const { data: dm, error: edm } = await c.from('whatsapp_messages').insert({
        organization_id: ORG, conversation_id: conv.id,
        direction: dir, sender_type: dir === 'inbound' ? 'customer' : 'bot',
        message_type: 'text', content: 'Test dir ' + dir
      }).select().single();
      ok('T13.4.8 Direction: ' + dir, !edm && dm, edm?.message);
      if (dm) await c.from('whatsapp_messages').delete().eq('id', dm.id);
    }

    // Cleanup conversation
    await c.from('whatsapp_conversations').delete().eq('id', conv.id);
  }

  // Cleanup account
  await c.from('whatsapp_accounts').delete().eq('id', waAcct.id);
}

// T13.5 Email logs table
console.log('\n--- T13.5 Email Logs ---');
const { data: el, error: e7 } = await c.from('email_logs').select('*').eq('organization_id', ORG).limit(5);
ok('T13.5.1 email_logs table accessible', !e7, e7?.message);

// Create test email log (from_email is NOT NULL)
const { data: newEl, error: e8 } = await c.from('email_logs').insert({
  organization_id: ORG,
  to_email: 'test@example.com',
  from_email: 'noreply@prosutest.com',
  subject: 'Test E2E email',
  template_id: 'quote_send',
  entity_type: 'quote',
  status: 'sent'
}).select().single();
ok('T13.5.2 CREATE email_log', !e8 && newEl, e8?.message);

if (newEl) {
  ok('T13.5.3 Email log has to_email', newEl.to_email === 'test@example.com');
  ok('T13.5.4 Email log has from_email', newEl.from_email === 'noreply@prosutest.com');
  ok('T13.5.5 Email log has status=sent', newEl.status === 'sent');
  ok('T13.5.6 Email log has template_id', newEl.template_id === 'quote_send');
  ok('T13.5.7 Email log has entity_type=quote', newEl.entity_type === 'quote');

  // Test email statuses
  const emailStatuses = ['queued', 'sent', 'delivered', 'opened', 'bounced', 'failed'];
  for (const es of emailStatuses) {
    const { error: eS } = await c.from('email_logs').update({ status: es }).eq('id', newEl.id);
    ok('T13.5.8 Email status: ' + es, !eS, eS?.message);
  }

  // Test entity types
  const entityTypes = ['quote', 'proforma', 'order', 'notification'];
  for (const et of entityTypes) {
    const { error: eE } = await c.from('email_logs').update({ entity_type: et }).eq('id', newEl.id);
    ok('T13.5.9 Entity type: ' + et, !eE, eE?.message);
  }

  await c.from('email_logs').delete().eq('id', newEl.id);
}

console.log('\n=== T13 Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
