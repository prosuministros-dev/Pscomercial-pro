import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * Get all role slugs for a user (server-side).
 */
export async function getUserRoleSlugs(userId: string): Promise<string[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client.rpc('get_user_roles', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error getting user roles:', error);
    return [];
  }

  return (data ?? []).map((r: { role_slug: string }) => r.role_slug);
}

type BillingStep = 'request' | 'approval' | 'remission' | 'invoice';

const BILLING_STEP_ROLES: Record<BillingStep, string[]> = {
  // Step 1: Solicitud - Comercial (once), Gerencia
  request: ['asesor_comercial', 'gerente_comercial', 'director_comercial', 'gerente_general', 'super_admin'],
  // Step 2: Aprobación - Compras
  approval: ['compras', 'gerente_general', 'super_admin'],
  // Step 3: Remisión - Logística, Compras
  remission: ['logistica', 'compras', 'gerente_general', 'super_admin'],
  // Step 4: Factura - Financiera
  invoice: ['finanzas', 'facturacion', 'gerente_general', 'super_admin'],
};

/**
 * Check if a user with given role slugs can edit a specific billing step.
 */
export function canEditBillingStep(roleSlugs: string[], step: BillingStep): boolean {
  const allowedRoles = BILLING_STEP_ROLES[step];
  return roleSlugs.some((slug) => allowedRoles.includes(slug));
}

/**
 * Get the target notification role slug for a billing step change.
 */
export function getBillingStepNotifyTarget(step: BillingStep): string[] {
  switch (step) {
    case 'request': return ['compras'];
    case 'approval': return ['logistica'];
    case 'remission': return ['finanzas'];
    case 'invoice': return ['compras']; // + advisor (handled separately)
  }
}
