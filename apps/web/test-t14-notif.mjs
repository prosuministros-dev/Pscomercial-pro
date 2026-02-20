import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const ADMIN = 'bbe305e6-6343-4911-ad7d-c25a5ded4c36';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T14: Notificaciones In-App ===');

// T14.3.1 Create notification (type: system, priority: normal)
const { data: notif, error: e1 } = await c.from('notifications').insert({
  organization_id: ORG, user_id: ADMIN, title: 'Test E2E Notification',
  message: 'Notificacion de prueba', type: 'system', priority: 'normal',
  entity_type: 'system', entity_id: '00000000-0000-0000-0000-000000000000'
}).select().single();
ok('T14.3.1 POST notification', !e1 && notif, e1?.message);

let notifId = null;
if (notif) {
  notifId = notif.id;
  ok('T14.3.2 Notification has title', notif.title === 'Test E2E Notification');
  ok('T14.3.3 Notification type=system', notif.type === 'system');
  ok('T14.3.4 Notification priority=normal', notif.priority === 'normal');
  ok('T14.3.5 is_read=false initially', notif.is_read === false);

  const { data: notifs, error: e2 } = await c.from('notifications').select('*')
    .eq('user_id', ADMIN).order('created_at', { ascending: false }).limit(10);
  ok('T14.3.6 GET notifications list', !e2 && notifs && notifs.length > 0, e2?.message);

  const { data: readN, error: e3 } = await c.from('notifications').update({
    is_read: true, read_at: new Date().toISOString()
  }).eq('id', notif.id).select().single();
  ok('T14.3.7 Mark as read', !e3 && readN && readN.is_read === true, e3?.message);

  const { count, error: e4 } = await c.from('notifications').select('*', { count: 'exact', head: true })
    .eq('user_id', ADMIN).eq('is_read', false);
  ok('T14.3.8 Unread count query', !e4 && typeof count === 'number', e4?.message);
}

// Priority levels (valid: low, normal, high, urgent)
const priorities = ['low', 'normal', 'high', 'urgent'];
for (const prio of priorities) {
  const { data: np, error: ep } = await c.from('notifications').insert({
    organization_id: ORG, user_id: ADMIN, title: 'Priority ' + prio,
    message: 'Test', type: 'system', priority: prio,
    entity_type: 'system', entity_id: '00000000-0000-0000-0000-000000000000'
  }).select().single();
  ok('T14.3.9 Priority: ' + prio, !ep && np, ep?.message);
  if (np) await c.from('notifications').delete().eq('id', np.id);
}

// Notification types
const types = ['lead_assigned', 'quote_approval', 'order_created', 'mention', 'alert',
  'margin_approved', 'margin_rejected', 'payment_confirmed', 'quote_sent', 'quote_reminder'];
for (const tp of types) {
  const { data: nt, error: et } = await c.from('notifications').insert({
    organization_id: ORG, user_id: ADMIN, title: 'Type ' + tp,
    message: 'Test', type: tp, priority: 'low',
    entity_type: 'system', entity_id: '00000000-0000-0000-0000-000000000000'
  }).select().single();
  ok('T14.3.10 Type: ' + tp, !et && nt, et?.message);
  if (nt) await c.from('notifications').delete().eq('id', nt.id);
}

// Invalid type rejected
const { error: eInv } = await c.from('notifications').insert({
  organization_id: ORG, user_id: ADMIN, title: 'Bad',
  message: 'Test', type: 'invalid_type', priority: 'low',
  entity_type: 'system', entity_id: '00000000-0000-0000-0000-000000000000'
});
ok('T14.3.11 Invalid type rejected', !!eInv);

if (notifId) await c.from('notifications').delete().eq('id', notifId);
console.log('\n=== T14 Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
