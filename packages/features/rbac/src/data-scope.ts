/**
 * Data Scope utility for role-based data visibility
 * Reference: FASE-02 Section 7.2
 *
 * Determines what data a user can see based on their role:
 * - all: sees everything in the organization
 * - team: sees data from their team members
 * - own: only sees their own data
 * - none: no access
 */

export type DataScope = 'all' | 'team' | 'own' | 'none';

interface ScopeConfig {
  [module: string]: DataScope;
}

const SCOPE_MAP: Record<string, ScopeConfig> = {
  super_admin: {
    leads: 'all',
    quotes: 'all',
    orders: 'all',
    customers: 'all',
    products: 'all',
    purchases: 'all',
    logistics: 'all',
    invoices: 'all',
    finance: 'all',
    warehouse: 'all',
    whatsapp: 'all',
    reports: 'all',
  },
  gerente_general: {
    leads: 'all',
    quotes: 'all',
    orders: 'all',
    customers: 'all',
    products: 'all',
    purchases: 'all',
    logistics: 'all',
    invoices: 'all',
    finance: 'all',
    warehouse: 'all',
    whatsapp: 'all',
    reports: 'all',
  },
  director_comercial: {
    leads: 'all',
    quotes: 'all',
    orders: 'all',
    customers: 'all',
    products: 'all',
    reports: 'all',
  },
  gerente_comercial: {
    leads: 'team',
    quotes: 'team',
    orders: 'team',
    customers: 'team',
  },
  gerente_operativo: {
    orders: 'all',
    purchases: 'all',
    logistics: 'all',
    warehouse: 'all',
  },
  asesor_comercial: {
    leads: 'own',
    quotes: 'own',
    orders: 'own',
    customers: 'own',
  },
  finanzas: {
    orders: 'all',
    invoices: 'all',
    finance: 'all',
    reports: 'all',
  },
  compras: {
    purchases: 'all',
    products: 'all',
    orders: 'all',
  },
  logistica: {
    logistics: 'all',
    orders: 'all',
    warehouse: 'all',
  },
  jefe_bodega: {
    warehouse: 'all',
    logistics: 'all',
  },
  auxiliar_bodega: {
    warehouse: 'own',
  },
  facturacion: {
    invoices: 'all',
    orders: 'all',
  },
};

const SCOPE_PRIORITY: Record<DataScope, number> = {
  all: 4,
  team: 3,
  own: 2,
  none: 1,
};

/**
 * Determines the data scope for a user based on their roles and the module.
 * If a user has multiple roles, the most permissive scope wins.
 */
export function getDataScope(
  userRoles: string[],
  module: string,
): DataScope {
  let bestScope: DataScope = 'none';

  for (const role of userRoles) {
    const scope = SCOPE_MAP[role]?.[module] ?? 'none';

    if (SCOPE_PRIORITY[scope] > SCOPE_PRIORITY[bestScope]) {
      bestScope = scope;
    }
  }

  return bestScope;
}
