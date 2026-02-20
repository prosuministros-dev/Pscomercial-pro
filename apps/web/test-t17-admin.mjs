import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://jmevnusslcdaldtzymax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
);
const ORG = 'bee5aac6-a830-4857-b608-25b1985c8d82';
const ADMIN = 'bbe305e6-6343-4911-ad7d-c25a5ded4c36';
let P = 0, F = 0;
function ok(t, r, detail) { if (r) P++; else F++; console.log(r ? '  PASS ' + t : '  FAIL ' + t); if (!r && detail) console.log('    Detail:', detail); }

console.log('=== T17: Admin y Configuracion ===');

// T17.1 Users
console.log('\n--- T17.1 Users ---');
const { data: users, error: e1 } = await c.from('profiles').select('*').eq('organization_id', ORG);
ok('T17.1.1 GET profiles lista', !e1 && users && users.length > 0, e1?.message);
console.log('    Users found:', users?.length);

const admin = users?.find(u => u.id === ADMIN);
ok('T17.1.2 Admin user has full_name', admin && admin.full_name?.length > 0);

const { data: roles, error: e3 } = await c.from('user_roles').select('*, roles(*)').eq('user_id', ADMIN);
ok('T17.1.3 Admin has role assignment', !e3 && roles && roles.length > 0, e3?.message);
if (roles) console.log('    Roles:', roles.map(r => r.roles?.name).join(', '));

// T17.2 Roles
console.log('\n--- T17.2 Roles ---');
const { data: allRoles, error: e4 } = await c.from('roles').select('*').eq('organization_id', ORG);
ok('T17.2.1 GET roles list', !e4 && allRoles && allRoles.length > 0, e4?.message);
console.log('    Roles found:', allRoles?.length, '-', allRoles?.map(r => r.name).join(', '));

// Check key roles exist (Spanish names from actual data)
const sysRoles = ['Super Administrador', 'Asesor Comercial', 'Gerente Comercial', 'Logística', 'Facturación'];
for (const sr of sysRoles) {
  const found = allRoles?.find(r => r.name === sr);
  ok('T17.2.2 Role: ' + sr, !!found);
}

// T17.2.3 Role permissions
const superAdmin = allRoles?.find(r => r.name === 'Super Administrador');
if (superAdmin) {
  const { data: perms, error: e5 } = await c.from('role_permissions').select('*, permissions(*)').eq('role_id', superAdmin.id);
  ok('T17.2.3 Super Admin has permissions', !e5 && perms && perms.length > 0, e5?.message);
  console.log('    Super Admin permissions:', perms?.length);
}

// T17.3 Audit Logs
console.log('\n--- T17.3 Audit Logs ---');
const { data: al, error: e6 } = await c.from('audit_logs').insert({
  organization_id: ORG, user_id: ADMIN, action: 'create',
  entity_type: 'lead', entity_id: '00000000-0000-0000-0000-000000000001',
  metadata: { test: 'T17 audit test' }
}).select().single();
ok('T17.3.1 CREATE audit_log', !e6 && al, e6?.message);

if (al) {
  ok('T17.3.2 Audit log has user_id', al.user_id === ADMIN);
  ok('T17.3.3 Audit log has action', al.action === 'create');
  ok('T17.3.4 Audit log has entity_type', al.entity_type === 'lead');
  await c.from('audit_logs').delete().eq('id', al.id);
}

// Valid actions check
const validActions = ['create', 'update', 'delete', 'approve', 'reject', 'assign', 'login', 'export'];
for (const act of validActions) {
  const { data: a, error: ea } = await c.from('audit_logs').insert({
    organization_id: ORG, user_id: ADMIN, action: act,
    entity_type: 'system', entity_id: '00000000-0000-0000-0000-000000000000'
  }).select().single();
  ok('T17.3.5 Valid action: ' + act, !ea, ea?.message);
  if (a) await c.from('audit_logs').delete().eq('id', a.id);
}

// T17.4 Permissions
console.log('\n--- T17.4 Permissions ---');
const { data: allPerms, error: e7 } = await c.from('permissions').select('*');
ok('T17.4.1 GET permissions list', !e7 && allPerms && allPerms.length > 0, e7?.message);
console.log('    Total permissions:', allPerms?.length);

// Check critical permissions (slug format)
const critPerms = ['leads:read', 'leads:create', 'quotes:read', 'quotes:create', 'orders:read', 'dashboard:read', 'reports:read'];
for (const cp of critPerms) {
  const found = allPerms?.find(p => p.slug === cp);
  ok('T17.4.2 Permission: ' + cp, !!found);
}

console.log('\n=== T17 Summary: ' + P + ' PASS, ' + F + ' FAIL ===');
