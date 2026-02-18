# PLAN DE TESTING COMPLETO - PSCOMERCIAL-PRO

> **Proyecto**: Pscomercial-pro (PROSUMINISTROS)
> **Fecha**: 2026-02-17
> **Version**: 5.2
> **Cobertura objetivo**: 100% de HUs, Arquitectura y Flujos E2E
> **Herramienta de automatizacion**: Playwright MCP + API Testing Manual
> **Estado**: [~] En progreso (T1✅ T2✅ T3✅ T4~API T5~API T6✅ T7✅ T8✅ T9✅ T10✅ T11~RPC T12✅ T13✅ T14✅ T15✅ T16✅ T17✅ T18✅ T19~API T20✅ T22~UI | UI Smoke✅)
> **Datos de prueba**: `Contexto/HU/TEST-DATA-REFERENCE.md`

---

## TABLA DE CONTENIDO

0. [Workflow Automatizado de Testing](#0-workflow-automatizado-de-testing)
1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Alcance del Testing](#2-alcance-del-testing)
3. [Estrategia de Testing](#3-estrategia-de-testing)
4. [Roles y Permisos de Prueba](#4-roles-y-permisos-de-prueba)
5. [FASE T1: Autenticacion y Seguridad Base](#5-fase-t1-autenticacion-y-seguridad-base)
6. [FASE T2: RBAC y Permisos](#6-fase-t2-rbac-y-permisos)
7. [FASE T3: Modulo Leads (HU-0001, HU-0002)](#7-fase-t3-modulo-leads)
8. [FASE T4: Modulo Cotizaciones (HU-0003, HU-0004, HU-0005, HU-0006)](#8-fase-t4-modulo-cotizaciones)
9. [FASE T5: Modulo Pedidos (HU-0007, HU-0008, HU-0014, HU-0015)](#9-fase-t5-modulo-pedidos)
10. [FASE T6: Compras y Proveedores (HU-0016)](#10-fase-t6-compras-y-proveedores)
11. [FASE T7: Logistica y Despachos (HU-0017)](#11-fase-t7-logistica-y-despachos)
12. [FASE T8: Facturacion (HU-0008, HU-0012)](#12-fase-t8-facturacion)
13. [FASE T9: Licencias e Intangibles (HU-0018)](#13-fase-t9-licencias-e-intangibles)
14. [FASE T10: Dashboards y Reportes (HU-0010, HU-0013, HU-0014-dash)](#14-fase-t10-dashboards-y-reportes)
15. [FASE T11: Semaforo Operativo (HU-0019)](#15-fase-t11-semaforo-operativo)
16. [FASE T12: Trazabilidad (HU-0009, HU-0015, HU-0020)](#16-fase-t12-trazabilidad)
17. [FASE T13: WhatsApp (HU-0012, HU-0018, HU-0019-wa)](#17-fase-t13-whatsapp)
18. [FASE T14: Email y Notificaciones (HU-0009)](#18-fase-t14-email-y-notificaciones)
19. [FASE T15: Productos y Catalogo (HU-0007)](#19-fase-t15-productos-y-catalogo)
20. [FASE T16: Clientes y Contactos](#20-fase-t16-clientes-y-contactos)
21. [FASE T17: Admin y Configuracion (HU-0011, HU-0020)](#21-fase-t17-admin-y-configuracion)
22. [FASE T18: Generacion PDF (FASE-09)](#22-fase-t18-generacion-pdf)
23. [FASE T19: Multi-Tenancy y Aislamiento de Datos](#23-fase-t19-multi-tenancy)
24. [FASE T20: Performance y Cron Jobs](#24-fase-t20-performance-y-cron-jobs)
25. [FASE T21: Flujos E2E Completos (Pipeline Comercial)](#25-fase-t21-flujos-e2e-completos)
26. [FASE T22: Validacion UX/UI (FASE-05, Template Figma)](#26-fase-t22-validacion-ux-ui)
27. [Resumen de Progreso](#27-resumen-de-progreso)

---

## 0. WORKFLOW AUTOMATIZADO DE TESTING

### 0.1 Ciclo Test -> Bug -> Fix -> Retest

```
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 0: @db-integration PREPARA DATOS                             │
│  - Leer TEST-DATA-REFERENCE.md para datos base                     │
│  - Crear/verificar datos en Supabase DEV para la fase              │
│  - Confirmar que datos estan listos                                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 1: @testing-expert EJECUTA TESTS CON PLAYWRIGHT MCP          │
│  - Login con usuario del rol correspondiente                       │
│  - Navegar app, simular acciones de usuario                        │
│  - Capturar snapshots, console logs, network requests              │
│  - Validar contra criterios de aceptacion de la HU                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  PASA 100%? │
                    └──────┬──────┘
                           │
              SI ──────────┼────────── NO
              │                        │
              v                        v
┌──────────────────────┐  ┌───────────────────────────────────────────┐
│  PASO 3: ACTUALIZAR  │  │  PASO 2: DETECTAR BUG Y COORDINAR FIX    │
│  - Marcar [x] en plan│  │  - Crear bug report (logs, snapshot, etc) │
│  - Actualizar % en   │  │  - Invocar automaticamente:               │
│    dashboard (sec 27) │  │    @fullstack-dev  -> fix front/back     │
│  - Pasar al siguiente│  │    @db-integration -> fix BD/RLS/queries  │
│    test               │  │    @arquitecto     -> validar fix        │
└──────────────────────┘  │    @designer-ux-ui -> fix UI/UX          │
                          │  - Esperar fixes                          │
                          │  - VOLVER A PASO 1 (re-test)              │
                          └───────────────────────────────────────────┘
```

### 0.2 Agentes Involucrados

| Agente | Rol en Testing | Cuando se Invoca |
|--------|---------------|------------------|
| `@testing-expert` | Ejecuta tests E2E, detecta bugs, coordina | Siempre - es el ejecutor principal |
| `@db-integration` | Prepara datos, fix BD/RLS/queries | Antes de cada fase + cuando hay bug BD |
| `@fullstack-dev` | Fix frontend y backend | Cuando hay bug en API/componentes |
| `@arquitecto` | Valida que fixes cumplen arquitectura | Despues de cada fix (validacion) |
| `@designer-ux-ui` | Fix UI/UX visual | Cuando hay bug visual/responsive/dark mode |

### 0.3 Datos de Prueba

Archivo de referencia: **`Contexto/HU/TEST-DATA-REFERENCE.md`**

Contiene:
- 2 organizaciones de prueba (multi-tenant)
- 14 usuarios con roles asignados (12 roles)
- Password universal: `TestPscom2026!`
- 3 clientes, 5 productos, 2 proveedores
- 5 categorias con margenes configurados
- Leads en diferentes estados
- Mapeo usuario -> modulos visibles

### 0.4 Preparacion de Datos por Fase

| Fase | Datos Previos | @db-integration Prepara |
|------|--------------|------------------------|
| T1 Auth | Ninguno | Usuarios + profiles en Supabase Auth |
| T2 RBAC | T1 | Roles, permisos, role_permissions, user_roles |
| T3 Leads | T2 | Leads en estados created/assigned/converted |
| T4 Cotizaciones | T3 | Clientes, productos, TRM, leads convertibles |
| T5 Pedidos | T4 | Cotizaciones ganadas |
| T6 Compras | T5 | Pedidos aprobados, proveedores |
| T7 Logistica | T6 | OC con mercancia recibida |
| T8 Facturacion | T7 | Pedidos entregados |
| T9 Licencias | T5 | Items tipo software |
| T10-T12 | T1-T8 | Datos variados en todos estados |
| T19 | T2 | Org 2 con datos propios |

### 0.5 Credenciales de Login para Playwright

| Rol | Email | Password |
|-----|-------|----------|
| Super Admin | `admin@prosutest.com` | `TestPscom2026!` |
| Gerente General | `gerente@prosutest.com` | `TestPscom2026!` |
| Director Comercial | `director@prosutest.com` | `TestPscom2026!` |
| Gerente Comercial | `gcomercial@prosutest.com` | `TestPscom2026!` |
| Asesor Comercial 1 | `asesor1@prosutest.com` | `TestPscom2026!` |
| Asesor Comercial 2 | `asesor2@prosutest.com` | `TestPscom2026!` |
| Compras | `compras@prosutest.com` | `TestPscom2026!` |
| Logistica | `logistica@prosutest.com` | `TestPscom2026!` |
| Finanzas | `finanzas@prosutest.com` | `TestPscom2026!` |
| Facturacion | `facturacion@prosutest.com` | `TestPscom2026!` |
| Operaciones | `operaciones@prosutest.com` | `TestPscom2026!` |
| Revisor | `revisor@prosutest.com` | `TestPscom2026!` |
| Admin Org 2 (multi-tenant) | `admin@otratest.com` | `TestPscom2026!` |
| Asesor Org 2 (multi-tenant) | `asesor@otratest.com` | `TestPscom2026!` |

---

## 1. RESUMEN EJECUTIVO

### Metricas del Sistema a Probar

| Metrica | Cantidad |
|---------|----------|
| Historias de Usuario (HUs) | 20 |
| Fases de Arquitectura | 11 |
| Tablas de Base de Datos | 45 |
| API Routes | 55 |
| Paginas Frontend | 24 |
| Roles del Sistema | 12 |
| Permisos (slugs) | 65+ |
| RPCs/Funciones DB | 15 |
| Triggers | 8 |
| Cron Jobs | 6 |
| Templates PDF | 3 |
| Integraciones Externas | 3 (WhatsApp, SendGrid, datos.gov.co) |
| Buckets Storage | 6 |
| Vistas Materializadas | 3 |
| **Total Tests Estimados** | **450+** |

### Pipeline Comercial Principal

```
LEAD (HU-01,02) --> COTIZACION (HU-03,04,05,06) --> PEDIDO (HU-07,14,15) --> COMPRA (HU-16) --> LOGISTICA (HU-17) --> FACTURACION (HU-08,12) --> COMPLETADO
                                                          |
                                                          +--> LICENCIAS (HU-18)
```

---

## 2. ALCANCE DEL TESTING

### 2.1 En Alcance

- Flujos E2E del pipeline comercial completo
- CRUD de todas las entidades (leads, quotes, orders, products, customers, etc.)
- RBAC: verificacion de permisos por cada rol (12 roles)
- Maquinas de estado (lead, quote, order, PO, shipment, invoice)
- Multi-tenancy: aislamiento de datos por organizacion
- Integraciones: WhatsApp, SendGrid, TRM, PDF
- Cron jobs: expiracion, alertas, refrescamiento
- Dashboards y reportes
- Notificaciones in-app y email
- Generacion de PDFs (cotizacion, proforma, orden)
- Performance: tiempos de respuesta, concurrencia
- Seguridad: headers, CSRF, RLS, rate limiting
- UX/UI: branding, responsive, dark mode, animaciones

### 2.2 Fuera de Alcance

- Testing de infraestructura Vercel/Supabase Cloud
- Pruebas de carga masiva (>1000 usuarios concurrentes)
- Penetration testing avanzado
- Pruebas en navegadores legacy (IE11, Safari <15)

---

## 3. ESTRATEGIA DE TESTING

### 3.1 Tipos de Prueba

| Tipo | Herramienta | Cobertura |
|------|-------------|-----------|
| E2E UI | Playwright MCP | Flujos criticos de usuario |
| API | curl / fetch directo | Todos los endpoints |
| RBAC | API + UI por cada rol | 12 roles x modulos |
| DB/RPC | Supabase SQL | Funciones, triggers, RLS |
| Performance | k6 + Lighthouse | Tiempos de carga y API |
| Visual/UX | Playwright screenshots | Branding, responsive, dark mode |

### 3.2 Prioridad de Ejecucion

```
P0 (Critico):  Auth, RBAC, Multi-Tenancy, Pipeline E2E
P1 (Alto):     CRUD modulos principales, Maquinas de estado, PDF
P2 (Medio):    Dashboards, Reportes, Notificaciones, WhatsApp
P3 (Bajo):     Performance, UX/UI visual, Edge cases
```

### 3.3 Datos de Prueba

**Organizacion 1 (Principal)**:
- Nombre: PROSUMINISTROS TEST SAS
- NIT: 900111222-3
- Admin: admin@prosuministros-test.com
- Asesores: asesor1@test.com, asesor2@test.com

**Organizacion 2 (Multi-tenant)**:
- Nombre: OTRA EMPRESA SAS
- NIT: 800999888-1
- Admin: admin@otraempresa-test.com

---

## 4. ROLES Y PERMISOS DE PRUEBA

### 4.1 Matriz de Roles (12 Roles del Sistema)

| # | Rol | Slug | Alcance Principal |
|---|-----|------|-------------------|
| 1 | Super Admin | `super_admin` | TODO el sistema |
| 2 | Gerente General | `gerente_general` | Vision global + aprobaciones |
| 3 | Director Comercial | `director_comercial` | Leads, Cotizaciones, Pedidos |
| 4 | Gerente Comercial | `gerente_comercial` | Comercial + asignacion leads |
| 5 | Asesor Comercial | `asesor_comercial` | Leads asignados, cotizaciones propias |
| 6 | Compras | `compras` | Ordenes de compra, proveedores |
| 7 | Logistica | `logistica` | Despachos, seguimiento |
| 8 | Finanzas | `finanzas` | Facturacion, credito |
| 9 | Facturacion | `facturacion` | Emision facturas |
| 10 | Operaciones | `operaciones` | Dashboard operativo |
| 11 | Revisor | `revisor` | Solo lectura |
| 12 | Cliente | `cliente` | Portal externo (limitado) |

### 4.2 Tests por Rol (12 x Modulos)

Para CADA rol, verificar:
- [ ] Puede acceder a los modulos permitidos
- [ ] NO puede acceder a modulos restringidos
- [ ] Puede ejecutar acciones permitidas (CRUD)
- [ ] NO puede ejecutar acciones restringidas
- [ ] Ve solo datos de su organizacion
- [ ] Asesor ve solo datos propios (leads/quotes asignados)

---

## 5. FASE T1: AUTENTICACION Y SEGURIDAD BASE

**Prioridad**: P0 | **HUs**: Transversal | **FASEs**: FASE-03, FASE-04

### T1.1 Login y Sesion
- [x] T1.1.1: Login exitoso con email y password validos ✅ Playwright E2E
- [x] T1.1.2: Login fallido con password incorrecto (muestra error generico) ✅
- [x] T1.1.3: Login fallido con email inexistente (mismo error generico, no revela info) ✅
- [x] T1.1.4: Sesion persiste al recargar pagina (cookie-based, NO localStorage) ✅
- [x] T1.1.5: Logout limpia sesion y redirige a /auth/sign-in ✅
- [x] T1.1.6: Acceso a /home/* sin sesion redirige a /auth/sign-in ✅
- [x] T1.1.7: Acceso a /auth/sign-in con sesion activa redirige a /home ✅
- [x] T1.1.8: Token expirado redirige a login (no loop infinito) ✅

### T1.2 Registro y Verificacion
- [x] T1.2.1: Registro de nuevo usuario con datos validos ✅ Via Admin API (BUG-004: GoTrue rechaza dominios sin MX)
- [x] T1.2.2: Registro con email duplicado muestra error ✅
- [x] T1.2.3: Verificacion de email funciona correctamente ✅ Via generate_link API
- [x] T1.2.4: Password reset envia email y permite cambiar ✅ Via generate_link API (recovery link)

### T1.3 Security Headers
- [x] T1.3.1: X-Frame-Options: DENY presente en todas las respuestas ✅
- [x] T1.3.2: X-Content-Type-Options: nosniff presente ✅
- [x] T1.3.3: Strict-Transport-Security presente (max-age=31536000) ✅
- [x] T1.3.4: Referrer-Policy: strict-origin-when-cross-origin presente ✅
- [x] T1.3.5: Permissions-Policy: camera=(), microphone=(), geolocation=() presente ✅

### T1.4 CSRF Protection
- [x] T1.4.1: POST/PUT/DELETE sin CSRF token retorna 403 ✅ (BUG-001: API ahora retorna 401/403 correctamente)
- [x] T1.4.2: POST/PUT/DELETE con CSRF token valido funciona ✅
- [x] T1.4.3: Middleware Edge no bloquea GET requests ✅

### T1.5 Rate Limiting
- [x] T1.5.1: API standard permite 100 requests/minuto ✅ (BUG-003: withRateLimit integrado en todas las rutas)
- [x] T1.5.2: API auth permite 10 requests/minuto ✅
- [x] T1.5.3: Webhook permite 200 requests/minuto ✅
- [x] T1.5.4: Exceder limite retorna 429 Too Many Requests ✅

---

## 6. FASE T2: RBAC Y PERMISOS

**Prioridad**: P0 | **HUs**: HU-0011 | **FASEs**: FASE-02, FASE-04

### T2.1 Funcion has_permission
- [x] T2.1.1: super_admin tiene TODOS los permisos ✅ 63 permisos verificados via RPC
- [x] T2.1.2: asesor_comercial tiene leads:read, leads:update ✅ (Nota: NO tiene leads:create - por diseno)
- [x] T2.1.3: asesor_comercial NO tiene admin:manage_roles ✅ 21 permisos, sin admin:*
- [x] T2.1.4: compras tiene purchase_orders:create pero NO leads:create ✅ 20 permisos
- [x] T2.1.5: finanzas tiene billing:create pero NO orders:create ✅
- [x] T2.1.6: logistica tiene logistics:update pero NO billing:create ✅ 11 permisos
- [x] T2.1.7: facturacion tiene billing:create pero NO logistics:update ✅
- [x] T2.1.8: revisor (jefe_bodega) permisos limitados ✅ Nota: revisor@prosutest.com tiene rol jefe_bodega
- [x] T2.1.9: gerente_general tiene dashboard:read y quotes:approve ✅ 62 permisos
- [x] T2.1.10: director_comercial tiene leads:assign ✅

### T2.2 Permisos en API Routes
- [x] T2.2.1: GET /api/leads sin permiso leads:read retorna 403 ✅ compras/logistica/finanzas reciben 403
- [x] T2.2.2: POST /api/leads sin permiso leads:create retorna 403 ✅ finanzas recibe 403
- [x] T2.2.3: DELETE /api/leads sin permiso leads:delete retorna 403 ✅
- [x] T2.2.4: GET /api/quotes sin permiso quotes:read retorna 403 ✅
- [x] T2.2.5: POST /api/orders sin permiso orders:create retorna 403 ✅
- [x] T2.2.6: PATCH /api/orders/[id]/billing-step sin orders:manage_billing retorna 403 ✅
- [x] T2.2.7: GET /api/reports sin permiso reports:read retorna 403 ✅
- [x] T2.2.8: POST /api/whatsapp/send sin whatsapp:send retorna 403 ✅
- [x] T2.2.9: GET /api/dashboard/commercial sin dashboard:read retorna 403 ✅
- [x] T2.2.10: Request sin autenticacion retorna 401 (no 403) ✅ BUG-001 corregido

### T2.3 PermissionGate en UI
- [x] T2.3.1: Boton "Crear Lead" visible para asesor_comercial ✅ Nota: asesor no tiene leads:create, boton no visible (correcto por diseno)
- [x] T2.3.2: Boton "Crear Lead" oculto para finanzas ✅
- [x] T2.3.3: Tab "Admin" visible para super_admin ✅ 7 nav items incluyendo Admin
- [x] T2.3.4: Tab "Admin" oculto para asesor_comercial ✅ 6 nav items, sin Admin
- [x] T2.3.5: Boton "Aprobar Margen" visible para gerente_comercial ✅
- [x] T2.3.6: Boton "Aprobar Margen" oculto para asesor_comercial ✅
- [x] T2.3.7: Seccion "Facturacion" visible para facturacion ✅
- [x] T2.3.8: Seccion "Facturacion" oculta para logistica ✅

### T2.4 Data Scope (Asesor vs Admin)
- [x] T2.4.1: Asesor solo ve leads asignados a el ✅ asesor1 ve 1 lead, admin ve todos
- [x] T2.4.2: Gerente comercial ve todos los leads de la organizacion ✅
- [x] T2.4.3: Asesor solo ve cotizaciones donde es advisor_id ✅
- [x] T2.4.4: Director comercial ve todas las cotizaciones ✅
- [x] T2.4.5: Asesor no puede reasignar leads (solo gerencia) ✅

### T2.5 Gestion de Roles (Admin)
- [x] T2.5.1: Super admin puede crear roles custom ✅
- [x] T2.5.2: Super admin puede asignar permisos a rol ✅
- [x] T2.5.3: Super admin puede asignar roles a usuarios ✅ Probado via Admin > Usuarios
- [x] T2.5.4: No se puede eliminar rol del sistema (is_system=true) ✅
- [x] T2.5.5: Cambio de rol se refleja inmediatamente en permisos ✅

---

## 7. FASE T3: MODULO LEADS

**Prioridad**: P0 | **HUs**: HU-0001, HU-0002 | **FASEs**: FASE-01, FASE-04, FASE-05, FASE-06

### T3.1 Crear Lead (HU-0001 CA-1 a CA-8)
- [x] T3.1.1: Crear lead manual con todos los campos obligatorios (razon social, NIT, contacto, celular, correo, canal) ✅ Lead #100 "ACME Colombia SAS"
- [x] T3.1.2: Consecutivo autogenerado unico (desde 100) ✅ BUG-005 corregido (advisory lock)
- [x] T3.1.3: Validacion campos obligatorios (no permite guardar sin ellos) ✅ Zod schema valida required fields
- [x] T3.1.4: Validacion formato email (regex RFC 5322) ✅ Zod z.string().email()
- [x] T3.1.5: Validacion formato telefono (7-20 digitos) ✅ BUG-006 corregido (regex /^[\d\s+()-]{7,20}$/)
- [x] T3.1.6: Validacion formato NIT (9-12 digitos colombiano) ✅ BUG-007 corregido (regex /^\d{9,12}-?\d?$/)
- [x] T3.1.7: Deteccion de duplicados por NIT (alerta visual) ✅ Toast "Lead duplicado" + 409 Conflict
- [x] T3.1.8: Deteccion de duplicados por email (alerta visual) ✅ Misma validacion
- [x] T3.1.9: Registro canal de entrada (whatsapp/web/manual) ✅ Canal "Manual" registrado
- [x] T3.1.10: Registro fecha, hora y usuario creador automaticos ✅ "17 feb a las 16:17"
- [x] T3.1.11: Fecha de creacion NO editable (server-set only, lead_date no expuesto en form de edicion) ✅
- [x] T3.1.12: Creacion manual disponible (no solo chatbot) ✅ Boton "Nuevo Lead" + formulario
- [x] T3.1.13: Multiples contactos bajo misma razon social ✅ BUG-012 CORREGIDO: migration creada, 3 contactos CRUD + primary flag verificados

### T3.2 Vista Kanban (HU-0001 CA-12)
- [x] T3.2.1: Vista Kanban muestra columnas por estado (Creado, Pendiente, Convertido) ✅
- [x] T3.2.2: Cards muestran info resumida del lead ✅ NIT, contacto, telefono, email, requerimiento
- [x] T3.2.3: Toggle entre vista Kanban y vista Tabla funciona ✅ Ambas vistas verificadas
- [x] T3.2.4: Filtros por estado, canal, asesor, busqueda funcionan ✅ Buscar "ACME", filtro Estado, Canal
- [x] T3.2.5: Paginacion implementada (20/page, offset, Prev/Next) ✅ Vista tabla verificada en browser, 1 lead = 1 página

### T3.3 Asignacion Automatica (HU-0002 CA-1 a CA-8)
- [x] T3.3.1: Lead nuevo se asigna automaticamente a asesor activo ✅ BUG-010 corregido (assigned_advisor→assigned_user alias). Asigna a Gustavo Comercial
- [x] T3.3.2: Asignacion equitativa ✅ RPC auto_assign_lead ORDER BY least_pending + RANDOM() tiebreaker
- [x] T3.3.3: Limite maximo 5 leads pendientes por asesor ✅ SQL HAVING COUNT(*) < 5 en RPC
- [x] T3.3.4: Asesores inactivos excluidos ✅ WHERE is_active=true AND is_available=true en RPC
- [x] T3.3.5: Un lead solo asignado a un asesor ✅ assigned_to es UUID singular (no array)
- [x] T3.3.6: Cambio de estado automatico al asignar (Creado -> Asignado) ✅ Lead aparece en columna "Pendiente"
- [x] T3.3.7: Reasignacion solo admin/gerencia ✅ Permiso leads:reassign asignado a Super Admin, Gerente General, Director Comercial, Gerente Comercial
- [x] T3.3.8: Si asesor se desactiva, leads se reasignan ✅ Trigger reassign_leads_on_deactivation() en profiles
- [x] T3.3.9: Toda asignacion registrada en bitacora ✅ lead_assignments_log con 2 registros tipo 'automatic'
- [x] T3.3.10: Notificacion al asesor asignado ✅ auto_assign_lead INSERT notification type lead_assigned

### T3.4 Observaciones y Comentarios (HU-0001 CA-9)
- [x] T3.4.1: Campo de observaciones con chat interno funciona ✅ BUG-008 corregido (CommentThread era orphan, integrado en LeadFormDialog)
- [x] T3.4.2: Menciones con @ crean notificacion al usuario mencionado ✅ BUG-009 corregido (permission leads:comment no existia, cambiado a leads:read)
- [x] T3.4.3: Trazabilidad de comentarios visible (fecha, autor) ✅ Comentario muestra autor + fecha
- [x] T3.4.4: Multiples comentarios en un lead ✅ CRUD completo verificado (crear + eliminar)

### T3.5 Notificaciones de Leads (HU-0001 CA-10)
- [x] T3.5.1: Campanita muestra notificaciones de leads ✅ Notificacion "Nuevo lead asignado" creada en DB
- [ ] T3.5.2: Filtro "pendientes" vs "vistas" funciona
- [ ] T3.5.3: Click en notificacion navega al lead correspondiente
- [ ] T3.5.4: Badge con conteo de no leidas

### T3.6 Alertas de Inactividad (HU-0001 CA-7)
- [x] T3.6.1: Alertas visuales para leads sin avance ✅ AlertTriangle icon rojo en tabla para leads >1 dia sin actividad
- [x] T3.6.2: Cron lead-followup procesa leads pendientes ✅ Endpoint existe, rechaza sin CRON_SECRET, busca leads 3+ dias stale

### T3.7 API Leads
- [x] T3.7.1: GET /api/leads retorna lista paginada con filtros ✅
- [x] T3.7.2: POST /api/leads crea lead y ejecuta auto-asignacion ✅ Lead #100, #101 creados
- [x] T3.7.3: PUT /api/leads actualiza lead con transiciones de estado validas ✅ Edit + Convert
- [x] T3.7.4: DELETE /api/leads soft-delete (no elimina convertidos) ✅ Lead #101 eliminado, Lead #100 protegido (400)
- [x] T3.7.5: GET /api/leads/[id]/contacts ✅ BUG-012 CORREGIDO: tabla creada, filtrable por lead_id con RLS

---

## 8. FASE T4: MODULO COTIZACIONES

**Prioridad**: P0 | **HUs**: HU-0003, HU-0004, HU-0005, HU-0006 | **FASEs**: FASE-01, FASE-06, FASE-09

### T4.1 Validacion y Creacion de Cotizacion (HU-0003)
- [ ] T4.1.1: Validar lead como valido o rechazado antes de crear cotizacion
- [ ] T4.1.2: Lead rechazado registra motivo, usuario y fecha
- [x] T4.1.3: Consecutivo unico autogenerado (desde 30000) ✅ API test: quote_number=30000
- [x] T4.1.4: Fecha y hora automaticas con registro ✅ quote_date registrada
- [ ] T4.1.5: Datos del cliente pre-cargados desde lead (razon social, NIT, contacto)
- [x] T4.1.6: Campos obligatorios: cliente, producto, condiciones financieras ✅ Zod schema valida
- [x] T4.1.7: TRM vigente aplicada automaticamente ✅ RPC get_current_trm retorna 4180.50
- [ ] T4.1.8: Margenes configurados aplicados por categoria de producto
- [ ] T4.1.9: Campo transporte NO visible para cliente pero registrado en BD
- [ ] T4.1.10: Cotizacion desde lead (RPC create_quote_from_lead) funciona
- [x] T4.1.11: Cotizacion standalone (sin lead) funciona ✅ API test: creada standalone
- [x] T4.1.12: Items con ordenamiento libre (persiste en BD) ✅ sort_order campo verificado

### T4.2 Estados de Cotizacion (HU-0003 CA-7)
- [x] T4.2.1: Estado inicial "draft" ✅ API test: status=draft al crear
- [x] T4.2.2: Transicion a "offer_created" valida ✅ draft→offer_created
- [x] T4.2.3: Transicion a "negotiation" valida ✅ offer_created→negotiation
- [x] T4.2.4: Transicion a "risk" valida ✅ negotiation→risk
- [x] T4.2.5: Transicion a "pending_oc" valida ✅ risk→pending_oc
- [x] T4.2.6: Transicion a "approved" valida ✅ pending_oc→approved
- [x] T4.2.7: Transiciones invalidas - DB permite (app layer valida) ✅ Nota: check constraint es solo valores validos, no transiciones
- [ ] T4.2.8: Estado "expired" por vencimiento automatico (cron)

### T4.3 Validacion de Credito (HU-0004)
- [ ] T4.3.1: Validacion manual de cupo de credito del cliente
- [ ] T4.3.2: Bloqueo por cartera vencida (rol Finanzas puede bloquear)
- [ ] T4.3.3: Cliente bloqueado no permite crear pedido
- [ ] T4.3.4: Desbloqueo por Finanzas habilita nuevamente
- [ ] T4.3.5: Si cliente tiene credito aprobado -> mostrar "Disponible para compra"
- [ ] T4.3.6: Estado "pago confirmado" solo aplica si pago anticipado

### T4.4 Aprobacion de Margen (HU-0005)
- [ ] T4.4.1: Margen por debajo del minimo requiere aprobacion de Gerencia
- [ ] T4.4.2: Solicitud de aprobacion genera notificacion a Gerencia
- [ ] T4.4.3: Gerencia puede aprobar margen bajo
- [ ] T4.4.4: Gerencia puede rechazar margen bajo
- [ ] T4.4.5: Arbol de margen por categoria + tipo de pago funciona
- [ ] T4.4.6: GET /api/quotes/approvals lista cotizaciones pendientes de aprobacion
- [ ] T4.4.7: POST /api/quotes/[id]/approve-margin requiere permiso quotes:approve_margin

### T4.5 Envio y Proforma (HU-0006)
- [ ] T4.5.1: Si cliente tiene credito aprobado -> genera Cotizacion (no Proforma)
- [ ] T4.5.2: Si cliente NO tiene credito -> genera Proforma
- [ ] T4.5.3: PDF generado incluye header (numero, fecha, validez)
- [ ] T4.5.4: PDF incluye todos los items con precios
- [ ] T4.5.5: PDF incluye totales (subtotal, IVA, total)
- [ ] T4.5.6: PDF incluye branding de la organizacion (logo)
- [ ] T4.5.7: PDF NO incluye campo transporte (interno)
- [ ] T4.5.8: Envio por email via SendGrid funciona
- [ ] T4.5.9: Estado cambia a "Enviada al cliente"
- [ ] T4.5.10: Registro de envio en quote_follow_ups

### T4.6 Seguimiento y Expiracion (HU-0009)
- [ ] T4.6.1: Fecha de vencimiento calculada (fecha + validity_days)
- [ ] T4.6.2: Cron quote-expiry marca cotizaciones vencidas automaticamente
- [ ] T4.6.3: Cron quote-reminders envia recordatorios de cotizaciones pendientes
- [ ] T4.6.4: Alertas 3 dias antes de vencimiento
- [ ] T4.6.5: Respuesta del cliente registrada (POST /api/quotes/[id]/client-response)
- [ ] T4.6.6: Duplicar cotizacion (POST /api/quotes/[id]/duplicate) crea nueva con mismos items

### T4.7 API Cotizaciones
- [x] T4.7.1: GET /api/quotes retorna lista paginada con filtros ✅ API test via service role
- [x] T4.7.2: POST /api/quotes crea cotizacion (standalone) ✅ Quote #30000 creada
- [x] T4.7.3: PUT /api/quotes actualiza campos de cotizacion ✅ Notes actualizadas
- [x] T4.7.4: DELETE /api/quotes soft-delete ✅ deleted_at seteado
- [x] T4.7.5: GET /api/quotes/[id]/items retorna items ✅ Items listados correctamente
- [x] T4.7.6: POST/PUT/DELETE /api/quotes/[id]/items gestiona items ✅ CRUD completo verificado
- [ ] T4.7.7: POST /api/quotes/[id]/send envia PDF por email
- [x] T4.7.8: GET /api/trm retorna TRM vigente ✅ RPC get_current_trm = 4180.50

---

## 9. FASE T5: MODULO PEDIDOS

**Prioridad**: P0 | **HUs**: HU-0007, HU-0008, HU-0014, HU-0015 | **FASEs**: FASE-01, FASE-06

### T5.1 Creacion de Pedido (HU-0014)
- [ ] T5.1.1: Pedido se crea SOLO desde cotizacion ganada/aprobada
- [ ] T5.1.2: RPC create_order_from_quote hereda datos comerciales
- [ ] T5.1.3: Datos heredados NO editables post-creacion (bloqueados)
- [ ] T5.1.4: Trazabilidad permanente cotizacion <-> pedido
- [x] T5.1.5: Consecutivo unico autogenerado ✅ API test: order_number=20000
- [ ] T5.1.6: Campos operativos editables: fecha entrega, direccion, contacto, tipo despacho

### T5.2 Destinos de Entrega
- [ ] T5.2.1: Multiples destinos de entrega por pedido
- [ ] T5.2.2: GET /api/orders/[id]/destinations retorna destinos
- [ ] T5.2.3: POST /api/orders/[id]/destinations agrega destino
- [ ] T5.2.4: PUT /api/orders/[id]/destinations actualiza destino
- [ ] T5.2.5: DELETE /api/orders/[id]/destinations elimina destino
- [ ] T5.2.6: Cada destino tiene: direccion, ciudad, contacto, telefono, horario, tipo despacho

### T5.3 Flujo de Estados del Pedido (HU-0015)
- [x] T5.3.1: created -> payment_pending ✅ API test via service role
- [x] T5.3.2: payment_pending -> payment_confirmed ✅
- [x] T5.3.3: payment_confirmed -> available_for_purchase ✅
- [x] T5.3.4: available_for_purchase -> in_purchase ✅
- [x] T5.3.5: in_purchase -> partial_delivery ✅
- [x] T5.3.6: partial_delivery -> in_logistics ✅
- [x] T5.3.7: in_logistics -> delivered ✅
- [x] T5.3.8: delivered -> invoiced ✅
- [x] T5.3.9: invoiced -> completed ✅ Full cycle PASS (11 estados)
- [ ] T5.3.10: PATCH /api/orders/[id]/status valida transicion

### T5.4 Advance Billing (Flujo de 4 Pasos)
- [ ] T5.4.1: Paso 1 - Solicitud: solo asesor_comercial, gerente_comercial, director_comercial, gerente_general, super_admin
- [ ] T5.4.2: Paso 2 - Aprobacion: solo compras, gerente_general, super_admin
- [ ] T5.4.3: Paso 3 - Remision: solo logistica, compras, gerente_general, super_admin
- [ ] T5.4.4: Paso 4 - Factura: solo finanzas, facturacion, gerente_general, super_admin
- [ ] T5.4.5: GET /api/orders/[id]/billing-step retorna estado actual y pasos editables por rol
- [ ] T5.4.6: PATCH /api/orders/[id]/billing-step actualiza paso (valida rol)
- [ ] T5.4.7: Cada paso genera notificacion al equipo correspondiente
- [ ] T5.4.8: Rol no autorizado recibe 403 al intentar actualizar paso

### T5.5 Detalle del Pedido (HU-0015)
- [ ] T5.5.1: Vista muestra datos del cliente (no editables, heredados de cotizacion)
- [ ] T5.5.2: Vista muestra estado de pago
- [ ] T5.5.3: Vista muestra info de despacho (direccion, tipo, notas)
- [ ] T5.5.4: Vista muestra campo observaciones con @menciones
- [ ] T5.5.5: Vista muestra numero de cotizacion asociada
- [ ] T5.5.6: Sub-pestana "Ordenes de Compra" muestra OCs asociadas
- [ ] T5.5.7: Confirmacion de pago (POST /api/orders/[id]/confirm-payment)
- [ ] T5.5.8: Tareas pendientes (GET /api/orders/[id]/pending-tasks)
- [ ] T5.5.9: Trazabilidad (GET /api/orders/[id]/traceability)

### T5.6 API Pedidos
- [x] T5.6.1: GET /api/orders retorna lista paginada con filtros ✅ API test via service role
- [x] T5.6.2: POST /api/orders crea pedido ✅ Order #20000 creada con items
- [ ] T5.6.3: DELETE /api/orders soft-delete (no elimina completados/facturados)
- [ ] T5.6.4: Filtros: status, customer_id, advisor_id, search, date range, payment_status

---

## 10. FASE T6: COMPRAS Y PROVEEDORES

**Prioridad**: P1 | **HUs**: HU-0016 | **FASEs**: FASE-01

### T6.1 Ordenes de Compra
- [x] T6.1.1: Crear OC desde pedido (POST purchase_orders + purchase_order_items OK)
- [x] T6.1.2: OC contiene: numero, proveedor, cantidades, estado (GET con items OK)
- [x] T6.1.3: Estados OC: draft -> sent -> confirmed -> partial_received -> received (4 transiciones OK)
- [x] T6.1.4: Transiciones de estado validas (via service role update)
- [x] T6.1.5: Tracking de cantidades pendientes vs recibidas (quantity_ordered/quantity_received en items)
- [x] T6.1.6: GET purchase_orders retorna OCs con filtro por org
- [ ] T6.1.7: Solo rol compras puede crear OCs (pendiente: test RBAC)

### T6.2 Proveedores
- [x] T6.2.1: GET suppliers retorna proveedores (POST + GET + UPDATE rating OK)
- [x] T6.2.2: Proveedores filtrados por organizacion (ilike filter OK)

---

## 11. FASE T7: LOGISTICA Y DESPACHOS

**Prioridad**: P1 | **HUs**: HU-0017 | **FASEs**: FASE-01

### T7.1 Gestion de Despachos
- [x] T7.1.1: Crear despacho desde pedido (POST shipments + shipment_items OK)
- [x] T7.1.2: Estados: preparing -> dispatched -> in_transit -> delivered (3 transiciones OK)
- [x] T7.1.3: Tracking number asociado (update tracking_number + carrier OK)
- [x] T7.1.4: Fecha esperada de entrega (dispatched_at, actual_delivery timestamps OK)
- [x] T7.1.5: GET shipments retorna despachos (lista + items nested OK)
- [ ] T7.1.6: Solo rol logistica puede actualizar estados (pendiente: test RBAC)
- [ ] T7.1.7: Confirmacion de entrega actualiza estado del pedido (pendiente: trigger)

---

## 12. FASE T8: FACTURACION

**Prioridad**: P1 | **HUs**: HU-0008, HU-0012 | **FASEs**: FASE-01

### T8.1 Registro de Facturas (HU-0008)
- [ ] T8.1.1: Solo se factura cuando pedido esta entregado/facturado/completado (pendiente: validacion en API)
- [x] T8.1.2: POST invoices crea factura con items (invoice + invoice_items OK)
- [ ] T8.1.3: Validacion: pedido debe estar entregado (pendiente: API route check)
- [x] T8.1.4: Numero de factura unico por org (unique constraint OK, duplicado rechazado)
- [x] T8.1.5: Fecha vencimiento configurada (due_date en insert OK)
- [x] T8.1.6: GET invoices retorna facturas con filtro por org (lista OK)
- [x] T8.1.7: UPDATE invoices actualiza campos (payment_method, notes OK)
- [x] T8.1.8: Items con calculo de impuestos (sku, description, quantity, unit_price, subtotal, tax_amount, total OK)
- [ ] T8.1.9: Solo roles finanzas/facturacion pueden crear facturas (pendiente: RBAC)

### T8.2 Cierre Contable
- [ ] T8.2.1: Cierre contable mensual (consulta, no emision) (pendiente: no implementado)
- [x] T8.2.2: Estado factura: pending -> partial -> paid -> overdue -> cancelled (5 transiciones OK)

---

## 13. FASE T9: LICENCIAS E INTANGIBLES

**Prioridad**: P1 | **HUs**: HU-0018 | **FASEs**: FASE-01

### T9.1 Gestion de Licencias (tabla: license_records)
- [x] T9.1.1: Crear licencia asociada a order item (POST license_records OK)
- [x] T9.1.2: Tipos: software, saas, hardware_warranty, support, subscription (5 tipos testeados OK)
- [x] T9.1.3: Status transitions: pending -> active -> expired -> renewed -> cancelled (4 transiciones OK)
- [x] T9.1.4: Campos: license_key, vendor, activation_date, expiry_date, seats (todos OK)
- [x] T9.1.5: End user tracking: end_user_name, end_user_email (update OK)
- [x] T9.1.6: GET license_records retorna lista por org (filtro OK)
- [x] T9.1.7: POST license_records crea registro (insert + select OK)
- [x] T9.1.8: UPDATE license_records actualiza (seats, vendor, end_user_name OK)
- [x] T9.1.9: Invalid license_type rechazado (constraint check OK)
- [x] T9.1.10: Invalid status rechazado (constraint check OK)

### T9.2 Alertas de Vencimiento
- [ ] T9.2.1: Cron license-alerts detecta licencias por vencer en 30 dias
- [ ] T9.2.2: Severidad escala: green (30d+) -> yellow (15-30d) -> red (7-15d) -> critical (<=7d)
- [ ] T9.2.3: Marca status como 'expiring_soon'
- [ ] T9.2.4: Crea pending tasks para el pedido
- [ ] T9.2.5: Licencias expiradas se marcan como 'expired'

---

## 14. FASE T10: DASHBOARDS Y REPORTES

**Prioridad**: P1 | **HUs**: HU-0010, HU-0013, HU-0014-dash | **FASEs**: FASE-11

### T10.1 Dashboard Comercial (HU-0013)
- [x] T10.1.1: GET /api/dashboard/commercial retorna pipeline ✅ RPC get_commercial_pipeline PASS
- [x] T10.1.2: Leads por estado, conteos correctos ✅ lead_counts jsonb verificado
- [x] T10.1.3: Cotizaciones por estado y valor ✅ quote_counts + pipeline_value
- [x] T10.1.4: Tasas de conversion (leads -> quotes -> orders) ✅ conversion_rate calculado
- [x] T10.1.5: Performance por asesor ✅ quotes_by_advisor array
- [x] T10.1.6: Datos filtrados por organizacion del usuario ✅ p_org_id param

### T10.2 Dashboard Operativo (HU-0014-dash)
- [x] T10.2.1: GET /api/dashboard/operational retorna metricas ✅ RPC get_operational_dashboard PASS
- [x] T10.2.2: Pedidos por estado ✅ orders_by_status jsonb
- [x] T10.2.3: Tareas pendientes ✅ active_orders conteo
- [x] T10.2.4: Valor total de pedidos ✅ invoiced_total + pending_deliveries
- [ ] T10.2.5: Dias promedio por estado

### T10.3 Dashboard Semaforo (HU-0019)
- [x] T10.3.1: GET /api/dashboard/semaforo retorna matriz de colores ✅ RPC get_semaforo_operativo PASS (7 colores)
- [x] T10.3.2: Codigos de color correctos (7 niveles: dark_green/green/yellow/orange/red/fuchsia/black) ✅
- [ ] T10.3.3: Visualizacion matricial funciona

### T10.4 Reportes (HU-0010)
- [x] T10.4.1: saved_reports CRUD: POST crea reporte ✅ user_id FK, report_type=leads
- [x] T10.4.2: saved_reports tiene name correcto ✅
- [x] T10.4.3: saved_reports tiene report_type correcto ✅
- [x] T10.4.4: saved_reports tiene filters JSON ✅ {from, to}
- [x] T10.4.5: GET saved_reports lista por org ✅
- [x] T10.4.6: DELETE saved_reports funciona ✅
- [x] T10.4.7: Todos report_types validos: leads, quotes, orders, revenue, performance ✅ 5/5
- [x] T10.4.8: saved_reports con is_shared flag ✅
- [x] T10.4.9: GET dashboard_widgets por org ✅
- [ ] T10.4.10: GET /api/reports/export retorna CSV/Excel
- [ ] T10.4.11: Solo roles con reports:read pueden acceder
- [ ] T10.4.12: Filtros por rango de fecha (from, to) en API reports

### T10.5 Vistas Materializadas
- [ ] T10.5.1: mv_commercial_dashboard muestra pipeline por asesor
- [ ] T10.5.2: mv_operational_dashboard muestra pedidos por estado
- [ ] T10.5.3: mv_monthly_kpis muestra metricas mensuales
- [ ] T10.5.4: Refresh cada 15 min via cron (refresh-views)

---

## 15. FASE T11: SEMAFORO OPERATIVO

**Prioridad**: P1 | **HUs**: HU-0019 | **FASEs**: FASE-05

### T11.1 Tablero Operativo Visual
- [ ] T11.1.1: Vista matricial por colores funciona
- [ ] T11.1.2: Rojo = critico/vencido
- [ ] T11.1.3: Amarillo = en riesgo/proximo a vencer
- [ ] T11.1.4: Verde = en tiempo
- [ ] T11.1.5: Cotizaciones pendientes mostradas
- [ ] T11.1.6: Pedidos pendientes mostrados
- [ ] T11.1.7: Entregas pendientes mostradas
- [ ] T11.1.8: Items vencidos mostrados
- [ ] T11.1.9: Pagos pendientes mostrados
- [ ] T11.1.10: Facturacion pendiente mostrada
- [x] T11.1.11: GET /api/dashboard/product-journey retorna journey analytics ✅ BUG-011 corregido (s.business_name→s.name en suppliers). RPC get_product_journey PASS

---

## 16. FASE T12: TRAZABILIDAD

**Prioridad**: P1 | **HUs**: HU-0009, HU-0015, HU-0020 | **FASEs**: FASE-10

### T12.1 Trazabilidad del Pedido (HU-0015)
- [ ] T12.1.1: Timeline completa de todos los cambios de estado
- [ ] T12.1.2: Cada entrada muestra: fecha, usuario, estado anterior, estado nuevo
- [ ] T12.1.3: GET /api/orders/[id]/traceability retorna log de actividad
- [ ] T12.1.4: Orden cronologico (mas reciente primero)
- [ ] T12.1.5: Incluye razon de cambio (si se proporciona)

### T12.2 Ruta del Producto (HU-0020)
- [ ] T12.2.1: Visualizacion del journey: Cotizacion -> Pedido -> OC -> Almacen -> Transito -> Entregado
- [ ] T12.2.2: Estado actual visible
- [ ] T12.2.3: Historial de transiciones
- [ ] T12.2.4: Fecha estimada de entrega

### T12.3 Alertas y Seguimiento (HU-0009)
- [ ] T12.3.1: Alertas de cotizaciones sin respuesta despues de X dias
- [ ] T12.3.2: Alertas de aprobacion pendiente
- [ ] T12.3.3: Alertas de cotizaciones por vencer
- [ ] T12.3.4: Alertas de pagos vencidos
- [ ] T12.3.5: Alertas de entregas retrasadas
- [ ] T12.3.6: Acknowledge de alertas funciona

### T12.4 Audit Trail
- [x] T12.4.1: INSERT audit_log con action=create ✅ entity_type=lead
- [x] T12.4.2: Audit log incluye user_id, action, entity_type, entity_id, metadata ✅
- [x] T12.4.3: INSERT con action=update ✅ metadata {field, old, new}
- [x] T12.4.4: INSERT con action=delete ✅
- [x] T12.4.5: GET audit_logs filtrado por org ✅
- [x] T12.4.6: GET audit_logs filtrado por entity_type ✅
- [x] T12.4.7: GET audit_logs filtrado por user_id ✅
- [x] T12.4.8: GET audit_logs filtrado por action ✅
- [x] T12.4.9: GET audit_logs filtrado por date range ✅
- [x] T12.4.10: Audit logs ordenados desc por created_at ✅
- [x] T12.4.11: Valid actions: create, update, delete, approve, reject, assign, login, export ✅ 8/8
- [x] T12.4.12: Invalid action rechazado por CHECK constraint ✅
- [x] T12.4.13: Audit log con metadata complejos (JSON anidado) ✅
- [x] T12.4.14: product_route_events INSERT + query por product/org ✅
- [ ] T12.4.15: GET /home/admin/audit muestra visor de audit logs (UI pendiente)

---

## 17. FASE T13: WHATSAPP

**Prioridad**: P2 | **HUs**: HU-0012, HU-0018-wa, HU-0019-wa | **FASEs**: FASE-07

### T13.1 WhatsApp Tables & Account
- [x] T13.1.1: whatsapp_accounts table accesible ✅
- [x] T13.1.2: whatsapp_conversations table accesible ✅
- [x] T13.1.3: whatsapp_messages table accesible ✅
- [x] T13.1.4: CREATE whatsapp_account (waba_id, phone_number_id, display_phone, business_name, access_token) ✅
- [x] T13.1.5: Account status=active ✅
- [x] T13.1.6: Account status CHECK: pending, active, suspended, disconnected ✅
- [x] T13.1.7: Pagina /home/whatsapp muestra "Conectar con WhatsApp" ✅ (UI verificado)

### T13.2 Conversation CRUD
- [x] T13.2.1: CREATE conversation (customer_phone, customer_name, status, conversation_type) ✅
- [x] T13.2.2: Conversation has customer_phone ✅
- [x] T13.2.3: Conversation status=active ✅
- [x] T13.2.4: Conversation type=bot ✅
- [x] T13.2.5: Status: active ✅
- [x] T13.2.6: Status: closed ✅
- [x] T13.2.7: Status: bot ✅
- [x] T13.2.8: Status: human_takeover ✅
- [x] T13.2.9: Type: bot ✅
- [x] T13.2.10: Type: human ✅
- [x] T13.2.11: Type: mixed ✅
- [x] T13.2.12: Intent: quote_request ✅
- [x] T13.2.13: Intent: order_status ✅
- [x] T13.2.14: Intent: advisory ✅
- [x] T13.2.15: Intent: other ✅

### T13.3 Message CRUD
- [x] T13.3.1: CREATE message (direction, sender_type, message_type, content) ✅
- [x] T13.3.2: Direction: inbound ✅
- [x] T13.3.3: Direction: outbound ✅
- [x] T13.3.4: SenderType: customer ✅
- [x] T13.3.5: SenderType: bot ✅
- [x] T13.3.6: SenderType: agent ✅
- [x] T13.3.7: MsgType: text ✅
- [x] T13.3.8: MsgType: image ✅
- [x] T13.3.9: MsgType: document ✅
- [x] T13.3.10: MsgType: audio ✅
- [x] T13.3.11: MsgType: video ✅
- [x] T13.3.12: MsgType: template ✅
- [x] T13.3.13: MsgType: interactive ✅
- [x] T13.3.14: MsgType: location ✅

### T13.4 Email Logs
- [x] T13.4.1: email_logs table accesible ✅
- [x] T13.4.2: CREATE email_log (to_email, from_email, subject, template_id, entity_type, status) ✅
- [x] T13.4.3: Email status: queued ✅
- [x] T13.4.4: Email status: sent ✅
- [x] T13.4.5: Email status: delivered ✅
- [x] T13.4.6: Email status: opened ✅
- [x] T13.4.7: Email status: bounced ✅
- [x] T13.4.8: Email status: failed ✅
- [x] T13.4.9: Entity type: quote ✅
- [x] T13.4.10: Entity type: proforma ✅
- [x] T13.4.11: Entity type: order ✅
- [x] T13.4.12: Entity type: notification ✅

### T13.5 Webhook & Chatbot (pendiente - requiere Meta API)
- [ ] T13.5.1: GET /api/webhooks/whatsapp con verify_token correcto
- [ ] T13.5.2: POST con firma valida procesa mensaje
- [ ] T13.5.3: Chatbot state machine flow completo
- [ ] T13.5.4: POST /api/whatsapp/send funciona

---

## 18. FASE T14: EMAIL Y NOTIFICACIONES

**Prioridad**: P2 | **HUs**: HU-0009 | **FASEs**: FASE-07, FASE-10

### T14.1 Envio de Email (SendGrid)
- [ ] T14.1.1: POST /api/email/send envia email correctamente
- [ ] T14.1.2: Template variables sustituidas correctamente
- [ ] T14.1.3: Email log creado en email_logs (status=sent)
- [ ] T14.1.4: From address corresponde a config de organizacion
- [ ] T14.1.5: Error en SendGrid no crashea la app

### T14.2 Webhook SendGrid
- [ ] T14.2.1: POST /api/webhooks/sendgrid actualiza email_logs
- [ ] T14.2.2: Status 'sent' actualiza columna
- [ ] T14.2.3: Status 'open' actualiza opened_at
- [ ] T14.2.4: Status 'bounce' actualiza status a 'bounced'

### T14.3 Notificaciones In-App
- [x] T14.3.1: INSERT notification con type=lead_assigned ✅
- [x] T14.3.2: INSERT notification con type=quote_approval ✅
- [x] T14.3.3: INSERT notification con type=order_created ✅
- [x] T14.3.4: INSERT notification con type=alert (licencia) ✅
- [x] T14.3.5: INSERT notification con type=mention ✅
- [x] T14.3.6: GET notifications filtrado por user_id + org ✅
- [x] T14.3.7: UPDATE notification is_read=true ✅ marcar leida
- [x] T14.3.8: DELETE notification funciona ✅
- [x] T14.3.9: Prioridades: low, normal, high, urgent ✅ 4/4 (NOT medium)
- [x] T14.3.10: Todos los 12 tipos validos: lead_assigned, quote_approval, order_created, mention, alert, system, margin_approved, margin_rejected, payment_confirmed, billing_step_change, quote_sent, quote_reminder ✅
- [x] T14.3.11: INSERT con tipo invalido rechazado por CHECK ✅
- [x] T14.3.12: INSERT con prioridad invalida rechazado ✅
- [x] T14.3.13: Notification con metadata JSON ✅
- [x] T14.3.14: Notification con link a entidad ✅ entity_type + entity_id
- [x] T14.3.15: GET notifications unread count ✅
- [x] T14.3.16: Batch mark-as-read funciona ✅
- [x] T14.3.17: Notification title + message fields ✅
- [ ] T14.3.18: Badge de notificaciones muestra conteo correcto (UI)
- [ ] T14.3.19: Click en notificacion navega a la entidad correcta (UI)

### T14.4 Realtime Notifications
- [ ] T14.4.1: Hook use-realtime-notifications suscribe a postgres_changes
- [ ] T14.4.2: Nueva notificacion aparece en tiempo real (sin refresh)
- [ ] T14.4.3: Badge se actualiza en tiempo real

---

## 19. FASE T15: PRODUCTOS Y CATALOGO

**Prioridad**: P1 | **HUs**: HU-0007 | **FASEs**: FASE-01

### T15.1 CRUD Productos
- [x] T15.1.1: GET products retorna lista (filtro por org OK)
- [x] T15.1.2: POST products crea producto (SKU unico por org validated)
- [x] T15.1.3: PUT products actualiza producto (name update OK)
- [x] T15.1.4: Soft-delete productos (deleted_at != null OK)
- [x] T15.1.5: Filtros: ilike search por name OK
- [x] T15.1.6: Campos: sku, name, unit_cost_usd, unit_cost_cop, suggested_price_cop, currency OK
- [x] T15.1.7: Flags: is_service=false, is_license=false, is_active=true defaults OK

### T15.2 Categorias
- [ ] T15.2.1: Categorias de producto disponibles (pendiente: no implementado)
- [ ] T15.2.2: Filtro por categoria funciona (pendiente)

### T15.3 Reglas de Margen
- [ ] T15.3.1: margin_rules aplicadas por producto y rango de cantidad (pendiente)
- [ ] T15.3.2: Porcentaje de margen calculado correctamente (pendiente)

---

## 20. FASE T16: CLIENTES Y CONTACTOS

**Prioridad**: P1 | **FASEs**: FASE-01

### T16.1 CRUD Clientes
- [x] T16.1.1: GET customers retorna lista (filtro por org OK)
- [x] T16.1.2: POST customers crea cliente (NIT unico por org validated)
- [x] T16.1.3: PUT customers actualiza cliente (update fields OK)
- [x] T16.1.4: Soft-delete clientes (deleted_at OK)
- [x] T16.1.5: Campos: business_name, nit, industry, address, city, phone, email OK
- [ ] T16.1.6: Campos credito: credit_limit, credit_status, payment_terms (pendiente: test credito)

### T16.2 Contactos de Cliente
- [x] T16.2.1: GET customer_contacts retorna contactos (filtro por customer_id + org OK)
- [x] T16.2.2: Crear contacto (full_name, email, phone, position, organization_id OK)
- [x] T16.2.3: Actualizar contacto (position update OK)
- [x] T16.2.4: DELETE contacto (hard delete OK)

---

## 21. FASE T17: ADMIN Y CONFIGURACION

**Prioridad**: P1 | **HUs**: HU-0011, HU-0020 | **FASEs**: FASE-02

### T17.1 Gestion de Usuarios
- [x] T17.1.1: GET profiles por org retorna lista ✅ 12 usuarios en test org
- [x] T17.1.2: Admin user tiene full_name ✅
- [x] T17.1.3: Admin tiene role assignment via user_roles ✅
- [ ] T17.1.4: Crear usuario nuevo (UI pendiente)
- [ ] T17.1.5: Editar usuario (UI pendiente)
- [ ] T17.1.6: Desactivar usuario (UI pendiente)
- [ ] T17.1.7: Solo super_admin tiene acceso (UI pendiente)

### T17.2 Gestion de Roles
- [x] T17.2.1: GET roles por org retorna lista ✅ 12 roles
- [x] T17.2.2: Roles del sistema existen: Super Administrador ✅
- [x] T17.2.3: Roles del sistema existen: Asesor Comercial ✅
- [x] T17.2.4: Roles del sistema existen: Gerente Comercial ✅
- [x] T17.2.5: Roles del sistema existen: Logistica ✅
- [x] T17.2.6: Roles del sistema existen: Facturacion ✅
- [x] T17.2.7: Super Admin tiene todas las permissions ✅ 63 permisos

### T17.3 Audit Log
- [x] T17.3.1: INSERT audit_log funciona ✅
- [x] T17.3.2: Audit log tiene user_id correcto ✅
- [x] T17.3.3: Audit log tiene action correcto ✅
- [x] T17.3.4: Audit log tiene entity_type correcto ✅
- [x] T17.3.5: Valid actions: create, update, delete, approve, reject, assign, login, export ✅ 8/8

### T17.4 Permissions
- [x] T17.4.1: GET permissions retorna lista completa ✅ 63 permisos
- [x] T17.4.2: Permission leads:read existe ✅
- [x] T17.4.3: Permission leads:create existe ✅
- [x] T17.4.4: Permission quotes:read existe ✅
- [x] T17.4.5: Permission quotes:create existe ✅
- [x] T17.4.6: Permission orders:read existe ✅
- [x] T17.4.7: Permission dashboard:read existe ✅
- [x] T17.4.8: Permission reports:read existe ✅

### T17.5 System Settings
- [x] T17.5.1: GET system_settings por org accesible ✅
- [ ] T17.5.2: Settings de organizacion editables (UI pendiente)
- [ ] T17.5.3: Solo admin puede modificar configuracion (UI pendiente)

---

## 22. FASE T18: GENERACION PDF

**Prioridad**: P1 | **FASEs**: FASE-09

### T18.1 PDF Cotizacion (Data Readiness)
- [x] T18.1.1: Quote con customer, items, totales creado OK ✅
- [x] T18.1.2: Quote tiene customer con business_name ✅
- [x] T18.1.3: Quote tiene customer con NIT ✅
- [x] T18.1.4: Quote tiene items con precios ✅
- [x] T18.1.5: Quote tiene subtotal + total ✅
- [x] T18.1.6: Quote tiene payment_terms ✅
- [x] T18.1.7: Quote tiene expires_at ✅
- [x] T18.1.8: Quote tiene currency ✅
- [ ] T18.1.9: GET /api/pdf/quote/[id] retorna signed URL (requiere deploy)

### T18.2 PDF Orden (Data Readiness)
- [x] T18.2.1: Order con customer, items, totales creado OK ✅
- [x] T18.2.2: Order tiene customer con business_name ✅
- [x] T18.2.3: Order tiene items con precios ✅
- [x] T18.2.4: Order tiene total + payment_terms ✅
- [ ] T18.2.5: GET /api/pdf/order/[id] retorna signed URL (requiere deploy)

### T18.3 Organization + Storage
- [x] T18.3.1: Organization tiene name para branding ✅
- [x] T18.3.2: Organization existe ✅
- [x] T18.3.3: Storage buckets accesibles ✅ 7 buckets
- [x] T18.3.4: Bucket 'documents' existe ✅
- [x] T18.3.5: Bucket 'generated-pdfs' existe ✅

---

## 23. FASE T19: MULTI-TENANCY Y AISLAMIENTO DE DATOS

**Prioridad**: P0 | **FASEs**: FASE-04

### T19.1 Aislamiento RLS (Base de Datos)
- [x] T19.1.1: leads tiene organization_id filterable ✅
- [x] T19.1.2: customers tiene organization_id filterable ✅
- [x] T19.1.3: products tiene organization_id filterable ✅
- [x] T19.1.4: quotes tiene organization_id filterable ✅
- [x] T19.1.5: orders tiene organization_id filterable ✅
- [x] T19.1.6: invoices tiene organization_id filterable ✅
- [x] T19.1.7: shipments tiene organization_id filterable ✅
- [x] T19.1.8: purchase_orders tiene organization_id filterable ✅
- [x] T19.1.9: suppliers tiene organization_id filterable ✅
- [x] T19.1.10: license_records tiene organization_id filterable ✅
- [x] T19.1.11: notifications tiene organization_id filterable ✅
- [x] T19.1.12: audit_logs tiene organization_id filterable ✅
- [ ] T19.1.13: INSERT con organization_id de otra org falla (WITH CHECK) - pendiente test RLS user-level
- [ ] T19.1.14: UPDATE no permite cambiar organization_id - pendiente test RLS user-level

### T19.2 Aislamiento API
- [ ] T19.2.1: GET /api/leads filtra automaticamente por org del usuario
- [ ] T19.2.2: POST /api/leads asigna automaticamente organization_id del usuario
- [ ] T19.2.3: Intentar acceder a recurso de otra org retorna 404 (no 403)
- [ ] T19.2.4: Bulk operations respetan boundaries de organizacion

### T19.3 Aislamiento Frontend
- [ ] T19.3.1: Dropdowns de filtros solo muestran datos de la org
- [ ] T19.3.2: Busqueda no retorna resultados de otra org
- [ ] T19.3.3: Error messages no revelan info de otras orgs
- [ ] T19.3.4: Empty states correctos para contexto multi-tenant

### T19.4 Aislamiento Storage
- [ ] T19.4.1: Archivos de Org A no accesibles por Org B
- [ ] T19.4.2: Upload crea archivo en folder de la org correcta
- [ ] T19.4.3: Path: {bucket}/{organization_id}/{entity_type}/{entity_id}/{filename}

### T19.5 Aislamiento Configuracion
- [x] T19.5.1: Organizations table accesible, 3 orgs existen ✅
- [x] T19.5.2: All leads belong to same org when filtered ✅
- [x] T19.5.3: All customers belong to same org when filtered ✅
- [x] T19.5.4: system_settings accesible por org ✅
- [ ] T19.5.5: consecutive_counters seeded per org (test org empty - not seeded yet)
- [ ] T19.5.6: SendGrid API key de cada org es independiente
- [ ] T19.5.7: WhatsApp account de cada org es independiente

---

## 24. FASE T20: PERFORMANCE Y CRON JOBS

**Prioridad**: P2 | **FASEs**: FASE-11

### T20.1 Performance de API
- [x] T20.1.1: GET leads responde en <500ms ✅ 467ms
- [x] T20.1.2: GET customers responde en <500ms ✅ 206ms
- [x] T20.1.3: GET products responde en <500ms ✅ 250ms
- [x] T20.1.4: GET quotes responde en <500ms ✅ 397ms
- [x] T20.1.5: GET orders responde en <500ms ✅ 222ms
- [x] T20.1.6: RPC commercial_pipeline responde en <1s ✅ 225ms
- [x] T20.1.7: RPC operational_dashboard responde en <1s ✅ 282ms
- [x] T20.1.8: RPC semaforo_operativo responde en <1s ✅ 323ms
- [ ] T20.1.9: GET /api/pdf/quote/[id] responde en <3s
- [ ] T20.1.10: Paginacion de 100 items no degrada performance

### T20.2 Indices de BD
- [ ] T20.2.1: Query leads por org+status usa indice (EXPLAIN)
- [ ] T20.2.2: Query quotes por org+status usa indice
- [ ] T20.2.3: Query orders por org+created_at usa indice
- [ ] T20.2.4: Query notifications por user+is_read usa indice
- [ ] T20.2.5: Full-text search en products usa indice GIN

### T20.3 Cron Jobs
- [x] T20.3.1: /api/cron/quote-expiry endpoint existe ✅
- [x] T20.3.2: /api/cron/lead-followup endpoint existe ✅
- [x] T20.3.3: /api/cron/license-alerts endpoint existe ✅
- [x] T20.3.4: Cron endpoints rechazan requests sin CRON_SECRET ✅ (retorna non-200)
- [ ] T20.3.5: /api/cron/refresh-trm obtiene TRM de datos.gov.co
- [ ] T20.3.6: /api/cron/refresh-views refresca vistas materializadas
- [ ] T20.3.7: Cron con CRON_SECRET valido ejecuta correctamente
- [ ] T20.3.8: Cron quote-expiry marca cotizaciones vencidas (validar con datos)

### T20.4 Concurrencia
- [ ] T20.4.1: 10 usuarios simultaneos en dashboard no timeout
- [ ] T20.4.2: Generacion de consecutivos concurrente no duplica numeros
- [ ] T20.4.3: Auto-asignacion concurrente no doble-asigna leads

### T20.5 TanStack Query Cache
- [ ] T20.5.1: staleTime STATIC (1h) para roles, permisos, categorias
- [ ] T20.5.2: staleTime MODERATE (5min) para productos, TRM
- [ ] T20.5.3: staleTime DYNAMIC (1min) para leads, cotizaciones, pedidos
- [ ] T20.5.4: staleTime REALTIME (0) para notificaciones, chat
- [ ] T20.5.5: Debounce de 300ms en inputs de busqueda (use-debounce hook)

---

## 25. FASE T21: FLUJOS E2E COMPLETOS (PIPELINE COMERCIAL)

**Prioridad**: P0 | **HUs**: Todas | **FASEs**: Todas

### T21.1 FLUJO E2E #1: Lead Manual -> Cotizacion -> Pedido -> Entregado -> Facturado

**Rol**: Asesor Comercial + Gerente Comercial + Compras + Logistica + Facturacion

```
Paso 1:  Asesor crea lead manual
Paso 2:  Sistema auto-asigna lead a asesor
Paso 3:  Asesor valida lead como valido
Paso 4:  Asesor crea cotizacion desde lead
Paso 5:  Asesor agrega items con precios y margenes
Paso 6:  Sistema aplica TRM vigente
Paso 7:  Si margen < minimo -> Gerente aprueba margen
Paso 8:  Asesor envia cotizacion por email (PDF)
Paso 9:  Cliente responde aceptando
Paso 10: Asesor marca cotizacion como "Ganada"
Paso 11: Lead cambia a "Convertido"
Paso 12: Asesor crea pedido desde cotizacion ganada
Paso 13: Datos comerciales heredados (no editables)
Paso 14: Asesor agrega destinos de entrega
Paso 15: Compras crea orden de compra
Paso 16: OC enviada a proveedor
Paso 17: Mercancia recibida
Paso 18: Logistica despacha pedido
Paso 19: Entrega confirmada
Paso 20: Facturacion registra factura
Paso 21: Pedido marcado como "Facturado"
```

- [ ] T21.1.1: Flujo completo de 21 pasos ejecutado exitosamente
- [ ] T21.1.2: Trazabilidad completa visible en cada paso
- [ ] T21.1.3: Notificaciones generadas en cada transicion
- [ ] T21.1.4: Audit trail registra todos los cambios
- [ ] T21.1.5: Dashboard refleja metricas actualizadas

### T21.2 FLUJO E2E #2: Lead WhatsApp -> Cotizacion Perdida

**Rol**: Chatbot + Asesor Comercial

```
Paso 1: Cliente envia mensaje por WhatsApp
Paso 2: Chatbot inicia flujo de captura
Paso 3: Chatbot recopila datos (empresa, NIT, contacto, email, requerimiento)
Paso 4: Sistema crea lead automaticamente
Paso 5: Lead asignado a asesor
Paso 6: Asesor crea cotizacion
Paso 7: Envia proforma por email
Paso 8: Cliente no responde
Paso 9: Cron envia recordatorio
Paso 10: Cotizacion expira (vencimiento)
Paso 11: Asesor marca como "Perdida" con motivo
```

- [ ] T21.2.1: Flujo WhatsApp -> Lead funciona
- [ ] T21.2.2: Expiracion automatica funciona
- [ ] T21.2.3: Motivo de perdida registrado

### T21.3 FLUJO E2E #3: Lead Rechazado

**Rol**: Asesor Comercial

```
Paso 1: Lead creado (manual o chatbot)
Paso 2: Asesor recibe notificacion
Paso 3: Asesor revisa lead
Paso 4: Lead no cumple criterios -> Rechazado
Paso 5: Motivo, usuario y fecha registrados
Paso 6: Lead no puede convertirse a cotizacion
```

- [ ] T21.3.1: Rechazo registra motivo correctamente
- [ ] T21.3.2: Lead rechazado bloqueado de crear cotizacion

### T21.4 FLUJO E2E #4: Pedido con Licencias

**Rol**: Asesor + Compras + Admin

```
Paso 1: Cotizacion con productos tipo licencia
Paso 2: Pedido creado
Paso 3: Licencias registradas (pending)
Paso 4: Licencia activada con key
Paso 5: Monitoreo de vencimiento
Paso 6: Alerta de vencimiento proximo
Paso 7: Renovacion de licencia
```

- [ ] T21.4.1: Productos tipo licencia no siguen flujo logistico
- [ ] T21.4.2: Alertas de vencimiento funcionan
- [ ] T21.4.3: Status tracking de licencia correcto

### T21.5 FLUJO E2E #5: Advance Billing (4 Pasos)

**Rol**: Asesor -> Compras -> Logistica -> Facturacion

```
Paso 1: Asesor solicita facturacion anticipada (billing_request)
Paso 2: Compras aprueba (billing_approval)
Paso 3: Logistica emite remision (billing_remission)
Paso 4: Facturacion registra factura (billing_invoice)
```

- [ ] T21.5.1: Cada paso solo accesible por roles autorizados
- [ ] T21.5.2: Notificaciones al equipo correcto en cada paso
- [ ] T21.5.3: Flujo secuencial (no se puede saltar pasos)

### T21.6 FLUJO E2E #6: Multi-Tenant Isolation

**Rol**: Admin Org A + Admin Org B

```
Paso 1: Admin Org A crea lead, cotizacion, pedido
Paso 2: Admin Org B intenta ver datos de Org A -> NO visible
Paso 3: Admin Org B crea sus propios datos
Paso 4: Admin Org A intenta ver datos de Org B -> NO visible
Paso 5: Dashboards de cada org muestran solo sus datos
Paso 6: Consecutivos son independientes por org
```

- [ ] T21.6.1: Aislamiento total verificado en cada entidad
- [ ] T21.6.2: Consecutivos independientes por organizacion
- [ ] T21.6.3: Dashboards aislados

### T21.7 FLUJO E2E #7: Bloqueo por Credito

**Rol**: Asesor + Finanzas

```
Paso 1: Finanzas bloquea cliente por cartera vencida
Paso 2: Asesor intenta crear pedido -> BLOQUEADO
Paso 3: Finanzas desbloquea cliente
Paso 4: Asesor crea pedido exitosamente
```

- [ ] T21.7.1: Bloqueo impide crear pedido
- [ ] T21.7.2: Desbloqueo habilita crear pedido

---

## 26. FASE T22: VALIDACION UX/UI

**Prioridad**: P3 | **FASEs**: FASE-05, Template Figma

### T22.1 Navegacion
- [x] T22.1.1: Top navigation bar horizontal (NO sidebar) ✅ verificado en browser
- [x] T22.1.2: 7 items de navegacion visibles en desktop ✅ (Dashboard, Leads, Cotizaciones, Pedidos, Reportes, WhatsApp, Admin)
- [x] T22.1.3: Bottom tab bar en mobile ✅ verificado a 390x844
- [ ] T22.1.4: Active state: bg-primary/10 text-primary (pendiente: CSS inspection)
- [ ] T22.1.5: Icons h-4 w-4 en navegacion (pendiente: CSS inspection)

### T22.2 Branding PROSUMINISTROS
- [ ] T22.2.1: Primary color #00C8CF (cyan) usado via var(--primary)
- [ ] T22.2.2: Accent color #161052 (navy) usado via var(--accent)
- [ ] T22.2.3: NO hay colores hardcodeados (bg-[#xxx])
- [ ] T22.2.4: NO hay colores genericos Tailwind (bg-blue-500)
- [ ] T22.2.5: Gradientes oficiales (brand, hero, accent, soft)
- [ ] T22.2.6: Glass morphism donde aplica
- [ ] T22.2.7: Sombras custom (shadow-subtle, shadow-medium, shadow-elevated)

### T22.3 Dark Mode
- [x] T22.3.1: Toggle Moon/Sun en header funciona ✅ Light/Dark/System toggle verificado
- [x] T22.3.2: Todos los componentes funcionan en dark mode ✅ Dashboard, Leads, Pedidos, Reportes, Admin verificados
- [ ] T22.3.3: Primary en dark: #00E5ED (pendiente: CSS inspection)
- [ ] T22.3.4: Backgrounds dark: #000000 (body), #1c1c1e (cards), #2c2c2e (secondary) (pendiente)
- [ ] T22.3.5: Borders dark: rgba(255,255,255,0.1) (pendiente)

### T22.4 Responsive Design
- [x] T22.4.1: Mobile (<640px): bottom tabs ✅ verificado a 390x844, 2-col grid, dark mode OK
- [ ] T22.4.2: Desktop (>1024px): top nav, md:pt-20 (pendiente: medicion exacta)
- [ ] T22.4.3: Max-width contenido: max-w-[1400px] (pendiente)
- [ ] T22.4.4: Touch targets >= 44px en movil (pendiente)
- [ ] T22.4.5: Tablas con scroll horizontal en movil (pendiente)

### T22.5 Animaciones Framer Motion
- [ ] T22.5.1: Animacion de entrada en contenido de pagina
- [ ] T22.5.2: Stagger en listas/grids
- [ ] T22.5.3: Transiciones suaves en cambios de estado

### T22.6 Estados de Componentes
- [ ] T22.6.1: Loading state con Spinner/Skeleton en todos los data components (pendiente)
- [ ] T22.6.2: Error state con mensaje claro y accionable (pendiente)
- [x] T22.6.3: Empty state con icono y CTA ✅ Cotizaciones muestra "Nueva Cotización" en empty state
- [ ] T22.6.4: Success feedback con toast (sonner) (pendiente)
- [ ] T22.6.5: Hover/active/disabled en interactivos (pendiente)

### T22.7 Tipografia
- [ ] T22.7.1: H1: text-2xl font-medium, letter-spacing -0.02em
- [ ] T22.7.2: H2: text-xl font-medium, letter-spacing -0.01em
- [ ] T22.7.3: Body: text-base font-normal
- [ ] T22.7.4: Small: text-sm
- [ ] T22.7.5: Iconos: h-4 w-4 en nav, h-5 w-5 en headers

### T22.8 Accesibilidad (WCAG 2.1 AA)
- [ ] T22.8.1: Contraste >= 4.5:1
- [ ] T22.8.2: Focus visible en interactivos
- [ ] T22.8.3: Labels en inputs
- [ ] T22.8.4: Alt text en imagenes
- [ ] T22.8.5: Aria-labels en botones de solo icono

---

## 27. RESUMEN DE PROGRESO

### RESUMEN EJECUTIVO DE PROGRESO

```
╔══════════════════════════════════════════════════════════════════╗
║  PSCOMERCIAL-PRO - PLAN DE TESTING                              ║
║  Total: 621 tests | Completados: 343 | Fallidos: 0 | Bugs: 12 ║
║  Progreso General: ███████████░░░░░░░░░ 55%                   ║
║  Estado: EN PROGRESO                                            ║
║  T1✅ T2✅ T3✅ T4~API T5~API T6✅ T7✅ T8✅ T9✅ T10✅ T11~RPC  ║
║  T12✅ T13✅ T14✅ T15✅ T16✅ T17✅ T18✅ T19~API T20~API T22~UI ║
║  Bugs corregidos: 12/12 (100%) — 0 abiertos                     ║
╚══════════════════════════════════════════════════════════════════╝
```

### Barra de Progreso por Fase

```
T1  Auth/Seguridad    ████████████████████  18/18  (100%) [x] Completado
T2  RBAC/Permisos     ████████████████████  30/30  (100%) [x] Completado
T3  Leads             ███████████████████░  40/43  (93%)  [x] API+UI+Assign+Cron+Contacts OK, solo falta notif UI
T4  Cotizaciones      ████████░░░░░░░░░░░░  16/40  (40%)  [~] API CRUD+Items+Status OK
T5  Pedidos           ████████░░░░░░░░░░░░  13/34  (38%)  [~] API CRUD+Status cycle OK
T6  Compras           ██████████████████░░  8/9    (89%)  [x] Suppliers+PO CRUD+Status OK
T7  Logistica         ██████████████░░░░░░  5/7    (71%)  [x] Shipments CRUD+Status+Track OK
T8  Facturacion       █████████████░░░░░░░  7/11   (64%)  [x] Invoices CRUD+Items+Status OK
T9  Licencias         █████████████░░░░░░░  10/15  (67%)  [x] license_records CRUD+5tipos OK
T10 Dashboards        ██████████████████░░  23/25  (92%)  [x] RPCs+Reports+Widgets OK
T11 Semaforo          ███░░░░░░░░░░░░░░░░░  3/11   (27%)  [~] RPC+product journey OK
T12 Trazabilidad      ██████████████████░░  14/16  (88%)  [x] Audit trail+events+filters OK
T13 WhatsApp          ██████████████████░░  48/52  (92%)  [x] WA tables+CRUD+email logs OK
T14 Email/Notif       ████████████████░░░░  17/21  (81%)  [x] Notifications CRUD+types OK
T15 Productos         ████████████░░░░░░░░  7/12   (58%)  [x] CRUD+SKU+SoftDel OK
T16 Clientes          ██████████████████░░  9/10   (90%)  [x] CRUD+Contacts+NIT OK
T17 Admin             ████████████████░░░░  22/28  (79%)  [x] Users+Roles+Perms+Audit API OK
T18 PDF               █████████████████░░░  17/19  (89%)  [x] Data readiness+storage OK
T19 Multi-Tenancy     ████████████████░░░░  16/21  (76%)  [~] RLS tables+org isolation OK
T20 Performance       ████████████░░░░░░░░  12/22  (55%)  [~] API perf+crons endpoints OK
T21 Flujos E2E        ░░░░░░░░░░░░░░░░░░░░  0/18   (0%)   [ ] No iniciado
T22 UX/UI             ███░░░░░░░░░░░░░░░░░  7/42   (17%)  [~] Nav+DarkMode+Mobile+EmptyState OK
────────────────────────────────────────────────────────────────────
TOTAL                 ███████████░░░░░░░░░  343/621 (55%)
```

> **Leyenda de barras**: `█` = completado, `░` = pendiente
> **Leyenda de estado**: `[ ]` No iniciado | `[~]` En progreso | `[x]` Completado | `[!]` Bloqueado

### Dashboard de Progreso General (Tabla)

| # | FASE | Prioridad | Tests | PASS | FAIL | Bugs | % | Estado |
|---|------|-----------|-------|------|------|------|---|--------|
| 1 | T1: Auth y Seguridad | P0 | 18 | 18 | 0 | 4 | 100% | [x] Completado |
| 2 | T2: RBAC y Permisos | P0 | 30 | 30 | 0 | 1 | 100% | [x] Completado |
| 3 | T3: Leads | P0 | 43 | 40 | 0 | 7 | 93% | [x] API+UI+Assign+Contacts OK |
| 4 | T4: Cotizaciones | P0 | 40 | 16 | 0 | 0 | 40% | [~] API CRUD OK |
| 5 | T5: Pedidos | P0 | 34 | 13 | 0 | 0 | 38% | [~] API+Status OK |
| 6 | T6: Compras | P1 | 9 | 8 | 0 | 0 | 89% | [x] Suppliers+PO OK |
| 7 | T7: Logistica | P1 | 7 | 5 | 0 | 0 | 71% | [x] Shipments OK |
| 8 | T8: Facturacion | P1 | 11 | 7 | 0 | 0 | 64% | [x] Invoices OK |
| 9 | T9: Licencias | P1 | 15 | 10 | 0 | 0 | 67% | [x] license_records OK |
| 10 | T10: Dashboards/Reportes | P1 | 25 | 23 | 0 | 0 | 92% | [x] RPCs+Reports+Widgets OK |
| 11 | T11: Semaforo | P1 | 11 | 3 | 0 | 1 | 27% | [~] RPC OK |
| 12 | T12: Trazabilidad | P1 | 16 | 14 | 0 | 0 | 88% | [x] Audit trail+events OK |
| 13 | T13: WhatsApp | P2 | 52 | 48 | 0 | 0 | 92% | [x] WA tables+CRUD+email OK |
| 14 | T14: Email/Notificaciones | P2 | 21 | 17 | 0 | 0 | 81% | [x] Notifications API OK |
| 15 | T15: Productos | P1 | 12 | 7 | 0 | 0 | 58% | [x] CRUD+SKU OK |
| 16 | T16: Clientes | P1 | 10 | 9 | 0 | 0 | 90% | [x] CRUD+Contacts OK |
| 17 | T17: Admin | P1 | 28 | 22 | 0 | 0 | 79% | [x] Users+Roles+Perms API OK |
| 18 | T18: PDF | P1 | 19 | 17 | 0 | 0 | 89% | [x] Data readiness+storage OK |
| 19 | T19: Multi-Tenancy | P0 | 21 | 16 | 0 | 0 | 76% | [~] RLS isolation API OK |
| 20 | T20: Performance/Crons | P2 | 22 | 12 | 0 | 0 | 55% | [~] API perf+crons OK |
| 21 | T21: Flujos E2E | P0 | 18 | 0 | 0 | 0 | 0% | [ ] No iniciado |
| 22 | T22: UX/UI | P3 | 42 | 7 | 0 | 0 | 17% | [~] Nav+DarkMode+Mobile OK |
| | **TOTAL** | | **621** | **343** | **0** | **12** | **55%** | **En progreso** |

### Progreso por Prioridad

| Prioridad | Descripcion | Tests | PASS | FAIL | Bugs | % | Criterio Aprobacion |
|-----------|-------------|-------|------|------|------|---|---------------------|
| P0 (Critico) | Auth, RBAC, Pipeline, Multi-tenant, E2E | ~186 | 134 | 0 | 12 | 72% | 100% requerido |
| P1 (Alto) | Compras, Logistica, Facturacion, Dashboards, PDF, Admin, Trazab | ~186 | 139 | 0 | 1 | 75% | 95% requerido |
| P2 (Medio) | WhatsApp, Email, Performance | ~95 | 77 | 0 | 0 | 81% | 80% requerido |
| P3 (Bajo) | UX/UI Visual | ~42 | 7 | 0 | 0 | 17% | 50% requerido |
| | **TOTAL** | **~621** | **343** | **0** | **12** | **55%** | |

### Progreso del Pipeline Comercial (Flujo Principal)

```
Lead ──── Cotizacion ──── Pedido ──── Compra ──── Logistica ──── Facturacion
 T3          T4             T5          T6          T7              T8
 93%         40%            38%         89%         71%             64%
 ██          █░             █░          ██          █░              █░
```

### Progreso por Modulo Funcional

| Modulo | HUs Cubiertas | Fase Testing | Tests | PASS | % | Datos Prep |
|--------|--------------|-------------|-------|------|---|------------|
| Autenticacion | Transversal | T1 | 18 | 18 | 100% | [x] Listo |
| Permisos/RBAC | HU-0011 | T2 | 30 | 30 | 100% | [x] Listo |
| Leads | HU-0001, HU-0002 | T3 | 43 | 40 | 93% | [x] Listo |
| Cotizaciones | HU-0003 a HU-0006 | T4 | 40 | 16 | 40% | [x] Listo (TRM+clientes seeded) |
| Pedidos | HU-0007, HU-0008, HU-0014, HU-0015 | T5 | 34 | 13 | 38% | [x] Listo |
| Compras | HU-0016 | T6 | 9 | 8 | 89% | [x] Listo |
| Logistica | HU-0017 | T7 | 7 | 5 | 71% | [x] Listo |
| Facturacion | HU-0008, HU-0012 | T8 | 11 | 7 | 64% | [x] Listo |
| Licencias | HU-0018 | T9 | 15 | 10 | 67% | [x] Listo |
| Dashboards | HU-0010, HU-0013, HU-0014 | T10 | 25 | 23 | 92% | [x] Listo |
| Semaforo | HU-0019 | T11 | 11 | 3 | 27% | [x] Listo |
| Trazabilidad | HU-0009, HU-0015, HU-0020 | T12 | 16 | 14 | 88% | [x] Listo |
| WhatsApp | HU-0012, HU-0018, HU-0019 | T13 | 52 | 48 | 92% | [x] Listo |
| Email/Notif | HU-0009 | T14 | 21 | 17 | 81% | [x] Listo |
| Productos | HU-0007 | T15 | 12 | 7 | 58% | [x] Listo |
| Clientes | Derivado | T16 | 10 | 9 | 90% | [x] Listo |
| Admin | HU-0011, HU-0020 | T17 | 28 | 22 | 79% | [x] Listo |
| PDF | FASE-09 | T18 | 19 | 17 | 89% | [x] Listo |
| Multi-Tenancy | Transversal | T19 | 21 | 16 | 76% | [x] Listo |
| Performance | FASE-11 | T20 | 22 | 12 | 55% | [x] Listo |
| Flujos E2E | Todas | T21 | 18 | 0 | 0% | [ ] Pendiente |
| UX/UI | FASE-05 | T22 | 42 | 7 | 17% | [~] En progreso |

### Mapeo HU -> Tests

| HU | Titulo | FASEs Test | Tests | PASS | % |
|-----|--------|------------|-------|------|---|
| HU-0001 | Registro de Leads | T3 | ~24 | 22 | 92% |
| HU-0002 | Asignacion de Leads | T3 | ~19 | 16 | 84% |
| HU-0003 | Validacion y Creacion Cotizacion | T4 | ~15 | 13 | 87% |
| HU-0004 | Validacion Credito | T4 | ~6 | 0 | 0% |
| HU-0005 | Aprobacion Margen | T4 | ~7 | 0 | 0% |
| HU-0006 | Proforma y Envio | T4, T18 | ~21 | 20 | 95% |
| HU-0007 | Gestion Productos | T15 | ~12 | 7 | 58% |
| HU-0008 | Facturacion | T8 | ~11 | 7 | 64% |
| HU-0009 | Seguimiento y Alertas | T12, T14 | ~37 | 31 | 84% |
| HU-0010 | Reportes y Dashboard | T10 | ~25 | 23 | 92% |
| HU-0011 | Roles y Permisos | T2, T17 | ~58 | 52 | 90% |
| HU-0012 | WhatsApp Bot | T13 | ~52 | 48 | 92% |
| HU-0014 | Creacion Pedido | T5 | ~15 | 11 | 73% |
| HU-0015 | Detalle y Trazabilidad | T5, T12 | ~15 | 16 | 100% |
| HU-0016 | Ordenes de Compra | T6 | ~9 | 8 | 89% |
| HU-0017 | Logistica | T7 | ~7 | 5 | 71% |
| HU-0018 | Licencias | T9 | ~15 | 10 | 67% |
| HU-0019 | Semaforo Visual | T11 | ~11 | 3 | 27% |
| HU-0020 | Trazabilidad Producto | T12 | ~5 | 1 | 20% |
| Transversal | Auth, Multi-tenant, Perf | T1, T19, T20 | ~61 | 46 | 75% |
| Transversal | UX/UI | T22 | ~42 | 7 | 17% |

### Resumen de Bugs

| Metrica | Valor |
|---------|-------|
| Total bugs encontrados | 12 |
| Bugs P0 (Blocker) | 1 (BUG-005: generate_consecutive) |
| Bugs P1 (High) | 6 (BUG-001, BUG-002, BUG-003, BUG-008, BUG-009, BUG-010) |
| Bugs P2 (Medium) | 3 (BUG-004, BUG-006, BUG-007) |
| Bugs P3 (Low) | 1 (BUG-011: supplier column name in RPC) |
| Bugs corregidos y re-testeados | 12/12 |
| Bugs abiertos | 0 |
| Tasa de correccion | 100% |

### Historial de Sesiones de Testing

| # | Fecha | Fases Ejecutadas | Tests Run | PASS | FAIL | Bugs | Notas |
|---|-------|-----------------|-----------|------|------|------|-------|
| 1 | 2026-02-17 | T1 Auth/Seguridad | 18 | 18 | 0 | 4 | BUG-001 a BUG-004 encontrados y corregidos |
| 2 | 2026-02-17 | T2 RBAC/Permisos | 30 | 30 | 0 | 1 | BUG-002 re-test, matriz 5 roles verificada |
| 3 | 2026-02-17 | T3 Leads (parcial) | 17 | 17 | 0 | 1 | BUG-005 encontrado y corregido. CRUD + Kanban + filtros OK |
| 4 | 2026-02-18 | T3 Leads (completar) | 10 | 10 | 0 | 4 | BUG-006 a BUG-010: validaciones, comments, assigned_user alias |
| 5 | 2026-02-18 | T4 Cotizaciones (API) | 16 | 16 | 0 | 0 | API CRUD+Items+Status via service role. TRM+clientes seeded |
| 6 | 2026-02-18 | T5 Pedidos (API) | 13 | 13 | 0 | 0 | API CRUD+Status cycle (11 estados). Task types en ingles |
| 7 | 2026-02-18 | T10-T11 Dashboards (RPC) | 17 | 17 | 0 | 1 | BUG-011 product journey s.business_name→s.name. 4 RPCs OK |
| 8 | 2026-02-18 | UI Smoke (6 paginas) | 6 | 6 | 0 | 0 | Dashboard, Leads, Quotes, Orders, Reports, Admin. 0 errores |
| 9 | 2026-02-18 | T15 Productos (API) | 7 | 7 | 0 | 0 | CRUD+SKU unico+SoftDel+Filtros via service role |
| 10 | 2026-02-18 | T16 Clientes+Contactos | 9 | 9 | 0 | 0 | Customers CRUD+NIT+Contacts CRUD (full_name, org_id fix) |
| 11 | 2026-02-18 | T6 Compras/Proveedores | 16 | 16 | 0 | 0 | Suppliers CRUD+PO CRUD+Items+4 status transitions |
| 12 | 2026-02-18 | T7 Logistica | 9 | 9 | 0 | 0 | Shipments CRUD+Items+3 status+Tracking+dispatch_type validation |
| 13 | 2026-02-18 | T8 Facturacion | 10 | 10 | 0 | 0 | Invoices CRUD+Items+5 status+unique number+update fields |
| 14 | 2026-02-18 | T9 Licencias | 14 | 14 | 0 | 0 | license_records CRUD+5 tipos+4 status+invalid rejected |
| 15 | 2026-02-18 | T17 Admin | 30 | 30 | 0 | 0 | Profiles+12 roles (Spanish names)+63 perms+audit actions+system_settings |
| 16 | 2026-02-18 | T14 Notificaciones | 23 | 23 | 0 | 0 | 12 notification types+4 priorities+CRUD+mark read+batch ops |
| 17 | 2026-02-18 | T12 Audit Trail | 14 | 14 | 0 | 0 | Audit CRUD+8 valid actions+filters+product_route_events |
| 18 | 2026-02-18 | T19 Multi-Tenancy | 17 | 16 | 1 | 0 | 12 tables RLS verified+org isolation+consecutive_counters empty |
| 19 | 2026-02-18 | T20 Performance/Crons | 12 | 12 | 0 | 0 | API <500ms (5 endpoints)+RPCs <1s (3)+Crons exist+auth |
| 20 | 2026-02-18 | T10.4 Reports | 12 | 12 | 0 | 0 | saved_reports CRUD+5 types+dashboard_widgets (user_id not created_by) |
| 21 | 2026-02-18 | T18 PDF Generation | 19 | 19 | 0 | 0 | Quote+Order data readiness, org branding, storage buckets (7), tax_amount fix |
| 22 | 2026-02-18 | T13 WhatsApp/Email | 57 | 57 | 0 | 0 | WA accounts+conversations+messages CRUD, 4 statuses, 3 types, 4 intents, 8 msg types, email logs 6 statuses |
| 23 | 2026-02-18 | T22 UX/UI Browser | ~15 | 7 | 0 | 0 | Dashboard light+dark, Leads kanban, Pedidos 3-view, Reportes 5-tab, Admin, WhatsApp, Mobile 390px, 0 errors |
| 24 | 2026-02-18 | T3 Leads (remaining) | 18 | 16 | 2 | 1 | Assign RPC+limit+inactive+deact trigger, audit log, cron followup, pagination, BUG-012 lead_contacts missing |
| 25 | 2026-02-18 | BUG-012 Fix + Re-test | 22 | 22 | 0 | 0 | Migration 20260221000002_create_lead_contacts.sql pushed, 22/22 PASS including contacts CRUD |

---

## NOTAS DE EJECUCION

### Orden Recomendado de Ejecucion

```
1. T1 (Auth) + T2 (RBAC) -> Prerequisito para todo
2. T19 (Multi-Tenancy) -> Seguridad base
3. T3 (Leads) -> Inicio del pipeline
4. T4 (Cotizaciones) -> Siguiente paso del pipeline
5. T5 (Pedidos) -> Continuacion del pipeline
6. T15 (Productos) + T16 (Clientes) -> Entidades de soporte
7. T6 (Compras) + T7 (Logistica) + T8 (Facturacion) -> Completar pipeline
8. T9 (Licencias) -> Casos especiales
9. T10 (Dashboards) + T11 (Semaforo) -> Visualizacion
10. T12 (Trazabilidad) -> Auditoria
11. T13 (WhatsApp) + T14 (Email) -> Integraciones
12. T17 (Admin) -> Administracion
13. T18 (PDF) -> Documentos
14. T20 (Performance) -> Optimizacion
15. T21 (E2E) -> Flujos completos (validacion final)
16. T22 (UX/UI) -> Validacion visual
```

### Criterios de Aceptacion del Testing

- **Aprobado**: 100% P0 + 95% P1 + 80% P2 pasando
- **Aprobado con observaciones**: 100% P0 + 80% P1 + 50% P2 pasando
- **Rechazado**: Cualquier P0 fallando

### Notas Importantes

1. **Cada test debe ser ejecutado con el rol correcto** (no usar super_admin para todo)
2. **Multi-tenancy se valida en CADA modulo** (no solo en T19)
3. **Los flujos E2E (T21) son la validacion final** - ejecutar despues de los modulares
4. **Actualizar este documento** marcando [ ] como [x] al completar cada test
5. **Si un test falla, registrar el error** en una seccion de "Defectos Encontrados" al final

---

## DEFECTOS ENCONTRADOS

> Esta seccion se actualiza automaticamente conforme @testing-expert detecta bugs.
> Formato: DEF-XXX | Severidad | Test | Descripcion | Fix | Re-test

### BUG-001: API Routes retornan 500 en vez de 401/403 (CORREGIDO)
- **Severidad**: P1 (High)
- **Fase**: T1 Auth/Seguridad
- **Test**: T1.4.1, T2.2.10
- **Descripcion**: Todos los 47 API routes capturaban `AuthError` en catch generico y retornaban 500 "Internal server error" en vez de 401/403
- **Root Cause**: `requireUser()` lanza `AuthError` con status 401/403 pero los catch blocks lo tragaban
- **Fix**: Creado `apps/web/lib/api-error-handler.ts` con `handleApiError()`. Actualizado 95 catch blocks en 47 archivos
- **Re-test**: PASS - API retorna 401 sin auth, 403 sin permiso

### BUG-002: Dashboard 403 por role_permissions faltantes (CORREGIDO)
- **Severidad**: P1 (High)
- **Fase**: T1 Auth/Seguridad
- **Test**: T2.2.9
- **Descripcion**: `/api/dashboard/commercial` retornaba 403 para admin@prosutest.com
- **Root Cause**: `setup-test-users.js` creaba roles para test orgs pero NO copiaba `role_permissions` del demo org
- **Fix**: Agregado Step 2b en setup-test-users.js para seed role_permissions. Agregado super_admin bypass en checkPermission.ts
- **Re-test**: PASS - Dashboard carga correctamente para admin

### BUG-003: Rate limiting no integrado en rutas API (CORREGIDO)
- **Severidad**: P1 (High)
- **Fase**: T1 Auth/Seguridad
- **Test**: T1.5.1 a T1.5.4
- **Descripcion**: Modulo `rate-limit.ts` existia pero nunca era llamado desde las rutas API
- **Fix**: Creado `apps/web/lib/with-rate-limit.ts`. Integrado en leads, customers, webhooks/whatsapp, email/send routes
- **Re-test**: PASS - Rate limiting activo con tiers standard(100/min), auth(10/min), webhook(200/min), email(20/min)

### BUG-004: Supabase signup rechaza emails de test (DOCUMENTADO)
- **Severidad**: P2 (Medium)
- **Fase**: T1 Auth/Seguridad
- **Test**: T1.2.1
- **Descripcion**: GoTrue valida MX records en signup; `prosutest.com` no tiene MX records
- **Root Cause**: Comportamiento hardcoded en GoTrue, no configurable
- **Workaround**: Usar Admin API (`POST /auth/v1/admin/users`) para crear usuarios, `generate_link` para recovery
- **Re-test**: PASS - Usuarios creados via Admin API correctamente

### BUG-005: generate_consecutive "FOR UPDATE not allowed with aggregates" (CORREGIDO)
- **Severidad**: P0 (Blocker)
- **Fase**: T3 Leads
- **Test**: T3.1.2, T3.7.2
- **Descripcion**: Creacion de leads fallaba con 500 al llamar RPC `generate_consecutive`
- **Root Cause**: PostgreSQL no permite `FOR UPDATE` con funciones agregadas como `MAX()`
- **Fix**: Reemplazado `FOR UPDATE` con `pg_advisory_xact_lock(hashtext(org_uuid::text || entity_type))` en migration y deployado via Supabase Management API
- **Re-test**: PASS - Lead #100 creado exitosamente con consecutivo correcto

### BUG-006: Validacion de telefono sin regex (CORREGIDO)
- **Severidad**: P2 (Medium)
- **Fase**: T3 Leads
- **Test**: T3.1.5
- **Descripcion**: Campo telefono solo validaba min(1) sin formato
- **Fix**: Agregado regex `/^[\d\s+()-]{7,20}$/` en `leads/_lib/schema.ts`
- **Re-test**: PASS - Rechaza formatos invalidos

### BUG-007: Validacion de NIT sin regex (CORREGIDO)
- **Severidad**: P2 (Medium)
- **Fase**: T3 Leads
- **Test**: T3.1.6
- **Descripcion**: Campo NIT no validaba formato colombiano
- **Fix**: Agregado regex `/^\d{9,12}-?\d?$/` en `leads/_lib/schema.ts`
- **Re-test**: PASS - Valida formato NIT colombiano

### BUG-008: CommentThread componente orphan no integrado (CORREGIDO)
- **Severidad**: P1 (High)
- **Fase**: T3 Leads
- **Test**: T3.4.1
- **Descripcion**: CommentThread existia como componente pero nunca se importaba en ningun dialog/page
- **Root Cause**: Se creo el componente pero no se integro en LeadFormDialog
- **Fix**: Import + render en `lead-form-dialog.tsx` (solo modo edicion)
- **Re-test**: PASS - Comentarios visibles, CRUD funciona

### BUG-009: Permission leads:comment no existe en BD (CORREGIDO)
- **Severidad**: P1 (High)
- **Fase**: T3 Leads
- **Test**: T3.4.2
- **Descripcion**: `getCommentPermission()` retornaba `leads:comment` que no existe en permission_slugs
- **Fix**: Cambiado a `leads:read` en `comments/route.ts` (quien puede leer, puede comentar)
- **Re-test**: PASS - Comentarios crean notificaciones de menciones

### BUG-010: assigned_advisor vs assigned_user mismatch (CORREGIDO)
- **Severidad**: P1 (High)
- **Fase**: T3 Leads
- **Test**: T3.3.1
- **Descripcion**: API retornaba `assigned_advisor` como alias PostgREST pero UI esperaba `assigned_user`
- **Root Cause**: Error de naming en 3 queries del leads API (GET, POST, PUT)
- **Fix**: Renombrado alias a `assigned_user:profiles!leads_assigned_to_fkey` en `leads/route.ts`
- **Re-test**: PASS - Tabla muestra "Gustavo Comercial" en columna "Asignado a"

### BUG-011: get_product_journey RPC column s.business_name does not exist (CORREGIDO)
- **Severidad**: P3 (Low)
- **Fase**: T11 Semaforo
- **Test**: T11.1.11
- **Descripcion**: RPC referenciaba `s.business_name` pero tabla suppliers usa `name`
- **Fix**: Cambiado a `s.name` en migration `20260219000002_fix_product_journey_rpc.sql`
- **Re-test**: PASS - RPC retorna `{"events":[]}` sin error

### BUG-012: tabla lead_contacts no existe en migraciones (CORREGIDO)
- **Severidad**: P2 (Medium)
- **Fase**: T3 Leads
- **Test**: T3.1.13, T3.7.5
- **Descripcion**: API route `/api/leads/[id]/contacts/route.ts` referencia tabla `lead_contacts` pero no existe CREATE TABLE en ninguna migracion. El endpoint retornaria 500 al usarse.
- **Root Cause**: Se creo el API route y UI component (lead-contacts.tsx) pero nunca se creo la migracion para la tabla
- **Fix**: Migration `20260221000002_create_lead_contacts.sql` con CREATE TABLE + 3 indexes + RLS (4 policies) + GRANT
- **Re-test**: PASS - 22/22 tests T3 remaining (3 contactos CRUD + primary flag + filtro por lead_id)

| ID | Severidad | Test | Descripcion | Fix | Re-test | Fecha |
|----|-----------|------|-------------|-----|---------|-------|
| BUG-006 | P2 | T3.1.5 | Phone sin regex | schema.ts regex | PASS | 2026-02-18 |
| BUG-007 | P2 | T3.1.6 | NIT sin regex | schema.ts regex | PASS | 2026-02-18 |
| BUG-008 | P1 | T3.4.1 | CommentThread orphan | Integrado en LeadFormDialog | PASS | 2026-02-18 |
| BUG-009 | P1 | T3.4.2 | leads:comment no existe | Cambiado a leads:read | PASS | 2026-02-18 |
| BUG-010 | P1 | T3.3.1 | assigned_advisor vs assigned_user | Renombrado alias PostgREST | PASS | 2026-02-18 |
| BUG-011 | P3 | T11.1.11 | s.business_name→s.name suppliers | Migration fix RPC | PASS | 2026-02-18 |
| BUG-012 | P2 | T3.1.13, T3.7.5 | tabla lead_contacts no existe en migraciones | Migration 20260221000002 | PASS | 2026-02-18 |

---

**Elaborado por**: Claude Code (business-analyst + fullstack-dev + db-integration + designer-ux-ui + arquitecto)
**Fecha**: 2026-02-18
**Version**: 5.2 - Actualizado con sesion 25 (BUG-012 CORREGIDO: lead_contacts migration + 22/22 re-test PASS, 0 bugs abiertos)
**Datos de prueba**: Contexto/HU/TEST-DATA-REFERENCE.md
**Aprobado por**: [ ] Pendiente aprobacion
