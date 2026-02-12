# PLAN DE IMPLEMENTACION DETALLADO - Pscomercial-pro

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Cobertura:** 100% de las 19 HUs
**Arquitectura:** 11 FASEs + Documento Maestro
**Agentes:** coordinator, business-analyst, db-integration, fullstack-dev, designer-ux-ui

---

## 1. RESUMEN EJECUTIVO

Este plan cubre la implementacion completa de Pscomercial-pro en **6 sprints** (~12 semanas), garantizando cobertura del 100% de las 19 historias de usuario, respetando toda la arquitectura definida en las 11 FASEs, los flujos de estados, criterios de aceptacion, logica de negocio y matrices de permisos documentadas.

### 1.1 Inventario de HUs

| # | HU | Titulo | Prioridad | Sprint |
|---|-----|--------|-----------|--------|
| 1 | HU-0011 | Roles y Permisos | Critica (Fundacion) | Sprint 0 |
| 2 | HU-0001 | Registro de Leads | Alta | Sprint 1 |
| 3 | HU-0002 | Asignacion de Leads | Alta | Sprint 1 |
| 4 | HU-0003 | Creacion de Cotizacion | Alta | Sprint 1 |
| 5 | HU-0004 | Bloqueo de Cartera (MVP manual) | Alta | Sprint 1 |
| 6 | HU-0005 | Aprobacion de Margen | Alta | Sprint 2 |
| 7 | HU-0006 | Proforma y Envio | Alta | Sprint 2 |
| 8 | HU-00014 | Creacion de Pedido (Pedidos 1) | Alta | Sprint 2 |
| 9 | HU-0007 | Panel Principal Pedidos | Alta | Sprint 3 |
| 10 | HU-00015 | Detalle y Trazabilidad Pedido | Alta | Sprint 3 |
| 11 | HU-00016 | Ordenes de Compra | Alta | Sprint 3 |
| 12 | HU-00017 | Logistica (Pedidos 2) | Alta | Sprint 3 |
| 13 | HU-00018 | Licencias e Intangibles | Media | Sprint 3 |
| 14 | HU-0008 | Facturacion | Alta | Sprint 3 |
| 15 | HU-00019 | Semaforo Visual Operativo | Alta | Sprint 4 |
| 16 | HU-00020 | Trazabilidad de Producto | Media | Sprint 4 |
| 17 | HU-0009 | Alertas y Seguimiento | Alta | Sprint 4 |
| 18 | HU-0010 | Reportes y Dashboard | Media | Sprint 4 |
| 19 | HU-0012 | WhatsApp Bot | Media | Sprint 5 |

### 1.2 Grafo de Dependencias

```
HU-0011 (Fundacion: Roles/Permisos)
    |
    +---> HU-0001 (Leads) ---> HU-0002 (Asignacion)
    |                               |
    |                               v
    |                          HU-0003 (Cotizacion) ---> HU-0004 (Bloqueo Cartera)
    |                               |                         |
    |                               v                         v
    |                          HU-0005 (Margen) ---------> HU-0006 (Proforma)
    |                                                         |
    |                                                         v
    |                                                    HU-00014 (Pedido)
    |                                                    /    |    \
    |                                                   /     |     \
    |                                                  v      v      v
    |                                          HU-00016  HU-00017  HU-00018
    |                                          (OC)     (Logist)  (Licencias)
    |                                                  \   |   /
    |                                                   v  v  v
    |                                                  HU-0008 (Facturacion)
    |                                                      |
    +---> HU-0007 (Panel Principal) <--------- depende de HU-00014
    +---> HU-00015 (Detalle Pedido) <--------- depende de HU-00014 + downstream
    +---> HU-00019 (Semaforo) <--------------- depende de HU-00014
    +---> HU-00020 (Trazabilidad Prod) <------ depende de todos los modulos
    +---> HU-0009 (Alertas) <----------------- cross-cutting, todos los modulos
    +---> HU-0010 (Reportes) <---------------- cross-cutting, todos los modulos
    +---> HU-0012 (WhatsApp) <---------------- depende de HU-0001
```

---

## 2. SPRINT 0: FUNDACION (2 semanas)

### 2.1 Objetivo
Establecer la infraestructura base: monorepo, base de datos completa (45 tablas), autenticacion cookie-based, RBAC funcional, layout base y seed data.

### 2.2 HUs Cubiertas
- **HU-0011** (Roles y Permisos) - Parcial: infraestructura RBAC

### 2.3 Tareas Detalladas

#### TAREA 0.1: Setup Monorepo y Proyecto
**Agente:** fullstack-dev
**Arquitectura:** FASE-05 (Frontend), DOCUMENTO-MAESTRO sec. 2

| # | Subtarea | Detalle |
|---|----------|---------|
| 0.1.1 | Inicializar Turborepo + PNPM workspaces | `apps/web` (Next.js 15.5.9), `packages/ui`, `packages/supabase`, `packages/features`, `packages/shared` |
| 0.1.2 | Configurar TypeScript 5.9.3 strict | `tsconfig.json` base + extends por workspace |
| 0.1.3 | Configurar TailwindCSS 4 + globals.css | Design tokens del Template Figma: Primary #00C8CF (Cyan), Accent #161052 (Navy), Secondary #f5f5f7, dark mode completo, gradientes (brand/hero/accent/soft), glass morphism, sombras custom (subtle/medium/elevated) |
| 0.1.4 | Instalar Shadcn/UI (47+ componentes) + Radix UI | Componentes base: Button, Input, Select, Dialog, Sheet, Table, Tabs, Card, Badge, Avatar, Tooltip, etc. Instalar sonner (toasts), Framer Motion (motion/react) |
| 0.1.5 | Configurar ESLint + Prettier | Reglas Next.js + TypeScript strict |
| 0.1.6 | Variables de entorno | `.env.local`, `.env.example` con todas las vars del Documento Maestro sec. 18 |

#### TAREA 0.2: Base de Datos Completa (DDL)
**Agente:** db-integration
**Arquitectura:** FASE-01 (Modelo de Datos), FASE-04 (RLS)

| # | Subtarea | Detalle |
|---|----------|---------|
| 0.2.1 | DDL Dominio 1: Organizaciones y Usuarios | 6 tablas: `organizations`, `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles` |
| 0.2.2 | DDL Dominio 2: Clientes y Leads | 4 tablas: `customers`, `customer_contacts`, `leads`, `lead_contacts` |
| 0.2.3 | DDL Dominio 3: Productos y Catalogo | 4 tablas: `product_categories`, `products`, `margin_rules`, `trm_history` |
| 0.2.4 | DDL Dominio 4: Cotizaciones | 4 tablas: `quotes`, `quote_items`, `quote_versions`, `margin_approvals` |
| 0.2.5 | DDL Dominio 5: Pedidos | 5 tablas: `orders`, `order_items`, `order_status_history`, `tasks`, `task_assignments` |
| 0.2.6 | DDL Dominio 6: Compras | 3 tablas: `suppliers`, `purchase_orders`, `po_items` |
| 0.2.7 | DDL Dominio 7: Logistica | 2 tablas: `shipments`, `shipment_items` |
| 0.2.8 | DDL Dominio 8: Facturacion | 2 tablas: `invoices`, `invoice_items` |
| 0.2.9 | DDL Dominio 9: Licencias | 1 tabla: `license_records` |
| 0.2.10 | DDL Dominio 10: WhatsApp | 4 tablas: `whatsapp_accounts`, `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_templates` |
| 0.2.11 | DDL Dominio 11: Notificaciones | 3 tablas: `notifications`, `notification_preferences`, `comments` |
| 0.2.12 | DDL Dominio 12: Auditoria y Config | 4 tablas: `audit_logs`, `system_settings`, `email_templates`, `email_logs` |
| 0.2.13 | DDL Dominio 13-14: Vistas y Reportes | `order_traceability` (vista), `report_definitions`, `saved_filters` |
| 0.2.14 | Indices compuestos y parciales | Segun FASE-01 sec. 1.3 y FASE-11 |
| 0.2.15 | Triggers estandar | `set_updated_at()`, `set_created_by()`, `audit_trail_trigger()` en 17 tablas |

#### TAREA 0.3: RLS Policies (Tenant Isolation)
**Agente:** db-integration
**Arquitectura:** FASE-04 (RLS Supabase)

| # | Subtarea | Detalle |
|---|----------|---------|
| 0.3.1 | Helper function `get_user_org_id()` | Extrae organization_id del JWT claim |
| 0.3.2 | Helper function `get_user_data_scope()` | Retorna 'all' o 'own' segun rol |
| 0.3.3 | RLS SELECT policies | ~45 tablas: `organization_id = get_user_org_id()` + data scope |
| 0.3.4 | RLS INSERT policies | Validar que `organization_id` del nuevo registro = org del usuario |
| 0.3.5 | RLS UPDATE/DELETE policies | Mismo tenant + restricciones adicionales por tabla |
| 0.3.6 | Habilitar RLS en TODAS las tablas | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |

#### TAREA 0.4: Autenticacion Cookie-Based
**Agente:** fullstack-dev
**Arquitectura:** FASE-03 (Backend/Middleware)

| # | Subtarea | Detalle |
|---|----------|---------|
| 0.4.1 | Instalar `@supabase/ssr` | Cliente browser + servidor + service role |
| 0.4.2 | Crear 3 clientes Supabase | `createBrowserClient()`, `createServerClient()`, `createServiceClient()` en `packages/supabase` |
| 0.4.3 | Middleware Edge (`middleware.ts`) | Solo verifica sesion activa, redirige a `/login` si no hay cookie |
| 0.4.4 | Pagina de Login | Email/password, recuperar contrasena |
| 0.4.5 | Auth callback (`/api/auth/callback`) | Manejo de tokens OAuth + cookie exchange |
| 0.4.6 | Layout protegido `(dashboard)` | Wrapper con verificacion de sesion server-side |

#### TAREA 0.5: Sistema RBAC Completo (HU-0011)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui
**HU:** HU-0011 (Creacion y Gestion de Roles y Permisos)
**Arquitectura:** FASE-02 (RBAC)

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 0.5.1 | RPC `get_user_permissions(user_id)` | db-integration | Retorna array de slugs de permisos consolidados |
| 0.5.2 | RPC `has_permission(user_id, permission)` | db-integration | Verificacion rapida booleana |
| 0.5.3 | Seed data: 12 roles + ~65 permisos + role_permissions | db-integration | Segun matriz FASE-02 sec. 3 |
| 0.5.4 | `PermissionProvider` (React Context) | fullstack-dev | Carga permisos al iniciar sesion, cachea en memoria |
| 0.5.5 | `usePermissions()` hook | fullstack-dev | `can('quotes:create')`, `canAny(...)`, `canAll(...)` |
| 0.5.6 | `<PermissionGate>` componente | fullstack-dev | Wrapper que oculta/muestra UI segun permiso |
| 0.5.7 | `checkPermission()` en API Routes | fullstack-dev | Middleware de autorizacion server-side |
| 0.5.8 | `withPermission()` HOF para API Routes | fullstack-dev | Decorator que envuelve handler con check de permiso |
| 0.5.9 | Panel Admin: CRUD Roles | fullstack-dev + designer-ux-ui | Crear, editar, eliminar roles; asignar permisos por modulo |
| 0.5.10 | Panel Admin: Gestion Usuarios | fullstack-dev + designer-ux-ui | Lista usuarios, asignar/remover roles, activar/desactivar |
| 0.5.11 | Panel Admin: Bitacora/Audit Log | fullstack-dev + designer-ux-ui | Vista con filtros: entidad, usuario, accion, rango fechas |
| 0.5.12 | Tests: verificar acceso denegado | fullstack-dev | "Acceso denegado. No cuenta con permisos para esta accion." |

**Criterios de Aceptacion HU-0011:**
- [x] CA-1: Crear, editar y eliminar roles
- [x] CA-2: Permisos configurables por modulo y accion
- [x] CA-3: Roles inactivos no asignables
- [x] CA-4: Usuario hereda permisos del rol asignado
- [x] CA-5: Usuario desactivado pierde acceso inmediato
- [x] CA-6: Validacion de permisos antes de ejecutar cualquier accion
- [x] CA-7: Bitacora con trazabilidad completa

**Reglas de Negocio HU-0011:**
- Multiples roles por usuario (permisos se suman sin duplicados)
- Roles inactivos no se pueden asignar a nuevos usuarios
- Mensaje de acceso denegado: "Acceso denegado. No cuenta con permisos para esta accion."
- Auditoria: admin, accion, fecha, hora, descripcion del cambio

#### TAREA 0.6: Layout Base, Navegacion y Design System (del Template Figma)
**Agente:** designer-ux-ui + fullstack-dev
**Arquitectura:** FASE-05 (Frontend) + Template Figma (Fuente de Verdad Visual)

| # | Subtarea | Detalle |
|---|----------|---------|
| 0.6.1 | Top Navigation Bar horizontal | 8 modulos (Dashboard, Leads, Cotizaciones, Pedidos, Financiero, Formatos, WhatsApp, Admin), filtrados por permisos, fixed top z-40, backdrop-blur |
| 0.6.2 | Mobile Bottom Tab Bar | Los 8 items como tabs con icono (h-4 w-4) + label (text-[8px]), md:hidden |
| 0.6.3 | NotificationBell con Sheet panel | Campanita con badge animate-pulse, Sheet lateral (NO dropdown), filtro pendientes/vistas |
| 0.6.4 | ThemeProvider (dark mode + gradients toggle) | Light/dark toggle (Moon/Sun en header), gradients on/off, persistencia localStorage |
| 0.6.5 | Layout responsive completo | Mobile: pt-36 (header+tabs), Desktop: md:pt-20, max-w-[1400px] mx-auto |
| 0.6.6 | Tema PROSUMINISTROS (del Template Figma) | globals.css con variables: Primary #00C8CF, Accent #161052, 4 gradientes, dark mode completo, glass morphism, sombras custom |
| 0.6.7 | Framer Motion setup | Patron base: motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} |
| 0.6.8 | Sonner (toasts) setup | Toaster en root layout, toast.success/error/info |
| 0.6.9 | Componentes compartidos base | DataTable, FormField, StatusBadge, ConfirmDialog, LoadingSkeleton, EmptyState, KanbanBoard |
| 0.6.10 | Header actions | Avatar (h-7 w-7) con nombre/rol, separador border-l, dark mode toggle |

#### TAREA 0.7: Seed Data Inicial
**Agente:** db-integration
**Fuente:** CONSOLIDADO-DOCUMENTOS-GENERALES.md

| # | Subtarea | Detalle |
|---|----------|---------|
| 0.7.1 | Organizacion demo | PROSUMINISTROS con NIT, logo, settings |
| 0.7.2 | Usuario Super Admin | admin@prosuministros.com |
| 0.7.3 | Catalogos: formas de pago | 7 tipos: Anticipado, Contra entrega, Credito 8/15/30/45/60 dias |
| 0.7.4 | Catalogos: monedas | COP, USD |
| 0.7.5 | Catalogos: vias de contacto | 8 canales segun CONSOLIDADO sec. 1.3 |
| 0.7.6 | Catalogos: verticales | 5: Accesorios, Hardware, Otros, Servicios, Software |
| 0.7.7 | Catalogos: margenes minimos | Tabla cruzada vertical x forma_pago segun CONSOLIDADO sec. 1.5 |
| 0.7.8 | Catalogos: impuestos | 0%, 5%, 19% |
| 0.7.9 | Consecutivos iniciales | Leads: 100, Cotizaciones: 30000, Pedidos: 20000 |
| 0.7.10 | Departamentos Colombia | 33 departamentos con ciudades |

### 2.4 Entregables Sprint 0
- Monorepo funcional con todos los workspaces
- 45 tablas creadas con indices, RLS y triggers
- Login/logout funcional con cookies
- RBAC: 12 roles, ~65 permisos, panel admin basico
- Layout con top navigation bar (8 modulos) + mobile bottom tabs
- Dark mode funcional (ThemeProvider con toggle Moon/Sun)
- Framer Motion configurado con patron base de animacion
- Sonner (toasts) configurado en root layout
- Tema PROSUMINISTROS: cyan #00C8CF + navy #161052, gradientes, glass, sombras
- Seed data completa con catalogos

### 2.5 Validacion de Arquitectura Sprint 0
| FASE | Cobertura | Validacion |
|------|-----------|------------|
| FASE-01 | 100% DDL | 45 tablas, todos los indices |
| FASE-02 | 100% RBAC | 12 roles, 65 permisos, 3 capas seguridad |
| FASE-03 | 80% | Auth + middleware + 3 clientes Supabase |
| FASE-04 | 100% RLS | Policies de tenant isolation |
| FASE-05 | 30% | Estructura monorepo + layout base |
| FASE-10 | 20% | Audit trail trigger en 17 tablas |
| FASE-11 | 10% | Indices, estructura para performance |

---

## 3. SPRINT 1: CORE COMERCIAL - LEADS Y COTIZACIONES (2.5 semanas)

### 3.1 Objetivo
Pipeline comercial completo: leads (Kanban), clientes, productos, cotizaciones con calculo de margen, TRM y duplicacion.

### 3.2 HUs Cubiertas
- **HU-0001** (Registro de Leads) - Completa
- **HU-0002** (Asignacion de Leads) - Completa
- **HU-0003** (Creacion de Cotizacion) - Completa
- **HU-0004** (Bloqueo de Cartera MVP) - Completa

### 3.3 Tareas Detalladas

#### TAREA 1.1: Modulo Clientes (Prerequisito)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui
**Fuente:** CONSOLIDADO sec. 2 (Creacion de Cliente - Matriz de Permisos)

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 1.1.1 | API CRUD `/api/customers` | fullstack-dev | GET (listado paginado), POST (crear), PUT (editar) |
| 1.1.2 | API `/api/customers/[id]/contacts` | fullstack-dev | CRUD contactos multiples por cliente |
| 1.1.3 | Validacion NIT duplicado | db-integration | CHECK UNIQUE `(organization_id, nit)` + validacion en API |
| 1.1.4 | Formulario Crear/Editar Cliente | fullstack-dev + designer-ux-ui | Campos segun CONSOLIDADO sec. 2 |
| 1.1.5 | Permisos por campo (Matriz) | fullstack-dev | Implementar restricciones campo-a-campo segun la matriz |
| 1.1.6 | Tabla de clientes con busqueda | designer-ux-ui + fullstack-dev | TanStack Table, server-side pagination, search by NIT/razon social |

**Reglas de Negocio Clientes (CONSOLIDADO sec. 2):**
- NIT con digito de verificacion: obligatorio
- Forma de pago default: ANTICIPADO (cuando comercial crea)
- Solo Gerencia General y Financiera pueden cambiar forma de pago
- Correo de facturacion: solo Financiera puede crear/modificar
- Comercial asignado: solo Gerencia puede modificar
- Contactos multiples: nombre, telefono, correo (Gerencia + Ger. Comercial + Comerciales)

#### TAREA 1.2: Modulo Productos (Prerequisito)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui
**Fuente:** CONSOLIDADO sec. 3 (Creacion de Producto - Matriz de Permisos)

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 1.2.1 | API CRUD `/api/products` | fullstack-dev | GET paginado, POST, PUT |
| 1.2.2 | Categorias/Verticales | db-integration | 5 verticales + subverticales si aplica |
| 1.2.3 | Tabla margenes minimos (`margin_rules`) | db-integration | Seed: 7 formas_pago x 5 verticales = 35 reglas |
| 1.2.4 | API TRM `/api/trm` | fullstack-dev | Consulta TRM vigente de datos.gov.co o cache |
| 1.2.5 | RPC `get_current_trm()` | db-integration | Cached, con fallback a ultimo valor conocido |
| 1.2.6 | Formulario Producto | fullstack-dev + designer-ux-ui | N/parte, nombre, vertical, marca, impuesto |
| 1.2.7 | Permisos por campo (Matriz) | fullstack-dev | Comercial: solo crear n/parte y nombre; Gerencia: todo |

**Reglas de Negocio Productos (CONSOLIDADO sec. 3):**
- Numero de parte: obligatorio, unico por organizacion
- Vertical y Marca: solo Gerencia General puede asignar/modificar
- Impuesto (0%/5%/19%): solo Gerencia General puede asignar/modificar
- Comerciales y Gerencia Comercial: solo pueden crear (n/parte + nombre)

#### TAREA 1.3: Modulo Leads (HU-0001 + HU-0002)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui
**HU:** HU-0001 (Registro) + HU-0002 (Asignacion)

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 1.3.1 | API CRUD `/api/leads` | fullstack-dev | GET paginado + filtros, POST, PUT |
| 1.3.2 | RPC `generate_consecutive(org_id, 'lead')` | db-integration | Thread-safe, inicia en 100 |
| 1.3.3 | Validacion duplicados por NIT y email | db-integration + fullstack-dev | Verificar en API antes de insertar |
| 1.3.4 | Vista Kanban de Leads | designer-ux-ui + fullstack-dev | Columnas: Creado, Pendiente, Convertido |
| 1.3.5 | Vista Tabla alternativa | designer-ux-ui + fullstack-dev | TanStack Table con filtros y busqueda |
| 1.3.6 | Formulario Crear Lead (manual) | fullstack-dev + designer-ux-ui | Campos segun CONSOLIDADO sec. 4 |
| 1.3.7 | RPC `auto_assign_lead(org_id, lead_id)` | db-integration | Asignacion balanceada, max 5 pendientes/asesor |
| 1.3.8 | Notificacion al asesor asignado | fullstack-dev | In-app (campanita) + email SendGrid |
| 1.3.9 | Reasignacion automatica si asesor se desactiva | db-integration | Trigger: reasignar al pool general |
| 1.3.10 | Campo observaciones con @menciones | fullstack-dev + designer-ux-ui | Chat interno, trazabilidad, notificacion a mencionados |
| 1.3.11 | Alerta visual por lead sin avance | fullstack-dev | Si lead > 1 dia sin convertir a cotizacion = alerta |
| 1.3.12 | Contactos multiples bajo misma razon social | db-integration + fullstack-dev | Jerarquia: empresa -> contactos |

**Estados de Lead (HU-0001 CA-11):**
```
Creado --> Pendiente --> Convertido
                    \-> Rechazado
```

**Criterios de Aceptacion HU-0001:**
- [x] CA-1: Creacion automatica con campos minimos (Excel "Proceso Comercial" pestana "Lead")
- [x] CA-2: Consecutivo unico auto-generado desde #100
- [x] CA-3: Validacion campos obligatorios antes de guardar
- [x] CA-4: Consultables por usuario con permisos
- [x] CA-5: Registrar canal, fecha, hora, usuario creador
- [x] CA-6: Validar duplicidad por NIT y email
- [x] CA-7: Alertas visuales para leads sin avance
- [x] CA-8: Creacion manual habilitada
- [x] CA-9: Observaciones con @menciones y notificacion en campanita
- [x] CA-10: Filtrar notificaciones entre "pendientes" y "vistas"
- [x] CA-11: Estados: Creado / Pendiente / Convertido
- [x] CA-12: Vista Kanban
- [x] CA-13: Jerarquia razon social -> multiples contactos

**Criterios de Aceptacion HU-0002:**
- [x] CA-1: Asignacion automatica solo a asesores activos
- [x] CA-2: Reasignacion solo para usuarios con permisos admin
- [x] CA-3: Registro en bitacora con fecha, hora, usuario
- [x] CA-4: Notificacion al asesor (panel y/o correo)
- [x] CA-5: Un lead = un asesor a la vez
- [x] CA-6: Cambio de estado automatico (Asignado)
- [x] CA-7: Asignacion equitativa, max 5 pendientes por asesor (configurable)
- [x] CA-8: Re-asignacion automatica si asesor se da de baja

#### TAREA 1.4: Modulo Cotizaciones (HU-0003 + HU-0004)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui
**HU:** HU-0003 (Creacion) + HU-0004 (Bloqueo Cartera)

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 1.4.1 | API CRUD `/api/quotes` | fullstack-dev | GET paginado, POST (crear desde lead), PUT |
| 1.4.2 | RPC `create_quote_from_lead(lead_id)` | db-integration | Crea cotizacion con datos del lead, cambia lead a Convertido |
| 1.4.3 | RPC `generate_consecutive(org_id, 'quote')` | db-integration | Inicia en #30000 |
| 1.4.4 | RPC `calculate_quote_totals(quote_id)` | db-integration | Recalcula subtotal, IVA, total, margen |
| 1.4.5 | Trigger `update_quote_totals` | db-integration | Se ejecuta en INSERT/UPDATE/DELETE de quote_items |
| 1.4.6 | Formulario Cotizacion | fullstack-dev + designer-ux-ui | Campos segun CONSOLIDADO sec. 5 |
| 1.4.7 | Tabla de items editable | designer-ux-ui + fullstack-dev | Agregar/eliminar/reordenar items, calculo en vivo |
| 1.4.8 | Calculo TRM en vivo | fullstack-dev | Si costo en USD: costo_final = costo * TRM del dia |
| 1.4.9 | Calculo de margen en vivo | fullstack-dev | Formula: `1 - (Total costo / Total venta)`, incluye transporte y descuentos |
| 1.4.10 | Campo transporte (no visible en PDF) | fullstack-dev | Pregunta si incluido en items; si no, campo separado |
| 1.4.11 | Duplicar version de cotizacion | fullstack-dev | Seleccionar items a copiar, crear nueva version |
| 1.4.12 | Liquidacion visible | designer-ux-ui + fullstack-dev | Total venta antes IVA, Total costo, Utilidad, Margen general |
| 1.4.13 | Campo bloqueo de cartera (HU-0004) | fullstack-dev | Si/No, solo Financiera edita, todos ven |
| 1.4.14 | Bloqueo generacion de pedido si cartera=Si | fullstack-dev | Validacion en API: no crear pedido si bloqueo activo |
| 1.4.15 | Validacion lead antes de crear cotizacion | fullstack-dev | Lead valido = crear; rechazado = registrar motivo, usuario, fecha |
| 1.4.16 | Fechas de cierre | fullstack-dev | Mes de cierre, Semana de cierre, Mes de facturacion |
| 1.4.17 | Links adjuntos y datos adjuntos | fullstack-dev | Upload a Supabase Storage (bucket: documents) |
| 1.4.18 | Permisos por campo (Matriz CONSOLIDADO sec. 5.1) | fullstack-dev | Implementar restricciones campo-a-campo |

**Estados de Cotizacion (HU-0003 CA-7 + CONSOLIDADO sec. 5.5):**
```
Creacion de oferta --> Negociacion --> Pendiente OC --> Ganada (-> genera pedido)
                   \-> Riesgo ------/              \-> Perdida
```

**Criterios de Aceptacion HU-0003:**
- [x] CA-1: Validar lead antes de crear cotizacion
- [x] CA-2: Leads rechazados registran motivo, usuario, fecha
- [x] CA-3: TRM vigente y margenes aplicados automaticamente
- [x] CA-4: Margen < minimo requiere aprobacion Gerencia
- [x] CA-5: Campos obligatorios: cliente, producto, condiciones financieras
- [x] CA-6: Transporte no visible para cliente pero registrado
- [x] CA-7: Estados: Creacion oferta / Negociacion / Riesgo / Pendiente OC / Perdida
- [x] CA-8: Consecutivo unico, fecha y hora

**Criterios de Aceptacion HU-0004:**
- [x] CA-1: Campo visible para todos, editable solo por Financiera
- [x] CA-2: Sin validacion automatica (MVP manual)
- [x] CA-3: Si "Si" -> pedido no puede generarse
- [x] CA-4: Si "No" -> flujo normal
- [x] CA-5: Bitacora: quien cambio, cuando, valor anterior/nuevo
- [x] CA-6: Mensaje de bloqueo claro y visible

### 3.4 Validacion de Arquitectura Sprint 1
| FASE | Cobertura Adicional |
|------|---------------------|
| FASE-01 | Dominios 2, 3, 4 en uso activo |
| FASE-05 | Modulos Leads, Clientes, Productos, Cotizaciones |
| FASE-06 | RPCs: generate_consecutive, auto_assign_lead, create_quote_from_lead, calculate_quote_totals |
| FASE-10 | Notificaciones in-app para asignacion de leads |
| FASE-11 | TanStack Query con staleTime por entidad |

---

## 4. SPRINT 2: PIPELINE COMPLETO - MARGEN, PROFORMA, PEDIDO (2.5 semanas)

### 4.1 Objetivo
Completar el flujo lead-to-order: aprobacion de margen, generacion de proforma/PDF, envio al cliente, y creacion de pedido desde cotizacion aprobada.

### 4.2 HUs Cubiertas
- **HU-0005** (Aprobacion de Margen) - Completa
- **HU-0006** (Proforma y Envio) - Completa
- **HU-00014** (Creacion de Pedido - Pedidos 1) - Completa

### 4.3 Tareas Detalladas

#### TAREA 2.1: Aprobacion de Margen (HU-0005)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 2.1.1 | RPC `request_margin_approval(quote_id)` | db-integration | Crea registro en margin_approvals, cambia estado cotizacion |
| 2.1.2 | API `/api/quotes/[id]/approve-margin` | fullstack-dev | POST: aprobar/rechazar con comentario |
| 2.1.3 | Comparacion automatica con margin_rules | db-integration | Al guardar/actualizar cotizacion, verificar margen vs minimo |
| 2.1.4 | Modal de aprobacion (Gerencia) | designer-ux-ui + fullstack-dev | Aprobar con margen opcional, rechazar con motivo |
| 2.1.5 | Notificacion a asesor y gerencia | fullstack-dev | In-app + email cuando se solicita y cuando se resuelve |
| 2.1.6 | Bloqueo de envio si margen bajo sin aprobacion | fullstack-dev | Validacion en API: no enviar si pendiente aprobacion |

**Reglas de Negocio HU-0005:**
- Formula margen: `1 - (Total costo / Total venta)`
- Total costo incluye: transporte, descuentos, TRM del dia
- Comparacion automatica al guardar/actualizar cotizacion
- Margen < minimo -> bloquea envio, genera solicitud de aprobacion
- Gerencia puede aprobar con margen inferior al minimo (campo opcional)
- Observaciones: "aprobado bajo menor margen" + valor del margen
- Rechazo incluye comentario/razon al asesor
- Margen >= minimo -> aprobacion automatica (sin intervencion)

**Criterios de Aceptacion HU-0005:**
- [x] CA-1: Calcular margen en todas las cotizaciones
- [x] CA-2: Comparacion automatica al guardar/actualizar
- [x] CA-3: Margen < minimo bloquea envio y solicita aprobacion
- [x] CA-4: Solo Gerencia o Finanzas aprueban/rechazan
- [x] CA-5: Registro en bitacora con trazabilidad completa
- [x] CA-6: Notificacion al asesor y gerencia
- [x] CA-7: Cotizacion no se envia sin aprobacion cuando margen es bajo

#### TAREA 2.2: Generacion PDF y Proforma (HU-0006)
**Agentes:** fullstack-dev + designer-ux-ui
**Arquitectura:** FASE-09 (Generacion PDF)

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 2.2.1 | Instalar `@react-pdf/renderer` | fullstack-dev | ~2MB, compatible Vercel serverless |
| 2.2.2 | Template QuotePDFTemplate | fullstack-dev + designer-ux-ui | Segun FASE-09 sec. 3.1 + Template Figma cotizacion-formato.tsx: header, cliente, tabla items, totales, condiciones. Colores: border #00C8CF, bg #E6F9FA, headers cyan. Formato A4 (210x297mm), margins 15mm, inline styles (NO Tailwind) |
| 2.2.3 | Template ProformaPDFTemplate | fullstack-dev + designer-ux-ui | Igual que cotizacion + datos bancarios, sin precios internos. Mismos colores cyan #00C8CF |
| 2.2.4 | API `/api/pdf/quote/[id]` | fullstack-dev | Fetch datos -> render PDF -> upload Storage -> retornar URL |
| 2.2.5 | Upload a Supabase Storage | fullstack-dev | Bucket: `generated-pdfs`, path: `{org_id}/quotes/{filename}` |
| 2.2.6 | Signed URL con expiracion 7 dias | fullstack-dev | Para envio al cliente |
| 2.2.7 | Boton "Generar PDF" en cotizacion | designer-ux-ui + fullstack-dev | Preview en modal + descarga |
| 2.2.8 | Envio por email (SendGrid) | fullstack-dev | Template transaccional con PDF adjunto |
| 2.2.9 | Recordatorio automatico (8 dias) | fullstack-dev | Vercel Cron o pg_cron: verificar cotizaciones enviadas sin respuesta |
| 2.2.10 | Estados de envio y respuesta | fullstack-dev | Enviada, Aceptada por cliente, Rechazada, Pendiente de ajustes |
| 2.2.11 | Determinacion cotizacion vs proforma | fullstack-dev | Si cliente tiene credito -> cotizacion; sin credito -> proforma |

**Reglas de Negocio HU-0006:**
- **Sin credito:** Asesor solicita proforma -> Financiera genera PDF -> notifica asesor -> envio por email/chatbot
- **Con credito:** Asesor envia cotizacion directamente
- PDF contiene: datos cliente, productos, cantidades, valores, condiciones pago, vigencia, notas
- Transporte NO visible en PDF para cliente
- Recordatorio automatico a los 8 dias sin respuesta
- Respuesta del cliente: Acepto -> "Aceptada"; Modificar -> "Pendiente ajustes"; No acepto -> "Rechazada"
- Financiera confirma pago antes de generar pedido (para anticipado)

**Criterios de Aceptacion HU-0006:**
- [x] CA-1: Proformas solo para clientes sin credito
- [x] CA-2: Numeracion consecutiva y registro en bitacora
- [x] CA-3: PDF con toda la informacion requerida
- [x] CA-4: Envio registrado con usuario, fecha, hora, canal
- [x] CA-5: Recordatorio automatico a los 8 dias
- [x] CA-6: Respuestas interpretadas (Aceptada/Rechazada/Pendiente)
- [x] CA-7: Estados actualizados segun respuesta

#### TAREA 2.3: Creacion de Pedido - Pedidos 1 (HU-00014)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui
**Fuente:** CONSOLIDADO sec. 7 + HU-00014

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 2.3.1 | RPC `create_order_from_quote(quote_id)` | db-integration | Valida cotizacion aprobada, crea pedido con datos heredados |
| 2.3.2 | RPC `generate_consecutive(org_id, 'order')` | db-integration | Inicia en #20000 |
| 2.3.3 | API `/api/orders` POST | fullstack-dev | Crear pedido: validar cotizacion aprobada, cargar datos automaticamente |
| 2.3.4 | Formulario Pedidos 1 | fullstack-dev + designer-ux-ui | Campos exactos del Excel "Pedidos 1" |
| 2.3.5 | Carga automatica desde cotizacion (read-only) | fullstack-dev | Cliente, items/servicios, valores, condiciones |
| 2.3.6 | Tipo facturacion: total/parcial | fullstack-dev | Selector con combinaciones validas segun Excel |
| 2.3.7 | Confirmacion entrega: con/sin | fullstack-dev | Combinaciones validas con tipo facturacion |
| 2.3.8 | Forma de pago: validacion Anticipado | fullstack-dev | Anticipado -> pendiente confirmacion pago, no avanza a logistica |
| 2.3.9 | Confirmacion de pago (Financiera) | fullstack-dev | Solo se habilita si forma_pago = Anticipado; solo Financiera edita |
| 2.3.10 | Flujo facturacion anticipada (4 pasos) | fullstack-dev | Solicitud -> Aprobacion Compras -> Remision Logistica -> Factura Financiera |
| 2.3.11 | Notificaciones entre areas (email) | fullstack-dev | Pago confirmado -> Compras; cada paso -> siguiente area |
| 2.3.12 | Destinos multiples de entrega | fullstack-dev + designer-ux-ui | Copiar info principal + destinos adicionales |
| 2.3.13 | Informacion despacho (CONSOLIDADO sec. 8.1) | fullstack-dev | Receptor, telefono, direccion, departamento, ciudad, horario, emails |
| 2.3.14 | Selectores despacho/facturacion (no editables post-guardado) | fullstack-dev | Tipo despacho (total/parcial), tipo facturacion, confirmacion entrega |
| 2.3.15 | Bloqueo total post-creacion | fullstack-dev | Solo lectura para todos; solo super_admin puede editar |
| 2.3.16 | Trazabilidad cotizacion -> pedido | fullstack-dev | Link permanente, navegable, no eliminable |
| 2.3.17 | Campo observaciones con @menciones | fullstack-dev | Igual que en Leads: chat interno, notificacion, no editable/borrable |

**Reglas de Negocio HU-00014 (CONSOLIDADO sec. 7):**
- Pedido SOLO desde cotizacion aprobada (no independiente)
- Datos comerciales heredados son read-only
- Campos exactos segun Excel "Pedidos 1"
- Anticipado: pendiente confirmacion pago, no avanza a logistica
- Anticipado: solo Financiera confirma pago -> notificacion a Compras
- Flujo facturacion anticipada: Solicitud -> Aprobacion Compras -> Remision anticipada Logistica -> Factura anticipada Financiera
- Cada paso envia notificacion email al area siguiente
- Destinos multiples sin duplicar info comercial
- Selectores de despacho/facturacion no editables post-guardado
- Pedido bloqueado (read-only) post-creacion
- Trazabilidad permanente cotizacion <-> pedido
- Observaciones con @menciones: no editables, no borrables, con trazabilidad

**Criterios de Aceptacion HU-00014:**
- [x] CA-1: Solo desde cotizacion aprobada
- [x] CA-2: Carga automatica de datos read-only
- [x] CA-3: Campos exactos del Excel "Pedidos 1"
- [x] CA-4: Campos obligatorios validados
- [x] CA-5: Combinaciones facturacion/entrega validadas
- [x] CA-6: Forma pago Anticipado -> pendiente confirmacion
- [x] CA-7: Destinos multiples validados independientemente
- [x] CA-8: Pedido con ID unico, usuario, fecha, cotizacion asociada
- [x] CA-9: Bloqueo total post-creacion
- [x] CA-10: Trazabilidad cotizacion -> pedido navegable
- [x] CA-11: Restricciones: no crear sin cotizacion, no cambiar origen, no modificar valores

### 4.4 Validacion de Arquitectura Sprint 2
| FASE | Cobertura Adicional |
|------|---------------------|
| FASE-06 | RPCs: request_margin_approval, create_order_from_quote |
| FASE-07 | SendGrid: templates de cotizacion, proforma, pedido |
| FASE-08 | Storage: bucket generated-pdfs |
| FASE-09 | 100% PDF: QuotePDFTemplate, ProformaPDFTemplate |
| FASE-10 | Notificaciones multi-area: margen, proforma, pedido |
| FASE-11 | Cron: recordatorio 8 dias sin respuesta |

---

## 5. SPRINT 3: OPERATIVO - OC, LOGISTICA, FACTURACION (3 semanas)

### 5.1 Objetivo
Flujo operativo completo: panel de pedidos, detalle con trazabilidad, ordenes de compra, logistica/despacho, licencias/intangibles y facturacion basada en estados.

### 5.2 HUs Cubiertas
- **HU-0007** (Panel Principal Pedidos) - Completa
- **HU-00015** (Detalle y Trazabilidad Pedido) - Completa
- **HU-00016** (Ordenes de Compra) - Completa
- **HU-00017** (Logistica - Pedidos 2) - Completa
- **HU-00018** (Licencias e Intangibles) - Completa
- **HU-0008** (Facturacion) - Completa

### 5.3 Tareas Detalladas

#### TAREA 3.1: Panel Principal Pedidos (HU-0007)
**Agentes:** fullstack-dev + designer-ux-ui

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 3.1.1 | API `/api/orders` GET con filtros | fullstack-dev | Filtro por estado, busqueda por numero/cliente |
| 3.1.2 | Vista tabla del panel | designer-ux-ui + fullstack-dev | Columnas: N pedido, cliente, estado, fecha, valor total, asunto |
| 3.1.3 | Filtro por estado | fullstack-dev | En proceso (default), Cerrado, Anulado; un filtro activo a la vez |
| 3.1.4 | Busqueda cross-estado | fullstack-dev | Por numero de pedido y nombre de cliente |
| 3.1.5 | Navegacion a detalle (read-only) | fullstack-dev | Click -> vista detalle, modo solo lectura |
| 3.1.6 | Ordenamiento descendente por N pedido | fullstack-dev | Default: N pedido DESC |
| 3.1.7 | Permisos de visibilidad | fullstack-dev | Financiera/Logistica/Compras/Gerencia: todos; Comercial: solo sus clientes |

**Criterios de Aceptacion HU-0007:**
- [x] CA-1: Carga automatica con "En proceso" por defecto
- [x] CA-2: Cada registro muestra: N pedido, cliente, estado, fecha, valor total, asunto
- [x] CA-3: Estados permitidos: En proceso, Cerrado, Anulado
- [x] CA-4: Filtro por estado (un activo a la vez, reversible)
- [x] CA-5: Busqueda por N pedido y cliente (cross-estado)
- [x] CA-6: Detalle en modo solo lectura (super admin excepcion)
- [x] CA-7: No permite: edicion, acciones masivas, cambios automaticos, metricas/KPIs

#### TAREA 3.2: Detalle y Trazabilidad Pedido (HU-00015)
**Agentes:** fullstack-dev + designer-ux-ui

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 3.2.1 | Pagina `/orders/[id]` | fullstack-dev + designer-ux-ui | Vista completa con tabs |
| 3.2.2 | Tab: Info General | fullstack-dev | Pedido, cotizacion origen (link), datos cliente (read-only) |
| 3.2.3 | Tab: Items/Servicios | fullstack-dev | Lista heredada de cotizacion (read-only) |
| 3.2.4 | Tab: Condiciones Operativas | fullstack-dev | Facturacion, despacho, pago, confirmacion |
| 3.2.5 | Tab: Destinos | fullstack-dev | Lista de destinos con detalles |
| 3.2.6 | Tab: Ordenes de Compra | fullstack-dev | Subpestana con OCs asociadas |
| 3.2.7 | Tab: Logistica | fullstack-dev | Info logistica (puede estar parcial/vacia) |
| 3.2.8 | Tab: Timeline/Trazabilidad | fullstack-dev + designer-ux-ui | Cronologica ascendente: evento, descripcion, usuario, fecha, hora |
| 3.2.9 | Tab: Observaciones | fullstack-dev | Con @menciones, read-only, no eliminables |
| 3.2.10 | RPC `get_order_traceability(order_id)` | db-integration | Timeline completa del pedido |
| 3.2.11 | Accion reabrir pedido | fullstack-dev | Solo Super Admin y Compras |

**Criterios de Aceptacion HU-00015:**
- [x] CA-1: N pedido, estado, fecha creacion, usuario creador (obligatorios, read-only)
- [x] CA-2: Cotizacion origen: numero, estado, fecha aprobacion, usuario aprobador
- [x] CA-3: Info comercial heredada no editable
- [x] CA-4: Condiciones operativas/financieras no editables, match HU-00014
- [x] CA-4.1: Reabrir pedido: solo Super Admin y Compras
- [x] CA-5: Destinos multiples, no editables/eliminables
- [x] CA-6: OCs asociadas (informativo, no editable)
- [x] CA-7: Info logistica (consulta, parcial o vacia)
- [x] CA-8: Estado actual + fecha ultimo cambio + usuario
- [x] CA-9: Timeline cronologica no editable
- [x] CA-10: Observaciones read-only
- [x] CA-11: No permite eliminacion, cambios de estado, inferir info

#### TAREA 3.3: Ordenes de Compra (HU-00016)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 3.3.1 | API CRUD `/api/purchase-orders` | fullstack-dev | POST, GET, PUT (solo Compras) |
| 3.3.2 | Crear OC desde pedido | fullstack-dev | Seleccionar items del pedido, asignar proveedor |
| 3.3.3 | Formulario OC | fullstack-dev + designer-ux-ui | Proveedor, items (solo del pedido), cantidades (no exceder pedido) |
| 3.3.4 | Moneda por producto en OC | fullstack-dev | Permitir COP o USD por producto |
| 3.3.5 | Recalculo valores con TRM del dia | fullstack-dev | Valores informativos, no impactan pedido |
| 3.3.6 | Item flete en OC | fullstack-dev | Campo que reemplaza flete |
| 3.3.7 | Cambios de estado manuales | fullstack-dev | Creada -> Enviada -> Confirmada -> Recibida -> Cerrada (o Cancelada) |
| 3.3.8 | Trazabilidad de OC | fullstack-dev | Evento, estado anterior, nuevo, usuario, fecha, hora |
| 3.3.9 | Edicion post-creacion (solo Compras) | fullstack-dev | Campos especificos editables |

**Estados de OC (HU-00016):**
```
Creada --> Enviada al proveedor --> Confirmada por proveedor --> Recibida --> Cerrada
  \---> Cancelada (desde cualquier estado)
```

**Criterios de Aceptacion HU-00016:**
- [x] CA-1: N OC, pedido asociado, estado, fecha, usuario, item flete
- [x] CA-2: Un proveedor por OC, no modifica maestro global
- [x] CA-3: Solo items del pedido, cantidades no exceden pedido
- [x] CA-4: Valor total, moneda (COP/USD), condicion pago proveedor
- [x] CA-5: Fechas opcionales, no inferidas
- [x] CA-6: 6 estados definidos, cambios manuales, cada uno genera evento
- [x] CA-7: OC <-> pedido (1:N), relacion permanente
- [x] CA-8: Trazabilidad completa no editable
- [x] CA-9: No modifica pedido ni cotizacion
- [x] CA-10: Edicion post-creacion solo por Compras

#### TAREA 3.4: Logistica y Seguimiento - Pedidos 2 (HU-00017)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui
**Fuente:** CONSOLIDADO sec. 8

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 3.4.1 | API CRUD `/api/shipments` | fullstack-dev | Crear despacho desde pedido |
| 3.4.2 | Formulario Logistica (Pedidos 2) | fullstack-dev + designer-ux-ui | Segun CONSOLIDADO sec. 8.5 |
| 3.4.3 | Info despacho heredada de destino | fullstack-dev | Direccion, ciudad, pais (read-only) |
| 3.4.4 | Tipo despacho | fullstack-dev | Motorizado PDC, Externo PDC, Nacional PDC, Desde mayorista, Hibrido |
| 3.4.5 | Transportadora + N guia | fullstack-dev | Campos opcionales |
| 3.4.6 | Fechas estimadas y reales | fullstack-dev | Opcionales, fecha real >= estimada |
| 3.4.7 | Cambios estado logistico | fullstack-dev | Manual: Pendiente -> Preparacion -> Despachado -> Transito -> Entregado |
| 3.4.8 | Incidencia logistica | fullstack-dev | Estado especial desde cualquier punto |
| 3.4.9 | Observaciones logisticas | fullstack-dev | No editables, no eliminables, con usuario, fecha, hora |
| 3.4.10 | Seguimiento facturacion (Financiera) | fullstack-dev | Selector: Facturado parcial / Facturado total |

**Estados Logistica (HU-00017):**
```
Pendiente despacho --> En preparacion --> Despachado --> En transito --> Entregado
           \--- Incidencia logistica (desde cualquier punto) ---/
```

**Criterios de Aceptacion HU-00017:**
- [x] CA-1: Pedido, destino, estado logistico, responsable (obligatorios)
- [x] CA-2: Fechas opcionales, no calculadas, real >= estimada
- [x] CA-3: Transporte: tipo, medio, transportador, guia (opcionales)
- [x] CA-4: Direccion heredada de destino (no editable)
- [x] CA-5: Observaciones no editables/eliminables
- [x] CA-6: 6 estados, cambios manuales, cada uno genera evento
- [x] CA-7: Trazabilidad completa
- [x] CA-8: No modifica info comercial/financiera/cotizacion/OC

#### TAREA 3.5: Licencias e Intangibles (HU-00018)
**Agentes:** fullstack-dev + designer-ux-ui
**Fuente:** CONSOLIDADO sec. 8.4

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 3.5.1 | API CRUD `/api/licenses` | fullstack-dev | Registrar licencia/intangible asociada a pedido |
| 3.5.2 | Formulario ADP (por marca) | fullstack-dev + designer-ux-ui | ACER, ASUS, DELL, HP, LENOVO + campos especificos |
| 3.5.3 | Formulario Enrolamiento Apple | fullstack-dev + designer-ux-ui | Datos empresa + ID cliente |
| 3.5.4 | Formulario Garantias (por marca) | fullstack-dev + designer-ux-ui | Misma estructura que ADP |
| 3.5.5 | Formulario Licenciamiento | fullstack-dev + designer-ux-ui | Adobe, Autodesk, Cisco, Fortinet, Kaspersky, Microsoft |
| 3.5.6 | Microsoft CSP vs ESD | fullstack-dev | CSP: tenant info; ESD: standard |
| 3.5.7 | Servicios: Instalacion y Renting | fullstack-dev | Fechas inicio/fin, fecha finalizacion proyecto |
| 3.5.8 | Selector: producto en pedido / no relacionado | fullstack-dev | Si no relacionado: N parte HW, Serial, Fecha compra |
| 3.5.9 | Estados especiales | fullstack-dev | Pendiente entrega -> Entregado -> Activado -> Vencido (o Incidencia) |

**Criterios de Aceptacion HU-00018:**
- [x] CA-1: Identificacion tipo: Licencia, Intangible, Caso especial, Servicios
- [x] CA-2: Campos especificos opcionales segun Excel
- [x] CA-3: Fechas opcionales, no calculadas
- [x] CA-4: 5 estados especiales, cambios manuales
- [x] CA-5: Observaciones no editables
- [x] CA-6: Trazabilidad completa
- [x] CA-7: No exige info logistica fisica

#### TAREA 3.6: Facturacion Basada en Estados (HU-0008)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 3.6.1 | Motor de reglas de facturacion | db-integration + fullstack-dev | Evalua automaticamente: parcial?, entrega parcial?, confirmacion?, acta? |
| 3.6.2 | API `/api/invoices` | fullstack-dev | Crear factura basada en evaluacion de reglas |
| 3.6.3 | Estados de facturacion | fullstack-dev | Pendiente, Pendiente por cierre contable, Pendiente por acta, En proceso entrega, Facturado |
| 3.6.4 | Facturacion parcial | fullstack-dev | Solo productos entregados, si pedido lo permite |
| 3.6.5 | Bloqueo por acta | fullstack-dev | Si requiere acta y no cargada -> bloqueado |
| 3.6.6 | Carga de acta (Comercial) | fullstack-dev | Upload a Storage -> notificacion a Facturacion |
| 3.6.7 | Bloqueo por confirmacion entrega | fullstack-dev | Si requiere confirmacion y no entregado -> bloqueado |
| 3.6.8 | Notificaciones automaticas entre areas | fullstack-dev | Logistica->Facturacion (remision/entrega), Comercial->Facturacion (acta), Facturacion->Compras (facturado) |
| 3.6.9 | Trazabilidad de facturacion | fullstack-dev | Evento, area, regla aplicada, fecha, hora (read-only) |
| 3.6.10 | Cierre: no mas acciones post-Facturado | fullstack-dev | Estado final irreversible |
| 3.6.11 | Cierre de pedido por Compras | fullstack-dev | Facturacion adjunta docs -> Compras revisa -> Compras cierra |

**Flujos de Facturacion (CONSOLIDADO sec. 10):**
```
Caso 1: Parcial SI + Entrega parcial SI = Facturar productos entregados
Caso 2: Parcial NO + Entrega parcial SI = Esperar entrega total
Caso 3: Entrega total = Facturar todo
Caso 4: Con confirmacion = Esperar confirmacion para facturar
Caso 5: Sin confirmacion = Facturar desde envio
Acta: Si requerida, bloquea hasta que comercial la suba
```

**Criterios de Aceptacion HU-0008:**
- [x] CA-01: NO solicitar N factura, fecha, datos fiscales (solo estados)
- [x] CA-02: Evaluacion automatica de reglas del pedido
- [x] CA-03: 5 estados claros de facturacion
- [x] CA-04: Facturacion parcial habilitada si pedido lo permite
- [x] CA-05: Facturacion parcial bloqueada si no permitida
- [x] CA-06: Con/sin confirmacion de entrega
- [x] CA-07: Dependencia de acta (bloqueo si no cargada)
- [x] CA-08: Notificaciones automaticas entre areas
- [x] CA-09: Trazabilidad obligatoria (evento, area, regla, fecha)
- [x] CA-10: Post-Facturado = cierre total

### 5.4 Validacion de Arquitectura Sprint 3
| FASE | Cobertura Adicional |
|------|---------------------|
| FASE-01 | Dominios 5-9 en uso activo |
| FASE-05 | Modulos Pedidos, Compras, Logistica, Facturacion |
| FASE-06 | RPCs: update_order_status, get_order_traceability |
| FASE-08 | Storage: bucket documents (actas) |
| FASE-10 | Notificaciones multi-area: logistica, facturacion |

---

## 6. SPRINT 4: SEMAFORO, TRAZABILIDAD, ALERTAS, REPORTES (2 semanas)

### 6.1 Objetivo
Herramientas de seguimiento y control: semaforo visual operativo, trazabilidad de producto, sistema de alertas/observaciones cross-cutting, y dashboard de reportes.

### 6.2 HUs Cubiertas
- **HU-00019** (Semaforo Visual Operativo) - Completa
- **HU-00020** (Trazabilidad de Producto) - Completa
- **HU-0009** (Alertas y Seguimiento) - Completa
- **HU-0010** (Reportes y Dashboard) - Completa

### 6.3 Tareas Detalladas

#### TAREA 4.1: Semaforo Visual Operativo (HU-00019)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui
**Fuente:** CONSOLIDADO sec. 9

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 4.1.1 | Tabla `operational_colors` o campo en tasks | db-integration | Pedido, producto, columna, color, usuario, fecha, motivo |
| 4.1.2 | API `/api/operational-dashboard` | fullstack-dev | GET: matriz completa; PUT: cambiar color (solo Gerente Operativo) |
| 4.1.3 | Vista tabla: Bloque Operativo | designer-ux-ui + fullstack-dev | Proveedor, OC, Cliente, OP, Producto, Cantidad, Fecha entrega, Responsable, Novedades |
| 4.1.4 | Separador visual fijo | designer-ux-ui | Linea vertical entre bloques |
| 4.1.5 | Vista tabla: Bloque Administrativo | designer-ux-ui + fullstack-dev | REM, Factura, Transportadora, Guia, Obs CRM, Correo U.F. |
| 4.1.6 | Sistema de 7 colores | designer-ux-ui + fullstack-dev | Rojo, Naranja, Morado, Amarillo, Azul, Verde claro, Verde oscuro |
| 4.1.7 | Asignacion de color por celda | fullstack-dev + designer-ux-ui | Click celda -> selector color -> campo motivo obligatorio -> confirmar |
| 4.1.8 | Multiples colores por fila (por columna) | fullstack-dev | Cada celda tiene su color independiente |
| 4.1.9 | Persistencia de colores (no recalcular) | fullstack-dev | Al recargar, colores se mantienen |
| 4.1.10 | Historial de cambios de color | fullstack-dev | Pedido, producto, columna, color anterior, nuevo, usuario, fecha, motivo |
| 4.1.11 | Consulta historial por pedido/producto | fullstack-dev + designer-ux-ui | Panel lateral o modal |
| 4.1.12 | Vista Kanban ejecutiva (Gerente General) | designer-ux-ui + fullstack-dev | Sin colores operativos; agrupa en: En compras, En proveedor, En transporte, En bodega, Bloqueado, Cerrado |

**Criterios de Aceptacion HU-00019:**
- [x] CA-1: Multiples colores simultaneos por fila
- [x] CA-2: Color por columna, no por pedido
- [x] CA-3: Colores = responsabilidad + accion pendiente
- [x] CA-4: Solo Gerente Operativo modifica
- [x] CA-5: Cada cambio registra: usuario, fecha, motivo
- [x] CA-6: Vista tipo tabla
- [x] CA-7: Cada fila = producto dentro de pedido
- [x] CA-8: Bloques: Operativo (izq) + Separador + Administrativo (der)
- [x] CA-9: Colores persisten al recargar
- [x] CA-10: 7 colores con significado definido
- [x] CA-11: Solo Gerente Operativo asigna/cambia/elimina
- [x] CA-12: Flujo: seleccionar celda -> color -> motivo -> confirmar
- [x] CA-13: Trazabilidad: pedido, producto, columna, color anterior/nuevo, usuario, fecha, motivo
- [x] CA-14: Historial consultable por pedido/producto, no editable
- [x] CA-15: Solo Ger. Operativo modifica; Bodega solo ve

#### TAREA 4.2: Trazabilidad de Producto (HU-00020)
**Agentes:** fullstack-dev + designer-ux-ui

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 4.2.1 | Vista timeline de producto | designer-ux-ui + fullstack-dev | Cronologica: estado, fecha/hora, usuario/sistema, observaciones |
| 4.2.2 | Acceso desde detalle producto y modulo | fullstack-dev | Link desde producto, OC, pedido |
| 4.2.3 | Mensaje si no hay historial | fullstack-dev | "El producto no cuenta con eventos historicos registrados." |
| 4.2.4 | Coherencia estado actual vs timeline | fullstack-dev | Validacion visual de consistencia |

**Criterios de Aceptacion HU-00020:**
- [x] CA-1: Consultar ruta de producto existente
- [x] CA-2: Orden cronologico
- [x] CA-3: Cada evento: estado, fecha/hora, usuario
- [x] CA-4: Solo lectura
- [x] CA-5: No introduce logica nueva
- [x] CA-6: Mensaje si no hay historial
- [x] CA-7: Consistente con parametrizacion del sistema

#### TAREA 4.3: Alertas y Seguimiento Cross-Cutting (HU-0009)
**Agentes:** db-integration + fullstack-dev + designer-ux-ui

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 4.3.1 | Sistema de notificaciones Realtime | fullstack-dev | Supabase Realtime: suscripcion a tabla notifications |
| 4.3.2 | NotificationBell completo | designer-ux-ui + fullstack-dev | Contador, dropdown, filtro pendientes/vistas, marcar como leida |
| 4.3.3 | Campo observaciones reutilizable | fullstack-dev + designer-ux-ui | Componente compartido: COT, OP, OC usanlo mismo componente |
| 4.3.4 | @menciones con dropdown usuarios | fullstack-dev + designer-ux-ui | Trigger "@" -> lista usuarios -> seleccionar -> notificacion |
| 4.3.5 | Trigger `notify_mentions` | db-integration | En INSERT de comments: detectar @menciones -> crear notificaciones |
| 4.3.6 | Formato chat/timeline | designer-ux-ui | Cronologico, no editable, no borrable |
| 4.3.7 | Contador de comentarios (bubble) | designer-ux-ui | Icono burbuja con numero en cada documento |
| 4.3.8 | Alertas de estado automaticas | fullstack-dev | Cambio de estado -> notificacion a rol responsable |
| 4.3.9 | Alertas criticas (rojo) | fullstack-dev | Cotizaciones 8+ dias sin respuesta, cotizaciones expiradas, asesores con bajo seguimiento |
| 4.3.10 | Filtros de bitacora | fullstack-dev | Por fecha, usuario, tipo documento, estado |

**Criterios de Aceptacion HU-0009:**
- [x] CA-1: Cada documento (COT, OP, OC) tiene campo observaciones con historial
- [x] CA-2: @menciones generan notificacion in-app (campanita), no email
- [x] CA-3: Bitacora de comentarios, fechas y usuarios
- [x] CA-4: No se pueden eliminar ni editar comentarios
- [x] CA-5: Visibilidad de comentarios segun nivel de acceso
- [x] CA-6: Notificaciones inmediatas con enlace directo al documento

#### TAREA 4.4: Reportes y Dashboard (HU-0010)
**Agentes:** fullstack-dev + designer-ux-ui
**Arquitectura:** FASE-06 (RPCs), FASE-11 (Performance)

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 4.4.1 | RPC `get_commercial_pipeline(org_id)` | db-integration | Pipeline con conteos por estado |
| 4.4.2 | RPC `get_operational_dashboard(org_id)` | db-integration | KPIs operativos consolidados |
| 4.4.3 | Vistas materializadas | db-integration | Para metricas pesadas (pipeline, KPIs) |
| 4.4.4 | Dashboard comercial | designer-ux-ui + fullstack-dev | KPI cards + pipeline chart + tabla top 5 asesores |
| 4.4.5 | Metricas: leads, cotizaciones, ventas | fullstack-dev | Total leads, cotizaciones por estado, conversion, tiempo respuesta |
| 4.4.6 | Filtros combinables | fullstack-dev | Rango fechas, asesor, cliente, estado, canal |
| 4.4.7 | Click-through en metricas | fullstack-dev | Click KPI -> lista filtrada detallada |
| 4.4.8 | Alertas visuales (color/icono) | designer-ux-ui | Rojo para criticos, iconos warning |
| 4.4.9 | Exportacion Excel y PDF | fullstack-dev | CSV streaming + @react-pdf/renderer |
| 4.4.10 | Cron: refresh materialized views | db-integration | pg_cron cada 15 min |
| 4.4.11 | Cron: expire_quotes_daily | db-integration | Expirar cotizaciones vencidas |

**Criterios de Aceptacion HU-0010:**
- [x] CA-1: Metricas de leads, cotizaciones, ventas consolidadas
- [x] CA-2: Filtros funcionales y combinables
- [x] CA-3: Exportacion Excel y PDF
- [x] CA-4: Datos en tiempo real
- [x] CA-5: Indicadores navegables (click -> detalle)
- [x] CA-6: Alertas visuales por color/icono
- [x] CA-7: Trazabilidad (usuario, fecha, hora)

### 6.4 Validacion de Arquitectura Sprint 4
| FASE | Cobertura Adicional |
|------|---------------------|
| FASE-05 | Semaforo visual, Trazabilidad, Reportes |
| FASE-06 | RPCs: get_commercial_pipeline, get_operational_dashboard |
| FASE-08 | Supabase Realtime para notificaciones |
| FASE-10 | 100% notificaciones: 3 canales, 15+ eventos |
| FASE-11 | Materialized views, cron jobs, particionamiento audit_logs |

---

## 7. SPRINT 5: WHATSAPP + POLISH (2 semanas)

### 7.1 Objetivo
Integracion completa de WhatsApp (chatbot + chat manual + Embedded Sign-Up) y pulido general del sistema.

### 7.2 HUs Cubiertas
- **HU-0012** (WhatsApp Bot) - Completa

### 7.3 Tareas Detalladas

#### TAREA 5.1: WhatsApp Integration (HU-0012)
**Agentes:** fullstack-dev + designer-ux-ui
**Arquitectura:** FASE-07 (Integraciones Externas)

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 5.1.1 | Meta Cloud API v21.0 setup | fullstack-dev | Config META_APP_ID, META_APP_SECRET, META_CONFIG_ID |
| 5.1.2 | Embedded Sign-Up SDK | fullstack-dev + designer-ux-ui | Boton para que asesor conecte su WhatsApp Business |
| 5.1.3 | Webhook `/api/whatsapp/webhook` | fullstack-dev | Recibir mensajes entrantes + status updates |
| 5.1.4 | Chatbot state machine (6 estados) | fullstack-dev | Menu -> Captura datos -> Clasificacion -> Creacion lead/caso |
| 5.1.5 | Menu inicial (3 opciones) | fullstack-dev | 1: Cotizacion, 2: Seguimiento pedido, 3: Otro motivo |
| 5.1.6 | Opcion 1: Captura para cotizacion | fullstack-dev | Datos, adjuntos, templates, validacion, crear caso |
| 5.1.7 | Opcion 2: Seguimiento pedido | fullstack-dev | Pide asesor -> identifica -> notificacion interna |
| 5.1.8 | Opcion 3: Otro motivo | fullstack-dev | Identifica necesidad -> dirige al area correcta |
| 5.1.9 | Deteccion intencion comercial | fullstack-dev | Palabras clave: "cotizacion", "precio" -> boton "Crear Lead" |
| 5.1.10 | Boton "Crear Lead" en conversacion | fullstack-dev + designer-ux-ui | Auto-extrae: nombre, telefono, ID, mensajes, adjuntos |
| 5.1.11 | Manejo inactividad | fullstack-dev | Reminder despues de X min; cierra como "incompleto" si no responde |
| 5.1.12 | Manejo duplicados | fullstack-dev | Ventana de tiempo, mismo caso para info adicional |
| 5.1.13 | Chat manual en plataforma | designer-ux-ui + fullstack-dev | Panel conversaciones Realtime |
| 5.1.14 | Envio de proformas por WhatsApp | fullstack-dev | PDF como documento por WhatsApp |
| 5.1.15 | Hyperlinks cuando aplica | fullstack-dev | Link a numero personal (pierde trazabilidad) |
| 5.1.16 | Templates de mensajes estructurados | fullstack-dev | CRUD templates aprobados por Meta |

**Criterios de Aceptacion HU-0012:**
- [x] CA-1: Menu con opciones 1, 2, 3
- [x] CA-2: Clasificacion por palabras clave
- [x] CA-3: Embedded sign-up del numero del asesor
- [x] CA-4: Conversaciones sincronizadas en plataforma
- [x] CA-5: Boton "Crear Lead" en conversacion
- [x] CA-6: Lead conserva mensajes y adjuntos
- [x] CA-7: Manejo inactividad, duplicados, adjuntos
- [x] CA-8: Seguimiento pedido pide asesor obligatoriamente
- [x] CA-9: Otro motivo identifica necesidad y dirige al area
- [x] CA-10: Notificacion interna al comercial indicado
- [x] CA-11: Hyperlink cuando aplica
- [x] CA-12: Todas las acciones en bitacora

#### TAREA 5.2: QA, Performance y Polish
**Agentes:** todos

| # | Subtarea | Agente | Detalle |
|---|----------|--------|---------|
| 5.2.1 | Particionamiento mensual audit_logs | db-integration | Performance para tablas con alto volumen |
| 5.2.2 | Load testing | fullstack-dev | >1000 tx/dia/usuario, 50 concurrentes |
| 5.2.3 | Security review (OWASP Top 10) | fullstack-dev | XSS, injection, CSRF, auth bypass |
| 5.2.4 | Email templates finales (SendGrid) | fullstack-dev | 7 templates transaccionales |
| 5.2.5 | Visual polish vs Template Figma | designer-ux-ui | Verificar identidad visual: dark mode, animaciones Framer Motion, glass morphism, sombras, gradientes, responsive (mobile tabs + desktop top bar) |
| 5.2.6 | UAT con usuarios piloto | business-analyst | Verificar flujos completos con datos reales |

---

## 8. FLUJOS DE ESTADOS CONSOLIDADOS

### 8.1 Lead
```
[Creado] --auto_assign--> [Pendiente] --convertir--> [Convertido]
                                      \--rechazar---> [Rechazado]
```
- Consecutivo desde #100
- Alerta si > 1 dia sin convertir
- Reasignacion automatica si asesor se desactiva

### 8.2 Cotizacion
```
[Creacion de oferta] --> [Negociacion] --> [Pendiente OC] --> [Ganada] --> (crea Pedido)
                     \-> [Riesgo] --------/               \-> [Perdida]

Sub-flujo margen:
  Si margen >= minimo -> aprobacion automatica
  Si margen < minimo -> [Pendiente aprobacion] --> [Aprobada bajo menor margen] o [Rechazada]

Sub-flujo envio:
  Sin credito -> [Proforma generada] -> [Enviada]
  Con credito -> [Enviada al cliente]
  -> [Aceptada] / [Rechazada por cliente] / [Pendiente de ajustes]
  Si 8 dias sin respuesta -> recordatorio automatico
```
- Consecutivo desde #30000
- Bloqueo si cartera = Si
- Transporte no visible en PDF

### 8.3 Pedido
```
[Creado] --> [En proceso] --> [Cerrado]
                           \-> [Anulado]

Sub-flujo anticipado:
  [Pendiente confirmacion pago] -> Financiera confirma -> [Disponible para compra]

Sub-flujo facturacion anticipada:
  [No requerida] -> [Requerida] -> Compras aprueba -> Logistica remisiona -> Financiera factura
```
- Consecutivo desde #20000
- Solo desde cotizacion aprobada
- Bloqueado post-creacion (read-only)
- Reabrir: solo Super Admin y Compras

### 8.4 Orden de Compra
```
[Creada] --> [Enviada al proveedor] --> [Confirmada] --> [Recibida] --> [Cerrada]
  \---> [Cancelada] (desde cualquier estado)
```
- Un proveedor por OC
- Un pedido puede tener multiples OCs
- Items solo del pedido, cantidades no exceden

### 8.5 Logistica
```
[Pendiente despacho] --> [En preparacion] --> [Despachado] --> [En transito] --> [Entregado]
       \--- [Incidencia logistica] (desde cualquier punto)
```
- Registro parcial o completo
- No modifica info comercial

### 8.6 Facturacion
```
[Pendiente por facturar]
[Pendiente por facturar por cierre contable]
[Pendiente por facturar por acta]
[En proceso de entrega]
[Facturado] (final, irreversible)
```
- Evaluacion automatica de reglas del pedido
- No solicitar N factura, datos fiscales (solo estados)
- Post-Facturado: Compras revisa y cierra pedido

### 8.7 Licencias/Intangibles
```
[Pendiente de entrega] --> [Entregado] --> [Activado] --> [Vencido]
       \--- [Incidencia] (desde cualquier punto)
```
- No requiere logistica fisica
- Cambios manuales solamente

### 8.8 Semaforo (Colores - NO son estados)
```
Rojo:        Bloqueos financieros/comerciales
Naranja:     Pendientes Auxiliar Bodega
Morado:      Pendientes Jefe Bodega
Amarillo:    Pendientes Compras
Azul:        Licencias/servicios recurrentes
Verde claro: Proceso avanzado no cerrado
Verde oscuro: Completado
```
- Por columna, no por fila
- Multiples colores simultaneos
- Solo Gerente Operativo modifica

---

## 9. REGLAS DE NEGOCIO CRITICAS (CHECKLIST CROSS-CUTTING)

### 9.1 Margenes
- [ ] Formula: `1 - (Total costo / Total venta)`
- [ ] 35 reglas: 7 formas_pago x 5 verticales (CONSOLIDADO sec. 1.5)
- [ ] Software: 5% (<=30d), 7% (45d), 9% (60d)
- [ ] Resto: 7% (<=30d), 9% (45d), 11% (60d)
- [ ] Total costo incluye transporte y descuentos
- [ ] Si margen < minimo: bloquear envio, solicitar aprobacion

### 9.2 Consecutivos
- [ ] Leads: desde #100, auto-generado, thread-safe
- [ ] Cotizaciones: desde #30000
- [ ] Pedidos: desde #20000
- [ ] RPC `generate_consecutive(org_id, type)` con advisory lock

### 9.3 TRM
- [ ] Consulta diaria desde datos.gov.co
- [ ] Cache con fallback a ultimo valor
- [ ] Aplicacion automatica en cotizaciones con costo en USD
- [ ] Recalculo en OC segun TRM del dia

### 9.4 Multi-Tenancy
- [ ] `organization_id` en TODAS las tablas de negocio
- [ ] RLS: tenant isolation en lectura/escritura
- [ ] Cada org tiene sus propios catalogos, roles, consecutivos

### 9.5 Auditoria
- [ ] Trigger `audit_trail_fn()` en 17 tablas
- [ ] Calcula diffs automaticamente en UPDATE
- [ ] Particionamiento mensual para performance
- [ ] Campos: tabla, operacion, old_data, new_data, user_id, timestamp

### 9.6 Notificaciones
- [ ] 3 canales: In-app (campanita), Email (SendGrid), WhatsApp (Meta API)
- [ ] 15+ eventos que generan notificacion
- [ ] @menciones en observaciones -> notificacion in-app
- [ ] Filtro pendientes/vistas en campanita
- [ ] Link directo al documento desde notificacion

### 9.7 Permisos por Campo
- [ ] Clientes: segun matriz CONSOLIDADO sec. 2
- [ ] Productos: segun matriz CONSOLIDADO sec. 3
- [ ] Cotizaciones: segun matriz CONSOLIDADO sec. 5
- [ ] Pedidos: segun matriz CONSOLIDADO sec. 7
- [ ] Implementar como logica en API + componente frontend

---

## 10. ASIGNACION DE AGENTES POR SPRINT

| Sprint | db-integration | fullstack-dev | designer-ux-ui | business-analyst |
|--------|---------------|---------------|----------------|-----------------|
| **S0** | DDL 45 tablas, RLS, triggers, seed, RPCs RBAC | Auth cookies, middleware, RBAC frontend, layout, ThemeProvider, Framer Motion, sonner | Top nav bar, mobile tabs, dark mode, tema cyan/navy, glass, sombras | Validar seed vs CONSOLIDADO |
| **S1** | Consecutivos, auto_assign, quote_totals, margin_rules | APIs CRUD, formularios, validaciones, permisos campo | Kanban leads, tabla items cotizacion, formularios | Validar flujos lead/cotizacion vs HUs |
| **S2** | margin_approval, create_order_from_quote | PDF, SendGrid, pedido form, flujo anticipado | PDF templates, formulario pedido, destinos | Validar flujo completo lead->pedido |
| **S3** | order_traceability, status_history | Panel pedidos, OC, logistica, facturacion motor | Panel pedidos, OC form, timeline trazabilidad | Validar flujos facturacion vs CONSOLIDADO |
| **S4** | materialized views, cron, pipeline RPC | Semaforo, trazabilidad producto, alertas, reportes | Semaforo 7 colores, dashboard KPIs, Kanban ejecutivo | Validar semaforo vs SharePoint actual |
| **S5** | Particionamiento audit_logs | WhatsApp chatbot, webhook, chat manual, QA | Chat panel, Embedded Sign-Up UI | UAT con usuarios piloto |

---

## 11. MATRIZ DE TRAZABILIDAD HU -> TAREAS

| HU | Sprint | Tareas Principales | FASEs Referenciadas |
|----|--------|-------------------|---------------------|
| HU-0011 | S0 | 0.5.1 - 0.5.12 | FASE-02, FASE-04 |
| HU-0001 | S1 | 1.3.1 - 1.3.12 | FASE-01, FASE-05, FASE-06, FASE-10 |
| HU-0002 | S1 | 1.3.7 - 1.3.9 | FASE-01, FASE-02, FASE-06, FASE-10 |
| HU-0003 | S1 | 1.4.1 - 1.4.18 | FASE-01, FASE-05, FASE-06, FASE-09 |
| HU-0004 | S1 | 1.4.13 - 1.4.14 | FASE-01, FASE-02 |
| HU-0005 | S2 | 2.1.1 - 2.1.6 | FASE-01, FASE-02, FASE-06 |
| HU-0006 | S2 | 2.2.1 - 2.2.11 | FASE-07, FASE-08, FASE-09 |
| HU-00014 | S2 | 2.3.1 - 2.3.17 | FASE-01, FASE-05, FASE-06 |
| HU-0007 | S3 | 3.1.1 - 3.1.7 | FASE-01, FASE-05 |
| HU-00015 | S3 | 3.2.1 - 3.2.11 | FASE-01, FASE-05, FASE-06, FASE-10 |
| HU-00016 | S3 | 3.3.1 - 3.3.9 | FASE-01, FASE-05, FASE-06, FASE-09 |
| HU-00017 | S3 | 3.4.1 - 3.4.10 | FASE-01, FASE-05, FASE-06 |
| HU-00018 | S3 | 3.5.1 - 3.5.9 | FASE-01, FASE-05 |
| HU-0008 | S3 | 3.6.1 - 3.6.11 | FASE-01, FASE-05, FASE-06, FASE-10 |
| HU-00019 | S4 | 4.1.1 - 4.1.12 | FASE-01, FASE-05, FASE-10 |
| HU-00020 | S4 | 4.2.1 - 4.2.4 | FASE-01, FASE-05, FASE-06 |
| HU-0009 | S4 | 4.3.1 - 4.3.10 | FASE-05, FASE-07, FASE-10 |
| HU-0010 | S4 | 4.4.1 - 4.4.11 | FASE-05, FASE-06, FASE-11 |
| HU-0012 | S5 | 5.1.1 - 5.1.16 | FASE-07 |

**Cobertura: 19/19 HUs = 100%**

---

## 12. QUALITY GATES POR SPRINT

### Gate Sprint 0 (Fundacion)
- [ ] 45 tablas creadas y accesibles via Supabase
- [ ] RLS activo: usuario org A no ve datos de org B
- [ ] Login/logout funcional con cookies (no JWT localStorage)
- [ ] RBAC: 12 roles con 65 permisos asignados correctamente
- [ ] Panel admin: CRUD roles + gestion usuarios
- [ ] Top navigation bar con 8 modulos (filtrados por permisos)
- [ ] Mobile bottom tab bar funcional
- [ ] Dark mode toggle funcional (Moon/Sun en header)
- [ ] ThemeProvider con gradients toggle y persistencia localStorage
- [ ] Framer Motion: animacion de entrada en vistas
- [ ] Sonner: toasts funcionales
- [ ] Tema: colores cyan #00C8CF / navy #161052, gradientes, glass, sombras
- [ ] NotificationBell con Sheet panel lateral

### Gate Sprint 1 (Core Comercial)
- [ ] Crear cliente con validacion NIT duplicado
- [ ] Crear producto con restricciones por rol
- [ ] Lead: crear manual, consecutivo desde #100, vista Kanban
- [ ] Lead: auto-asignacion equitativa, max 5 pendientes
- [ ] Lead: @menciones en observaciones generan notificacion
- [ ] Cotizacion: crear desde lead, consecutivo desde #30000
- [ ] Cotizacion: calculo TRM, margen, transporte separado
- [ ] Cotizacion: duplicar version seleccionando items
- [ ] Bloqueo cartera: Solo Financiera edita, bloquea pedido si Si

### Gate Sprint 2 (Pipeline Completo)
- [ ] Margen < minimo bloquea envio, genera solicitud aprobacion
- [ ] Gerencia aprueba/rechaza con comentario
- [ ] PDF cotizacion generado con @react-pdf/renderer (sin Chromium)
- [ ] PDF subido a Supabase Storage
- [ ] Envio por email con SendGrid
- [ ] Recordatorio automatico 8 dias
- [ ] Pedido creado SOLO desde cotizacion aprobada
- [ ] Datos heredados read-only
- [ ] Anticipado: pendiente confirmacion, no avanza sin ella
- [ ] Flujo facturacion anticipada: 4 pasos con notificaciones

### Gate Sprint 3 (Operativo)
- [ ] Panel pedidos: "En proceso" por defecto, filtro por estado
- [ ] Detalle pedido con tabs completas y timeline
- [ ] OC: crear desde pedido, items no exceden cantidades
- [ ] OC: 6 estados manuales con trazabilidad
- [ ] Logistica: 6 estados, fechas opcionales, observaciones
- [ ] Licencias: formularios por marca, 5 estados
- [ ] Facturacion: motor de reglas automatico (parcial, acta, confirmacion)
- [ ] Facturacion: post-Facturado irreversible
- [ ] Cierre pedido por Compras

### Gate Sprint 4 (Seguimiento)
- [ ] Semaforo: 7 colores, por celda, solo Gerente Operativo
- [ ] Semaforo: persistencia, historial con motivo
- [ ] Kanban ejecutivo derivado de colores
- [ ] Trazabilidad producto: timeline cronologica
- [ ] Observaciones cross-cutting: @menciones, no editables
- [ ] NotificationBell con Realtime y filtro
- [ ] Dashboard con KPIs, filtros, click-through, export

### Gate Sprint 5 (WhatsApp + QA)
- [ ] Embedded Sign-Up funcional
- [ ] Chatbot: menu 3 opciones, captura datos, crea lead
- [ ] Chat manual en plataforma
- [ ] Envio proforma por WhatsApp
- [ ] Performance: <500ms p95, <2s LCP
- [ ] Security: sin vulnerabilidades OWASP Top 10
- [ ] UAT aprobado por usuarios piloto

---

## 13. RIESGOS Y MITIGACIONES

| Riesgo | Impacto | Mitigacion |
|--------|---------|------------|
| Meta API changes (WhatsApp) | Alto | Abstraer integracion, version pinning v21.0 |
| PDF rendering lento en serverless | Medio | Cache templates, chunking para muchos items |
| TRM API caida (datos.gov.co) | Bajo | Fallback a ultimo valor en cache |
| Complejidad semaforo (7 colores x N columnas) | Medio | Disenar data model eficiente, lazy loading |
| Volume audit_logs | Medio | Particionamiento mensual desde Sprint 0 |
| Permisos por campo (matrices complejas) | Alto | Implementar como config (no hardcoded), validar en API |

---

*Plan generado el 2026-02-11, actualizado el 2026-02-11 con alineacion al Template Figma (Fuente de Verdad Visual).*
*Cobertura: 19/19 HUs (100%) | 11/11 FASEs referenciadas | 4 agentes asignados*
*Branding: Cyan #00C8CF + Navy #161052 | Dark mode obligatorio | Framer Motion | Top nav bar | sonner toasts*
