/**
 * fix-role-permissions.js
 *
 * Copies role_permissions from the demo org to both test orgs.
 * For each test org, it maps demo role slugs to the corresponding role_id
 * in the test org, then inserts role_permissions entries.
 *
 * Idempotent: uses Prefer: resolution=merge-duplicates (unique index on role_id+permission_id).
 */

const SUPABASE_URL = 'https://jmevnusslcdaldtzymax.supabase.co';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw';

const DEMO_ORG = '00000000-0000-0000-0000-000000000000';
const TEST_ORGS = [
  'bee5aac6-a830-4857-b608-25b1985c8d82',
  '03eb936e-3cff-4a91-a25f-efaf548f0527',
];

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function supabasePost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('=== Fix Role Permissions for Test Organizations ===\n');

  // ---------------------------------------------------------------
  // Step 1: Find which demo org actually has role_permissions
  // ---------------------------------------------------------------
  console.log('Step 1: Finding demo org with role_permissions...');

  // Try the user-specified demo org first, then fall back to ...0001
  const candidateOrgs = [
    DEMO_ORG,
    '00000000-0000-0000-0000-000000000001',
  ];

  let demoOrgId = null;
  let demoRoles = [];
  let demoRolePermissions = [];

  for (const orgId of candidateOrgs) {
    const roles = await supabaseGet(
      `roles?organization_id=eq.${orgId}&select=id,slug,name`
    );
    if (roles.length === 0) continue;

    // Check if this org has role_permissions
    const roleIds = roles.map((r) => r.id);
    const rp = await supabaseGet(
      `role_permissions?role_id=in.(${roleIds.join(',')})&select=id,role_id,permission_id`
    );

    if (rp.length > 0) {
      demoOrgId = orgId;
      demoRoles = roles;
      demoRolePermissions = rp;
      break;
    }
  }

  if (!demoOrgId) {
    console.error('ERROR: No demo org found with role_permissions!');
    process.exit(1);
  }

  console.log(`  Demo org: ${demoOrgId}`);
  console.log(`  Demo roles: ${demoRoles.length}`);
  console.log(`  Demo role_permissions: ${demoRolePermissions.length}`);

  // Build a map: role_id -> slug for the demo org
  const demoRoleIdToSlug = {};
  for (const r of demoRoles) {
    demoRoleIdToSlug[r.id] = r.slug;
  }

  // Build a map: slug -> [permission_ids] from demo
  const slugToPermissionIds = {};
  for (const rp of demoRolePermissions) {
    const slug = demoRoleIdToSlug[rp.role_id];
    if (!slug) continue;
    if (!slugToPermissionIds[slug]) slugToPermissionIds[slug] = [];
    slugToPermissionIds[slug].push(rp.permission_id);
  }

  console.log('\n  Permission counts per role (demo):');
  for (const [slug, perms] of Object.entries(slugToPermissionIds)) {
    console.log(`    ${slug}: ${perms.length} permissions`);
  }

  // ---------------------------------------------------------------
  // Step 2: For each test org, create role_permissions
  // ---------------------------------------------------------------
  for (const testOrgId of TEST_ORGS) {
    console.log(`\n--- Processing test org: ${testOrgId} ---`);

    // Get roles for this test org
    const testRoles = await supabaseGet(
      `roles?organization_id=eq.${testOrgId}&select=id,slug,name`
    );

    if (testRoles.length === 0) {
      console.log('  WARNING: No roles found for this org. Skipping.');
      continue;
    }

    console.log(`  Found ${testRoles.length} roles`);

    // Build slug -> role_id for test org
    const testSlugToRoleId = {};
    for (const r of testRoles) {
      testSlugToRoleId[r.slug] = r.id;
    }

    // Build the role_permissions rows to insert
    const rowsToInsert = [];
    let matchedSlugs = 0;
    let skippedSlugs = [];

    for (const [slug, permissionIds] of Object.entries(slugToPermissionIds)) {
      const testRoleId = testSlugToRoleId[slug];
      if (!testRoleId) {
        skippedSlugs.push(slug);
        continue;
      }
      matchedSlugs++;
      for (const permId of permissionIds) {
        rowsToInsert.push({
          role_id: testRoleId,
          permission_id: permId,
        });
      }
    }

    console.log(`  Matched ${matchedSlugs} role slugs`);
    if (skippedSlugs.length > 0) {
      console.log(`  Skipped slugs (not in test org): ${skippedSlugs.join(', ')}`);
    }
    console.log(`  Total role_permission rows to upsert: ${rowsToInsert.length}`);

    if (rowsToInsert.length === 0) {
      console.log('  Nothing to insert. Skipping.');
      continue;
    }

    // Insert in batches of 500 to avoid payload size issues
    const BATCH_SIZE = 500;
    let totalInserted = 0;
    for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
      const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
      const result = await supabasePost('role_permissions', batch);
      totalInserted += result.length;
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: upserted ${result.length} rows`);
    }

    console.log(`  Total upserted: ${totalInserted}`);
  }

  // ---------------------------------------------------------------
  // Step 3: Verification
  // ---------------------------------------------------------------
  console.log('\n=== Verification ===\n');

  for (const testOrgId of TEST_ORGS) {
    const testRoles = await supabaseGet(
      `roles?organization_id=eq.${testOrgId}&select=id,slug,name`
    );
    const roleIds = testRoles.map((r) => r.id);

    if (roleIds.length === 0) {
      console.log(`Org ${testOrgId}: No roles found`);
      continue;
    }

    const rp = await supabaseGet(
      `role_permissions?role_id=in.(${roleIds.join(',')})&select=id,role_id,permission_id`
    );

    // Count per role
    const testRoleIdToSlug = {};
    for (const r of testRoles) {
      testRoleIdToSlug[r.id] = r.slug;
    }

    const countPerRole = {};
    for (const entry of rp) {
      const slug = testRoleIdToSlug[entry.role_id] || entry.role_id;
      countPerRole[slug] = (countPerRole[slug] || 0) + 1;
    }

    console.log(`Org ${testOrgId}:`);
    console.log(`  Total role_permissions: ${rp.length}`);
    for (const [slug, count] of Object.entries(countPerRole)) {
      const demoCount = slugToPermissionIds[slug]?.length || '?';
      const match = count === demoCount ? 'OK' : `MISMATCH (demo: ${demoCount})`;
      console.log(`    ${slug}: ${count} permissions [${match}]`);
    }
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
