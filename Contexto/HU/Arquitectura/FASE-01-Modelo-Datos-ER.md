# FASE 1: Modelo de Datos y Entidad-Relación Completo

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Perspectivas:** Arquitecto | DB-Integration | Business Analyst | Fullstack Dev | UX/UI Designer
**Base:** Supabase (PostgreSQL 15) | Multi-tenant con `organization_id`

---

## 1. PRINCIPIOS DE DISEÑO DEL MODELO

### 1.1 Multi-tenancy
- **Estrategia:** Row-Level Security (RLS) con columna `organization_id` en TODAS las tablas de negocio
- **Esquema:** `public` para tablas de negocio, `auth` manejado por Supabase
- **Aislamiento:** Cada organización solo ve sus propios datos

### 1.2 Convenciones de Nomenclatura
- **Tablas:** `snake_case`, plural (ej: `leads`, `quotes`, `orders`)
- **Columnas:** `snake_case` (ej: `created_at`, `organization_id`)
- **PKs:** `id` tipo `uuid` con `gen_random_uuid()`
- **FKs:** `{tabla_singular}_id` (ej: `lead_id`, `quote_id`)
- **Timestamps:** `created_at`, `updated_at` en TODAS las tablas
- **Soft delete:** `deleted_at` (nullable timestamp) donde aplique
- **Audit:** `created_by`, `updated_by` (uuid ref a auth.users)

### 1.3 Indices Estándar
- PK en `id` (automático)
- Índice en `organization_id` (todas las tablas)
- Índice compuesto `(organization_id, created_at DESC)` para listados
- Índice en FKs para JOINs eficientes
- Índices parciales donde el filtrado por estado sea frecuente

### 1.4 Triggers Estándar
- `set_updated_at()` - Actualiza `updated_at` en cada UPDATE
- `set_created_by()` - Establece `created_by` desde `auth.uid()`
- `audit_trail_trigger()` - Registra cambios en `audit_logs`

---

## 2. CATÁLOGO COMPLETO DE ENTIDADES (45 tablas)

### DOMINIO 1: ORGANIZACIÓN Y USUARIOS (6 tablas)

#### 2.1 `organizations`
> Tabla raíz del multi-tenant. Cada empresa cliente del sistema.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `name` | `varchar(255)` | NOT NULL | Razón social de la organización |
| `nit` | `varchar(20)` | NOT NULL, UNIQUE | NIT de la organización |
| `logo_url` | `text` | NULLABLE | URL del logo en Storage |
| `domain` | `varchar(100)` | NULLABLE | Dominio personalizado |
| `plan` | `varchar(50)` | NOT NULL DEFAULT 'standard' | Plan de suscripción |
| `settings` | `jsonb` | NOT NULL DEFAULT '{}' | Configuraciones generales (TRM auto, moneda, timezone) |
| `max_users` | `integer` | NOT NULL DEFAULT 50 | Límite de usuarios |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Estado de la organización |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_organizations_nit` UNIQUE en `nit`
- `idx_organizations_active` parcial WHERE `is_active = true`

---

#### 2.2 `profiles`
> Perfil extendido del usuario vinculado a auth.users de Supabase.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, REFERENCES auth.users(id) ON DELETE CASCADE | Mismo ID que auth.users |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización a la que pertenece |
| `full_name` | `varchar(255)` | NOT NULL | Nombre completo |
| `email` | `varchar(255)` | NOT NULL | Email (sync con auth.users) |
| `phone` | `varchar(20)` | NULLABLE | Teléfono |
| `avatar_url` | `text` | NULLABLE | URL del avatar |
| `area` | `varchar(100)` | NULLABLE | Área o departamento |
| `position` | `varchar(100)` | NULLABLE | Cargo |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Usuario activo para asignaciones |
| `is_available` | `boolean` | NOT NULL DEFAULT true | Disponible para asignación de leads |
| `max_pending_leads` | `integer` | NOT NULL DEFAULT 5 | Máximo de leads pendientes (configurable) |
| `preferences` | `jsonb` | NOT NULL DEFAULT '{}' | Preferencias del usuario (notificaciones, idioma, etc.) |
| `last_login_at` | `timestamptz` | NULLABLE | Último inicio de sesión |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_profiles_org` en `organization_id`
- `idx_profiles_org_active` en `(organization_id, is_active)` WHERE `is_active = true`
- `idx_profiles_email` en `email`

---

#### 2.3 `roles`
> Roles del sistema, configurables por organización.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización dueña del rol |
| `name` | `varchar(100)` | NOT NULL | Nombre del rol |
| `slug` | `varchar(100)` | NOT NULL | Slug para código (ej: 'gerente_comercial') |
| `description` | `text` | NULLABLE | Descripción del rol |
| `is_system` | `boolean` | NOT NULL DEFAULT false | Si es rol del sistema (no eliminable) |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Estado del rol |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_roles_org` en `organization_id`
- `idx_roles_org_slug` UNIQUE en `(organization_id, slug)`

**Roles del sistema predefinidos (12):**
1. `super_admin` - Super Administrador
2. `gerente_general` - Gerente General
3. `director_comercial` - Director Comercial
4. `gerente_comercial` - Gerente Comercial
5. `gerente_operativo` - Gerente Operativo
6. `asesor_comercial` - Asesor Comercial
7. `finanzas` - Finanzas
8. `compras` - Compras
9. `logistica` - Logística
10. `jefe_bodega` - Jefe de Bodega
11. `auxiliar_bodega` - Auxiliar de Bodega
12. `facturacion` - Facturación

---

#### 2.4 `permissions`
> Permisos granulares agrupados por módulo. Formato: `modulo:accion`.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `module` | `varchar(50)` | NOT NULL | Módulo (leads, quotes, orders, etc.) |
| `action` | `varchar(50)` | NOT NULL | Acción (create, read, update, delete, approve, export) |
| `slug` | `varchar(100)` | NOT NULL, UNIQUE | Slug completo (ej: 'leads:create') |
| `description` | `text` | NULLABLE | Descripción del permiso |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_permissions_module` en `module`
- `idx_permissions_slug` UNIQUE en `slug`

**Módulos de permisos:**
`leads`, `quotes`, `orders`, `purchase_orders`, `logistics`, `billing`, `whatsapp`, `reports`, `admin`, `products`, `customers`, `licenses`, `dashboard`

**Acciones estándar por módulo:**
`create`, `read`, `update`, `delete`, `approve`, `export`, `assign`, `reassign`

---

#### 2.5 `role_permissions`
> Tabla pivote: relación N:M entre roles y permisos.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `role_id` | `uuid` | NOT NULL, FK → roles(id) ON DELETE CASCADE | Rol |
| `permission_id` | `uuid` | NOT NULL, FK → permissions(id) ON DELETE CASCADE | Permiso |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de asignación |

**Índices:**
- `idx_role_permissions_role` en `role_id`
- `idx_role_permissions_unique` UNIQUE en `(role_id, permission_id)`

---

#### 2.6 `user_roles`
> Tabla pivote: relación N:M entre usuarios y roles. Un usuario puede tener múltiples roles.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `user_id` | `uuid` | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Usuario |
| `role_id` | `uuid` | NOT NULL, FK → roles(id) ON DELETE CASCADE | Rol asignado |
| `assigned_by` | `uuid` | FK → auth.users(id) | Quién asignó el rol |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de asignación |

**Índices:**
- `idx_user_roles_user` en `user_id`
- `idx_user_roles_unique` UNIQUE en `(user_id, role_id)`

---

### DOMINIO 2: CLIENTES Y LEADS (4 tablas)

#### 2.7 `customers`
> Clientes/empresas del sistema. Un lead se convierte en customer al validarse.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización dueña |
| `business_name` | `varchar(255)` | NOT NULL | Razón social |
| `nit` | `varchar(20)` | NOT NULL | NIT o número de identificación |
| `industry` | `varchar(100)` | NULLABLE | Sector/industria |
| `address` | `text` | NULLABLE | Dirección principal |
| `city` | `varchar(100)` | NULLABLE | Ciudad |
| `phone` | `varchar(20)` | NULLABLE | Teléfono principal |
| `email` | `varchar(255)` | NULLABLE | Email corporativo |
| `website` | `varchar(255)` | NULLABLE | Sitio web |
| `credit_limit` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Cupo de crédito aprobado |
| `credit_available` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Cupo de crédito disponible |
| `credit_status` | `varchar(20)` | NOT NULL DEFAULT 'pending' | Estado de crédito: pending, approved, blocked, suspended |
| `payment_terms` | `varchar(50)` | NULLABLE | Términos de pago por defecto (Anticipado, 30 días, 60 días) |
| `outstanding_balance` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Saldo de cartera vencida |
| `is_blocked` | `boolean` | NOT NULL DEFAULT false | Bloqueado por cartera |
| `block_reason` | `text` | NULLABLE | Motivo del bloqueo |
| `notes` | `text` | NULLABLE | Notas generales |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Índices:**
- `idx_customers_org` en `organization_id`
- `idx_customers_org_nit` UNIQUE en `(organization_id, nit)`
- `idx_customers_org_name` en `(organization_id, business_name)`
- `idx_customers_blocked` parcial WHERE `is_blocked = true`

---

#### 2.8 `customer_contacts`
> Contactos de un cliente. Una empresa puede tener múltiples contactos (HU-0001).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `customer_id` | `uuid` | NOT NULL, FK → customers(id) ON DELETE CASCADE | Cliente al que pertenece |
| `full_name` | `varchar(255)` | NOT NULL | Nombre completo del contacto |
| `email` | `varchar(255)` | NULLABLE | Email del contacto |
| `phone` | `varchar(20)` | NULLABLE | Teléfono/celular |
| `position` | `varchar(100)` | NULLABLE | Cargo |
| `is_primary` | `boolean` | NOT NULL DEFAULT false | Si es el contacto principal |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Activo |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_customer_contacts_customer` en `customer_id`
- `idx_customer_contacts_org` en `organization_id`

---

#### 2.9 `leads`
> Leads capturados por chatbot WhatsApp, formulario web o creación manual.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `lead_number` | `integer` | NOT NULL | Consecutivo auto (inicia en 100) |
| `business_name` | `varchar(255)` | NOT NULL | Razón social |
| `nit` | `varchar(20)` | NULLABLE | NIT (validar duplicidad) |
| `contact_name` | `varchar(255)` | NOT NULL | Nombre del contacto principal |
| `phone` | `varchar(20)` | NOT NULL | Celular de contacto |
| `email` | `varchar(255)` | NOT NULL | Correo electrónico |
| `requirement` | `text` | NOT NULL | Requerimiento/motivo de contacto |
| `channel` | `varchar(20)` | NOT NULL | Canal: 'whatsapp', 'web', 'manual' |
| `status` | `varchar(30)` | NOT NULL DEFAULT 'created' | Estado: created, pending_assignment, assigned, converted, rejected, pending_info |
| `rejection_reason_id` | `uuid` | FK → rejection_reasons(id) | Motivo de rechazo (si aplica) |
| `rejection_notes` | `text` | NULLABLE | Notas de rechazo |
| `customer_id` | `uuid` | FK → customers(id) | Cliente vinculado (al convertir) |
| `assigned_to` | `uuid` | FK → profiles(id) | Asesor asignado |
| `assigned_at` | `timestamptz` | NULLABLE | Fecha de asignación |
| `assigned_by` | `uuid` | FK → auth.users(id) | Quién asignó (null si automático) |
| `converted_at` | `timestamptz` | NULLABLE | Fecha de conversión a cotización |
| `lead_date` | `timestamptz` | NOT NULL DEFAULT now() | Fecha del lead (editable por Gerente/Director) |
| `source_conversation_id` | `uuid` | FK → whatsapp_conversations(id) | Conversación origen (si vino de WhatsApp) |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Índices:**
- `idx_leads_org` en `organization_id`
- `idx_leads_org_number` UNIQUE en `(organization_id, lead_number)`
- `idx_leads_org_status` en `(organization_id, status)`
- `idx_leads_assigned` en `assigned_to` WHERE `status IN ('assigned', 'pending_assignment')`
- `idx_leads_org_nit` en `(organization_id, nit)` -- para detección de duplicados
- `idx_leads_org_email` en `(organization_id, email)` -- para detección de duplicados
- `idx_leads_created` en `(organization_id, created_at DESC)`

**Trigger:** `auto_assign_lead()` - Asignación automática balanceada al crear lead

---

#### 2.10 `lead_assignments_log`
> Bitácora de asignaciones y reasignaciones de leads (HU-0002).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `lead_id` | `uuid` | NOT NULL, FK → leads(id) ON DELETE CASCADE | Lead afectado |
| `from_user_id` | `uuid` | FK → profiles(id) | Asesor anterior (null si primera asignación) |
| `to_user_id` | `uuid` | NOT NULL, FK → profiles(id) | Asesor destino |
| `assignment_type` | `varchar(20)` | NOT NULL | Tipo: 'automatic', 'manual', 'reassignment' |
| `reason` | `text` | NULLABLE | Motivo (para reasignaciones manuales) |
| `performed_by` | `uuid` | FK → auth.users(id) | Quién realizó la acción |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha del evento |

**Índices:**
- `idx_lead_assignments_lead` en `lead_id`
- `idx_lead_assignments_org` en `(organization_id, created_at DESC)`

---

### DOMINIO 3: PRODUCTOS Y CATÁLOGO (4 tablas)

#### 2.11 `product_categories`
> Categorías de productos para el árbol de márgenes.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `name` | `varchar(255)` | NOT NULL | Nombre de la categoría |
| `slug` | `varchar(100)` | NOT NULL | Slug de la categoría |
| `parent_id` | `uuid` | FK → product_categories(id) | Categoría padre (árbol jerárquico) |
| `level` | `integer` | NOT NULL DEFAULT 0 | Nivel en el árbol |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Activa |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_product_categories_org` en `organization_id`
- `idx_product_categories_parent` en `parent_id`
- `idx_product_categories_org_slug` UNIQUE en `(organization_id, slug)`

---

#### 2.12 `products`
> Catálogo de productos y servicios.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `sku` | `varchar(50)` | NOT NULL | Código/SKU/Número de parte |
| `name` | `varchar(255)` | NOT NULL | Nombre del producto |
| `description` | `text` | NULLABLE | Descripción detallada |
| `category_id` | `uuid` | FK → product_categories(id) | Categoría del producto |
| `brand` | `varchar(100)` | NULLABLE | Marca |
| `unit_cost_usd` | `numeric(15,4)` | NOT NULL DEFAULT 0 | Costo unitario en USD |
| `unit_cost_cop` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Costo unitario en COP |
| `suggested_price_cop` | `numeric(15,2)` | NULLABLE | Precio sugerido COP |
| `currency` | `varchar(3)` | NOT NULL DEFAULT 'COP' | Moneda principal: COP, USD |
| `is_service` | `boolean` | NOT NULL DEFAULT false | Si es servicio (no tiene inventario) |
| `is_license` | `boolean` | NOT NULL DEFAULT false | Si es licencia/intangible (HU-00018) |
| `requires_activation` | `boolean` | NOT NULL DEFAULT false | Si requiere activación |
| `warranty_months` | `integer` | NULLABLE | Meses de garantía |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Producto activo |
| `metadata` | `jsonb` | NOT NULL DEFAULT '{}' | Metadata adicional (especificaciones técnicas) |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Índices:**
- `idx_products_org` en `organization_id`
- `idx_products_org_sku` UNIQUE en `(organization_id, sku)`
- `idx_products_category` en `category_id`
- `idx_products_org_name` en `(organization_id, name)`

---

#### 2.13 `margin_rules`
> Árbol de asignación de porcentajes de margen por categoría y condición de pago (HU-0003).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `category_id` | `uuid` | FK → product_categories(id) | Categoría (null = aplica a todas) |
| `payment_type` | `varchar(30)` | NOT NULL | Tipo de pago: 'anticipated', 'credit_30', 'credit_60', 'credit_90' |
| `min_margin_pct` | `numeric(5,2)` | NOT NULL | Margen mínimo % (requiere aprobación si es menor) |
| `target_margin_pct` | `numeric(5,2)` | NOT NULL | Margen objetivo % |
| `max_discount_pct` | `numeric(5,2)` | NOT NULL DEFAULT 0 | Descuento máximo permitido % |
| `requires_approval_below` | `numeric(5,2)` | NOT NULL | Margen por debajo del cual requiere aprobación |
| `approval_role_slug` | `varchar(100)` | NOT NULL DEFAULT 'gerente_comercial' | Rol que debe aprobar |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Regla activa |
| `effective_from` | `date` | NOT NULL DEFAULT CURRENT_DATE | Fecha de vigencia desde |
| `effective_until` | `date` | NULLABLE | Fecha de vigencia hasta |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_margin_rules_org` en `organization_id`
- `idx_margin_rules_category` en `(organization_id, category_id, payment_type)`
- `idx_margin_rules_active` parcial WHERE `is_active = true`

---

#### 2.14 `trm_rates`
> Tasa Representativa del Mercado diaria para conversión USD→COP.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `rate_date` | `date` | NOT NULL | Fecha de la TRM |
| `rate_value` | `numeric(10,2)` | NOT NULL | Valor de la TRM (ej: 4250.00) |
| `source` | `varchar(50)` | NOT NULL DEFAULT 'manual' | Fuente: 'manual', 'api_banrep', 'api_superfinanciera' |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario que registró |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_trm_rates_org_date` UNIQUE en `(organization_id, rate_date)`
- `idx_trm_rates_latest` en `(organization_id, rate_date DESC)`

---

### DOMINIO 4: COTIZACIONES (4 tablas)

#### 2.15 `quotes`
> Cotizaciones generadas a partir de leads validados (HU-0003, HU-0005, HU-0006).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `quote_number` | `integer` | NOT NULL | Consecutivo (inicia en 30000) |
| `lead_id` | `uuid` | FK → leads(id) | Lead origen |
| `customer_id` | `uuid` | NOT NULL, FK → customers(id) | Cliente |
| `contact_id` | `uuid` | FK → customer_contacts(id) | Contacto del cliente |
| `advisor_id` | `uuid` | NOT NULL, FK → profiles(id) | Asesor comercial responsable |
| `quote_date` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de cotización (editable) |
| `validity_days` | `integer` | NOT NULL DEFAULT 30 | Días de validez |
| `expires_at` | `timestamptz` | NOT NULL | Fecha de vencimiento |
| `status` | `varchar(30)` | NOT NULL DEFAULT 'draft' | Estado: draft, offer_created, negotiation, risk, pending_oc, approved, rejected, lost, expired |
| `currency` | `varchar(3)` | NOT NULL DEFAULT 'COP' | Moneda: COP, USD |
| `trm_applied` | `numeric(10,2)` | NULLABLE | TRM aplicada al momento de crear |
| `subtotal` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Subtotal sin IVA |
| `discount_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Descuento total |
| `tax_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | IVA total |
| `transport_cost` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Costo de transporte (interno, no visible al cliente) |
| `transport_included` | `boolean` | NOT NULL DEFAULT false | Si el transporte está incluido en el precio |
| `total` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Total con IVA |
| `margin_pct` | `numeric(5,2)` | NULLABLE | Margen calculado % |
| `margin_approved` | `boolean` | NOT NULL DEFAULT false | Si el margen fue aprobado (cuando es bajo) |
| `margin_approved_by` | `uuid` | FK → auth.users(id) | Quién aprobó el margen |
| `margin_approved_at` | `timestamptz` | NULLABLE | Cuándo se aprobó |
| `payment_terms` | `varchar(50)` | NOT NULL | Forma de pago |
| `credit_validated` | `boolean` | NOT NULL DEFAULT false | Si se validó el cupo de crédito |
| `credit_validation_result` | `jsonb` | NULLABLE | Resultado de validación: {available, used, blocked_reason} |
| `proforma_url` | `text` | NULLABLE | URL del PDF de proforma en Storage |
| `proforma_generated_at` | `timestamptz` | NULLABLE | Cuándo se generó la proforma |
| `sent_to_client` | `boolean` | NOT NULL DEFAULT false | Si se envió al cliente |
| `sent_at` | `timestamptz` | NULLABLE | Cuándo se envió |
| `sent_via` | `varchar(20)` | NULLABLE | Canal de envío: 'email', 'whatsapp', 'both' |
| `loss_reason` | `text` | NULLABLE | Razón de pérdida (si status = lost) |
| `notes` | `text` | NULLABLE | Observaciones internas |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Índices:**
- `idx_quotes_org` en `organization_id`
- `idx_quotes_org_number` UNIQUE en `(organization_id, quote_number)`
- `idx_quotes_customer` en `customer_id`
- `idx_quotes_advisor` en `advisor_id`
- `idx_quotes_status` en `(organization_id, status)`
- `idx_quotes_org_date` en `(organization_id, quote_date DESC)`
- `idx_quotes_lead` en `lead_id`
- `idx_quotes_expires` en `(organization_id, expires_at)` WHERE `status NOT IN ('approved', 'rejected', 'lost')`

---

#### 2.16 `quote_items`
> Ítems/líneas de una cotización con orden personalizable (HU-0003).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `quote_id` | `uuid` | NOT NULL, FK → quotes(id) ON DELETE CASCADE | Cotización padre |
| `product_id` | `uuid` | FK → products(id) | Producto del catálogo (nullable para items manuales) |
| `sort_order` | `integer` | NOT NULL DEFAULT 0 | Orden de visualización (drag & drop) |
| `sku` | `varchar(50)` | NOT NULL | Código/número de parte |
| `description` | `text` | NOT NULL | Descripción del producto |
| `quantity` | `numeric(10,2)` | NOT NULL DEFAULT 1 | Cantidad |
| `unit_price` | `numeric(15,4)` | NOT NULL | Precio unitario |
| `discount_pct` | `numeric(5,2)` | NOT NULL DEFAULT 0 | Descuento % por ítem |
| `discount_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Descuento monto |
| `tax_pct` | `numeric(5,2)` | NOT NULL DEFAULT 19 | % de IVA |
| `tax_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Monto IVA |
| `subtotal` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Subtotal línea |
| `total` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Total línea con IVA |
| `cost_price` | `numeric(15,4)` | NOT NULL DEFAULT 0 | Precio de costo (interno, no visible al cliente) |
| `margin_pct` | `numeric(5,2)` | NULLABLE | Margen % calculado |
| `notes` | `text` | NULLABLE | Notas del ítem |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_quote_items_quote` en `quote_id`
- `idx_quote_items_product` en `product_id`
- `idx_quote_items_order` en `(quote_id, sort_order)`

---

#### 2.17 `quote_approvals`
> Aprobaciones de cotización por margen bajo (HU-0005).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `quote_id` | `uuid` | NOT NULL, FK → quotes(id) ON DELETE CASCADE | Cotización |
| `requested_by` | `uuid` | NOT NULL, FK → auth.users(id) | Asesor que solicita aprobación |
| `requested_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de solicitud |
| `current_margin_pct` | `numeric(5,2)` | NOT NULL | Margen actual calculado |
| `min_margin_required` | `numeric(5,2)` | NOT NULL | Margen mínimo requerido |
| `justification` | `text` | NULLABLE | Justificación del asesor |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'pending' | Estado: pending, approved, rejected |
| `reviewed_by` | `uuid` | FK → auth.users(id) | Quién revisó |
| `reviewed_at` | `timestamptz` | NULLABLE | Cuándo se revisó |
| `review_notes` | `text` | NULLABLE | Notas del revisor |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_quote_approvals_quote` en `quote_id`
- `idx_quote_approvals_org_status` en `(organization_id, status)` WHERE `status = 'pending'`

---

#### 2.18 `quote_follow_ups`
> Seguimientos y alertas automáticas de cotizaciones (HU-0009).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `quote_id` | `uuid` | NOT NULL, FK → quotes(id) ON DELETE CASCADE | Cotización |
| `follow_up_type` | `varchar(30)` | NOT NULL | Tipo: 'reminder', 'escalation', 'expiration_warning', 'manual' |
| `scheduled_at` | `timestamptz` | NOT NULL | Cuándo ejecutar |
| `executed_at` | `timestamptz` | NULLABLE | Cuándo se ejecutó |
| `channel` | `varchar(20)` | NOT NULL DEFAULT 'internal' | Canal: 'internal', 'email', 'whatsapp' |
| `message` | `text` | NULLABLE | Mensaje personalizado |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'pending' | Estado: pending, sent, cancelled |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_quote_followups_org` en `organization_id`
- `idx_quote_followups_pending` en `(organization_id, scheduled_at)` WHERE `status = 'pending'`
- `idx_quote_followups_quote` en `quote_id`

---

### DOMINIO 5: PEDIDOS (5 tablas)

#### 2.19 `orders`
> Pedidos creados a partir de cotizaciones aprobadas (HU-0007, HU-00014).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `order_number` | `integer` | NOT NULL | Consecutivo de pedido |
| `quote_id` | `uuid` | NOT NULL, FK → quotes(id) | Cotización origen |
| `customer_id` | `uuid` | NOT NULL, FK → customers(id) | Cliente |
| `advisor_id` | `uuid` | NOT NULL, FK → profiles(id) | Asesor comercial |
| `status` | `varchar(30)` | NOT NULL DEFAULT 'created' | Estado: created, payment_pending, payment_confirmed, available_for_purchase, in_purchase, partial_delivery, in_logistics, delivered, invoiced, completed, cancelled |
| `payment_status` | `varchar(30)` | NOT NULL DEFAULT 'pending' | Estado de pago: pending, confirmed, partial, overdue |
| `payment_terms` | `varchar(50)` | NOT NULL | Forma de pago (heredada de cotización) |
| `requires_advance_billing` | `boolean` | NOT NULL DEFAULT false | Requiere facturación anticipada |
| `currency` | `varchar(3)` | NOT NULL DEFAULT 'COP' | Moneda |
| `subtotal` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Subtotal |
| `tax_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | IVA |
| `total` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Total |
| `delivery_date` | `timestamptz` | NULLABLE | Fecha estimada de entrega |
| `delivery_address` | `text` | NULLABLE | Dirección de entrega |
| `delivery_city` | `varchar(100)` | NULLABLE | Ciudad de entrega |
| `delivery_contact` | `varchar(255)` | NULLABLE | Contacto de recepción |
| `delivery_phone` | `varchar(20)` | NULLABLE | Teléfono de recepción |
| `delivery_schedule` | `varchar(100)` | NULLABLE | Horario de entrega |
| `dispatch_type` | `varchar(30)` | NULLABLE | Tipo: 'envio', 'retiro', 'mensajeria' |
| `notes` | `text` | NULLABLE | Observaciones |
| `completed_at` | `timestamptz` | NULLABLE | Fecha de cierre |
| `cancelled_at` | `timestamptz` | NULLABLE | Fecha de cancelación |
| `cancellation_reason` | `text` | NULLABLE | Motivo de cancelación |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Índices:**
- `idx_orders_org` en `organization_id`
- `idx_orders_org_number` UNIQUE en `(organization_id, order_number)`
- `idx_orders_customer` en `customer_id`
- `idx_orders_advisor` en `advisor_id`
- `idx_orders_status` en `(organization_id, status)`
- `idx_orders_quote` en `quote_id`
- `idx_orders_org_date` en `(organization_id, created_at DESC)`

---

#### 2.20 `order_items`
> Ítems/líneas de un pedido (heredados de la cotización, no editables en lo comercial).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) ON DELETE CASCADE | Pedido padre |
| `quote_item_id` | `uuid` | FK → quote_items(id) | Ítem de cotización origen |
| `product_id` | `uuid` | FK → products(id) | Producto |
| `sku` | `varchar(50)` | NOT NULL | Código/número de parte |
| `description` | `text` | NOT NULL | Descripción |
| `quantity` | `numeric(10,2)` | NOT NULL | Cantidad total |
| `quantity_purchased` | `numeric(10,2)` | NOT NULL DEFAULT 0 | Cantidad ya comprada a proveedor |
| `quantity_received` | `numeric(10,2)` | NOT NULL DEFAULT 0 | Cantidad recibida en bodega |
| `quantity_dispatched` | `numeric(10,2)` | NOT NULL DEFAULT 0 | Cantidad despachada |
| `quantity_delivered` | `numeric(10,2)` | NOT NULL DEFAULT 0 | Cantidad entregada al cliente |
| `unit_price` | `numeric(15,4)` | NOT NULL | Precio unitario |
| `subtotal` | `numeric(15,2)` | NOT NULL | Subtotal |
| `tax_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | IVA |
| `total` | `numeric(15,2)` | NOT NULL | Total |
| `item_status` | `varchar(30)` | NOT NULL DEFAULT 'pending' | Estado: pending, purchased, partial_received, received, dispatched, delivered |
| `is_license` | `boolean` | NOT NULL DEFAULT false | Si es licencia/intangible |
| `license_data` | `jsonb` | NULLABLE | Datos de licencia: {key, activation_date, expiry_date, vendor, notes} |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_order_items_order` en `order_id`
- `idx_order_items_product` en `product_id`
- `idx_order_items_status` en `item_status`

---

#### 2.21 `order_status_history`
> Historial de cambios de estado del pedido para trazabilidad (HU-00015).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) ON DELETE CASCADE | Pedido |
| `from_status` | `varchar(30)` | NULLABLE | Estado anterior |
| `to_status` | `varchar(30)` | NOT NULL | Estado nuevo |
| `changed_by` | `uuid` | NOT NULL, FK → auth.users(id) | Quién cambió |
| `notes` | `text` | NULLABLE | Notas del cambio |
| `metadata` | `jsonb` | NULLABLE | Datos adicionales del cambio |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha del cambio |

**Índices:**
- `idx_order_status_history_order` en `(order_id, created_at DESC)`

---

#### 2.22 `order_documents`
> Documentos adjuntos a pedidos (OC proveedor, guías, comprobantes, etc.).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) ON DELETE CASCADE | Pedido |
| `document_type` | `varchar(30)` | NOT NULL | Tipo: 'purchase_order', 'invoice', 'guide', 'receipt', 'proforma', 'other' |
| `file_name` | `varchar(255)` | NOT NULL | Nombre del archivo |
| `file_url` | `text` | NOT NULL | URL en Supabase Storage |
| `file_size` | `integer` | NULLABLE | Tamaño en bytes |
| `mime_type` | `varchar(100)` | NULLABLE | Tipo MIME |
| `uploaded_by` | `uuid` | NOT NULL, FK → auth.users(id) | Quién subió |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de subida |

**Índices:**
- `idx_order_documents_order` en `order_id`
- `idx_order_documents_type` en `(order_id, document_type)`

---

#### 2.23 `order_pending_tasks`
> Pendientes y control operativo por pedido - Semáforo visual (HU-00019).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) ON DELETE CASCADE | Pedido |
| `order_item_id` | `uuid` | FK → order_items(id) | Ítem específico (null = pedido completo) |
| `task_type` | `varchar(30)` | NOT NULL | Tipo: 'purchase', 'reception', 'dispatch', 'delivery', 'billing', 'license_activation' |
| `title` | `varchar(255)` | NOT NULL | Título del pendiente |
| `description` | `text` | NULLABLE | Descripción detallada |
| `priority` | `varchar(10)` | NOT NULL DEFAULT 'medium' | Prioridad: low, medium, high, critical |
| `traffic_light` | `varchar(10)` | NOT NULL DEFAULT 'green' | Semáforo: green, yellow, red |
| `due_date` | `timestamptz` | NULLABLE | Fecha límite |
| `assigned_to` | `uuid` | FK → profiles(id) | Responsable |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'pending' | Estado: pending, in_progress, completed, cancelled |
| `completed_at` | `timestamptz` | NULLABLE | Fecha de completado |
| `completed_by` | `uuid` | FK → auth.users(id) | Quién completó |
| `created_by` | `uuid` | FK → auth.users(id) | Quién creó |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_order_pending_org` en `organization_id`
- `idx_order_pending_order` en `order_id`
- `idx_order_pending_assigned` en `assigned_to` WHERE `status IN ('pending', 'in_progress')`
- `idx_order_pending_traffic` en `(organization_id, traffic_light)` WHERE `status != 'completed'`
- `idx_order_pending_due` en `(organization_id, due_date)` WHERE `status IN ('pending', 'in_progress')`

---

### DOMINIO 6: ÓRDENES DE COMPRA Y PROVEEDORES (3 tablas)

#### 2.24 `suppliers`
> Proveedores de la organización (HU-00016).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `name` | `varchar(255)` | NOT NULL | Nombre del proveedor |
| `nit` | `varchar(20)` | NULLABLE | NIT |
| `contact_name` | `varchar(255)` | NULLABLE | Contacto principal |
| `email` | `varchar(255)` | NULLABLE | Email |
| `phone` | `varchar(20)` | NULLABLE | Teléfono |
| `address` | `text` | NULLABLE | Dirección |
| `city` | `varchar(100)` | NULLABLE | Ciudad |
| `country` | `varchar(100)` | NOT NULL DEFAULT 'Colombia' | País |
| `payment_terms` | `varchar(50)` | NULLABLE | Condiciones de pago |
| `lead_time_days` | `integer` | NULLABLE | Tiempo de entrega en días |
| `rating` | `numeric(3,1)` | NULLABLE | Calificación (1-5) |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Activo |
| `notes` | `text` | NULLABLE | Notas |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_suppliers_org` en `organization_id`
- `idx_suppliers_org_name` en `(organization_id, name)`

---

#### 2.25 `purchase_orders`
> Órdenes de compra a proveedores, vinculadas a un pedido (HU-00016).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `po_number` | `integer` | NOT NULL | Consecutivo de OC |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) | Pedido asociado |
| `supplier_id` | `uuid` | NOT NULL, FK → suppliers(id) | Proveedor |
| `status` | `varchar(30)` | NOT NULL DEFAULT 'draft' | Estado: draft, sent, confirmed, partial_received, received, cancelled |
| `currency` | `varchar(3)` | NOT NULL DEFAULT 'COP' | Moneda |
| `trm_applied` | `numeric(10,2)` | NULLABLE | TRM aplicada |
| `subtotal` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Subtotal |
| `tax_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | IVA |
| `total` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Total |
| `expected_delivery_date` | `timestamptz` | NULLABLE | Fecha estimada de entrega del proveedor |
| `actual_delivery_date` | `timestamptz` | NULLABLE | Fecha real de entrega |
| `notes` | `text` | NULLABLE | Observaciones |
| `document_url` | `text` | NULLABLE | URL del documento OC (PDF) |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_purchase_orders_org` en `organization_id`
- `idx_purchase_orders_org_number` UNIQUE en `(organization_id, po_number)`
- `idx_purchase_orders_order` en `order_id`
- `idx_purchase_orders_supplier` en `supplier_id`
- `idx_purchase_orders_status` en `(organization_id, status)`

---

#### 2.26 `purchase_order_items`
> Ítems de una orden de compra.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `purchase_order_id` | `uuid` | NOT NULL, FK → purchase_orders(id) ON DELETE CASCADE | OC padre |
| `order_item_id` | `uuid` | NOT NULL, FK → order_items(id) | Ítem del pedido asociado |
| `product_id` | `uuid` | FK → products(id) | Producto |
| `sku` | `varchar(50)` | NOT NULL | Código/número de parte |
| `description` | `text` | NOT NULL | Descripción |
| `quantity_ordered` | `numeric(10,2)` | NOT NULL | Cantidad ordenada |
| `quantity_received` | `numeric(10,2)` | NOT NULL DEFAULT 0 | Cantidad recibida |
| `unit_cost` | `numeric(15,4)` | NOT NULL | Costo unitario |
| `subtotal` | `numeric(15,2)` | NOT NULL | Subtotal |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'pending' | Estado: pending, partial, received |
| `received_at` | `timestamptz` | NULLABLE | Fecha de recepción |
| `received_by` | `uuid` | FK → auth.users(id) | Quién recibió |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_po_items_po` en `purchase_order_id`
- `idx_po_items_order_item` en `order_item_id`

---

### DOMINIO 7: LOGÍSTICA Y DESPACHOS (2 tablas)

#### 2.27 `shipments`
> Despachos/envíos de mercancía al cliente (HU-00017).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `shipment_number` | `integer` | NOT NULL | Consecutivo de despacho |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) | Pedido asociado |
| `status` | `varchar(30)` | NOT NULL DEFAULT 'preparing' | Estado: preparing, dispatched, in_transit, delivered, returned |
| `dispatch_type` | `varchar(30)` | NOT NULL | Tipo: 'envio', 'retiro', 'mensajeria' |
| `carrier` | `varchar(255)` | NULLABLE | Transportadora/mensajería |
| `tracking_number` | `varchar(100)` | NULLABLE | Número de guía |
| `tracking_url` | `text` | NULLABLE | URL de seguimiento |
| `delivery_address` | `text` | NOT NULL | Dirección de entrega |
| `delivery_city` | `varchar(100)` | NOT NULL | Ciudad |
| `delivery_contact` | `varchar(255)` | NOT NULL | Contacto de recepción |
| `delivery_phone` | `varchar(20)` | NOT NULL | Teléfono |
| `estimated_delivery` | `timestamptz` | NULLABLE | Entrega estimada |
| `actual_delivery` | `timestamptz` | NULLABLE | Entrega real |
| `dispatched_at` | `timestamptz` | NULLABLE | Fecha de despacho |
| `dispatched_by` | `uuid` | FK → auth.users(id) | Quién despachó |
| `received_by_name` | `varchar(255)` | NULLABLE | Nombre de quien recibió |
| `reception_notes` | `text` | NULLABLE | Notas de recepción |
| `proof_of_delivery_url` | `text` | NULLABLE | URL del comprobante de entrega |
| `notes` | `text` | NULLABLE | Observaciones |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_shipments_org` en `organization_id`
- `idx_shipments_org_number` UNIQUE en `(organization_id, shipment_number)`
- `idx_shipments_order` en `order_id`
- `idx_shipments_status` en `(organization_id, status)`
- `idx_shipments_tracking` en `tracking_number`

---

#### 2.28 `shipment_items`
> Ítems incluidos en un despacho (despachos parciales posibles).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `shipment_id` | `uuid` | NOT NULL, FK → shipments(id) ON DELETE CASCADE | Despacho |
| `order_item_id` | `uuid` | NOT NULL, FK → order_items(id) | Ítem del pedido |
| `quantity_shipped` | `numeric(10,2)` | NOT NULL | Cantidad despachada |
| `serial_numbers` | `text[]` | NULLABLE | Números de serie (si aplica) |
| `notes` | `text` | NULLABLE | Notas |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_shipment_items_shipment` en `shipment_id`
- `idx_shipment_items_order_item` en `order_item_id`

---

### DOMINIO 8: FACTURACIÓN (2 tablas)

#### 2.29 `invoices`
> Facturas manuales registradas en el sistema (HU-0008).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `invoice_number` | `varchar(50)` | NOT NULL | Número de factura (externo, del sistema de facturación real) |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) | Pedido asociado |
| `customer_id` | `uuid` | NOT NULL, FK → customers(id) | Cliente |
| `invoice_date` | `date` | NOT NULL | Fecha de factura |
| `due_date` | `date` | NULLABLE | Fecha de vencimiento |
| `currency` | `varchar(3)` | NOT NULL DEFAULT 'COP' | Moneda |
| `subtotal` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Subtotal |
| `tax_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | IVA |
| `total` | `numeric(15,2)` | NOT NULL DEFAULT 0 | Total |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'pending' | Estado: pending, paid, partial, overdue, cancelled |
| `payment_date` | `date` | NULLABLE | Fecha de pago |
| `payment_method` | `varchar(50)` | NULLABLE | Método de pago |
| `payment_reference` | `varchar(100)` | NULLABLE | Referencia de pago |
| `document_url` | `text` | NULLABLE | URL del documento factura |
| `notes` | `text` | NULLABLE | Observaciones |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario que registró |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_invoices_org` en `organization_id`
- `idx_invoices_org_number` UNIQUE en `(organization_id, invoice_number)`
- `idx_invoices_order` en `order_id`
- `idx_invoices_customer` en `customer_id`
- `idx_invoices_status` en `(organization_id, status)`
- `idx_invoices_due_date` en `(organization_id, due_date)` WHERE `status IN ('pending', 'partial')`

---

#### 2.30 `invoice_items`
> Ítems de una factura.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `invoice_id` | `uuid` | NOT NULL, FK → invoices(id) ON DELETE CASCADE | Factura |
| `order_item_id` | `uuid` | FK → order_items(id) | Ítem del pedido origen |
| `sku` | `varchar(50)` | NOT NULL | Código |
| `description` | `text` | NOT NULL | Descripción |
| `quantity` | `numeric(10,2)` | NOT NULL | Cantidad |
| `unit_price` | `numeric(15,4)` | NOT NULL | Precio unitario |
| `subtotal` | `numeric(15,2)` | NOT NULL | Subtotal |
| `tax_amount` | `numeric(15,2)` | NOT NULL DEFAULT 0 | IVA |
| `total` | `numeric(15,2)` | NOT NULL | Total |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_invoice_items_invoice` en `invoice_id`

---

### DOMINIO 9: LICENCIAS E INTANGIBLES (1 tabla)

#### 2.31 `license_records`
> Registro de licencias, intangibles y activaciones (HU-00018).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) | Pedido |
| `order_item_id` | `uuid` | NOT NULL, FK → order_items(id) | Ítem del pedido |
| `product_id` | `uuid` | FK → products(id) | Producto licenciado |
| `license_type` | `varchar(30)` | NOT NULL | Tipo: 'software', 'saas', 'hardware_warranty', 'support', 'subscription' |
| `license_key` | `text` | NULLABLE | Clave de licencia |
| `vendor` | `varchar(255)` | NULLABLE | Fabricante/proveedor |
| `activation_date` | `date` | NULLABLE | Fecha de activación |
| `expiry_date` | `date` | NULLABLE | Fecha de vencimiento |
| `renewal_date` | `date` | NULLABLE | Fecha de renovación |
| `seats` | `integer` | NULLABLE | Número de licencias/puestos |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'pending' | Estado: pending, active, expired, renewed, cancelled |
| `activation_notes` | `text` | NULLABLE | Notas de activación |
| `end_user_name` | `varchar(255)` | NULLABLE | Usuario final |
| `end_user_email` | `varchar(255)` | NULLABLE | Email del usuario final |
| `document_url` | `text` | NULLABLE | URL del certificado/documento |
| `metadata` | `jsonb` | NOT NULL DEFAULT '{}' | Datos adicionales del fabricante |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario creador |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_license_records_org` en `organization_id`
- `idx_license_records_order` en `order_id`
- `idx_license_records_expiry` en `(organization_id, expiry_date)` WHERE `status = 'active'`
- `idx_license_records_renewal` en `(organization_id, renewal_date)` WHERE `status IN ('active', 'expired')`

---

### DOMINIO 10: WHATSAPP INTEGRATION (4 tablas)

#### 2.32 `whatsapp_accounts`
> Cuentas de WhatsApp Business por organización - Embedded Sign-Up SDK (HU-0012).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `waba_id` | `varchar(50)` | NOT NULL | WhatsApp Business Account ID |
| `phone_number_id` | `varchar(50)` | NOT NULL | Phone Number ID de Meta |
| `display_phone` | `varchar(20)` | NOT NULL | Número de teléfono visible |
| `business_name` | `varchar(255)` | NOT NULL | Nombre del negocio en WhatsApp |
| `access_token` | `text` | NOT NULL | Token de acceso (encriptado) |
| `token_expires_at` | `timestamptz` | NULLABLE | Expiración del token |
| `webhook_verify_token` | `varchar(100)` | NOT NULL | Token de verificación del webhook |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'pending' | Estado: pending, active, suspended, disconnected |
| `quality_rating` | `varchar(20)` | NULLABLE | Rating de calidad de Meta |
| `messaging_limit` | `varchar(20)` | NULLABLE | Límite de mensajería |
| `setup_completed_at` | `timestamptz` | NULLABLE | Fecha de completar setup |
| `metadata` | `jsonb` | NOT NULL DEFAULT '{}' | Datos adicionales de Meta |
| `created_by` | `uuid` | FK → auth.users(id) | Usuario que conectó |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_whatsapp_accounts_org` UNIQUE en `organization_id` (1 cuenta por org)
- `idx_whatsapp_accounts_waba` en `waba_id`
- `idx_whatsapp_accounts_phone` en `phone_number_id`

---

#### 2.33 `whatsapp_templates`
> Templates de mensajes aprobados por Meta para el WhatsApp de la organización.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `whatsapp_account_id` | `uuid` | NOT NULL, FK → whatsapp_accounts(id) | Cuenta WA |
| `meta_template_id` | `varchar(100)` | NOT NULL | ID del template en Meta |
| `name` | `varchar(100)` | NOT NULL | Nombre del template |
| `language` | `varchar(10)` | NOT NULL DEFAULT 'es' | Idioma |
| `category` | `varchar(30)` | NOT NULL | Categoría Meta: 'MARKETING', 'UTILITY', 'AUTHENTICATION' |
| `status` | `varchar(20)` | NOT NULL | Estado Meta: 'APPROVED', 'PENDING', 'REJECTED' |
| `components` | `jsonb` | NOT NULL | Componentes del template (header, body, footer, buttons) |
| `purpose` | `varchar(50)` | NULLABLE | Propósito interno: 'welcome', 'lead_capture', 'quote_send', 'order_status', 'follow_up' |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_whatsapp_templates_org` en `organization_id`
- `idx_whatsapp_templates_account` en `whatsapp_account_id`

---

#### 2.34 `whatsapp_conversations`
> Conversaciones de WhatsApp (hilos de chat).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `whatsapp_account_id` | `uuid` | NOT NULL, FK → whatsapp_accounts(id) | Cuenta WA |
| `wa_conversation_id` | `varchar(100)` | NULLABLE | ID de conversación de Meta |
| `customer_phone` | `varchar(20)` | NOT NULL | Teléfono del cliente |
| `customer_name` | `varchar(255)` | NULLABLE | Nombre del cliente |
| `customer_id` | `uuid` | FK → customers(id) | Cliente vinculado (si existe) |
| `lead_id` | `uuid` | FK → leads(id) | Lead generado (si se creó) |
| `assigned_agent_id` | `uuid` | FK → profiles(id) | Agente humano asignado |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'active' | Estado: active, closed, bot, human_takeover |
| `conversation_type` | `varchar(20)` | NOT NULL DEFAULT 'bot' | Tipo: 'bot', 'human', 'mixed' |
| `intent` | `varchar(50)` | NULLABLE | Intención detectada: 'quote_request', 'order_status', 'advisory', 'other' |
| `last_message_at` | `timestamptz` | NULLABLE | Último mensaje |
| `closed_at` | `timestamptz` | NULLABLE | Fecha de cierre |
| `metadata` | `jsonb` | NOT NULL DEFAULT '{}' | Datos adicionales |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_wa_conversations_org` en `organization_id`
- `idx_wa_conversations_phone` en `(organization_id, customer_phone)`
- `idx_wa_conversations_status` en `(organization_id, status)` WHERE `status = 'active'`
- `idx_wa_conversations_agent` en `assigned_agent_id`

---

#### 2.35 `whatsapp_messages`
> Mensajes individuales dentro de una conversación.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `conversation_id` | `uuid` | NOT NULL, FK → whatsapp_conversations(id) ON DELETE CASCADE | Conversación |
| `wa_message_id` | `varchar(100)` | NULLABLE | ID del mensaje en Meta |
| `direction` | `varchar(10)` | NOT NULL | Dirección: 'inbound', 'outbound' |
| `sender_type` | `varchar(10)` | NOT NULL | Tipo: 'customer', 'bot', 'agent' |
| `sender_id` | `uuid` | FK → profiles(id) | Agente que envió (si sender_type='agent') |
| `message_type` | `varchar(20)` | NOT NULL DEFAULT 'text' | Tipo: 'text', 'image', 'document', 'audio', 'video', 'template', 'interactive', 'location' |
| `content` | `text` | NULLABLE | Contenido del mensaje |
| `media_url` | `text` | NULLABLE | URL del media |
| `template_name` | `varchar(100)` | NULLABLE | Nombre del template (si aplica) |
| `template_params` | `jsonb` | NULLABLE | Parámetros del template |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'sent' | Estado de entrega Meta: 'sent', 'delivered', 'read', 'failed' |
| `error_code` | `varchar(20)` | NULLABLE | Código de error Meta |
| `error_message` | `text` | NULLABLE | Mensaje de error |
| `metadata` | `jsonb` | NOT NULL DEFAULT '{}' | Datos adicionales |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha del mensaje |

**Índices:**
- `idx_wa_messages_conversation` en `(conversation_id, created_at DESC)`
- `idx_wa_messages_org` en `(organization_id, created_at DESC)`
- `idx_wa_messages_wa_id` en `wa_message_id` WHERE `wa_message_id IS NOT NULL`

---

### DOMINIO 11: NOTIFICACIONES Y COMUNICACIÓN (3 tablas)

#### 2.36 `notifications`
> Notificaciones internas del sistema - campanita (HU-0002, HU-0009).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `user_id` | `uuid` | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Usuario destinatario |
| `type` | `varchar(50)` | NOT NULL | Tipo: 'lead_assigned', 'quote_approval', 'order_created', 'mention', 'alert', 'system' |
| `title` | `varchar(255)` | NOT NULL | Título breve |
| `message` | `text` | NOT NULL | Contenido del mensaje |
| `action_url` | `text` | NULLABLE | URL de acción (a dónde navegar) |
| `entity_type` | `varchar(50)` | NULLABLE | Entidad relacionada: 'lead', 'quote', 'order', etc. |
| `entity_id` | `uuid` | NULLABLE | ID de la entidad relacionada |
| `is_read` | `boolean` | NOT NULL DEFAULT false | Si fue leída |
| `read_at` | `timestamptz` | NULLABLE | Cuándo se leyó |
| `priority` | `varchar(10)` | NOT NULL DEFAULT 'normal' | Prioridad: 'low', 'normal', 'high', 'urgent' |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_notifications_user_unread` en `(user_id, created_at DESC)` WHERE `is_read = false`
- `idx_notifications_user` en `(user_id, created_at DESC)`
- `idx_notifications_org` en `organization_id`
- `idx_notifications_entity` en `(entity_type, entity_id)`

---

#### 2.37 `comments`
> Observaciones con chat interno y menciones "@" (HU-0001, HU-0003).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `entity_type` | `varchar(50)` | NOT NULL | Entidad: 'lead', 'quote', 'order', 'purchase_order', 'shipment' |
| `entity_id` | `uuid` | NOT NULL | ID de la entidad |
| `author_id` | `uuid` | NOT NULL, FK → profiles(id) | Autor del comentario |
| `content` | `text` | NOT NULL | Contenido del comentario (puede incluir @menciones) |
| `mentions` | `uuid[]` | NULLABLE | Array de user IDs mencionados |
| `parent_id` | `uuid` | FK → comments(id) | Comentario padre (para hilos) |
| `is_internal` | `boolean` | NOT NULL DEFAULT true | Si es interno (no visible al cliente) |
| `attachments` | `jsonb` | NULLABLE | Archivos adjuntos [{url, name, size, type}] |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

**Índices:**
- `idx_comments_entity` en `(entity_type, entity_id, created_at DESC)`
- `idx_comments_author` en `author_id`
- `idx_comments_org` en `organization_id`
- `idx_comments_mentions` GIN en `mentions` -- para buscar menciones por usuario

---

#### 2.38 `email_logs`
> Registro de correos enviados vía SendGrid.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `to_email` | `varchar(255)` | NOT NULL | Email destino |
| `to_name` | `varchar(255)` | NULLABLE | Nombre destino |
| `from_email` | `varchar(255)` | NOT NULL | Email remitente |
| `subject` | `varchar(500)` | NOT NULL | Asunto |
| `template_id` | `varchar(100)` | NULLABLE | Template ID de SendGrid |
| `entity_type` | `varchar(50)` | NULLABLE | Entidad: 'quote', 'proforma', 'order', 'notification' |
| `entity_id` | `uuid` | NULLABLE | ID de la entidad |
| `status` | `varchar(20)` | NOT NULL DEFAULT 'queued' | Estado: 'queued', 'sent', 'delivered', 'opened', 'bounced', 'failed' |
| `sendgrid_message_id` | `varchar(100)` | NULLABLE | Message ID de SendGrid |
| `error_message` | `text` | NULLABLE | Error si falló |
| `metadata` | `jsonb` | NULLABLE | Datos adicionales |
| `sent_at` | `timestamptz` | NULLABLE | Fecha de envío |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_email_logs_org` en `(organization_id, created_at DESC)`
- `idx_email_logs_entity` en `(entity_type, entity_id)`
- `idx_email_logs_status` en `(organization_id, status)`

---

### DOMINIO 12: AUDITORÍA Y CONFIGURACIÓN (4 tablas)

#### 2.39 `audit_logs`
> Registro de auditoría de todas las acciones del sistema.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `user_id` | `uuid` | NOT NULL, FK → auth.users(id) | Usuario que realizó la acción |
| `action` | `varchar(50)` | NOT NULL | Acción: 'create', 'update', 'delete', 'approve', 'reject', 'assign', 'login', 'export' |
| `entity_type` | `varchar(50)` | NOT NULL | Tabla/entidad afectada |
| `entity_id` | `uuid` | NOT NULL | ID del registro afectado |
| `changes` | `jsonb` | NULLABLE | Cambios realizados {field: {old, new}} |
| `ip_address` | `inet` | NULLABLE | IP del usuario |
| `user_agent` | `text` | NULLABLE | User-Agent del navegador |
| `metadata` | `jsonb` | NULLABLE | Datos adicionales |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de la acción |

**Índices:**
- `idx_audit_logs_org_date` en `(organization_id, created_at DESC)`
- `idx_audit_logs_user` en `user_id`
- `idx_audit_logs_entity` en `(entity_type, entity_id)`
- `idx_audit_logs_action` en `(organization_id, action)`

**Nota:** Esta tabla NO tiene RLS para lectura global por admin. Considerar particionamiento por mes para performance.

---

#### 2.40 `rejection_reasons`
> Catálogo de motivos de rechazo configurables (HU-0003).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `entity_type` | `varchar(50)` | NOT NULL | Entidad: 'lead', 'quote', 'order' |
| `label` | `varchar(255)` | NOT NULL | Etiqueta visible |
| `sort_order` | `integer` | NOT NULL DEFAULT 0 | Orden de aparición |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Activo |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |

**Índices:**
- `idx_rejection_reasons_org_entity` en `(organization_id, entity_type)` WHERE `is_active = true`

---

#### 2.41 `consecutive_counters`
> Contadores de consecutivos por organización y tipo de entidad.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `entity_type` | `varchar(50)` | NOT NULL | Tipo: 'lead', 'quote', 'order', 'purchase_order', 'shipment', 'invoice' |
| `prefix` | `varchar(10)` | NULLABLE | Prefijo (ej: 'COT-', 'PED-') |
| `current_value` | `integer` | NOT NULL | Valor actual del consecutivo |
| `start_value` | `integer` | NOT NULL | Valor inicial |
| `increment` | `integer` | NOT NULL DEFAULT 1 | Incremento |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_consecutive_org_entity` UNIQUE en `(organization_id, entity_type)`

**Valores iniciales predefinidos:**
| Entity Type | Start Value | Prefix |
|---|---|---|
| lead | 100 | null |
| quote | 30000 | null |
| order | 1 | null |
| purchase_order | 1 | 'OC-' |
| shipment | 1 | 'DSP-' |

**Función crítica:** `get_next_consecutive(org_id, entity_type)` - Función PostgreSQL con `SELECT FOR UPDATE` para evitar race conditions.

---

#### 2.42 `system_settings`
> Configuraciones del sistema por organización.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `key` | `varchar(100)` | NOT NULL | Clave de configuración |
| `value` | `jsonb` | NOT NULL | Valor |
| `description` | `text` | NULLABLE | Descripción |
| `updated_by` | `uuid` | FK → auth.users(id) | Quién modificó |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_system_settings_org_key` UNIQUE en `(organization_id, key)`

**Configuraciones predefinidas:**
- `trm_auto_fetch` - Si la TRM se obtiene automáticamente
- `lead_auto_assign` - Si los leads se asignan automáticamente
- `max_pending_leads_per_advisor` - Máximo de leads pendientes por asesor (default: 5)
- `quote_validity_days` - Días de validez de cotización (default: 30)
- `quote_expiration_reminder_days` - Días antes de vencimiento para alertar
- `default_tax_pct` - IVA por defecto (default: 19)
- `default_currency` - Moneda por defecto (default: 'COP')
- `sendgrid_api_key` - API Key de SendGrid (encriptada)
- `sendgrid_from_email` - Email remitente
- `company_info` - Datos de la empresa para documentos PDF

---

### DOMINIO 13: TRAZABILIDAD DE PRODUCTO (1 tabla)

#### 2.43 `product_route_events`
> Eventos de la ruta/trazabilidad de un producto desde OC hasta entrega al cliente (HU-00020).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `order_id` | `uuid` | NOT NULL, FK → orders(id) | Pedido |
| `order_item_id` | `uuid` | NOT NULL, FK → order_items(id) | Ítem del pedido |
| `event_type` | `varchar(30)` | NOT NULL | Tipo: 'po_created', 'po_confirmed', 'received_warehouse', 'quality_check', 'dispatched', 'in_transit', 'delivered', 'license_activated', 'returned' |
| `event_date` | `timestamptz` | NOT NULL DEFAULT now() | Fecha del evento |
| `location` | `varchar(255)` | NULLABLE | Ubicación (bodega, ciudad, etc.) |
| `quantity` | `numeric(10,2)` | NULLABLE | Cantidad afectada |
| `performed_by` | `uuid` | FK → auth.users(id) | Quién realizó |
| `reference_type` | `varchar(50)` | NULLABLE | Entidad referencia: 'purchase_order', 'shipment', 'license_record' |
| `reference_id` | `uuid` | NULLABLE | ID de la entidad referencia |
| `notes` | `text` | NULLABLE | Notas |
| `metadata` | `jsonb` | NULLABLE | Datos adicionales |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de registro |

**Índices:**
- `idx_product_route_order_item` en `(order_item_id, event_date)`
- `idx_product_route_order` en `(order_id, event_date)`
- `idx_product_route_org` en `(organization_id, event_date DESC)`

---

### DOMINIO 14: REPORTES Y DASHBOARD (2 tablas)

#### 2.44 `dashboard_widgets`
> Configuración de widgets del dashboard por usuario (HU-0010).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `user_id` | `uuid` | NOT NULL, FK → profiles(id) | Usuario |
| `widget_type` | `varchar(50)` | NOT NULL | Tipo: 'leads_funnel', 'quotes_pipeline', 'orders_status', 'revenue_chart', 'team_performance', 'pending_tasks' |
| `position` | `integer` | NOT NULL DEFAULT 0 | Posición en el dashboard |
| `config` | `jsonb` | NOT NULL DEFAULT '{}' | Configuración del widget (filtros, periodo, etc.) |
| `is_visible` | `boolean` | NOT NULL DEFAULT true | Si está visible |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_dashboard_widgets_user` en `(user_id, position)`

---

#### 2.45 `saved_reports`
> Reportes guardados/favoritos por usuario.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Identificador único |
| `organization_id` | `uuid` | NOT NULL, FK → organizations(id) | Organización |
| `user_id` | `uuid` | NOT NULL, FK → profiles(id) | Usuario creador |
| `name` | `varchar(255)` | NOT NULL | Nombre del reporte |
| `report_type` | `varchar(50)` | NOT NULL | Tipo: 'leads', 'quotes', 'orders', 'revenue', 'performance', 'custom' |
| `filters` | `jsonb` | NOT NULL DEFAULT '{}' | Filtros aplicados |
| `columns` | `jsonb` | NULLABLE | Columnas seleccionadas |
| `is_shared` | `boolean` | NOT NULL DEFAULT false | Compartido con la organización |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Última actualización |

**Índices:**
- `idx_saved_reports_user` en `user_id`
- `idx_saved_reports_org_shared` en `organization_id` WHERE `is_shared = true`

---

## 3. DIAGRAMA ENTIDAD-RELACIÓN (Texto)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ORGANIZATIONS                               │
│  (Tabla raíz - Multi-tenant)                                       │
└─────────────┬───────────────────────────────────────────────────────┘
              │ 1:N
    ┌─────────┼──────────┬──────────┬──────────┬──────────┐
    │         │          │          │          │          │
    ▼         ▼          ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────────┐
│PROFILES││ ROLES  ││CUSTOMERS││PRODUCTS││ LEADS  ││WA_ACCOUNTS │
│        ││        ││         ││        ││        ││            │
└───┬────┘└───┬────┘└───┬─────┘└───┬────┘└───┬────┘└─────┬──────┘
    │         │         │          │         │           │
    │    ┌────┤    ┌────┤     ┌────┤    ┌────┤      ┌────┤
    │    ▼    │    ▼    │     ▼    │    ▼    │      ▼    │
    │ ROLE_   │ CUST_   │  PRODUCT_│ LEAD_   │   WA_     │
    │ PERMS   │ CONTACTS│  CATEG   │ ASSIGN  │   CONVS   │
    │         │         │          │ LOG     │           │
    │    ┌────┤         │     ┌────┤         │      ┌────┤
    │    ▼    │         │     ▼    │         │      ▼
    │ USER_   │         │  MARGIN  │         │   WA_
    │ ROLES   │         │  RULES   │         │   MESSAGES
    │         │         │          │         │
    └────┐    │         │     ┌────┤         │
         │    │         │     ▼    │         │
         │    │         │  TRM_    │         │
         │    │         │  RATES   │         │
         │    │         │          │         │
    ┌────┴────┴─────────┴──────────┴─────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────┐
│                         QUOTES                                  │
│  quote_number starts at 30000                                  │
│  Statuses: draft → offer_created → negotiation → ...          │
└───┬────────────────┬───────────────────────────────────────────┘
    │                │
    ▼                ▼
┌──────────┐   ┌──────────────┐
│QUOTE_ITEMS│  │QUOTE_APPROVALS│
│(sortable) │  │(margin check) │
└──────────┘   └──────────────┘
    │
    │  Quote approved → creates Order
    ▼
┌────────────────────────────────────────────────────────────────┐
│                         ORDERS                                  │
│  Commercial data locked from quote                             │
│  Operational data editable                                     │
│  Statuses: created → payment_pending → ... → completed        │
└───┬──────────┬──────────┬──────────┬───────────────────────────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌──────────────┐
│ORDER_  ││ORDER_  ││ORDER_  ││ORDER_PENDING_│
│ITEMS   ││STATUS_ ││DOCS   ││TASKS         │
│        ││HISTORY │         ││(Traffic Light)│
└───┬────┘└────────┘└────────┘└──────────────┘
    │
    │ Items → split into Purchase Orders
    ▼
┌────────────────────────────────────────────┐
│            PURCHASE_ORDERS                  │
│  Linked to supplier + order                │
└───┬──────────────────────┬─────────────────┘
    │                      │
    ▼                      ▼
┌──────────────┐    ┌──────────┐
│PO_ITEMS      │    │SUPPLIERS │
│(qty tracking)│    │          │
└──────────────┘    └──────────┘
    │
    │ Items received → ready for dispatch
    ▼
┌────────────────────────────────────────────┐
│              SHIPMENTS                      │
│  Tracking numbers, carrier info             │
└───┬────────────────────────────────────────┘
    │
    ▼
┌──────────────┐
│SHIPMENT_ITEMS│
└──────────────┘
    │
    │ Delivered → ready for billing
    ▼
┌────────────────────────────────────────────┐
│              INVOICES                       │
│  Manual registration from external system   │
└───┬────────────────────────────────────────┘
    │
    ▼
┌──────────────┐
│INVOICE_ITEMS │
└──────────────┘

┌──────────────────────────────────────────┐
│           CROSS-CUTTING ENTITIES          │
│                                          │
│  - notifications (bell icon)             │
│  - comments (@mentions, threads)         │
│  - audit_logs (all actions)              │
│  - email_logs (SendGrid)                 │
│  - product_route_events (traceability)   │
│  - license_records (intangibles)         │
│  - dashboard_widgets                     │
│  - saved_reports                         │
│  - consecutive_counters                  │
│  - rejection_reasons                     │
│  - system_settings                       │
└──────────────────────────────────────────┘
```

---

## 4. RELACIONES CLAVE (FK Summary)

| Tabla Origen | FK | Tabla Destino | Tipo | ON DELETE |
|---|---|---|---|---|
| profiles | organization_id | organizations | N:1 | RESTRICT |
| profiles | id | auth.users | 1:1 | CASCADE |
| roles | organization_id | organizations | N:1 | RESTRICT |
| permissions | - | (standalone) | - | - |
| role_permissions | role_id | roles | N:1 | CASCADE |
| role_permissions | permission_id | permissions | N:1 | CASCADE |
| user_roles | user_id | profiles | N:1 | CASCADE |
| user_roles | role_id | roles | N:1 | CASCADE |
| customers | organization_id | organizations | N:1 | RESTRICT |
| customer_contacts | customer_id | customers | N:1 | CASCADE |
| leads | organization_id | organizations | N:1 | RESTRICT |
| leads | assigned_to | profiles | N:1 | SET NULL |
| leads | customer_id | customers | N:1 | SET NULL |
| quotes | lead_id | leads | N:1 | SET NULL |
| quotes | customer_id | customers | N:1 | RESTRICT |
| quotes | advisor_id | profiles | N:1 | RESTRICT |
| quote_items | quote_id | quotes | N:1 | CASCADE |
| quote_items | product_id | products | N:1 | SET NULL |
| quote_approvals | quote_id | quotes | N:1 | CASCADE |
| orders | quote_id | quotes | N:1 | RESTRICT |
| orders | customer_id | customers | N:1 | RESTRICT |
| order_items | order_id | orders | N:1 | CASCADE |
| order_items | quote_item_id | quote_items | N:1 | SET NULL |
| purchase_orders | order_id | orders | N:1 | RESTRICT |
| purchase_orders | supplier_id | suppliers | N:1 | RESTRICT |
| purchase_order_items | purchase_order_id | purchase_orders | N:1 | CASCADE |
| purchase_order_items | order_item_id | order_items | N:1 | RESTRICT |
| shipments | order_id | orders | N:1 | RESTRICT |
| shipment_items | shipment_id | shipments | N:1 | CASCADE |
| shipment_items | order_item_id | order_items | N:1 | RESTRICT |
| invoices | order_id | orders | N:1 | RESTRICT |
| invoices | customer_id | customers | N:1 | RESTRICT |
| invoice_items | invoice_id | invoices | N:1 | CASCADE |
| license_records | order_item_id | order_items | N:1 | RESTRICT |
| whatsapp_accounts | organization_id | organizations | 1:1 | CASCADE |
| whatsapp_conversations | whatsapp_account_id | whatsapp_accounts | N:1 | CASCADE |
| whatsapp_messages | conversation_id | whatsapp_conversations | N:1 | CASCADE |
| notifications | user_id | profiles | N:1 | CASCADE |
| comments | entity_type + entity_id | (polymorphic) | - | - |
| audit_logs | user_id | auth.users | N:1 | SET NULL |
| product_route_events | order_item_id | order_items | N:1 | CASCADE |

---

## 5. FLUJO DE ESTADOS POR ENTIDAD

### 5.1 Lead Status Flow
```
created → pending_assignment → assigned → converted
                                       → rejected
           pending_info ──────────────→ (any above)
```

### 5.2 Quote Status Flow
```
draft → offer_created → negotiation → pending_oc → approved
                      → risk ───────→ pending_oc → approved
                                                 → lost
                      → expired
                      → rejected
```

### 5.3 Order Status Flow
```
created → payment_pending → payment_confirmed → available_for_purchase
                                              → in_purchase → partial_delivery → in_logistics → delivered → invoiced → completed
                         → cancelled
```

### 5.4 Purchase Order Status Flow
```
draft → sent → confirmed → partial_received → received
                                            → cancelled
```

### 5.5 Shipment Status Flow
```
preparing → dispatched → in_transit → delivered
                                    → returned
```

### 5.6 Invoice Status Flow
```
pending → paid
        → partial → paid
        → overdue → paid
        → cancelled
```

---

## 6. FUNCIONES SQL CRÍTICAS PARA EL MODELO

### 6.1 Generación de Consecutivos (Thread-Safe)
```sql
CREATE OR REPLACE FUNCTION get_next_consecutive(
  p_org_id uuid,
  p_entity_type text
) RETURNS integer AS $$
DECLARE
  v_next integer;
BEGIN
  UPDATE consecutive_counters
  SET current_value = current_value + increment,
      updated_at = now()
  WHERE organization_id = p_org_id
    AND entity_type = p_entity_type
  RETURNING current_value INTO v_next;

  IF v_next IS NULL THEN
    RAISE EXCEPTION 'Consecutive counter not found for org % entity %', p_org_id, p_entity_type;
  END IF;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Trigger updated_at
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 6.3 Cálculo de Margen
```sql
CREATE OR REPLACE FUNCTION calculate_quote_margin(
  p_quote_id uuid
) RETURNS numeric AS $$
DECLARE
  v_total_revenue numeric;
  v_total_cost numeric;
  v_margin numeric;
BEGIN
  SELECT
    COALESCE(SUM(qi.subtotal), 0),
    COALESCE(SUM(qi.cost_price * qi.quantity), 0)
  INTO v_total_revenue, v_total_cost
  FROM quote_items qi
  WHERE qi.quote_id = p_quote_id;

  IF v_total_revenue = 0 THEN
    RETURN 0;
  END IF;

  v_margin = ((v_total_revenue - v_total_cost) / v_total_revenue) * 100;
  RETURN ROUND(v_margin, 2);
END;
$$ LANGUAGE plpgsql;
```

### 6.4 Validación de Cupo de Crédito
```sql
CREATE OR REPLACE FUNCTION validate_credit_limit(
  p_customer_id uuid,
  p_amount numeric
) RETURNS jsonb AS $$
DECLARE
  v_customer customers%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF v_customer.is_blocked THEN
    RETURN jsonb_build_object(
      'approved', false,
      'reason', 'Customer blocked: ' || COALESCE(v_customer.block_reason, 'No reason'),
      'credit_limit', v_customer.credit_limit,
      'credit_available', v_customer.credit_available,
      'outstanding_balance', v_customer.outstanding_balance
    );
  END IF;

  IF v_customer.credit_available < p_amount THEN
    RETURN jsonb_build_object(
      'approved', false,
      'reason', 'Insufficient credit',
      'credit_limit', v_customer.credit_limit,
      'credit_available', v_customer.credit_available,
      'amount_requested', p_amount
    );
  END IF;

  RETURN jsonb_build_object(
    'approved', true,
    'credit_limit', v_customer.credit_limit,
    'credit_available', v_customer.credit_available - p_amount,
    'amount_requested', p_amount
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 7. CONSIDERACIONES DE PERFORMANCE

### 7.1 Particionamiento Recomendado
- `audit_logs` → Particionar por rango de `created_at` (mensual)
- `whatsapp_messages` → Particionar por rango de `created_at` (mensual)
- `email_logs` → Particionar por rango de `created_at` (mensual)
- `product_route_events` → Particionar por rango de `created_at` (trimestral)

### 7.2 Índices GIN para búsqueda
- `comments.mentions` → GIN index para buscar @menciones por usuario
- `products.metadata` → GIN index para búsqueda de especificaciones
- `system_settings.value` → GIN index para configuraciones

### 7.3 Materialized Views Sugeridas
- `mv_dashboard_leads_summary` - Resumen de leads por asesor y estado
- `mv_dashboard_quotes_pipeline` - Pipeline de cotizaciones activas
- `mv_dashboard_revenue_monthly` - Ingresos por mes
- `mv_advisor_performance` - Performance por asesor (leads, conversión, revenue)

### 7.4 Estimación de Volumen (>1000 tx/dia/usuario, 50 usuarios)
| Tabla | Registros/mes estimados | Crecimiento anual |
|---|---|---|
| leads | 2,000-5,000 | 24K-60K |
| quotes | 3,000-8,000 | 36K-96K |
| quote_items | 15,000-40,000 | 180K-480K |
| orders | 1,500-4,000 | 18K-48K |
| order_items | 7,500-20,000 | 90K-240K |
| purchase_orders | 1,000-3,000 | 12K-36K |
| shipments | 1,500-4,000 | 18K-48K |
| invoices | 1,500-4,000 | 18K-48K |
| notifications | 50,000-150,000 | 600K-1.8M |
| audit_logs | 100,000-500,000 | 1.2M-6M |
| whatsapp_messages | 20,000-100,000 | 240K-1.2M |
| comments | 10,000-30,000 | 120K-360K |

---

## 8. TRAZABILIDAD HU → TABLAS

| HU | Descripción | Tablas Principales |
|---|---|---|
| HU-0001 | Registro de Leads | leads, customer_contacts, whatsapp_conversations |
| HU-0002 | Asignación de Leads | leads (assigned_to), lead_assignments_log, notifications |
| HU-0003 | Creación de Cotización | quotes, quote_items, products, margin_rules, trm_rates |
| HU-0004 | Validación Cupo Crédito | customers (credit_limit, credit_available, is_blocked) |
| HU-0005 | Aprobación Margen | quote_approvals, margin_rules |
| HU-0006 | Proforma y Envío | quotes (proforma_url, sent_*), email_logs |
| HU-0007 | Panel Pedidos | orders, order_items, order_status_history |
| HU-0008 | Facturación Manual | invoices, invoice_items |
| HU-0009 | Alertas Cotizaciones | quote_follow_ups, notifications |
| HU-0010 | Dashboard/Reportes | dashboard_widgets, saved_reports, (materialized views) |
| HU-0011 | Roles y Permisos | roles, permissions, role_permissions, user_roles, profiles |
| HU-0012 | Bot WhatsApp | whatsapp_accounts, whatsapp_conversations, whatsapp_messages, whatsapp_templates |
| HU-00014 | Creación Pedido | orders, order_items |
| HU-00015 | Detalle/Trazabilidad Pedido | order_status_history, order_documents, comments |
| HU-00016 | Órdenes de Compra | purchase_orders, purchase_order_items, suppliers |
| HU-00017 | Logística/Seguimiento | shipments, shipment_items |
| HU-00018 | Licencias/Intangibles | license_records, order_items (is_license) |
| HU-00019 | Semáforo Operativo | order_pending_tasks (traffic_light) |
| HU-00020 | Ruta de Producto | product_route_events |

---

## 9. VALIDACIONES A NIVEL DE BASE DE DATOS

### 9.1 CHECK Constraints
```sql
-- Leads
ALTER TABLE leads ADD CONSTRAINT chk_lead_status
  CHECK (status IN ('created', 'pending_assignment', 'assigned', 'converted', 'rejected', 'pending_info'));

ALTER TABLE leads ADD CONSTRAINT chk_lead_channel
  CHECK (channel IN ('whatsapp', 'web', 'manual'));

-- Quotes
ALTER TABLE quotes ADD CONSTRAINT chk_quote_status
  CHECK (status IN ('draft', 'offer_created', 'negotiation', 'risk', 'pending_oc', 'approved', 'rejected', 'lost', 'expired'));

ALTER TABLE quotes ADD CONSTRAINT chk_quote_currency
  CHECK (currency IN ('COP', 'USD'));

-- Orders
ALTER TABLE orders ADD CONSTRAINT chk_order_status
  CHECK (status IN ('created', 'payment_pending', 'payment_confirmed', 'available_for_purchase', 'in_purchase', 'partial_delivery', 'in_logistics', 'delivered', 'invoiced', 'completed', 'cancelled'));

-- Traffic Light
ALTER TABLE order_pending_tasks ADD CONSTRAINT chk_traffic_light
  CHECK (traffic_light IN ('green', 'yellow', 'red'));

-- Numeric validations
ALTER TABLE quote_items ADD CONSTRAINT chk_quantity_positive CHECK (quantity > 0);
ALTER TABLE quote_items ADD CONSTRAINT chk_unit_price_non_negative CHECK (unit_price >= 0);
ALTER TABLE customers ADD CONSTRAINT chk_credit_limit_non_negative CHECK (credit_limit >= 0);
```

### 9.2 Unique Constraints Compuestos (Multi-tenant Safety)
```sql
-- Evitar NIT duplicado dentro de una organización
ALTER TABLE customers ADD CONSTRAINT uq_customers_org_nit UNIQUE (organization_id, nit);

-- Evitar email duplicado de lead dentro de una organización
-- (No UNIQUE porque puede haber múltiples leads del mismo email)

-- Consecutivos únicos por organización
ALTER TABLE leads ADD CONSTRAINT uq_leads_org_number UNIQUE (organization_id, lead_number);
ALTER TABLE quotes ADD CONSTRAINT uq_quotes_org_number UNIQUE (organization_id, quote_number);
ALTER TABLE orders ADD CONSTRAINT uq_orders_org_number UNIQUE (organization_id, order_number);
```

---

## 10. RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| **Total de tablas** | 45 |
| **Dominios** | 14 |
| **Tablas de negocio core** | 20 |
| **Tablas de soporte/config** | 12 |
| **Tablas de integración** | 6 |
| **Tablas de auditoría/notificaciones** | 4 |
| **Tablas de reportes** | 3 |
| **Funciones SQL críticas** | 4+ |
| **Materialized Views sugeridas** | 4 |
| **Tablas con particionamiento** | 4 |
| **CHECK constraints** | 10+ |
| **Roles predefinidos** | 12 |
| **Módulos de permisos** | 13 |

### Principios Arquitectónicos Aplicados:
1. **Multi-tenant con organization_id** en todas las tablas de negocio
2. **Soft delete** con `deleted_at` donde aplique
3. **Audit trail** automático vía triggers
4. **Consecutivos thread-safe** con `SELECT FOR UPDATE`
5. **Índices optimizados** para los patrones de acceso más frecuentes
6. **Polimorfismo controlado** para comments, notifications, audit_logs
7. **Sin duplicación de datos** - cotización → pedido hereda datos locked
8. **Validaciones en DB** con CHECK constraints y UNIQUE constraints
9. **Performance-ready** con particionamiento, materialized views, índices parciales
