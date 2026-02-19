# PLAN DE IMPLEMENTACIÓN - HU-00021
## Módulo de Gestión de Clientes y Seguimiento de Visitas Comerciales

**Fecha**: 19/02/2026
**Analizado por**: business-analyst, arquitecto, fullstack-dev, db-integration, designer-ux-ui
**Excluido del alcance**: Migración masiva de 2,500 clientes (se hará por seed)

---

## 1. DIAGNÓSTICO: QUÉ EXISTE vs QUÉ FALTA

### 1.1 Base de Datos (Supabase - Verificado via MCP)

| Elemento | Estado | Detalle |
|----------|--------|---------|
| Tabla `customers` | ✅ EXISTE | 22 columnas: id, organization_id, business_name, nit, industry, address, city, phone, email, website, credit_limit, credit_available, credit_status, payment_terms, outstanding_balance, is_blocked, block_reason, notes, created_by, created_at, updated_at, deleted_at |
| Tabla `customer_contacts` | ✅ EXISTE | 11 columnas: id, organization_id, customer_id, full_name, email, phone, position, is_primary, is_active, created_at, updated_at |
| Columna `department` en customers | ❌ NO EXISTE | El frontend lo tiene en el formulario pero la BD no tiene la columna |
| Columna `assigned_sales_rep_id` en customers | ❌ NO EXISTE | Necesaria para asignar clientes a asesores comerciales |
| Tabla `customer_visits` | ❌ NO EXISTE | Necesaria para registrar visitas comerciales presenciales |
| RLS policies en customers | ✅ EXISTE | 4 policies: select (org), insert (org), update (org), delete (org+admin) |
| RLS con data scope (advisor ve solo sus clientes) | ❌ NO EXISTE | Actualmente todos ven todos los clientes de la org |
| Índices en customers | ✅ EXISTE | 5 índices: pkey, org, org_nit(unique), org_name, blocked(partial) |
| Índice por assigned_sales_rep_id | ❌ NO EXISTE | Necesario para filtrar por asesor |
| Permisos customers | ✅ EXISTE | 5: create, read, update, delete, export |
| Permiso `customers:manage_contacts` | ⚠️ NO EN BD | Usado en el código frontend pero no registrado en tabla permissions |
| Tabla `order_pending_tasks` | ✅ EXISTE | Solo para tareas de pedidos, NO para visitas comerciales |

### 1.2 Backend (API Routes)

| Endpoint | Estado | Detalle |
|----------|--------|---------|
| `GET /api/customers` | ✅ EXISTE | Lista con paginación y filtros (business_name, nit, city) |
| `POST /api/customers` | ✅ EXISTE | Crear cliente con validación NIT único |
| `PUT /api/customers` | ✅ EXISTE | Actualizar cliente |
| `DELETE /api/customers` | ✅ EXISTE | Eliminar cliente |
| `GET /api/customers/[id]/contacts` | ✅ EXISTE | Listar contactos del cliente |
| `POST /api/customers/[id]/contacts` | ✅ EXISTE | Crear contacto |
| `PUT /api/customers/[id]/contacts` | ✅ EXISTE | Actualizar contacto |
| `DELETE /api/customers/[id]/contacts` | ✅ EXISTE | Eliminar contacto |
| `GET /api/customers?assigned_sales_rep_id=X` | ❌ FALTA | Filtrar clientes por asesor asignado |
| `GET /api/customers/[id]/history` | ❌ FALTA | Historial comercial (quotes, orders, OC) |
| `GET/POST /api/customers/[id]/visits` | ❌ FALTA | CRUD de visitas comerciales |
| `GET /api/customers/export` | ❌ FALTA | Exportar clientes a Excel/CSV |
| `GET /api/reports` con tipo "customers" | ❌ FALTA | Pestaña de clientes en reportes |

### 1.3 Frontend (Componentes y Páginas)

| Componente | Estado | Detalle |
|------------|--------|---------|
| Página `/home/customers` | ✅ EXISTE | Tabla con paginación, filtros, CRUD |
| `customers-page-client.tsx` | ✅ EXISTE | Componente principal con state management |
| `customer-table.tsx` | ✅ EXISTE | TanStack Table v8 con animaciones |
| `customer-table-columns.tsx` | ✅ EXISTE | Columnas: NIT, Razón Social, Ciudad, Depto, Teléfono, Contactos |
| `customer-form-dialog.tsx` | ✅ EXISTE | Form con 33 departamentos, validación NIT colombiano |
| `customer-contacts-dialog.tsx` | ✅ EXISTE | CRUD de contactos con primary contact |
| `contact-form-dialog.tsx` | ✅ EXISTE | Form de contacto individual |
| `customer-filters.tsx` | ✅ EXISTE | Filtros: business_name, nit, city (debounce 500ms) |
| Tipos (`types.ts`) | ✅ EXISTE | Customer, CustomerContact, CustomerFilters |
| Schemas Zod (`schemas.ts`) | ✅ EXISTE | customerFormSchema, contactFormSchema con validación NIT |
| Hooks TanStack Query (`customer-queries.ts`) | ✅ EXISTE | useCustomers, useCustomerContacts, mutations |
| **Link en navegación top-bar** | ❌ FALTA | `/home/customers` existe pero NO aparece en el menú |
| **Selector de asesor asignado en form** | ❌ FALTA | `assigned_sales_rep_id` no se usa en el formulario |
| **Filtro por asesor comercial** | ❌ FALTA | No se puede filtrar por asesor asignado |
| **Página detalle / Ficha del cliente** | ❌ FALTA | No hay `/home/customers/[id]` con tabs de historial |
| **Tab Cotizaciones en ficha** | ❌ FALTA | Ver cotizaciones del cliente con filtro por estado |
| **Tab Pedidos en ficha** | ❌ FALTA | Ver pedidos del cliente con filtro por estado |
| **Tab Órdenes de Compra en ficha** | ❌ FALTA | Ver OC del cliente |
| **Tab Visitas/Tareas en ficha** | ❌ FALTA | Ver y registrar visitas comerciales |
| **Resumen ventas totales** | ❌ FALTA | KPI de ventas acumuladas por cliente |
| **Exportación de clientes** | ❌ FALTA | Botón exportar a Excel (solo admin) |
| **Data scope por asesor** | ❌ FALTA | Asesor ve solo sus clientes asignados |
| **Pestaña Clientes en Reportes** | ❌ FALTA | Nueva pestaña en módulo de reportes |

### 1.4 UX/UI (designer-ux-ui)

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Branding PROSUMINISTROS | ✅ OK | Componentes existentes usan variables CSS |
| Framer Motion animaciones | ✅ OK | Presente en tabla y page client |
| Dark mode | ⚠️ VERIFICAR | Necesita validación en nuevos componentes |
| Top bar navigation | ❌ FALTA link | "Clientes" no aparece en la barra de navegación |
| Responsive design | ✅ OK | Componentes existentes son responsive |
| Estados loading/error/empty | ✅ OK | Implementados en componentes existentes |

---

## 2. PLAN DE IMPLEMENTACIÓN

### FASE A: Base de Datos (db-integration)
**Prioridad: ALTA - Prerrequisito para todo lo demás**

#### A.1 - Migración: Agregar columnas faltantes a `customers`
```
Columnas a agregar:
- assigned_sales_rep_id UUID REFERENCES profiles(id) -- Asesor asignado
- department VARCHAR(100)                             -- Departamento (ya en frontend)
- status VARCHAR(20) DEFAULT 'active'                 -- active/inactive
- last_interaction_at TIMESTAMPTZ                     -- Fecha última interacción
```
**Índices nuevos:**
```
- idx_customers_org_rep ON customers(organization_id, assigned_sales_rep_id)
- idx_customers_org_status ON customers(organization_id, status) WHERE deleted_at IS NULL
- idx_customers_last_interaction ON customers(organization_id, last_interaction_at)
```

#### A.2 - Migración: Crear tabla `customer_visits`
```sql
CREATE TABLE customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES profiles(id),
  visit_date TIMESTAMPTZ NOT NULL,
  visit_type VARCHAR(30) NOT NULL DEFAULT 'presencial', -- presencial, virtual, telefonica
  status VARCHAR(20) NOT NULL DEFAULT 'realizada',       -- programada, realizada, cancelada
  observations TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**Índices:**
```
- idx_customer_visits_org ON customer_visits(organization_id)
- idx_customer_visits_customer ON customer_visits(customer_id)
- idx_customer_visits_advisor ON customer_visits(organization_id, advisor_id)
- idx_customer_visits_date ON customer_visits(organization_id, visit_date)
```
**RLS:** Tenant isolation por organization_id

#### A.3 - Migración: Actualizar RLS de `customers` para data scope
```sql
-- Actualizar policy SELECT para que asesores solo vean sus clientes asignados
-- Admin/Gerente ve todos, asesor ve solo los suyos
DROP POLICY customers_select ON customers;
CREATE POLICY customers_select ON customers FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND (
      is_org_admin()
      OR assigned_sales_rep_id = auth.uid()
      OR assigned_sales_rep_id IS NULL  -- Clientes sin asignar visibles para todos
    )
  );
```

#### A.4 - Permisos adicionales
```sql
-- Registrar permiso faltante
INSERT INTO permissions (module, action, slug, description) VALUES
  ('customers', 'manage_contacts', 'customers:manage_contacts', 'Gestionar contactos de clientes');

-- Permisos para visitas
INSERT INTO permissions (module, action, slug, description) VALUES
  ('visits', 'create', 'visits:create', 'Registrar visitas comerciales'),
  ('visits', 'read', 'visits:read', 'Ver visitas comerciales'),
  ('visits', 'read_all', 'visits:read_all', 'Ver visitas de todos los asesores');
```

#### A.5 - Trigger para actualizar `last_interaction_at`
```sql
-- Trigger que actualiza customers.last_interaction_at cuando:
-- Se crea una cotización, pedido o visita asociada al cliente
```

### FASE B: Backend - API Routes (fullstack-dev)
**Prioridad: ALTA**

#### B.1 - Actualizar `GET /api/customers`
- Agregar filtro por `assigned_sales_rep_id`
- Agregar filtro por `status` (active/inactive)
- Agregar filtro por rango de fechas `last_interaction_at`
- Implementar data scope: asesor ve solo sus clientes

#### B.2 - Actualizar `POST/PUT /api/customers`
- Incluir `assigned_sales_rep_id`, `department`, `status` en schema Zod
- Validar que assigned_sales_rep_id sea un profile válido de la org

#### B.3 - Nuevo: `GET /api/customers/[id]/history`
- Retornar: quotes (con status), orders (con status), purchase_orders
- Filtros: status, date_range
- Paginación por sección

#### B.4 - Nuevo: `GET/POST /api/customers/[id]/visits`
- GET: Listar visitas del cliente (con filtro advisor_id, date_range)
- POST: Registrar nueva visita (permission: visits:create)

#### B.5 - Nuevo: `GET /api/visits`
- Listar todas las visitas (para vista gerencial)
- Filtros: advisor_id, customer_id, date_range
- Permission: visits:read_all (solo gerente general)

#### B.6 - Nuevo: `GET /api/customers/export`
- Exportar clientes a CSV/Excel
- Permission: customers:export (solo gerente general/director comercial)
- Streaming para evitar timeout con grandes volúmenes

#### B.7 - Actualizar `GET /api/reports`
- Agregar tipo "customers" en el endpoint de reportes
- Métricas: total clientes, clientes activos, clientes por asesor, clientes sin actividad reciente

### FASE C: Frontend - Navegación y Módulo Base (fullstack-dev + designer-ux-ui)
**Prioridad: ALTA**

#### C.1 - Agregar "Clientes" a la navegación top-bar
- **Archivo**: `apps/web/components/dashboard/top-navigation.tsx`
- **Archivo**: `apps/web/components/dashboard/mobile-bottom-tabs.tsx`
- Agregar item: { label: "Clientes", path: "/home/customers", icon: Users, permission: "customers:read" }
- Posición: después de "Pedidos" (4to o 5to item)

#### C.2 - Actualizar formulario de cliente
- **Archivo**: `apps/web/app/home/(admin)/customers/_components/customer-form-dialog.tsx`
- Agregar campo `assigned_sales_rep_id` (selector de asesores de la org)
- Agregar campo `status` (active/inactive)
- Verificar que `department` se guarda correctamente (actualmente no existe en BD)

#### C.3 - Actualizar filtros de cliente
- **Archivo**: `apps/web/app/home/(admin)/customers/_components/customer-filters.tsx`
- Agregar filtro por asesor comercial asignado
- Agregar filtro por estado (activo/inactivo)
- Agregar filtro por última interacción

#### C.4 - Actualizar tabla de clientes
- **Archivo**: `apps/web/app/home/(admin)/customers/_components/customer-table-columns.tsx`
- Agregar columna "Asesor asignado"
- Agregar columna "Estado" (badge activo/inactivo)
- Agregar columna "Última interacción"
- Agregar acción "Ver ficha" que navegue a detalle

#### C.5 - Agregar botón exportar
- Solo visible para roles con permiso `customers:export`
- Usar `<PermissionGate permission="customers:export">`
- Llamar a `GET /api/customers/export`

### FASE D: Frontend - Ficha del Cliente / Página Detalle (fullstack-dev + designer-ux-ui)
**Prioridad: ALTA - Funcionalidad principal del HU**

#### D.1 - Crear página `/home/customers/[id]/page.tsx`
- Server Component que carga datos iniciales del cliente
- Client wrapper con tabs/secciones

#### D.2 - Crear `customer-detail-client.tsx`
- Layout con tabs:
  1. **Información General** - Datos del cliente (readonly o editable según permiso)
  2. **Contactos** - Reutilizar componentes existentes (customer-contacts-dialog)
  3. **Cotizaciones** - Tabla de cotizaciones del cliente con filtro por estado
  4. **Pedidos** - Tabla de pedidos del cliente con filtro por estado
  5. **Órdenes de Compra** - Tabla de OC del cliente
  6. **Visitas** - Historial de visitas + botón registrar nueva
  7. **Resumen** - KPIs de ventas totales, última interacción, etc.
- Framer Motion para transiciones entre tabs
- Responsive: tabs como accordion en mobile

#### D.3 - Crear componente `customer-quotes-tab.tsx`
- Tabla de cotizaciones del cliente
- Filtros: status (En proceso / Ganada / Perdida / Anulada / Todas), rango de fechas
- Click en cotización navega al detalle de cotización
- Usa `GET /api/customers/[id]/history?type=quotes`

#### D.4 - Crear componente `customer-orders-tab.tsx`
- Tabla de pedidos del cliente
- Filtros: status (En proceso / Cerrado / Anulado / Perdido / Todos)
- Click en pedido navega al detalle
- Usa `GET /api/customers/[id]/history?type=orders`

#### D.5 - Crear componente `customer-purchase-orders-tab.tsx`
- Tabla de OC del cliente
- Click en OC navega al detalle

#### D.6 - Crear componente `customer-visits-tab.tsx`
- Tabla de visitas realizadas al cliente
- Botón "Registrar Visita" (abre form dialog)
- Muestra: fecha, tipo, asesor, observaciones, estado
- Para gerente: muestra visitas de todos los asesores
- Para asesor: muestra solo sus visitas

#### D.7 - Crear componente `visit-form-dialog.tsx`
- Form para registrar nueva visita:
  - Fecha de visita (date picker)
  - Tipo (presencial / virtual / telefónica)
  - Observaciones (textarea)
  - Estado (programada / realizada / cancelada)
- Validación con Zod

#### D.8 - Crear componente `customer-summary-tab.tsx`
- KPI cards:
  - Total cotizaciones / Total ganadas
  - Total pedidos / Total entregados
  - Total visitas (último mes / total)
  - Ventas acumuladas (COP)
  - Última interacción (fecha + tipo)

### FASE E: Frontend - Módulo de Reportes (fullstack-dev)
**Prioridad: MEDIA**

#### E.1 - Agregar pestaña "Clientes" en reportes
- **Archivo**: `apps/web/app/home/(admin)/reports/_components/reports-page-client.tsx`
- Agregar tab "Clientes" junto a las 5 existentes (Leads, Quotes, Orders, Revenue, Performance)
- Filtros: asesor comercial, estado, rango de fechas
- Botón exportar (solo con permiso `customers:export`)

#### E.2 - Actualizar tipos de reportes
- **Archivo**: `apps/web/app/home/(admin)/reports/_lib/types.ts`
- Agregar tipo "customers" con métricas: total_clientes, clientes_activos, por_asesor, sin_actividad

### FASE F: Arquitectura - Documentación (arquitecto)
**Prioridad: BAJA - Post-implementación**

#### F.1 - Actualizar FASE-01-Modelo-Datos-ER.md
- Agregar tabla `customer_visits`
- Actualizar tabla `customers` con nuevas columnas

#### F.2 - Actualizar FASE-02-Arquitectura-RBAC.md
- Agregar permisos de visitas
- Documentar data scope por asesor

#### F.3 - Actualizar FASE-05-Arquitectura-Frontend.md
- Documentar nueva ruta `/customers/[id]` (detalle)
- Documentar componentes de visitas

#### F.4 - Actualizar FASE-06-Funciones-Centralizadas.md
- Documentar trigger de last_interaction_at

#### F.5 - Actualizar DOCUMENTO-MAESTRO-ARQUITECTURA.md
- Agregar HU-00021 en tabla de trazabilidad

---

## 3. MATRIZ DE DEPENDENCIAS

```
FASE A (BD) ──────────────────┐
  A.1 (columnas customers)    │
  A.2 (tabla visits)          ├──→ FASE B (API) ──→ FASE C (Nav + Form) ──→ FASE D (Ficha)
  A.3 (RLS data scope)        │                                               │
  A.4 (permisos)              │                                               │
  A.5 (trigger)               │                                               ↓
                               └─────────────────────────────────────────→ FASE E (Reportes)
                                                                              │
                                                                              ↓
                                                                         FASE F (Docs)
```

---

## 4. ESTIMACIÓN DE COMPLEJIDAD

| Fase | Tarea | Complejidad | Archivos Nuevos | Archivos Modificados |
|------|-------|:-----------:|:---:|:---:|
| A.1 | Columnas customers | Baja | 0 | 1 migración |
| A.2 | Tabla customer_visits | Media | 0 | 1 migración |
| A.3 | RLS data scope | Media | 0 | 1 migración |
| A.4 | Permisos | Baja | 0 | 1 migración |
| A.5 | Trigger last_interaction | Media | 0 | 1 migración |
| B.1 | Actualizar GET customers | Baja | 0 | 1 |
| B.2 | Actualizar POST/PUT customers | Baja | 0 | 1 |
| B.3 | GET history | Media | 1 | 0 |
| B.4 | GET/POST visits | Media | 1 | 0 |
| B.5 | GET visits (gerencial) | Baja | 1 | 0 |
| B.6 | Export customers | Media | 1 | 0 |
| B.7 | Reportes customers | Baja | 0 | 1 |
| C.1 | Navegación | Baja | 0 | 2 |
| C.2 | Form cliente | Media | 0 | 1 |
| C.3 | Filtros cliente | Baja | 0 | 1 |
| C.4 | Tabla columnas | Baja | 0 | 1 |
| C.5 | Botón exportar | Baja | 0 | 1 |
| D.1 | Page detalle | Baja | 1 | 0 |
| D.2 | Detail client | Alta | 1 | 0 |
| D.3 | Quotes tab | Media | 1 | 0 |
| D.4 | Orders tab | Media | 1 | 0 |
| D.5 | PO tab | Baja | 1 | 0 |
| D.6 | Visits tab | Media | 1 | 0 |
| D.7 | Visit form | Media | 1 | 0 |
| D.8 | Summary tab | Media | 1 | 0 |
| E.1 | Tab reportes | Media | 0 | 1 |
| E.2 | Tipos reportes | Baja | 0 | 1 |
| F.* | Documentación | Baja | 0 | 5 |

**Totales**: ~12 archivos nuevos, ~18 archivos modificados, 1-5 migraciones SQL

---

## 5. GAPS IDENTIFICADOS POR AGENTE

### Business Analyst (business-analyst)
1. **GAP CRÍTICO**: No existe ficha del cliente con historial comercial → Es el requisito principal del HU
2. **GAP CRÍTICO**: No existe gestión de visitas comerciales → Funcionalidad completamente nueva
3. **GAP ALTO**: No hay data scope por asesor → Asesor ve todos los clientes, debería ver solo los suyos
4. **GAP ALTO**: No hay exportación de clientes → Solicitado explícitamente por Daniel
5. **GAP MEDIO**: Link de clientes no está en la navegación → Módulo inaccesible sin URL directa
6. **GAP MEDIO**: No hay pestaña de clientes en reportes → Solicitado por Daniel y Freddy

### Arquitecto (arquitecto)
1. **GAP BD**: Falta columna `assigned_sales_rep_id` → Impide asignación de clientes a asesores
2. **GAP BD**: Falta columna `department` → Frontend lo tiene pero BD no
3. **GAP BD**: Falta tabla `customer_visits` → No hay dónde almacenar visitas
4. **GAP RLS**: Policy SELECT no filtra por asesor → Violación del requisito de data scope
5. **GAP PERMISOS**: `customers:manage_contacts` no está en BD → Usado en código pero no registrado
6. **RIESGO**: Cambio de RLS en customers puede afectar módulo de cotizaciones → Validar

### Fullstack Dev (fullstack-dev)
1. **GAP API**: Falta endpoint de historial por cliente
2. **GAP API**: Falta CRUD de visitas
3. **GAP API**: Falta export endpoint
4. **GAP FRONTEND**: No existe ruta `/home/customers/[id]` (detalle)
5. **GAP FRONTEND**: No hay selector de asesor en el formulario de cliente
6. **GAP FRONTEND**: No hay componentes de historial comercial

### DB Integration (db-integration)
1. **ACCIÓN**: 1-5 migraciones SQL necesarias
2. **ACCIÓN**: Actualizar RLS policies
3. **ACCIÓN**: Crear tabla customer_visits con índices
4. **ACCIÓN**: Registrar permisos faltantes
5. **RIESGO**: El cambio de RLS en customers SELECT puede romper cotizaciones si `assigned_sales_rep_id` es NULL
6. **MITIGACIÓN**: Policy debe incluir `OR assigned_sales_rep_id IS NULL` para clientes sin asignar

### Designer UX/UI (designer-ux-ui)
1. **ACCIÓN**: Definir diseño de ficha de cliente (tabs layout)
2. **ACCIÓN**: Definir diseño de registro de visitas
3. **VERIFICAR**: Dark mode en todos los componentes nuevos
4. **VERIFICAR**: Responsive design en ficha de cliente (tabs → accordion en mobile)
5. **VERIFICAR**: Animaciones Framer Motion en nuevos componentes
6. **VERIFICAR**: Variables CSS (NO colores hardcodeados)

---

## 6. RIESGOS Y MITIGACIONES

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|:---:|------------|
| Cambio RLS rompe cotizaciones | Alto | Media | Incluir `OR assigned_sales_rep_id IS NULL` en policy + probar flujo completo |
| Performance en ficha con muchas cotizaciones/pedidos | Medio | Baja | Paginación server-side en cada tab del historial |
| Data scope excluye clientes sin asesor asignado | Alto | Alta | Policy debe permitir ver clientes sin asignar |
| Conflicto con department que no existe en BD | Bajo | Alta | La migración A.1 lo soluciona antes de que sea problema |
| Export masivo causa timeout | Medio | Media | Usar streaming CSV (patrón anti-timeout de FASE-03) |

---

## 7. ORDEN DE EJECUCIÓN RECOMENDADO

### Sprint 1: Fundamentos (BD + API base)
1. ✅ A.1 - Migración: columnas en customers
2. ✅ A.2 - Migración: tabla customer_visits
3. ✅ A.4 - Migración: permisos
4. ✅ A.3 - Migración: RLS data scope (después de A.1)
5. ✅ B.1 - Actualizar GET /api/customers (filtros nuevos)
6. ✅ B.2 - Actualizar POST/PUT /api/customers (campos nuevos)
7. ✅ C.1 - Agregar "Clientes" a navegación

### Sprint 2: Ficha del Cliente
8. ✅ B.3 - API: GET /api/customers/[id]/history
9. ✅ B.4 - API: GET/POST /api/customers/[id]/visits
10. ✅ D.1 - Page detalle `/home/customers/[id]`
11. ✅ D.2 - Customer detail client (layout con tabs)
12. ✅ D.3 - Tab cotizaciones
13. ✅ D.4 - Tab pedidos

### Sprint 3: Visitas + Complementarios
14. ✅ D.5 - Tab órdenes de compra
15. ✅ D.6 - Tab visitas
16. ✅ D.7 - Visit form dialog
17. ✅ D.8 - Tab resumen/KPIs
18. ✅ C.2 - Actualizar form cliente (asesor, department, status)
19. ✅ C.3 - Actualizar filtros
20. ✅ C.4 - Actualizar columnas tabla

### Sprint 4: Reportes + Export + Docs
21. ✅ B.5 - API: GET /api/visits (vista gerencial)
22. ✅ B.6 - API: Export customers
23. ✅ C.5 - Botón exportar en frontend
24. ✅ B.7 - Reportes tipo customers
25. ✅ E.1-E.2 - Tab clientes en reportes
26. ✅ A.5 - Trigger last_interaction_at
27. ✅ F.* - Actualizar documentación de arquitectura

---

## 8. ARCHIVOS CLAVE A MODIFICAR

### Existentes (Modificar)
```
apps/web/components/dashboard/top-navigation.tsx          → C.1 (agregar link Clientes)
apps/web/components/dashboard/mobile-bottom-tabs.tsx       → C.1 (agregar tab Clientes)
apps/web/app/api/customers/route.ts                        → B.1, B.2 (filtros + campos)
apps/web/app/home/(admin)/customers/_components/
  ├── customers-page-client.tsx                            → C.2, C.5 (asesor, export)
  ├── customer-form-dialog.tsx                             → C.2 (asesor, department, status)
  ├── customer-table-columns.tsx                           → C.4 (columnas nuevas)
  └── customer-filters.tsx                                 → C.3 (filtros nuevos)
apps/web/app/home/(admin)/customers/_lib/
  ├── types.ts                                             → Actualizar interfaces
  ├── schemas.ts                                           → Actualizar schemas Zod
  └── customer-queries.ts                                  → Hooks nuevos
apps/web/app/home/(admin)/reports/_components/
  └── reports-page-client.tsx                              → E.1 (tab clientes)
apps/web/app/home/(admin)/reports/_lib/types.ts            → E.2 (tipo customers)
```

### Nuevos (Crear)
```
apps/web/app/api/customers/[id]/history/route.ts           → B.3
apps/web/app/api/customers/[id]/visits/route.ts            → B.4
apps/web/app/api/visits/route.ts                           → B.5
apps/web/app/api/customers/export/route.ts                 → B.6
apps/web/app/home/(admin)/customers/[id]/page.tsx          → D.1
apps/web/app/home/(admin)/customers/[id]/_components/
  ├── customer-detail-client.tsx                           → D.2
  ├── customer-info-tab.tsx                                → D.2 (info general)
  ├── customer-quotes-tab.tsx                              → D.3
  ├── customer-orders-tab.tsx                              → D.4
  ├── customer-purchase-orders-tab.tsx                     → D.5
  ├── customer-visits-tab.tsx                              → D.6
  ├── visit-form-dialog.tsx                                → D.7
  └── customer-summary-tab.tsx                             → D.8
```

---

## 9. CRITERIOS DE ACEPTACIÓN → TRAZABILIDAD

| CA# | Criterio HU-00021 | Fase | Tarea |
|-----|-------------------|------|-------|
| CA-1 | Módulo accesible desde menú lateral | C | C.1 |
| CA-2 | Listado con razón social, NIT, contacto, teléfono, correo, asesor, estado | C | C.4 |
| CA-3 | Asesor ve solo sus clientes; gerente ve todos | A+B | A.3, B.1 |
| CA-4 | Filtrar por asesor, estado, búsqueda, rango fechas | C | C.3 |
| CA-5 | Creación manual desde módulo y desde cotización | C | C.2 (ya existe parcial) |
| CA-6 | Múltiples contactos gestionables desde ficha | - | ✅ YA EXISTE |
| CA-7 | Vista detalle con info general, contactos, gestión | D | D.1, D.2 |
| CA-8 | Cotizaciones filtrables por estado y fechas | D | D.3 |
| CA-9 | Pedidos filtrables por estado | D | D.4 |
| CA-10 | OC consultables y navegables | D | D.5 |
| CA-11 | Historial de visitas desde ficha | D | D.6 |
| CA-12 | Registrar visitas presenciales | D | D.6, D.7 |
| CA-13 | Cada visita: cliente, asesor, fecha, tipo, obs, estado | A+D | A.2, D.7 |
| CA-14 | Gerente filtra visitas por asesor y fechas | B+D | B.5, D.6 |
| CA-15 | Última visita y historial completo en ficha | D | D.6 |
| CA-16 | Solo gerente/director exporta clientes | B+C | B.6, C.5 |
| CA-17 | Pestaña "Clientes" en reportes con export | E | E.1, E.2 |
| CA-18 | Importación masiva desde Excel/CSV | - | EXCLUIDO (se hará por seed) |
| CA-19 | Migración respeta asignación por asesor | - | EXCLUIDO (seed) |
| CA-20 | Diferencia clientes vs proveedores | - | EXCLUIDO (seed) |
| CA-21 | Buscar clientes desde formulario de cotización | - | ✅ YA EXISTE |
| CA-22 | Clientes convertidos desde leads aparecen | - | ✅ YA EXISTE (flujo lead→cliente) |
