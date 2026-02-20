/**
 * setup-test-users.js
 *
 * Creates test users, profiles, and role assignments for Pscomercial-pro.
 * Uses Supabase Admin API (service_role key) and REST API.
 * Idempotent: safe to run multiple times.
 *
 * Requirements: Node.js 18+ (uses native fetch)
 *
 * Usage: node setup-test-users.js
 */

const SUPABASE_URL = 'https://jmevnusslcdaldtzymax.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjEwNDcsImV4cCI6MjA4NjM5NzA0N30.CCGILUaLNsmwgT5MbffinKOpNJV0Jy5_0xg1yTNCOyg';

const DEFAULT_PASSWORD = 'TestPscom2026!';

// ---------------------------------------------------------------------------
// Helper: headers for service-role REST API calls
// ---------------------------------------------------------------------------
function restHeaders(prefer) {
  const h = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) h['Prefer'] = prefer;
  return h;
}

// ---------------------------------------------------------------------------
// Helper: headers for Auth Admin API calls
// ---------------------------------------------------------------------------
function authHeaders() {
  return {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ---------------------------------------------------------------------------
// Generic REST helpers
// ---------------------------------------------------------------------------
async function restGet(path) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { headers: restHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function restPost(path, body, upsert = false) {
  const prefer = upsert
    ? 'resolution=merge-duplicates,return=representation'
    : 'return=representation';
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: restHeaders(prefer),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Auth Admin helpers
// ---------------------------------------------------------------------------

/** List all auth users (paginated, returns up to 1000) */
async function listAuthUsers(page = 1, perPage = 1000) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List auth users failed (${res.status}): ${text}`);
  }
  return res.json();
}

/** Create an auth user via Admin API */
async function createAuthUser(email, password, displayName) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create auth user ${email} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ============================================================================
// ORGANIZATION DEFINITIONS
// ============================================================================
const ORG1 = {
  name: 'PROSUMINISTROS TEST SAS',
  nit: '900111222-3',
  domain: 'prosutest.com',
  plan: 'enterprise',
  settings: { currency: 'COP', timezone: 'America/Bogota', language: 'es' },
  is_active: true,
};

const ORG2 = {
  name: 'OTRA EMPRESA TEST SAS',
  nit: '800999888-1',
  domain: 'otratest.com',
  plan: 'standard',
  settings: { currency: 'COP', timezone: 'America/Bogota', language: 'es' },
  is_active: true,
};

// ============================================================================
// USER DEFINITIONS  (orgKey: 'org1' or 'org2')
// ============================================================================
const USERS = [
  { email: 'admin@prosutest.com',       fullName: 'Admin Principal',     roleSlug: 'super_admin',        orgKey: 'org1' },
  { email: 'gerente@prosutest.com',      fullName: 'Carlos Gerente',      roleSlug: 'gerente_general',    orgKey: 'org1' },
  { email: 'director@prosutest.com',     fullName: 'Diana Directora',     roleSlug: 'director_comercial', orgKey: 'org1' },
  { email: 'gcomercial@prosutest.com',   fullName: 'Gustavo Comercial',   roleSlug: 'gerente_comercial',  orgKey: 'org1' },
  { email: 'asesor1@prosutest.com',      fullName: 'Andrea Asesora',      roleSlug: 'asesor_comercial',   orgKey: 'org1' },
  { email: 'asesor2@prosutest.com',      fullName: 'Bernardo Asesor',     roleSlug: 'asesor_comercial',   orgKey: 'org1' },
  { email: 'compras@prosutest.com',      fullName: 'Camila Compras',      roleSlug: 'compras',            orgKey: 'org1' },
  { email: 'logistica@prosutest.com',    fullName: 'Luis Logistica',      roleSlug: 'logistica',          orgKey: 'org1' },
  { email: 'finanzas@prosutest.com',     fullName: 'Fernanda Finanzas',   roleSlug: 'finanzas',           orgKey: 'org1' },
  { email: 'facturacion@prosutest.com',  fullName: 'Felipe Facturacion',  roleSlug: 'facturacion',        orgKey: 'org1' },
  { email: 'operaciones@prosutest.com',  fullName: 'Oscar Operaciones',   roleSlug: 'gerente_operativo',  orgKey: 'org1' },
  { email: 'revisor@prosutest.com',      fullName: 'Roberto Revisor',     roleSlug: 'jefe_bodega',        orgKey: 'org1' },
  { email: 'admin@otratest.com',         fullName: 'Admin Otra',          roleSlug: 'super_admin',        orgKey: 'org2' },
  { email: 'asesor@otratest.com',        fullName: 'Ana Otra',            roleSlug: 'asesor_comercial',   orgKey: 'org2' },
];

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('='.repeat(70));
  console.log('  PSCOMERCIAL-PRO  --  Test User Setup Script');
  console.log('='.repeat(70));
  console.log();

  // -----------------------------------------------------------------------
  // STEP 1: Ensure organizations exist
  // -----------------------------------------------------------------------
  console.log('[STEP 1] Checking / creating organizations...');

  const existingOrgs = await restGet('organizations?select=*');
  console.log(`  Found ${existingOrgs.length} existing organization(s).`);

  // -- Org 1 --
  let org1 = existingOrgs.find(o => o.nit === ORG1.nit);
  if (!org1) {
    console.log(`  Creating Org 1: ${ORG1.name} ...`);
    const created = await restPost('organizations', ORG1);
    org1 = created[0];
    console.log(`  -> Created with id: ${org1.id}`);
  } else {
    console.log(`  Org 1 already exists: ${org1.name} (${org1.id})`);
  }

  // -- Org 2 --
  let org2 = existingOrgs.find(o => o.nit === ORG2.nit);
  if (!org2) {
    console.log(`  Creating Org 2: ${ORG2.name} ...`);
    const created = await restPost('organizations', ORG2);
    org2 = created[0];
    console.log(`  -> Created with id: ${org2.id}`);
  } else {
    console.log(`  Org 2 already exists: ${org2.name} (${org2.id})`);
  }

  const orgMap = { org1: org1.id, org2: org2.id };
  console.log();

  // -----------------------------------------------------------------------
  // STEP 2: Ensure system roles exist for each organization
  // -----------------------------------------------------------------------
  console.log('[STEP 2] Ensuring system roles exist for each organization...');

  // The seed migration creates roles for the demo org (00000000-0000-0000-0000-000000000001).
  // We need roles for our test orgs. Let's check and create if needed.

  const SYSTEM_ROLES = [
    { name: 'Super Administrador',  slug: 'super_admin',        description: 'Acceso total al sistema.' },
    { name: 'Gerente General',      slug: 'gerente_general',    description: 'Visibilidad total. Aprobaciones.' },
    { name: 'Director Comercial',   slug: 'director_comercial', description: 'Gestión del equipo comercial.' },
    { name: 'Gerente Comercial',    slug: 'gerente_comercial',  description: 'Aprobación de márgenes. Asignación de leads.' },
    { name: 'Gerente Operativo',    slug: 'gerente_operativo',  description: 'Supervisión de pedidos, logística, bodega.' },
    { name: 'Asesor Comercial',     slug: 'asesor_comercial',   description: 'Gestión de leads asignados. Cotizaciones.' },
    { name: 'Finanzas',             slug: 'finanzas',           description: 'Control financiero. Validación de crédito.' },
    { name: 'Compras',              slug: 'compras',            description: 'Órdenes de compra. Gestión de proveedores.' },
    { name: 'Logística',            slug: 'logistica',          description: 'Despachos. Seguimiento. Guías de transporte.' },
    { name: 'Jefe de Bodega',       slug: 'jefe_bodega',        description: 'Recepción de mercancía. Control de inventario.' },
    { name: 'Auxiliar de Bodega',   slug: 'auxiliar_bodega',     description: 'Recepción y despacho bajo supervisión.' },
    { name: 'Facturación',          slug: 'facturacion',        description: 'Registro y seguimiento de facturas.' },
  ];

  for (const orgId of [org1.id, org2.id]) {
    const orgLabel = orgId === org1.id ? 'Org 1' : 'Org 2';
    const existingRoles = await restGet(`roles?organization_id=eq.${orgId}&select=id,slug`);
    const existingSlugs = new Set(existingRoles.map(r => r.slug));

    const toCreate = SYSTEM_ROLES.filter(r => !existingSlugs.has(r.slug));
    if (toCreate.length === 0) {
      console.log(`  ${orgLabel}: All ${SYSTEM_ROLES.length} system roles already exist.`);
    } else {
      console.log(`  ${orgLabel}: Creating ${toCreate.length} missing role(s)...`);
      const roleBodies = toCreate.map(r => ({
        organization_id: orgId,
        name: r.name,
        slug: r.slug,
        description: r.description,
        is_system: true,
        is_active: true,
      }));
      await restPost('roles', roleBodies);
      console.log(`  ${orgLabel}: Roles created.`);
    }
  }
  console.log();

  // -----------------------------------------------------------------------
  // STEP 2b: Seed role_permissions for each test organization
  // -----------------------------------------------------------------------
  // The seed migration (20260212000004) only creates role_permissions for the
  // demo org (00000000-0000-0000-0000-000000000001). We need to copy those
  // mappings to our test orgs so that roles actually grant permissions.
  // Without this, checkPermission() returns false for all users => 403 errors.
  // -----------------------------------------------------------------------
  console.log('[STEP 2b] Ensuring role_permissions exist for each test organization...');

  const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

  // Fetch demo org roles with their IDs and slugs
  const demoRoles = await restGet(`roles?organization_id=eq.${DEMO_ORG_ID}&select=id,slug`);
  const demoRoleBySlug = {};
  for (const r of demoRoles) {
    demoRoleBySlug[r.slug] = r.id;
  }

  // Fetch all permissions (they are global, not per-org)
  const allPermissions = await restGet('permissions?select=id,slug');
  const permIdBySlug = {};
  for (const p of allPermissions) {
    permIdBySlug[p.slug] = p.id;
  }

  // Fetch demo org role_permissions as our template
  const demoRoleIds = demoRoles.map(r => `"${r.id}"`).join(',');
  const demoRolePerms = await restGet(
    `role_permissions?role_id=in.(${demoRoleIds})&select=role_id,permission_id`
  );

  // Build a map: role_slug -> [permission_id, ...]
  const demoRoleIdToSlug = {};
  for (const r of demoRoles) {
    demoRoleIdToSlug[r.id] = r.slug;
  }
  const permsByRoleSlug = {};
  for (const rp of demoRolePerms) {
    const slug = demoRoleIdToSlug[rp.role_id];
    if (!permsByRoleSlug[slug]) permsByRoleSlug[slug] = [];
    permsByRoleSlug[slug].push(rp.permission_id);
  }

  for (const orgId of [org1.id, org2.id]) {
    const orgLabel = orgId === org1.id ? 'Org 1' : 'Org 2';

    // Get roles for this org
    const orgRoles = await restGet(`roles?organization_id=eq.${orgId}&select=id,slug`);
    const orgRoleBySlug = {};
    for (const r of orgRoles) {
      orgRoleBySlug[r.slug] = r.id;
    }

    // Get existing role_permissions for this org's roles
    const orgRoleIds = orgRoles.map(r => `"${r.id}"`).join(',');
    const existingOrgRolePerms = orgRoleIds.length > 0
      ? await restGet(`role_permissions?role_id=in.(${orgRoleIds})&select=role_id,permission_id`)
      : [];
    const existingRPSet = new Set(
      existingOrgRolePerms.map(rp => `${rp.role_id}::${rp.permission_id}`)
    );

    // For each role slug that has a template in the demo org, copy missing permissions
    let totalCreated = 0;
    for (const [roleSlug, permissionIds] of Object.entries(permsByRoleSlug)) {
      const targetRoleId = orgRoleBySlug[roleSlug];
      if (!targetRoleId) continue; // role doesn't exist in this org

      const toInsert = permissionIds
        .filter(pid => !existingRPSet.has(`${targetRoleId}::${pid}`))
        .map(pid => ({ role_id: targetRoleId, permission_id: pid }));

      if (toInsert.length > 0) {
        await restPost('role_permissions', toInsert, true);
        totalCreated += toInsert.length;
      }
    }

    if (totalCreated === 0) {
      console.log(`  ${orgLabel}: All role_permissions already exist.`);
    } else {
      console.log(`  ${orgLabel}: Created ${totalCreated} role_permission(s).`);
    }
  }
  console.log();

  // -----------------------------------------------------------------------
  // STEP 3: Fetch existing auth users (for idempotency check)
  // -----------------------------------------------------------------------
  console.log('[STEP 3] Fetching existing auth users...');
  const authUsersResponse = await listAuthUsers();
  const authUsersList = authUsersResponse.users || authUsersResponse;
  const existingByEmail = {};
  for (const u of authUsersList) {
    if (u.email) existingByEmail[u.email.toLowerCase()] = u;
  }
  console.log(`  Found ${Object.keys(existingByEmail).length} existing auth user(s).`);
  console.log();

  // -----------------------------------------------------------------------
  // STEP 4: Create users, profiles, and role assignments
  // -----------------------------------------------------------------------
  console.log('[STEP 4] Creating users, profiles, and role assignments...');

  // Pre-fetch all profiles so we can skip already-created ones
  const existingProfiles = await restGet('profiles?select=id,email');
  const profilesByUserId = new Set(existingProfiles.map(p => p.id));

  // Pre-fetch all user_roles so we can skip duplicates
  const existingUserRoles = await restGet('user_roles?select=user_id,role_id');
  const userRoleSet = new Set(existingUserRoles.map(ur => `${ur.user_id}::${ur.role_id}`));

  let createdCount = 0;
  let skippedCount = 0;

  for (const userDef of USERS) {
    const orgId = orgMap[userDef.orgKey];
    const orgLabel = userDef.orgKey === 'org1' ? 'Org 1' : 'Org 2';
    console.log(`\n  --- ${userDef.email} (${userDef.fullName}) ---`);

    // 4a. Create or get auth user
    let authUser = existingByEmail[userDef.email.toLowerCase()];
    if (authUser) {
      console.log(`    Auth user already exists (id: ${authUser.id})`);
      skippedCount++;
    } else {
      try {
        authUser = await createAuthUser(userDef.email, DEFAULT_PASSWORD, userDef.fullName);
        console.log(`    Auth user CREATED (id: ${authUser.id})`);
        createdCount++;
      } catch (err) {
        console.error(`    ERROR creating auth user: ${err.message}`);
        continue;
      }
    }

    const userId = authUser.id;

    // 4b. Create profile if not exists
    if (profilesByUserId.has(userId)) {
      console.log(`    Profile already exists.`);
    } else {
      try {
        await restPost('profiles', {
          id: userId,
          organization_id: orgId,
          full_name: userDef.fullName,
          email: userDef.email,
          is_active: true,
          is_available: true,
        });
        profilesByUserId.add(userId);
        console.log(`    Profile CREATED.`);
      } catch (err) {
        // Might fail due to unique constraint if profile already exists with different email
        console.error(`    ERROR creating profile: ${err.message}`);
      }
    }

    // 4c. Look up role ID for this org + slug
    let roleId;
    try {
      const roles = await restGet(
        `roles?organization_id=eq.${orgId}&slug=eq.${userDef.roleSlug}&select=id`
      );
      if (roles.length === 0) {
        console.error(`    ERROR: Role '${userDef.roleSlug}' not found for ${orgLabel}.`);
        continue;
      }
      roleId = roles[0].id;
    } catch (err) {
      console.error(`    ERROR looking up role: ${err.message}`);
      continue;
    }

    // 4d. Create user_role entry if not exists
    const urKey = `${userId}::${roleId}`;
    if (userRoleSet.has(urKey)) {
      console.log(`    Role assignment already exists (${userDef.roleSlug}).`);
    } else {
      try {
        await restPost('user_roles', {
          user_id: userId,
          role_id: roleId,
        });
        userRoleSet.add(urKey);
        console.log(`    Role '${userDef.roleSlug}' ASSIGNED.`);
      } catch (err) {
        console.error(`    ERROR assigning role: ${err.message}`);
      }
    }
  }

  // -----------------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  console.log(`  Auth users created : ${createdCount}`);
  console.log(`  Auth users skipped : ${skippedCount} (already existed)`);
  console.log(`  Total users processed: ${USERS.length}`);
  console.log(`  Org 1 ID: ${org1.id}`);
  console.log(`  Org 2 ID: ${org2.id}`);
  console.log();
  console.log('  All users have password: ' + DEFAULT_PASSWORD);
  console.log();
  console.log('  Login emails:');
  for (const u of USERS) {
    console.log(`    - ${u.email.padEnd(30)} (${u.roleSlug})`);
  }
  console.log();
  console.log('Done!');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main().catch(err => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
