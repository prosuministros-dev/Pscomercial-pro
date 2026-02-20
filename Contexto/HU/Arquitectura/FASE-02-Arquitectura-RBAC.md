# FASE 2: Arquitectura RBAC (Roles, Permisos, Recursos)

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Perspectivas:** Arquitecto | DB-Integration | Business Analyst | Fullstack Dev | UX/UI Designer
**Referencia:** HU-0011 – Creación y Gestión de Roles y Permisos de Usuario

---

## 1. VISIÓN GENERAL DEL MODELO DE ACCESOS

### 1.1 Principios de Diseño
1. **RBAC puro con granularidad por módulo**: Cada rol tiene un conjunto de permisos definidos como `modulo:accion`
2. **Multi-rol por usuario**: Un usuario puede tener múltiples roles simultáneamente (ej: Asesor Comercial + Logística)
3. **Permisos aditivos**: Los permisos se SUMAN entre roles (si un rol da `quotes:read` y otro da `quotes:create`, el usuario tiene ambos)
4. **Configuración por organización**: Cada organización puede personalizar los permisos de sus roles
5. **Sin herencia de roles**: Los roles NO heredan permisos entre sí (simplicidad y predictibilidad)
6. **Cacheo agresivo**: Los permisos se cachean en memoria (React Context) y se refrescan solo al cambiar sesión
7. **Doble validación**: Frontend oculta UI + Backend/RLS valida en cada operación (defensa en profundidad)

### 1.2 Capas de Seguridad
```
┌─────────────────────────────────────────────────────┐
│ CAPA 1: Frontend (UI Guard)                         │
│ - Ocultar/mostrar botones, menús, módulos           │
│ - Hook usePermissions() + componente <PermissionGate>│
│ - NO es seguridad real, solo UX                     │
├─────────────────────────────────────────────────────┤
│ CAPA 2: API/Middleware (Server Guard)               │
│ - Next.js middleware valida sesión + org             │
│ - API Routes validan permisos específicos           │
│ - Función checkPermission(userId, 'module:action')  │
├─────────────────────────────────────────────────────┤
│ CAPA 3: Database/RLS (Data Guard)                   │
│ - RLS valida organization_id (multi-tenant)         │
│ - Funciones RPC validan permisos cuando necesario   │
│ - CHECK constraints validan estados                 │
└─────────────────────────────────────────────────────┘
```

---

## 2. CATÁLOGO DE ROLES DEL SISTEMA

### 2.1 Roles Predefinidos (12 roles)

| # | Slug | Nombre | Área | Descripción | Nivel |
|---|------|--------|------|-------------|-------|
| 1 | `super_admin` | Super Administrador | Sistema | Acceso total al sistema. Gestión de la organización. | Estratégico |
| 2 | `gerente_general` | Gerente General | Gerencia | Visibilidad total. Aprobaciones. Dashboard ejecutivo. | Estratégico |
| 3 | `director_comercial` | Director Comercial | Comercial | Gestión del equipo comercial. KPIs. Creación de leads. | Táctico |
| 4 | `gerente_comercial` | Gerente Comercial | Comercial | Aprobación de márgenes. Asignación de leads. Reportes. | Táctico |
| 5 | `gerente_operativo` | Gerente Operativo | Operaciones | Supervisión de pedidos, logística, bodega. Semáforo operativo. | Táctico |
| 6 | `asesor_comercial` | Asesor Comercial | Comercial | Gestión de leads asignados. Cotizaciones. Pedidos. | Operativo |
| 7 | `finanzas` | Finanzas | Finanzas | Control financiero. Validación de crédito. Facturación. | Operativo |
| 8 | `compras` | Compras | Compras | Órdenes de compra. Gestión de proveedores. | Operativo |
| 9 | `logistica` | Logística | Logística | Despachos. Seguimiento. Guías de transporte. | Operativo |
| 10 | `jefe_bodega` | Jefe de Bodega | Bodega | Recepción de mercancía. Control de inventario. | Operativo |
| 11 | `auxiliar_bodega` | Auxiliar de Bodega | Bodega | Recepción y despacho bajo supervisión. | Operativo |
| 12 | `facturacion` | Facturación | Finanzas | Registro y seguimiento de facturas. | Operativo |

### 2.2 Jerarquía de Visibilidad

```
super_admin ─────────────────── VE TODO (toda la organización)
    │
gerente_general ─────────────── VE TODO (toda la organización)
    │
    ├── director_comercial ──── VE: Todo lo comercial + sus subordinados
    │       │
    │       ├── gerente_comercial ── VE: Su equipo + leads/cotizaciones
    │       │       │
    │       │       └── asesor_comercial ── VE: Solo sus leads/cotizaciones asignadas
    │       │
    │       └── finanzas ───── VE: Créditos, facturación, cartera
    │
    └── gerente_operativo ──── VE: Todo lo operativo
            │
            ├── compras ────── VE: Órdenes de compra, proveedores
            ├── logistica ──── VE: Despachos, seguimiento
            ├── jefe_bodega ── VE: Recepción, inventario
            │       │
            │       └── auxiliar_bodega ── VE: Solo recepción/despacho
            │
            └── facturacion ── VE: Facturas
```

---

## 3. CATÁLOGO DE PERMISOS POR MÓDULO

### 3.1 Módulos y Acciones

| Módulo | Acciones Disponibles |
|--------|---------------------|
| `dashboard` | `read`, `export` |
| `leads` | `create`, `read`, `update`, `delete`, `assign`, `reassign`, `export` |
| `customers` | `create`, `read`, `update`, `delete`, `export` |
| `quotes` | `create`, `read`, `update`, `delete`, `approve`, `send`, `export` |
| `orders` | `create`, `read`, `update`, `delete`, `export` |
| `purchase_orders` | `create`, `read`, `update`, `delete`, `approve`, `export` |
| `logistics` | `create`, `read`, `update`, `export` |
| `billing` | `create`, `read`, `update`, `export` |
| `products` | `create`, `read`, `update`, `delete`, `export` |
| `licenses` | `create`, `read`, `update`, `export` |
| `whatsapp` | `read`, `send`, `configure`, `export` |
| `reports` | `read`, `create`, `export` |
| `admin` | `read`, `manage_roles`, `manage_users`, `manage_settings`, `view_audit` |

### 3.2 Catálogo Completo de Permisos (Seed Data)

```typescript
// Total: ~65 permisos únicos
const PERMISSIONS_CATALOG = [
  // Dashboard
  { slug: 'dashboard:read', module: 'dashboard', action: 'read', description: 'Ver dashboard y métricas' },
  { slug: 'dashboard:export', module: 'dashboard', action: 'export', description: 'Exportar datos del dashboard' },

  // Leads
  { slug: 'leads:create', module: 'leads', action: 'create', description: 'Crear leads manualmente' },
  { slug: 'leads:read', module: 'leads', action: 'read', description: 'Ver leads' },
  { slug: 'leads:update', module: 'leads', action: 'update', description: 'Editar leads' },
  { slug: 'leads:delete', module: 'leads', action: 'delete', description: 'Eliminar leads' },
  { slug: 'leads:assign', module: 'leads', action: 'assign', description: 'Asignar leads a asesores' },
  { slug: 'leads:reassign', module: 'leads', action: 'reassign', description: 'Reasignar leads entre asesores' },
  { slug: 'leads:export', module: 'leads', action: 'export', description: 'Exportar listado de leads' },

  // Customers
  { slug: 'customers:create', module: 'customers', action: 'create', description: 'Crear clientes' },
  { slug: 'customers:read', module: 'customers', action: 'read', description: 'Ver clientes' },
  { slug: 'customers:update', module: 'customers', action: 'update', description: 'Editar clientes' },
  { slug: 'customers:delete', module: 'customers', action: 'delete', description: 'Eliminar clientes' },
  { slug: 'customers:export', module: 'customers', action: 'export', description: 'Exportar clientes' },

  // Quotes
  { slug: 'quotes:create', module: 'quotes', action: 'create', description: 'Crear cotizaciones' },
  { slug: 'quotes:read', module: 'quotes', action: 'read', description: 'Ver cotizaciones' },
  { slug: 'quotes:update', module: 'quotes', action: 'update', description: 'Editar cotizaciones' },
  { slug: 'quotes:delete', module: 'quotes', action: 'delete', description: 'Eliminar cotizaciones' },
  { slug: 'quotes:approve', module: 'quotes', action: 'approve', description: 'Aprobar cotizaciones con margen bajo' },
  { slug: 'quotes:send', module: 'quotes', action: 'send', description: 'Enviar cotización/proforma al cliente' },
  { slug: 'quotes:export', module: 'quotes', action: 'export', description: 'Exportar cotizaciones' },

  // Orders
  { slug: 'orders:create', module: 'orders', action: 'create', description: 'Crear pedidos' },
  { slug: 'orders:read', module: 'orders', action: 'read', description: 'Ver pedidos' },
  { slug: 'orders:update', module: 'orders', action: 'update', description: 'Editar pedidos' },
  { slug: 'orders:delete', module: 'orders', action: 'delete', description: 'Eliminar/cancelar pedidos' },
  { slug: 'orders:export', module: 'orders', action: 'export', description: 'Exportar pedidos' },

  // Purchase Orders
  { slug: 'purchase_orders:create', module: 'purchase_orders', action: 'create', description: 'Crear órdenes de compra' },
  { slug: 'purchase_orders:read', module: 'purchase_orders', action: 'read', description: 'Ver órdenes de compra' },
  { slug: 'purchase_orders:update', module: 'purchase_orders', action: 'update', description: 'Editar órdenes de compra' },
  { slug: 'purchase_orders:delete', module: 'purchase_orders', action: 'delete', description: 'Eliminar órdenes de compra' },
  { slug: 'purchase_orders:approve', module: 'purchase_orders', action: 'approve', description: 'Aprobar órdenes de compra' },
  { slug: 'purchase_orders:export', module: 'purchase_orders', action: 'export', description: 'Exportar órdenes de compra' },

  // Logistics
  { slug: 'logistics:create', module: 'logistics', action: 'create', description: 'Crear despachos' },
  { slug: 'logistics:read', module: 'logistics', action: 'read', description: 'Ver despachos y seguimiento' },
  { slug: 'logistics:update', module: 'logistics', action: 'update', description: 'Editar despachos' },
  { slug: 'logistics:export', module: 'logistics', action: 'export', description: 'Exportar logística' },

  // Billing
  { slug: 'billing:create', module: 'billing', action: 'create', description: 'Registrar facturas' },
  { slug: 'billing:read', module: 'billing', action: 'read', description: 'Ver facturas' },
  { slug: 'billing:update', module: 'billing', action: 'update', description: 'Editar facturas' },
  { slug: 'billing:export', module: 'billing', action: 'export', description: 'Exportar facturación' },

  // Products
  { slug: 'products:create', module: 'products', action: 'create', description: 'Crear productos' },
  { slug: 'products:read', module: 'products', action: 'read', description: 'Ver catálogo de productos' },
  { slug: 'products:update', module: 'products', action: 'update', description: 'Editar productos' },
  { slug: 'products:delete', module: 'products', action: 'delete', description: 'Eliminar productos' },
  { slug: 'products:export', module: 'products', action: 'export', description: 'Exportar productos' },

  // Licenses
  { slug: 'licenses:create', module: 'licenses', action: 'create', description: 'Registrar licencias' },
  { slug: 'licenses:read', module: 'licenses', action: 'read', description: 'Ver licencias' },
  { slug: 'licenses:update', module: 'licenses', action: 'update', description: 'Editar licencias' },
  { slug: 'licenses:export', module: 'licenses', action: 'export', description: 'Exportar licencias' },

  // WhatsApp
  { slug: 'whatsapp:read', module: 'whatsapp', action: 'read', description: 'Ver conversaciones de WhatsApp' },
  { slug: 'whatsapp:send', module: 'whatsapp', action: 'send', description: 'Enviar mensajes por WhatsApp' },
  { slug: 'whatsapp:configure', module: 'whatsapp', action: 'configure', description: 'Configurar cuenta y templates de WhatsApp' },
  { slug: 'whatsapp:export', module: 'whatsapp', action: 'export', description: 'Exportar conversaciones' },

  // Reports
  { slug: 'reports:read', module: 'reports', action: 'read', description: 'Ver reportes' },
  { slug: 'reports:create', module: 'reports', action: 'create', description: 'Crear reportes personalizados' },
  { slug: 'reports:export', module: 'reports', action: 'export', description: 'Exportar reportes' },

  // Admin
  { slug: 'admin:read', module: 'admin', action: 'read', description: 'Ver panel de administración' },
  { slug: 'admin:manage_roles', module: 'admin', action: 'manage_roles', description: 'Crear/editar/eliminar roles' },
  { slug: 'admin:manage_users', module: 'admin', action: 'manage_users', description: 'Crear/editar/desactivar usuarios' },
  { slug: 'admin:manage_settings', module: 'admin', action: 'manage_settings', description: 'Editar configuraciones del sistema' },
  { slug: 'admin:view_audit', module: 'admin', action: 'view_audit', description: 'Ver bitácora de auditoría' },
];
```

### 3.3 Matriz de Permisos por Rol (Default)

| Permiso | Super Admin | Gerente General | Director Comercial | Gerente Comercial | Gerente Operativo | Asesor Comercial | Finanzas | Compras | Logística | Jefe Bodega | Auxiliar Bodega | Facturación |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **dashboard** |
| read | X | X | X | X | X | X | X | X | X | - | - | X |
| export | X | X | X | X | X | - | X | - | - | - | - | - |
| **leads** |
| create | X | X | X | - | - | - | - | - | - | - | - | - |
| read | X | X | X | X | - | X* | - | - | - | - | - | - |
| update | X | X | X | X | - | X* | - | - | - | - | - | - |
| delete | X | X | - | - | - | - | - | - | - | - | - | - |
| assign | X | X | X | X | - | - | - | - | - | - | - | - |
| reassign | X | X | X | X | - | - | - | - | - | - | - | - |
| export | X | X | X | X | - | - | - | - | - | - | - | - |
| **customers** |
| create | X | X | X | X | - | X | X | - | - | - | - | - |
| read | X | X | X | X | X | X | X | X | X | - | - | X |
| update | X | X | X | X | - | X | X | - | - | - | - | - |
| delete | X | X | - | - | - | - | - | - | - | - | - | - |
| export | X | X | X | X | - | - | X | - | - | - | - | - |
| **quotes** |
| create | X | X | X | X | - | X | - | - | - | - | - | - |
| read | X | X | X | X | - | X* | X | - | - | - | - | - |
| update | X | X | X | X | - | X* | - | - | - | - | - | - |
| delete | X | X | - | - | - | - | - | - | - | - | - | - |
| approve | X | X | X | X | - | - | - | - | - | - | - | - |
| send | X | X | X | X | - | X | - | - | - | - | - | - |
| export | X | X | X | X | - | - | X | - | - | - | - | - |
| **orders** |
| create | X | X | X | X | X | X | - | - | - | - | - | - |
| read | X | X | X | X | X | X* | X | X | X | X | X | X |
| update | X | X | X | X | X | X* | - | - | - | - | - | - |
| delete | X | X | - | - | - | - | - | - | - | - | - | - |
| export | X | X | X | X | X | - | X | X | - | - | - | X |
| **purchase_orders** |
| create | X | X | - | - | X | - | - | X | - | - | - | - |
| read | X | X | X | X | X | - | X | X | X | X | - | - |
| update | X | X | - | - | X | - | - | X | - | - | - | - |
| delete | X | X | - | - | - | - | - | - | - | - | - | - |
| approve | X | X | - | - | X | - | X | - | - | - | - | - |
| export | X | X | - | - | X | - | X | X | - | - | - | - |
| **logistics** |
| create | X | X | - | - | X | - | - | - | X | X | X | - |
| read | X | X | X | X | X | X | - | X | X | X | X | - |
| update | X | X | - | - | X | - | - | - | X | X | X | - |
| export | X | X | - | - | X | - | - | - | X | - | - | - |
| **billing** |
| create | X | X | - | - | - | - | X | - | - | - | - | X |
| read | X | X | X | X | X | X | X | - | - | - | - | X |
| update | X | X | - | - | - | - | X | - | - | - | - | X |
| export | X | X | - | - | - | - | X | - | - | - | - | X |
| **products** |
| create | X | X | X | - | - | - | - | X | - | - | - | - |
| read | X | X | X | X | X | X | X | X | - | X | - | - |
| update | X | X | X | - | - | - | - | X | - | - | - | - |
| delete | X | X | - | - | - | - | - | - | - | - | - | - |
| export | X | X | X | - | - | - | - | X | - | - | - | - |
| **licenses** |
| create | X | X | - | - | X | - | - | X | - | - | - | - |
| read | X | X | X | X | X | X | - | X | - | - | - | - |
| update | X | X | - | - | X | - | - | X | - | - | - | - |
| export | X | X | - | - | X | - | - | X | - | - | - | - |
| **whatsapp** |
| read | X | X | X | X | - | X | - | - | - | - | - | - |
| send | X | X | X | X | - | X | - | - | - | - | - | - |
| configure | X | X | - | - | - | - | - | - | - | - | - | - |
| export | X | X | X | X | - | - | - | - | - | - | - | - |
| **reports** |
| read | X | X | X | X | X | X | X | X | X | - | - | X |
| create | X | X | X | X | X | - | X | - | - | - | - | - |
| export | X | X | X | X | X | - | X | X | - | - | - | X |
| **admin** |
| read | X | X | - | - | - | - | - | - | - | - | - | - |
| manage_roles | X | X | - | - | - | - | - | - | - | - | - | - |
| manage_users | X | X | - | - | - | - | - | - | - | - | - | - |
| manage_settings | X | - | - | - | - | - | - | - | - | - | - | - |
| view_audit | X | X | - | - | - | - | - | - | - | - | - | - |

> **X*** = El asesor comercial solo ve/edita SUS propios leads, cotizaciones y pedidos (filtro por `advisor_id` o `assigned_to`).

---

## 4. ARQUITECTURA DE IMPLEMENTACIÓN

### 4.1 Función RPC para Obtener Permisos del Usuario

```sql
-- Función que retorna todos los permisos de un usuario
-- Se llama UNA VEZ al login y se cachea en el cliente
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS TABLE(
  permission_slug text,
  module text,
  action text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.slug::text,
    p.module::text,
    p.action::text
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id AND r.is_active = true
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 4.2 Función RPC para Verificar Permiso Específico

```sql
-- Función rápida para verificar un permiso específico
-- Para usar en RLS policies o API routes
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id uuid,
  p_permission_slug text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND p.slug = p_permission_slug
      AND r.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 4.3 Función para Obtener Rol Principal (Nivel más alto)

```sql
CREATE OR REPLACE FUNCTION get_user_primary_role(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_role_slug text;
  v_role_priority integer;
BEGIN
  -- Prioridad: super_admin=1, gerente_general=2, etc.
  SELECT r.slug INTO v_role_slug
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id AND r.is_active = true
  WHERE ur.user_id = p_user_id
  ORDER BY
    CASE r.slug
      WHEN 'super_admin' THEN 1
      WHEN 'gerente_general' THEN 2
      WHEN 'director_comercial' THEN 3
      WHEN 'gerente_comercial' THEN 4
      WHEN 'gerente_operativo' THEN 5
      WHEN 'asesor_comercial' THEN 6
      WHEN 'finanzas' THEN 7
      WHEN 'compras' THEN 8
      WHEN 'logistica' THEN 9
      WHEN 'jefe_bodega' THEN 10
      WHEN 'auxiliar_bodega' THEN 11
      WHEN 'facturacion' THEN 12
      ELSE 99
    END
  LIMIT 1;

  RETURN v_role_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## 5. IMPLEMENTACIÓN FRONTEND

### 5.1 Tipos TypeScript

```typescript
// types/permissions.ts
export type Module =
  | 'dashboard' | 'leads' | 'customers' | 'quotes' | 'orders'
  | 'purchase_orders' | 'logistics' | 'billing' | 'products'
  | 'licenses' | 'whatsapp' | 'reports' | 'admin';

export type Action =
  | 'create' | 'read' | 'update' | 'delete'
  | 'approve' | 'send' | 'assign' | 'reassign'
  | 'export' | 'configure'
  | 'manage_roles' | 'manage_users' | 'manage_settings' | 'view_audit';

export type PermissionSlug = `${Module}:${Action}`;

export interface UserPermissions {
  permissions: Set<string>;
  roles: string[];
  organizationId: string;
  userId: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: string[];
}
```

### 5.2 Hook `usePermissions`

```typescript
// hooks/use-permissions.ts
'use client';

import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PermissionSlug, UserPermissions } from '@/types/permissions';

const PermissionsContext = createContext<UserPermissions | null>(null);

export function PermissionsProvider({ children, userId }: {
  children: React.ReactNode;
  userId: string;
}) {
  const { data } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_user_permissions', {
        p_user_id: userId
      });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 30 * 60 * 1000, // 30 minutos en garbage collection
  });

  const permissions = useMemo(() => ({
    permissions: new Set(data?.map(p => p.permission_slug) ?? []),
    roles: [], // loaded separately
    organizationId: '',
    userId,
  }), [data, userId]);

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}

// Hooks de conveniencia
export function useHasPermission(slug: PermissionSlug): boolean {
  const { permissions } = usePermissions();
  return permissions.has(slug);
}

export function useHasAnyPermission(slugs: PermissionSlug[]): boolean {
  const { permissions } = usePermissions();
  return slugs.some(s => permissions.has(s));
}

export function useHasAllPermissions(slugs: PermissionSlug[]): boolean {
  const { permissions } = usePermissions();
  return slugs.every(s => permissions.has(s));
}

export function useCanAccessModule(module: string): boolean {
  const { permissions } = usePermissions();
  // Si tiene CUALQUIER permiso del módulo, puede acceder
  return Array.from(permissions).some(p => p.startsWith(`${module}:`));
}
```

### 5.3 Componente `<PermissionGate>`

```tsx
// components/permission-gate.tsx
'use client';

import { useHasPermission, useHasAnyPermission } from '@/hooks/use-permissions';
import type { PermissionSlug } from '@/types/permissions';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: PermissionSlug;
  anyOf?: PermissionSlug[];
  allOf?: PermissionSlug[];
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
}: PermissionGateProps) {
  let hasAccess = false;

  if (permission) {
    hasAccess = useHasPermission(permission);
  } else if (anyOf) {
    hasAccess = useHasAnyPermission(anyOf);
  } else if (allOf) {
    const { permissions } = usePermissions();
    hasAccess = allOf.every(s => permissions.has(s));
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Uso:
// <PermissionGate permission="leads:create">
//   <Button>Nuevo Lead</Button>
// </PermissionGate>
//
// <PermissionGate anyOf={['quotes:approve', 'admin:manage_roles']}>
//   <ApprovalPanel />
// </PermissionGate>
```

### 5.4 Middleware de Navegación por Módulo

```typescript
// config/navigation.ts
import type { PermissionSlug } from '@/types/permissions';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiredPermission: PermissionSlug;
  children?: NavItem[];
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    requiredPermission: 'dashboard:read',
  },
  {
    label: 'Leads',
    href: '/leads',
    icon: 'UserPlus',
    requiredPermission: 'leads:read',
  },
  {
    label: 'Cotizaciones',
    href: '/quotes',
    icon: 'FileText',
    requiredPermission: 'quotes:read',
  },
  {
    label: 'Pedidos',
    href: '/orders',
    icon: 'ShoppingCart',
    requiredPermission: 'orders:read',
  },
  {
    label: 'Órdenes de Compra',
    href: '/purchase-orders',
    icon: 'ClipboardList',
    requiredPermission: 'purchase_orders:read',
  },
  {
    label: 'Logística',
    href: '/logistics',
    icon: 'Truck',
    requiredPermission: 'logistics:read',
  },
  {
    label: 'Facturación',
    href: '/billing',
    icon: 'Receipt',
    requiredPermission: 'billing:read',
  },
  {
    label: 'Productos',
    href: '/products',
    icon: 'Package',
    requiredPermission: 'products:read',
  },
  {
    label: 'WhatsApp',
    href: '/whatsapp',
    icon: 'MessageCircle',
    requiredPermission: 'whatsapp:read',
  },
  {
    label: 'Reportes',
    href: '/reports',
    icon: 'BarChart3',
    requiredPermission: 'reports:read',
  },
  {
    label: 'Tablero Operativo',
    href: '/operations',
    icon: 'Gauge',
    requiredPermission: 'orders:read',
  },
  {
    label: 'Equipo',
    href: '/team',
    icon: 'Users',
    requiredPermission: 'admin:manage_users',
  },
  {
    label: 'Administración',
    href: '/admin',
    icon: 'Settings',
    requiredPermission: 'admin:read',
    children: [
      { label: 'Roles y Permisos', href: '/admin/roles', icon: 'Shield', requiredPermission: 'admin:manage_roles' },
      { label: 'Configuración', href: '/admin/settings', icon: 'Cog', requiredPermission: 'admin:manage_settings' },
      { label: 'Bitácora', href: '/admin/audit', icon: 'History', requiredPermission: 'admin:view_audit' },
    ],
  },
];
```

### 5.5 Server-Side Permission Check (API Routes)

```typescript
// lib/permissions/check-permission.ts
import { createClient } from '@/packages/supabase/server';

export async function checkPermission(
  permissionSlug: string
): Promise<{ allowed: boolean; userId: string; organizationId: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { allowed: false, userId: '', organizationId: '' };
  }

  // Obtener organization_id del perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { allowed: false, userId: user.id, organizationId: '' };
  }

  // Verificar permiso
  const { data: hasPermission } = await supabase.rpc('has_permission', {
    p_user_id: user.id,
    p_permission_slug: permissionSlug,
  });

  return {
    allowed: !!hasPermission,
    userId: user.id,
    organizationId: profile.organization_id,
  };
}

// Helper para API routes
export function withPermission(permission: string) {
  return async function(handler: Function) {
    const result = await checkPermission(permission);
    if (!result.allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handler(result);
  };
}
```

---

## 6. PANEL DE ADMINISTRACIÓN DE ROLES Y PERMISOS (UI)

### 6.1 Estructura del Panel (3 tabs)

Basado en el template Figma `roles-permisos.tsx`:

```
┌──────────────────────────────────────────────────────┐
│  Roles y Permisos                                    │
│  Gestión de seguridad y accesos                      │
├───────────┬───────────┬──────────────────────────────┤
│   Roles   │ Usuarios  │     Bitácora                 │
├───────────┴───────────┴──────────────────────────────┤
│                                                      │
│  TAB: ROLES                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Super    │  │ Gerente  │  │ Director │  [+ Nuevo]│
│  │ Admin    │  │ General  │  │ Comercial│           │
│  │ 65 perms │  │ 58 perms │  │ 42 perms │          │
│  │ [Editar] │  │ [Editar] │  │ [Editar] │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  TAB: USUARIOS                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │ Usuario    │ Email        │ Área  │ Roles    │   │
│  │ Juan Pérez │ juan@...     │ Vtas  │ Asesor   │   │
│  │ María L.   │ maria@...    │ Admin │ SuperAdm │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  TAB: BITÁCORA                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │ ● Rol 'Asesor' modificado                    │   │
│  │   Por: Admin - 11/02/2026 10:30              │   │
│  │ ● Usuario 'Juan' agregado al rol 'Compras'   │   │
│  │   Por: Admin - 11/02/2026 09:15              │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 6.2 Modal de Edición de Rol (Checkbox Matrix)

```
┌────────────────────────────────────────────────────────┐
│  Editar Rol: Gerente Comercial                         │
│  Configura los permisos y accesos del rol              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Nombre: [Gerente Comercial     ]                     │
│  Descripción: [Aprobación de márgenes...]             │
│  [✓] Rol Activo                                       │
│                                                        │
│  Permisos (42 seleccionados)                          │
│                                                        │
│  ┌── Dashboard ──────────────────────────────────┐    │
│  │ [✓] Ver dashboard      [✓] Exportar datos    │    │
│  └───────────────────────────────────────────────┘    │
│  ┌── Leads ──────────────────────────────────────┐    │
│  │ [ ] Crear leads        [✓] Ver leads          │    │
│  │ [✓] Editar leads       [ ] Eliminar leads     │    │
│  │ [✓] Asignar leads      [✓] Reasignar leads    │    │
│  │ [✓] Exportar leads                            │    │
│  └───────────────────────────────────────────────┘    │
│  ┌── Cotizaciones ───────────────────────────────┐    │
│  │ [✓] Crear              [✓] Ver                │    │
│  │ [✓] Editar             [ ] Eliminar           │    │
│  │ [✓] Aprobar margen     [✓] Enviar al cliente  │    │
│  │ [✓] Exportar                                  │    │
│  └───────────────────────────────────────────────┘    │
│  ... (más módulos)                                    │
│                                                        │
│  [Cancelar]                        [Actualizar Rol]   │
└────────────────────────────────────────────────────────┘
```

### 6.3 Funcionalidades del Panel

1. **Crear/editar roles**: Nombre, descripción, estado, selección de permisos por módulo
2. **Roles del sistema**: No se pueden eliminar (`is_system = true`), pero sí modificar sus permisos
3. **Crear/editar usuarios**: Nombre, email, área, roles asignados, estado activo/inactivo
4. **Bitácora**: Registro cronológico de todos los cambios en roles y usuarios
5. **Validaciones**:
   - No se puede desactivar el último `super_admin`
   - No se puede eliminar un rol asignado a usuarios activos
   - Al desactivar un usuario, se reasignan automáticamente sus leads pendientes

---

## 7. REGLAS DE NEGOCIO ESPECIALES POR ROL

### 7.1 Filtro de Datos por Rol (Data Scope)

| Rol | Leads | Cotizaciones | Pedidos | OC | Despachos | Facturas |
|-----|-------|-------------|---------|-----|-----------|----------|
| Super Admin | Todos | Todos | Todos | Todos | Todos | Todos |
| Gerente General | Todos | Todos | Todos | Todos | Todos | Todos |
| Director Comercial | Todos | Todos | Todos (comercial) | Lectura | Lectura | Lectura |
| Gerente Comercial | De su equipo | De su equipo | De su equipo | Lectura | Lectura | Lectura |
| Asesor Comercial | **Solo asignados** | **Solo propias** | **Solo propios** | - | Lectura de sus pedidos | Lectura de sus pedidos |
| Gerente Operativo | Lectura | Lectura | Todos | Todos | Todos | Lectura |
| Compras | - | - | Lectura | Todos | Lectura | - |
| Logística | - | - | Lectura | Lectura | Todos | - |
| Jefe Bodega | - | - | Lectura | Lectura | De su bodega | - |
| Auxiliar Bodega | - | - | Lectura | - | De su bodega (limitado) | - |
| Finanzas | - | Lectura | Lectura | Lectura | - | Todos |
| Facturación | - | - | Lectura | - | - | Todos |

### 7.2 Implementación del Data Scope

```typescript
// lib/permissions/data-scope.ts
type DataScope = 'all' | 'team' | 'own' | 'none';

interface ScopeConfig {
  [module: string]: DataScope;
}

// Esta función determina qué datos puede ver un usuario basándose en su rol
export function getDataScope(userRoles: string[], module: string): DataScope {
  const SCOPE_MAP: Record<string, ScopeConfig> = {
    super_admin: { leads: 'all', quotes: 'all', orders: 'all' },
    gerente_general: { leads: 'all', quotes: 'all', orders: 'all' },
    director_comercial: { leads: 'all', quotes: 'all', orders: 'all' },
    gerente_comercial: { leads: 'team', quotes: 'team', orders: 'team' },
    asesor_comercial: { leads: 'own', quotes: 'own', orders: 'own' },
    // ... etc
  };

  // El scope más permisivo de todos los roles del usuario gana
  let bestScope: DataScope = 'none';
  const priority = { all: 4, team: 3, own: 2, none: 1 };

  for (const role of userRoles) {
    const scope = SCOPE_MAP[role]?.[module] ?? 'none';
    if (priority[scope] > priority[bestScope]) {
      bestScope = scope;
    }
  }

  return bestScope;
}
```

### 7.3 Aplicación del Scope en Queries Supabase

```sql
-- Función RPC que filtra leads según el scope del usuario
CREATE OR REPLACE FUNCTION get_leads_for_user(
  p_user_id uuid,
  p_org_id uuid,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
) RETURNS SETOF leads AS $$
DECLARE
  v_scope text;
  v_role text;
BEGIN
  -- Determinar el scope del usuario
  v_role := get_user_primary_role(p_user_id);

  CASE v_role
    WHEN 'super_admin', 'gerente_general', 'director_comercial' THEN
      v_scope := 'all';
    WHEN 'gerente_comercial' THEN
      v_scope := 'team'; -- Ve leads de sus subordinados
    WHEN 'asesor_comercial' THEN
      v_scope := 'own'; -- Solo sus leads asignados
    ELSE
      v_scope := 'none';
  END CASE;

  RETURN QUERY
  SELECT l.*
  FROM leads l
  WHERE l.organization_id = p_org_id
    AND l.deleted_at IS NULL
    AND (p_status IS NULL OR l.status = p_status)
    AND (
      v_scope = 'all'
      OR (v_scope = 'own' AND l.assigned_to = p_user_id)
      OR (v_scope = 'team' AND l.assigned_to IN (
        -- Subordinados: asesores asignados al gerente
        SELECT ur.user_id
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE r.slug = 'asesor_comercial'
          AND r.organization_id = p_org_id
        -- En el futuro: filtrar por equipo específico del gerente
      ))
    )
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## 8. FLUJO DE AUTENTICACIÓN Y AUTORIZACIÓN

```
┌──────────┐    ┌────────────┐    ┌──────────────────┐    ┌───────────┐
│  Login   │ →  │ Supabase   │ →  │ Next.js          │ →  │ App       │
│  Form    │    │ Auth       │    │ Middleware        │    │ Layout    │
└──────────┘    │ (cookies)  │    │ (session check)  │    │           │
                └────────────┘    └──────────────────┘    └─────┬─────┘
                                                                │
                                           ┌────────────────────┤
                                           │                    │
                                    ┌──────▼──────┐   ┌────────▼────────┐
                                    │ Load User   │   │ Load Permissions│
                                    │ Profile     │   │ (RPC call,     │
                                    │ (org_id)    │   │  cached 5min)  │
                                    └──────┬──────┘   └────────┬────────┘
                                           │                    │
                                    ┌──────▼────────────────────▼────────┐
                                    │     PermissionsProvider             │
                                    │     (React Context)                │
                                    │                                    │
                                    │  ┌─ Navigation (filtered by perms) │
                                    │  ├─ Page Content                   │
                                    │  │  ├─ <PermissionGate>           │
                                    │  │  ├─ useHasPermission()         │
                                    │  │  └─ Data fetched with scope    │
                                    │  └─ Actions (create, update, etc.)│
                                    └────────────────────────────────────┘
```

---

## 9. SEED DATA DE ROLES Y PERMISOS

```sql
-- Script de inicialización de roles para una nueva organización
CREATE OR REPLACE FUNCTION seed_organization_roles(p_org_id uuid)
RETURNS void AS $$
DECLARE
  v_role_id uuid;
  v_permission_ids uuid[];
BEGIN
  -- Crear los 12 roles del sistema
  INSERT INTO roles (organization_id, name, slug, description, is_system, is_active)
  VALUES
    (p_org_id, 'Super Administrador', 'super_admin', 'Acceso total al sistema', true, true),
    (p_org_id, 'Gerente General', 'gerente_general', 'Visibilidad total, aprobaciones y dashboard ejecutivo', true, true),
    (p_org_id, 'Director Comercial', 'director_comercial', 'Gestión del equipo comercial y KPIs', true, true),
    (p_org_id, 'Gerente Comercial', 'gerente_comercial', 'Aprobación de márgenes y asignación de leads', true, true),
    (p_org_id, 'Gerente Operativo', 'gerente_operativo', 'Supervisión de pedidos, logística y bodega', true, true),
    (p_org_id, 'Asesor Comercial', 'asesor_comercial', 'Gestión de leads asignados y cotizaciones', true, true),
    (p_org_id, 'Finanzas', 'finanzas', 'Control financiero y facturación', true, true),
    (p_org_id, 'Compras', 'compras', 'Órdenes de compra y proveedores', true, true),
    (p_org_id, 'Logística', 'logistica', 'Despachos y seguimiento', true, true),
    (p_org_id, 'Jefe de Bodega', 'jefe_bodega', 'Recepción de mercancía y control de inventario', true, true),
    (p_org_id, 'Auxiliar de Bodega', 'auxiliar_bodega', 'Recepción y despacho bajo supervisión', true, true),
    (p_org_id, 'Facturación', 'facturacion', 'Registro y seguimiento de facturas', true, true);

  -- Asignar TODOS los permisos al super_admin
  SELECT id INTO v_role_id FROM roles WHERE organization_id = p_org_id AND slug = 'super_admin';
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_role_id, p.id FROM permissions p;

  -- (Se repite para cada rol según la matriz de la sección 3.3)
  -- Los demás roles se configuran con sus permisos específicos...
END;
$$ LANGUAGE plpgsql;
```

---

## 10. RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| **Roles predefinidos** | 12 |
| **Módulos** | 13 |
| **Permisos únicos** | ~65 |
| **Estrategia** | RBAC puro, aditivo, multi-rol |
| **Cache** | TanStack Query (5 min staleTime) |
| **Validación** | 3 capas (UI → API → RLS) |
| **Panel Admin** | 3 tabs (Roles, Usuarios, Bitácora) |
| **Data Scope** | 4 niveles (all, team, own, none) |
| **Funciones RPC** | 4 (get_permissions, has_permission, get_primary_role, seed_roles) |

### Decisiones Clave:
1. **Permisos en tabla separada** (no hardcoded) → permite que cada org personalice
2. **Multi-rol aditivo** → flexibilidad sin complejidad de herencia
3. **Data scope por rol** → el asesor solo ve lo suyo, el gerente ve todo su equipo
4. **Cache en cliente** → reduce queries de permisos a ~1 cada 5 minutos
5. **PermissionGate component** → patrón declarativo para UI condicional
6. **RPC SECURITY DEFINER** → las funciones de permisos ejecutan con privilegios elevados
