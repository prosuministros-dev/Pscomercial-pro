# DOCUMENTO MAESTRO DE ARQUITECTURA

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Versión:** 1.0
**Fecha:** 2026-02-11
**Estado:** Diseño Completo - Pre-Implementación

---

## 1. VISIÓN GENERAL

### 1.1 Propósito del Sistema

Pscomercial-pro es un CRM/ERP comercial que digitaliza el pipeline completo de PROSUMINISTROS: desde la captación del lead por WhatsApp hasta la facturación final, eliminando la dependencia de Excel y centralizando toda la operación en una plataforma web multi-tenant.

### 1.2 Alcance Funcional

```
Lead → Cotización → Pedido → Compra → Recepción → Despacho → Facturación
  │        │            │         │          │          │          │
  ▼        ▼            ▼         ▼          ▼          ▼          ▼
WhatsApp  PDF/Email  Aprobación  Proveedor  Bodega   Logística  Contable
Chatbot   Margen     Operativa   OC         Control  Tracking   Cierre
```

### 1.3 Usuarios del Sistema

| Rol | Cantidad Est. | Módulos Principales |
|-----|:---:|---|
| Super Admin | 1 | Todos + Configuración |
| Gerente General | 1 | Dashboards, Reportes |
| Director Comercial | 1 | Pipeline, KPIs, Asignaciones |
| Gerente Comercial | 2-3 | Cotizaciones, Aprobaciones margen |
| Gerente Operativo | 1-2 | Pedidos, Logística, Trazabilidad |
| Asesor Comercial | 10-20 | Leads, Cotizaciones, Pedidos |
| Finanzas | 2-3 | Facturación, Reportes financieros |
| Compras | 2-3 | Órdenes de compra, Proveedores |
| Logística | 2-3 | Despachos, Tracking |
| Jefe Bodega | 1-2 | Recepción, Inventario |
| Auxiliar Bodega | 3-5 | Recepción, Inspección |
| Facturación | 2-3 | Facturas, Cierre |
| **Total estimado** | **~50** | |

---

## 2. STACK TECNOLÓGICO

### 2.1 Tecnologías Core

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| **Frontend** | Next.js (App Router) | 15.5.9 | SSR + RSC + API Routes |
| **UI Framework** | React | 19 | Server Components, Suspense |
| **Lenguaje** | TypeScript | 5.9.3 | Type safety end-to-end |
| **Estilos** | TailwindCSS | 4 | Utility-first, design tokens |
| **Componentes UI** | Shadcn/UI + Radix UI | Latest | Accesible, customizable |
| **Formularios** | React Hook Form + Zod | RHF 7 / Zod 3 | Validación tipada |
| **Tablas** | TanStack Table | 8 | Headless, server-side pagination |
| **Estado servidor** | TanStack Query | 5 | Cache, invalidation, optimistic |
| **Monorepo** | Turborepo + PNPM | Latest | Build cache, workspaces |
| **Backend** | Supabase | Cloud | PostgreSQL 15, Auth, Realtime, Storage |
| **Deployment** | Vercel | Pro | Edge + Serverless |
| **PDF** | @react-pdf/renderer | Latest | Serverless compatible (no Chromium) |
| **Email** | SendGrid API | v3 | Transactional + bulk |
| **WhatsApp** | Meta Cloud API | v21.0 | Embedded Sign-Up SDK |

### 2.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (CDN + Edge)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Next.js SSR  │  │  API Routes  │  │  Middleware (Edge)   │   │
│  │  (React 19)   │  │  (Serverless)│  │  Auth check only     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          │    ┌────────────┴────────────┐        │
          │    │    PostgREST (built-in)  │        │
          │    │    Connection Pooling    │        │
          │    └────────────┬────────────┘        │
          │                 │                     │
┌─────────┼─────────────────┼─────────────────────┼───────────────┐
│         ▼                 ▼                     ▼    SUPABASE    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PostgreSQL   │  │   Realtime   │  │     Auth (GoTrue)    │   │
│  │  15 + RLS     │  │  WebSocket   │  │   Cookie-based SSR   │   │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤   │
│  │   Storage     │  │Edge Functions│  │    Cron (pg_cron)    │   │
│  │   6 buckets   │  │  Background  │  │  Vistas materializad │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                                       │
          ▼                                       ▼
┌──────────────────┐                   ┌──────────────────┐
│   SendGrid API   │                   │  Meta Cloud API  │
│   (Email)        │                   │  (WhatsApp)      │
└──────────────────┘                   └──────────────────┘
```

---

## 3. ÍNDICE DE DOCUMENTOS DE ARQUITECTURA

Cada fase contiene diseño detallado con código, diagramas y decisiones técnicas.

### Documentos Principales

| # | Documento | Descripción | Archivo |
|---|----------|-------------|---------|
| **01** | Modelo de Datos y ER | 45 tablas, 14 dominios, relaciones, índices, SQL DDL | [FASE-01](FASE-01-Modelo-Datos-ER.md) |
| **02** | Arquitectura RBAC | 12 roles, 65 permisos, matriz, panel admin, seed | [FASE-02](FASE-02-Arquitectura-RBAC.md) |
| **03** | Backend y Middleware | Cookies, anti-timeout, API Routes, error handling | [FASE-03](FASE-03-Backend-Middleware.md) |
| **04** | RLS Supabase | Tenant isolation, data scope, policies, performance | [FASE-04](FASE-04-RLS-Supabase.md) |
| **05** | Arquitectura Frontend | Monorepo, módulos, componentes, hooks, estado | [FASE-05](FASE-05-Arquitectura-Frontend.md) |
| **06** | Funciones Centralizadas | 15 RPCs, 8 triggers, helpers TS, schemas Zod | [FASE-06](FASE-06-Funciones-Centralizadas.md) |
| **07** | Integraciones Externas | WhatsApp Embedded Sign-Up, chatbot, SendGrid | [FASE-07](FASE-07-Integraciones-Externas.md) |
| **08** | Storage Supabase | 6 buckets, folder structure, RLS policies, upload | [FASE-08](FASE-08-Storage-Supabase.md) |
| **09** | Generación PDF | @react-pdf/renderer, templates, API pattern | [FASE-09](FASE-09-Generacion-PDF.md) |
| **10** | Notificaciones y Audit | 3 canales, 15+ eventos, Realtime, audit trigger | [FASE-10](FASE-10-Notificaciones-AuditTrail.md) |
| **11** | Performance y Escalabilidad | Índices, cache, anti-timeout, cron, monitoreo | [FASE-11](FASE-11-Performance-Escalabilidad.md) |

---

## 4. MODELO DE DATOS (RESUMEN)

### 4.1 Dominios y Tablas (45 total)

| Dominio | Tablas | Descripción |
|---------|:---:|---|
| **Organizaciones y Usuarios** | 6 | organizations, profiles, roles, permissions, role_permissions, user_roles |
| **Clientes y Leads** | 4 | customers, customer_contacts, leads, lead_contacts |
| **Productos y Catálogo** | 4 | product_categories, products, margin_rules, trm_history |
| **Cotizaciones** | 4 | quotes, quote_items, quote_versions, margin_approvals |
| **Pedidos** | 5 | orders, order_items, order_status_history, tasks, task_assignments |
| **Compras** | 3 | suppliers, purchase_orders, po_items |
| **Logística** | 2 | shipments, shipment_items |
| **Facturación** | 2 | invoices, invoice_items |
| **Licencias** | 1 | license_records |
| **WhatsApp** | 4 | whatsapp_accounts, whatsapp_conversations, whatsapp_messages, whatsapp_templates |
| **Notificaciones** | 3 | notifications, notification_preferences, comments |
| **Auditoría y Config** | 4 | audit_logs, system_settings, email_templates, email_logs |
| **Trazabilidad** | 1 | order_traceability (vista) |
| **Reportes** | 2 | report_definitions, saved_filters |

### 4.2 Flujo de Estados Principal

```
LEAD                    COTIZACIÓN                    PEDIDO
┌──────────┐           ┌─────────────────┐           ┌──────────────────┐
│ Creado   │──────────▶│ Creación Oferta │──────────▶│ Creado           │
│ Pendiente│           │ Negociación     │           │ En proceso       │
│ Convertido│          │ Riesgo          │           │ Compra aprobada  │
└──────────┘           │ Pendiente OC    │           │ OC enviada       │
                       │ Ganada ✓        │           │ Mercancía recibida│
                       │ Perdida ✗       │           │ En despacho      │
                       └─────────────────┘           │ Entregado        │
                                                     │ Facturado ✓      │
                                                     └──────────────────┘
```

> **Detalle completo:** [FASE-01-Modelo-Datos-ER.md](FASE-01-Modelo-Datos-ER.md)

---

## 5. RBAC (RESUMEN)

### 5.1 Matriz de Roles y Módulos

| Módulo | Super Admin | Ger. General | Dir. Comercial | Ger. Comercial | Ger. Operativo | Asesor | Finanzas | Compras | Logística | Bodega | Facturación |
|--------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Dashboard | FULL | FULL | FULL | FULL | FULL | OWN | VIEW | VIEW | VIEW | VIEW | VIEW |
| Leads | FULL | VIEW | FULL | FULL | - | CRU* | - | - | - | - | - |
| Cotizaciones | FULL | VIEW | FULL | FULL | VIEW | CRU* | - | - | - | - | - |
| Pedidos | FULL | VIEW | VIEW | VIEW | FULL | CRU* | VIEW | VIEW | VIEW | VIEW | VIEW |
| Compras | FULL | VIEW | - | - | VIEW | - | - | FULL | - | - | - |
| Logística | FULL | VIEW | - | - | FULL | VIEW | - | - | FULL | FULL | - |
| Facturación | FULL | VIEW | - | - | VIEW | VIEW | FULL | - | - | - | FULL |
| Clientes | FULL | VIEW | FULL | FULL | VIEW | CRU* | - | - | - | - | - |
| Productos | FULL | VIEW | VIEW | FULL | VIEW | VIEW | - | FULL | - | - | - |
| Reportes | FULL | FULL | FULL | FULL | FULL | OWN | FULL | OWN | OWN | - | OWN |
| WhatsApp | FULL | VIEW | FULL | FULL | - | CRU | - | - | - | - | - |
| Admin | FULL | - | - | - | - | - | - | - | - | - | - |

*CRU = Create, Read, Update (no Delete) | *OWN = Solo propios

### 5.2 Arquitectura de 3 Capas

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   API ROUTES    │    │   SUPABASE RLS  │
│                 │    │                 │    │                 │
│ PermissionGate  │───▶│ checkPermission │───▶│ Tenant isolation│
│ usePermissions  │    │ withPermission  │    │ Data scope      │
│ Nav filtering   │    │ Business rules  │    │ (read policies) │
│                 │    │                 │    │                 │
│ UI visibility   │    │ Authorization   │    │ Data access     │
│ only            │    │ enforcement     │    │ enforcement     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

> **Detalle completo:** [FASE-02-Arquitectura-RBAC.md](FASE-02-Arquitectura-RBAC.md)

---

## 6. BACKEND Y MIDDLEWARE (RESUMEN)

### 6.1 Autenticación

- **Método:** Cookie-based con `@supabase/ssr`
- **Middleware Edge:** Solo verifica sesión activa (~5ms), redirige a login si no hay sesión
- **3 clientes Supabase:** Browser (client components), Server (RSC + API Routes), Service (admin/cron)
- **NO se verifican permisos en Edge** (solo en API Routes)

### 6.2 API Routes (~30 endpoints)

```
app/api/
├── auth/callback/route.ts           # OAuth callback
├── leads/route.ts                   # CRUD leads
├── quotes/route.ts                  # CRUD cotizaciones
├── quotes/[id]/approve-margin/      # Aprobación de margen
├── quotes/[id]/pdf/                 # Generar PDF
├── orders/route.ts                  # CRUD pedidos
├── orders/[id]/status/              # Cambio de estado
├── purchase-orders/route.ts         # Órdenes de compra
├── shipments/route.ts               # Despachos
├── invoices/route.ts                # Facturas
├── products/route.ts                # Catálogo
├── customers/route.ts               # Clientes
├── whatsapp/webhook/route.ts        # Webhook Meta
├── whatsapp/send/route.ts           # Enviar mensaje
├── notifications/route.ts           # Notificaciones
├── exports/[entity]/route.ts        # Exportaciones CSV
├── cron/[job]/route.ts              # Cron jobs
└── health/route.ts                  # Health check
```

### 6.3 Anti-Timeout Patterns

| Patrón | Uso | Límite |
|--------|-----|--------|
| **Chunking** | Actualizaciones masivas | 50 items/chunk |
| **Streaming** | Exportaciones CSV | Sin límite |
| **Edge Functions** | Emails masivos, background | 400s |
| **Vercel Cron** | Expiración, refrescos, alertas | Diario/cada 15min |

> **Detalle completo:** [FASE-03-Backend-Middleware.md](FASE-03-Backend-Middleware.md)

---

## 7. RLS SUPABASE (RESUMEN)

### 7.1 Estrategia: RLS = Tenant Isolation

```
┌─────────────────────────────────────────────────┐
│  RLS NO verifica permisos granulares.            │
│  RLS SOLO garantiza que:                         │
│  1. Un usuario solo ve datos de SU organización  │
│  2. Data scope (all/own) para tablas de negocio  │
│  3. Reglas especiales (notificaciones, comments) │
└─────────────────────────────────────────────────┘
```

### 7.2 Responsabilidad por Capa

| Capa | Responsabilidad | Ejemplo |
|------|----------------|---------|
| **RLS** | Tenant isolation + data scope | `organization_id = auth.get_user_org_id()` |
| **API** | Permisos, validación de negocio | `checkPermission('quotes:create')` |
| **Frontend** | Visibilidad UI (cosmético) | `<PermissionGate permission="quotes:create">` |
| **Triggers** | Consecutivos, auditoría, cálculos | `auto_assign_lead()`, `audit_trail_fn()` |

> **Detalle completo:** [FASE-04-RLS-Supabase.md](FASE-04-RLS-Supabase.md)

---

## 8. FRONTEND (RESUMEN)

### 8.1 Estructura Monorepo

```
Pscomercial-pro/
├── apps/
│   └── web/                          # Next.js 15 App
│       ├── app/
│       │   ├── (auth)/               # Login, registro
│       │   ├── (dashboard)/          # Layout con sidebar
│       │   │   ├── leads/            # Módulo Leads
│       │   │   ├── quotes/           # Módulo Cotizaciones
│       │   │   ├── orders/           # Módulo Pedidos
│       │   │   ├── ...               # Otros módulos
│       │   │   └── admin/            # Configuración
│       │   └── api/                  # API Routes
│       └── components/               # Componentes de la app
├── packages/
│   ├── ui/                           # Shadcn/UI components
│   ├── supabase/                     # Supabase clients + hooks
│   ├── features/                     # Business logic (hooks, schemas)
│   └── shared/                       # Utils, types, constants
```

### 8.2 Módulos (12)

| # | Módulo | Rutas | Componentes Clave |
|---|--------|-------|-------------------|
| 1 | Dashboard | `/` | KPI cards, pipeline chart, semáforo tareas |
| 2 | Leads | `/leads` | Kanban, tabla, formulario, timeline |
| 3 | Cotizaciones | `/quotes` | Tabla items con TRM, PDF preview, margen |
| 4 | Pedidos | `/orders` | Stepper estados, trazabilidad, tareas |
| 5 | Compras | `/purchase-orders` | OC desde pedido, tracking proveedor |
| 6 | Logística | `/shipments` | Despachos, tracking, confirmación entrega |
| 7 | Facturación | `/invoices` | Generación desde pedido entregado |
| 8 | Clientes | `/customers` | CRUD, contactos múltiples, historial |
| 9 | Productos | `/products` | Catálogo, márgenes, TRM |
| 10 | WhatsApp | `/whatsapp` | Chat, chatbot config, templates |
| 11 | Reportes | `/reports` | Builder, gráficos, exportación |
| 12 | Admin | `/admin` | Roles, usuarios, bitácora, config |

> **Detalle completo:** [FASE-05-Arquitectura-Frontend.md](FASE-05-Arquitectura-Frontend.md)

---

## 9. FUNCIONES CENTRALIZADAS (RESUMEN)

### 9.1 Catálogo de RPCs (15)

| Función | Descripción |
|---------|-------------|
| `get_user_permissions(user_id)` | Permisos consolidados del usuario |
| `has_permission(user_id, permission)` | Verificación rápida booleana |
| `auto_assign_lead(org_id, lead_id)` | Asignación balanceada a asesor |
| `create_quote_from_lead(lead_id)` | Crea cotización con datos del lead |
| `calculate_quote_totals(quote_id)` | Recalcula subtotal, IVA, total |
| `request_margin_approval(quote_id)` | Solicita aprobación de margen bajo |
| `create_order_from_quote(quote_id)` | Crea pedido desde cotización ganada |
| `update_order_status(order_id, status)` | Cambia estado con validación de flujo |
| `get_order_traceability(order_id)` | Timeline completa del pedido |
| `get_operational_dashboard(org_id)` | KPIs operativos consolidados |
| `get_commercial_pipeline(org_id)` | Pipeline comercial con conteos |
| `generate_consecutive(org_id, type)` | Genera consecutivo thread-safe |
| `refresh_materialized_views()` | Refresca vistas materializadas |
| `get_audit_log(org_id, filters)` | Consulta bitácora con filtros |
| `get_current_trm()` | TRM vigente (cached) |

### 9.2 Triggers (8)

| Trigger | Tabla | Evento |
|---------|-------|--------|
| `audit_trail_fn` | 17 tablas de negocio | INSERT/UPDATE/DELETE |
| `notify_mentions` | comments | INSERT |
| `auto_assign_on_create` | leads | INSERT |
| `update_quote_totals` | quote_items | INSERT/UPDATE/DELETE |
| `create_status_history` | orders | UPDATE (status) |
| `validate_status_transition` | orders | UPDATE (status) |
| `expire_quotes_daily` | quotes (cron) | Scheduled |
| `send_expiry_notifications` | quotes | UPDATE (status → expired) |

> **Detalle completo:** [FASE-06-Funciones-Centralizadas.md](FASE-06-Funciones-Centralizadas.md)

---

## 10. INTEGRACIONES (RESUMEN)

### 10.1 WhatsApp (Meta Cloud API v21.0)

| Componente | Implementación |
|-----------|---------------|
| **Embedded Sign-Up** | SDK frontend para que cada organización conecte su propio número WhatsApp Business |
| **Chatbot** | State machine (6 estados): captura empresa, NIT, contacto, email, requerimiento → crea Lead |
| **Chat manual** | Panel con conversaciones Realtime, envío de templates aprobados |
| **Webhook** | `/api/whatsapp/webhook` recibe mensajes entrantes y status updates |
| **Proformas** | Envío de PDF como documento por WhatsApp al cliente |

### 10.2 SendGrid (API v3)

| Componente | Implementación |
|-----------|---------------|
| **Transaccional** | 7 templates: lead asignado, cotización, margen, pedido, despacho, factura, licencia |
| **Masivo** | Batches de 100, background job para >1,000 destinatarios |
| **Tracking** | Tabla `email_logs` con status via webhooks |
| **Multi-org** | Cada organización puede configurar su propio API key de SendGrid |

> **Detalle completo:** [FASE-07-Integraciones-Externas.md](FASE-07-Integraciones-Externas.md)

---

## 11. STORAGE (RESUMEN)

| Bucket | Acceso | Contenido |
|--------|--------|-----------|
| `organization-logos` | Público | Logos de organizaciones |
| `avatars` | Público | Fotos de perfil de usuarios |
| `documents` | Privado | Adjuntos de clientes, OC, RUT, etc. |
| `generated-pdfs` | Privado | Cotizaciones, proformas, OC generadas |
| `whatsapp-media` | Privado | Imágenes y documentos de WhatsApp |
| `comment-attachments` | Privado | Archivos adjuntos en comentarios |

> **Detalle completo:** [FASE-08-Storage-Supabase.md](FASE-08-Storage-Supabase.md)

---

## 12. GENERACIÓN PDF (RESUMEN)

- **Librería:** `@react-pdf/renderer` (JSX syntax, ~2MB, serverless compatible)
- **NO usar:** Puppeteer, Chromium, wkhtmltopdf (incompatibles con Vercel)
- **Templates:** Cotización, Proforma (sin precios internos), Orden de Compra
- **Flujo:** API Route → fetch datos → render PDF → upload a Storage → retornar URL
- **Personalización:** Logo de organización, colores de marca, datos fiscales

> **Detalle completo:** [FASE-09-Generacion-PDF.md](FASE-09-Generacion-PDF.md)

---

## 13. NOTIFICACIONES Y AUDITORÍA (RESUMEN)

### 13.1 Canales

| Canal | Tecnología | Uso |
|-------|-----------|-----|
| **Campanita (in-app)** | Supabase Realtime | Todas las notificaciones, tiempo real |
| **Email** | SendGrid | Leads asignados, cotizaciones, alertas críticas |
| **WhatsApp** | Meta Cloud API | Envío de proformas al cliente |

### 13.2 Audit Trail

- **Trigger genérico** `audit_trail_fn()` en 17 tablas de negocio
- **Calcula diffs** automáticamente en UPDATE (campo old vs new)
- **Particionamiento mensual** de `audit_logs` para performance
- **Panel admin** con filtros por entidad, usuario, acción, rango de fechas

> **Detalle completo:** [FASE-10-Notificaciones-AuditTrail.md](FASE-10-Notificaciones-AuditTrail.md)

---

## 14. PERFORMANCE (RESUMEN)

### 14.1 Objetivos

| Métrica | Objetivo |
|---------|----------|
| Transacciones/día/usuario | >1,000 |
| Tiempo respuesta API (p95) | <500ms |
| Tiempo carga página (LCP) | <2s |
| Usuarios concurrentes | 50 |

### 14.2 Estrategias

| Capa | Estrategia |
|------|-----------|
| **Database** | Índices compuestos, particionamiento audit_logs, materialized views |
| **Cache** | TanStack Query (4 niveles staleTime), HTTP cache CDN para datos estáticos |
| **API** | RPC consolidados (anti-N+1), chunking, streaming para exports |
| **Frontend** | Code splitting (dynamic import), virtualización listas, debounce búsquedas |
| **Background** | Supabase Edge Functions, Vercel Cron (6 jobs programados) |

### 14.3 Plan de Costos Estimado

| Fase | Usuarios | Costo/mes |
|------|:---:|---:|
| Lanzamiento | 1-50 | ~$45 |
| Crecimiento | 50-200 | ~$150 |
| Escala | 200-1000 | ~$800-1,500 |

> **Detalle completo:** [FASE-11-Performance-Escalabilidad.md](FASE-11-Performance-Escalabilidad.md)

---

## 15. DECISIONES ARQUITECTÓNICAS CLAVE

### 15.1 Decisiones Tomadas

| # | Decisión | Alternativas Evaluadas | Justificación |
|---|----------|----------------------|---------------|
| D01 | **Cookie-based auth** (no JWT en localStorage) | JWT localStorage, NextAuth | Seguro para SSR, HTTP-only cookies, @supabase/ssr nativo |
| D02 | **RLS solo para tenant isolation** (no permisos) | RLS para todo, sin RLS | Equilibrio entre seguridad y rendimiento; permisos en API |
| D03 | **PostgREST SDK** (no conexión PG directa) | pg Pool, Prisma, Drizzle | Built-in pooling, API REST eficiente, sin cold starts |
| D04 | **@react-pdf/renderer** (no Puppeteer) | pdf-lib, jsPDF, Puppeteer | JSX syntax, serverless compatible, buen output |
| D05 | **WhatsApp Embedded Sign-Up** (no número compartido) | Número fijo, Twilio | Requisito: cada org usa su propio número |
| D06 | **SendGrid** (no SES, no Resend) | Amazon SES, Resend, Mailgun | Madurez, templates dinámicos, webhooks |
| D07 | **TanStack Query** (no SWR, no Redux) | SWR, Redux Toolkit Query | Cache inteligente, mutations, optimistic updates |
| D08 | **Supabase Realtime** (no Pusher, no Socket.io) | Pusher, Ably, Socket.io | Integrado con Supabase, postgres_changes |
| D09 | **Turborepo monorepo** (no Nx, no Lerna) | Nx, Lerna, single repo | Liviano, build cache, PNPM workspaces |
| D10 | **App Router** (no Pages Router) | Pages Router, Remix | RSC, streaming, Server Actions |

### 15.2 Principios de Diseño

1. **Sin duplicidad de funciones:** Cada responsabilidad tiene una sola ubicación (DB, API, o Frontend)
2. **Multi-tenant by default:** Toda tabla tiene `organization_id`, todo query lo filtra
3. **Fail-safe permissions:** Si no hay permiso explícito, se deniega
4. **Serverless-first:** Todo diseñado para funcionar en Vercel + Supabase Cloud
5. **Progressive enhancement:** Funcionalidades core primero, integraciones después

---

## 16. TRAZABILIDAD HU → ARQUITECTURA

| HU | Título | Fases Relacionadas |
|----|--------|--------------------|
| HU-0001 | Registro de Leads | F01, F04, F05, F06, F07 |
| HU-0002 | Asignación de Leads | F01, F02, F06, F10 |
| HU-0003 | Validación y Creación Cotización | F01, F05, F06, F09 |
| HU-0004 | Gestión de Cotización y Márgenes | F01, F02, F06 |
| HU-0005 | Generación y Envío Proforma | F07, F08, F09 |
| HU-0006 | Generación Orden de Compra | F01, F06, F09 |
| HU-0007 | Gestión de Productos | F01, F05, F06 |
| HU-0008 | Creación de Pedido | F01, F05, F06 |
| HU-0009 | Trazabilidad de Pedido | F01, F05, F06, F10 |
| HU-0010 | Semáforo de Tareas | F01, F05, F10 |
| HU-0011 | Módulo Logística | F01, F05, F06 |
| HU-0012 | Módulo Facturación | F01, F05, F06 |
| HU-0013 | Dashboard Comercial | F01, F05, F06, F11 |
| HU-0014 | Dashboard Operativo | F01, F05, F06, F11 |
| HU-0015 | Reportes y Exportaciones | F05, F11 |
| HU-0016 | Roles y Permisos | F02, F04, F05 |
| HU-0017 | Gestión de Licencias | F01, F05, F10 |
| HU-0018 | WhatsApp Chatbot | F07 |
| HU-0019 | Chat Manual WhatsApp | F05, F07, F08 |
| HU-0020 | Configuración Sistema | F01, F02, F05 |

---

## 17. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Sprint 0: Fundación (2 semanas)

```
1. Setup monorepo (Turborepo + PNPM)
2. Configurar Supabase project (DEV + STG)
3. Ejecutar DDL completo (45 tablas)
4. Configurar RLS policies
5. Implementar auth con cookies (@supabase/ssr)
6. Layout base (sidebar, header, NotificationBell)
7. RBAC: PermissionProvider + usePermissions
8. Seed data: roles, permisos, usuario admin
```

### Sprint 1: Core Comercial (3 semanas)

```
9.  Módulo Clientes (CRUD + contactos)
10. Módulo Productos (catálogo + márgenes + TRM)
11. Módulo Leads (Kanban + tabla + formulario)
12. Auto-asignación de leads
13. Módulo Cotizaciones (items + cálculos + margen)
14. Generación PDF cotización
15. Aprobación de margen
```

### Sprint 2: Operativo (3 semanas)

```
16. Módulo Pedidos (creación desde cotización)
17. Cambio de estados (stepper)
18. Trazabilidad (timeline)
19. Semáforo de tareas
20. Módulo Compras (OC desde pedido)
21. Módulo Logística (despachos)
22. Módulo Facturación
```

### Sprint 3: Integraciones (2 semanas)

```
23. WhatsApp Embedded Sign-Up
24. Chatbot WhatsApp (state machine)
25. Chat manual WhatsApp
26. Envío proformas por WhatsApp
27. SendGrid: templates transaccionales
28. Notificaciones Realtime (campanita)
```

### Sprint 4: Dashboards y Admin (2 semanas)

```
29. Dashboard Comercial (KPIs + pipeline)
30. Dashboard Operativo (semáforo + tracking)
31. Reportes + exportación CSV
32. Panel Admin (roles, usuarios, bitácora)
33. Configuración del sistema
34. Gestión de licencias
```

### Sprint 5: Performance y QA (1 semana)

```
35. Vistas materializadas
36. Cron jobs (Vercel + pg_cron)
37. Particionamiento audit_logs
38. Load testing (>1000 tx/día/usuario)
39. Security review (OWASP Top 10)
40. UAT con usuarios piloto
```

**Total estimado: ~11 semanas** (con equipo de 2-3 desarrolladores)

---

## 18. VARIABLES DE ENTORNO REQUERIDAS

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jmevnusslcdaldtzymax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vercel
NEXT_PUBLIC_SITE_URL=https://pscomercial.vercel.app
CRON_SECRET=cron_secret_here

# WhatsApp Meta
META_APP_ID=123456789
META_APP_SECRET=abc123...
META_CONFIG_ID=config_id_here
WHATSAPP_VERIFY_TOKEN=verify_token_here

# SendGrid
SENDGRID_API_KEY=SG.xxxxx

# TRM (Banco de la República API o similar)
TRM_API_URL=https://www.datos.gov.co/resource/...
TRM_API_TOKEN=token_here
```

---

## 19. MÉTRICAS DE ARQUITECTURA

| Métrica | Valor |
|---------|-------|
| **Tablas de base de datos** | 45 |
| **Funciones RPC** | 15 |
| **Triggers** | 8 |
| **Políticas RLS** | ~90 (2 por tabla) |
| **Roles de usuario** | 12 |
| **Permisos únicos** | ~65 |
| **Módulos frontend** | 12 |
| **API Routes** | ~30 |
| **Buckets de storage** | 6 |
| **Cron jobs** | 6 |
| **Templates PDF** | 3 |
| **Templates email** | 7 |
| **Canales de notificación** | 3 |
| **Eventos que notifican** | 15+ |
| **Vistas materializadas** | 3 |
| **Historias de usuario** | 21 |
| **Documentos de arquitectura** | 11 fases |

---

*Documento generado como parte del análisis de arquitectura completo de Pscomercial-pro.*
*Cada fase contiene implementación detallada con código, diagramas y decisiones técnicas.*
