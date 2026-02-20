# PLAN DE IMPLEMENTACIÓN Y CORRECCIONES - PSComercial Pro

> **Proyecto**: Pscomercial-pro (PROSUMINISTROS)
> **Fecha de elaboración**: 2026-02-20
> **Fuentes**: CONSOLIDADO-VALIDACION-TRANSCRIPCIONES.md + EXTRACCION-PRUEBAS-PS-20260220.md
> **Análisis del repositorio**: Frontend (Next.js 15), Backend (API Routes), Base de datos (Supabase - 52 tablas, 47 migraciones)
> **Perspectivas**: @arquitecto, @fullstack-dev, @db-integration, @business-analyst

---

## RESUMEN EJECUTIVO

Se identificaron **11 bugs**, **13 funcionalidades faltantes** y **múltiples discrepancias** entre los requisitos validados en transcripciones y la implementación actual. Este plan consolida TODAS las correcciones e implementaciones necesarias organizadas en **7 bloques de trabajo** priorizados por criticidad y dependencias.

### Inventario de Estado Actual

| Aspecto | Estado |
|---------|--------|
| Tablas en BD | 52 tablas creadas, esquema robusto |
| Migraciones | 47 aplicadas (Sprint 1-6) |
| API Routes | ~30 endpoints funcionales |
| Módulos Frontend | 9 módulos en sidebar (falta Financiero) |
| PDFs | 3 de 4 implementados (falta Remisión) |
| WhatsApp | Scaffolding completo, pendiente número |
| Notificaciones | Campanita funcional con realtime |
| RBAC | 36 roles, 69 permisos, 1056 asignaciones |

---

## TABLA DE CONTENIDO

1. [BLOQUE 1: Corrección de Bugs Críticos](#bloque-1-correccion-de-bugs-criticos)
2. [BLOQUE 2: Estados de Cotización y Pipeline Kanban](#bloque-2-estados-de-cotizacion-y-pipeline-kanban)
3. [BLOQUE 3: Módulo Financiero](#bloque-3-modulo-financiero)
4. [BLOQUE 4: Tablas Maestras y Flujos Faltantes](#bloque-4-tablas-maestras-y-flujos-faltantes)
5. [BLOQUE 5: Documentos, PDFs y Gestión de Archivos](#bloque-5-documentos-pdfs-y-gestion-de-archivos)
6. [BLOQUE 6: Notificaciones, @Menciones y Trazabilidad](#bloque-6-notificaciones-menciones-y-trazabilidad)
7. [BLOQUE 7: Mejoras de UX y Validaciones del Pipeline](#bloque-7-mejoras-de-ux-y-validaciones-del-pipeline)

---

## BLOQUE 1: CORRECCIÓN DE BUGS CRÍTICOS

**Prioridad**: 🔴 MÁXIMA
**Dependencias**: Ninguna - se pueden iniciar inmediatamente
**Estimación**: Sprint actual

### 1.1 Aprobación de Margen da error al hacer clic

| Aspecto | Detalle |
|---------|---------|
| **Bug** | En los 3 puntitos de la cotización, la opción "Aprobación de margen" da error al hacer clic |
| **Fuente** | EXTRACCION línea 74 |
| **Severidad** | 🔴 Alta |
| **Módulo** | Cotizaciones |

**Análisis del repositorio** (@fullstack-dev):
- El componente `margin-approval-dialog.tsx` existe en `apps/web/app/home/(admin)/quotes/_components/`
- El endpoint `/api/quotes/[id]/approve-margin` existe con POST (solicitar) y PATCH (aprobar/rechazar)
- La función RPC `request_margin_approval` existe en BD
- La tabla `quote_approvals` existe (0 rows → nunca se ha usado exitosamente)

**Plan de corrección**:
1. Revisar `margin-approval-dialog.tsx` - verificar que el dialog se abre correctamente y que los datos del quote se pasan al componente
2. Verificar que el POST a `/api/quotes/[id]/approve-margin` envía el payload correcto (quote_id)
3. Verificar la RPC `request_margin_approval` - asegurar que el quote existe y que el margen está calculado
4. Verificar permisos: el comercial necesita `quotes:update` para solicitar, el gerente necesita `quotes:approve_margin` para aprobar
5. **Archivos a modificar**:
   - `apps/web/app/home/(admin)/quotes/_components/margin-approval-dialog.tsx`
   - `apps/web/app/api/quotes/[id]/approve-margin/route.ts` (si hay error en la lógica)

---

### 1.2 Kanban drag-and-drop no funciona

| Aspecto | Detalle |
|---------|---------|
| **Bug** | No se pueden arrastrar tarjetas entre columnas en vista Kanban de cotizaciones |
| **Fuente** | EXTRACCION línea 86 |
| **Severidad** | 🟡 Media |
| **Módulo** | Cotizaciones |

**Análisis del repositorio** (@fullstack-dev):
- `quotes-kanban.tsx` existe en `apps/web/app/home/(admin)/quotes/_components/`
- El kanban renderiza columnas pero la funcionalidad de drag probablemente no está conectada al API de actualización de estado

**Plan de corrección**:
1. Revisar `quotes-kanban.tsx` - verificar si tiene handler de onDrop/onDragEnd
2. Implementar o corregir el handler que llama a PUT `/api/quotes` con el nuevo `status`
3. Validar transiciones permitidas (no se puede pasar de `offer_created` directo a `pending_oc`, debe seguir secuencia)
4. **Archivos a modificar**:
   - `apps/web/app/home/(admin)/quotes/_components/quotes-kanban.tsx`

---

### 1.3 Seleccionar items en despacho da error

| Aspecto | Detalle |
|---------|---------|
| **Bug** | Al intentar seleccionar ítems para despachar en la modal de nuevo despacho, da error |
| **Fuente** | EXTRACCION línea 120 |
| **Severidad** | 🔴 Alta |
| **Módulo** | Pedidos / Despachos |

**Análisis del repositorio** (@fullstack-dev):
- `shipment-form-dialog.tsx` existe en `apps/web/app/home/(admin)/orders/_components/`
- Endpoint `/api/shipments/` existe
- Tabla `shipments` y `shipment_items` existen en BD

**Plan de corrección**:
1. Revisar `shipment-form-dialog.tsx` - el error probablemente está en la carga de los `order_items` disponibles para despacho
2. Verificar que la query filtra correctamente ítems con `quantity_dispatched < quantity`
3. Verificar el submit del formulario contra `/api/shipments/`
4. **Archivos a modificar**:
   - `apps/web/app/home/(admin)/orders/_components/shipment-form-dialog.tsx`
   - `apps/web/app/api/shipments/route.ts` (si el error es backend)

---

### 1.4 PDF Orden de Compra no permite seleccionar OC específica

| Aspecto | Detalle |
|---------|---------|
| **Bug** | Al tener múltiples OC, el PDF no deja seleccionar cuál descargar |
| **Fuente** | EXTRACCION línea 116 |
| **Severidad** | 🟡 Media |
| **Módulo** | Pedidos / OC |

**Plan de corrección**:
1. En el componente de orden de compra, agregar selector/dropdown cuando hay múltiples OC
2. El endpoint `/api/pdf/order/[id]` ya existe - necesita recibir el `purchase_order_id` como query param
3. **Archivos a modificar**:
   - Componente de pedido que tiene el botón de PDF (en `_components/` de orders)
   - `apps/web/app/api/pdf/order/[id]/route.ts` (agregar filtro por PO si aplica)

---

### 1.5 PDF Orden de Despacho no se genera

| Aspecto | Detalle |
|---------|---------|
| **Bug** | El PDF de despacho no se está creando ni descargando |
| **Fuente** | EXTRACCION línea 218 |
| **Severidad** | 🔴 Alta |
| **Módulo** | Pedidos / Despachos |

**Análisis del repositorio** (@fullstack-dev):
- NO existe endpoint `/api/pdf/shipment/[id]`
- NO existe template `shipment-pdf-template.tsx` en `apps/web/lib/pdf/`
- Existen templates para: quote, proforma, order

**Plan de corrección** (es implementación nueva, no solo fix):
1. Crear `apps/web/lib/pdf/shipment-pdf-template.tsx` usando @react-pdf/renderer
2. Crear `apps/web/app/api/pdf/shipment/[id]/route.ts`
3. Contenido del PDF: datos de despacho, productos enviados, cantidades, transportadora, guía
4. Agregar botón de descarga en `shipment-form-dialog.tsx` o tab de despachos
5. **Archivos a crear**:
   - `apps/web/lib/pdf/shipment-pdf-template.tsx`
   - `apps/web/app/api/pdf/shipment/[id]/route.ts`
6. **Archivos a modificar**:
   - Componente de despachos para agregar botón PDF

---

### 1.6 Dashboard requiere fechas para cargar

| Aspecto | Detalle |
|---------|---------|
| **Bug** | Dashboard debería mostrar datos sin necesidad de seleccionar rango de fechas |
| **Fuente** | EXTRACCION línea 12 |
| **Severidad** | 🟡 Media |
| **Módulo** | Dashboard |

**Plan de corrección**:
1. Establecer rango de fechas por defecto (ej: mes actual o últimos 30 días)
2. Cargar datos iniciales con ese rango al montar el componente
3. **Archivos a modificar**: Componente principal del dashboard

---

### 1.7 Etiqueta "ganadas y ganadas" duplicada

| Aspecto | Detalle |
|---------|---------|
| **Bug** | En tarjeta "Cotizaciones por asesor", hover muestra "ganadas 6 y ganadas 3". Una debería decir "perdidas" |
| **Fuente** | EXTRACCION línea 14 |
| **Severidad** | 🟢 Baja |
| **Módulo** | Dashboard |

**Plan de corrección**:
1. Buscar la configuración del gráfico en el componente de dashboard
2. Corregir el label del segundo dataset a "perdidas"
3. **Archivos a modificar**: Componente de gráfico de cotizaciones por asesor

---

### 1.8 Estados en trazabilidad en inglés

| Aspecto | Detalle |
|---------|---------|
| **Bug** | Los estados en la trazabilidad de pedidos aparecen en inglés |
| **Fuente** | EXTRACCION línea 120 |
| **Severidad** | 🟢 Baja |
| **Módulo** | Pedidos |

**Plan de corrección**:
1. Agregar/completar mapeo de estados a español en el componente `order-timeline.tsx`
2. Verificar `order_status_history` - si los estados se guardan en inglés, crear mapper en frontend
3. **Archivos a modificar**:
   - `apps/web/app/home/(admin)/orders/_components/order-timeline.tsx`

---

### 1.9 Permisos reportan "no tiene ningún tipo de permisos"

| Aspecto | Detalle |
|---------|---------|
| **Bug** | El módulo de admin muestra que usuarios no tienen permisos |
| **Fuente** | EXTRACCION línea 184 |
| **Severidad** | 🔴 Alta |
| **Módulo** | Admin |

**Análisis del repositorio** (@db-integration):
- Tabla `role_permissions` tiene 1,056 registros
- Tabla `user_roles` tiene 15 registros
- RPC `get_user_permissions` existe
- El problema puede ser: la RPC no retorna datos, o el frontend no los renderiza correctamente

**Plan de corrección**:
1. Verificar RPC `get_user_permissions(user_id)` ejecutándola manualmente
2. Verificar que `user_roles` tiene asignaciones correctas (no IDs huérfanos)
3. Revisar el componente de admin que muestra permisos
4. **Archivos a verificar**:
   - RPC `get_user_permissions` en BD
   - Componente de admin en `apps/web/app/home/(admin)/admin/`

---

### 1.10 Auditoría no funciona correctamente

| Aspecto | Detalle |
|---------|---------|
| **Bug** | Módulo de auditoría no está funcionando |
| **Fuente** | EXTRACCION línea 184 |
| **Severidad** | 🟡 Media |
| **Módulo** | Admin |

**Análisis del repositorio** (@db-integration):
- Tabla `audit_logs` existe pero solo tiene ~1 registro
- Trigger `audit_trail_trigger` existe y debería estar en 17 tablas de negocio
- La función `audit_trail_fn` podría no estar ejecutándose

**Plan de corrección**:
1. Verificar que el trigger `audit_trail_fn` está asociado a las tablas correctas
2. Verificar que la función no tiene errores de ejecución (logs de Postgres)
3. Verificar que el frontend tiene la página de auditoría y llama al API correctamente
4. **Verificar en BD**:
   - `SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname LIKE '%audit%';`
   - Verificar que hay triggers activos en quotes, orders, leads, customers, etc.

---

## BLOQUE 2: ESTADOS DE COTIZACIÓN Y PIPELINE KANBAN

**Prioridad**: 🔴 MÁXIMA
**Dependencias**: Ninguna - se puede iniciar inmediatamente
**Contexto**: Daniel fue ENFÁTICO: solo 4 estados en el pipeline Kanban. Las aprobaciones NO crean estados.

### 2.1 Problema Actual - Discrepancias Encontradas

Se detectaron **3 niveles de inconsistencia** en los estados de cotización:

| Fuente | Estados Definidos |
|--------|-------------------|
| **BD (CHECK constraint)** | draft, offer_created, negotiation, risk, pending_oc, approved, rejected, lost, expired |
| **Shared constants** | draft, offer_created, negotiation, risk, pending_oc, approved, rejected, lost, expired |
| **Types.ts (interfaz)** | Agrega `pending_approval` que NO existe en BD |
| **Schema.ts (form)** | NO incluye `pending_approval` |
| **Schema.ts (kanban)** | SÍ incluye columna `pending_approval` → columna fantasma |
| **Schema.ts (labels)** | SÍ incluye label para `pending_approval` |

### 2.2 Estados Correctos según Daniel (CONSOLIDADO §1.1)

**4 Estados del Pipeline Kanban** (los ÚNICOS visibles como columnas):

| # | Estado Pipeline | Status en BD | % Probabilidad |
|---|----------------|-------------|----------------|
| 1 | Envío Cotización / Creación de Oferta | `offer_created` | 40% |
| 2 | En Negociación | `negotiation` | 60% |
| 3 | Riesgo | `risk` | 70% |
| 4 | Pendiente Orden de Compra | `pending_oc` | 80% |

**3 Estados Terminales** (NO son columnas del Kanban, son salidas):

| Estado Terminal | Status en BD | Requiere |
|----------------|-------------|----------|
| Convertida a Pedido | `converted` | Todas las aprobaciones cumplidas |
| Perdida | `lost` | Motivo obligatorio |
| Rechazada | `rejected` | Motivo obligatorio |

**Estados a EVALUAR o ELIMINAR**:

| Estado | Status en BD | Decisión |
|--------|-------------|----------|
| Borrador | `draft` | MANTENER como estado inicial antes de enviar |
| Aprobación | `pending_approval` | ❌ ELIMINAR - No existe en BD, no debe ser estado |
| Aprobada | `approved` | ❌ ELIMINAR del pipeline - Las aprobaciones son vía log/bitácora |
| Vencida | `expired` | MANTENER como estado terminal automático (cron) |

### 2.3 Plan de Corrección (@db-integration + @fullstack-dev)

**Paso 1: Migración de BD**
```sql
-- Agregar estado 'converted' al CHECK constraint
ALTER TABLE quotes DROP CONSTRAINT chk_quote_status;
ALTER TABLE quotes ADD CONSTRAINT chk_quote_status
  CHECK (status IN ('draft', 'offer_created', 'negotiation', 'risk', 'pending_oc', 'converted', 'rejected', 'lost', 'expired'));
```

- Eliminar `approved` del CHECK (mover cotizaciones existentes a `converted` o `pending_oc`)
- Agregar `converted` como nuevo estado terminal

**Paso 2: Actualizar constantes compartidas**
- **Archivo**: `packages/shared/src/lib/constants.ts`
- Actualizar `QUOTE_STATUSES` para reflejar los estados correctos

**Paso 3: Corregir tipos e interfaces**
- **Archivo**: `apps/web/app/home/(admin)/quotes/_lib/types.ts`
- Eliminar `pending_approval` del type union
- Agregar `converted`
- Eliminar campos `credit_blocked*` que no existen en BD

**Paso 4: Corregir schema del formulario**
- **Archivo**: `apps/web/app/home/(admin)/quotes/_lib/schema.ts`
- Actualizar `z.enum()` con estados correctos
- Actualizar `STATUS_LABELS`:
  - Eliminar `pending_approval` y `approved`
  - Agregar `converted: { label: 'Convertida a Pedido', variant: 'default' }`

**Paso 5: Corregir Kanban**
- **Archivo**: `apps/web/app/home/(admin)/quotes/_lib/schema.ts`
- `KANBAN_COLUMNS` debe tener EXACTAMENTE 4 columnas:
```typescript
export const KANBAN_COLUMNS = [
  { key: 'oferta', label: 'Creación Oferta', statuses: ['offer_created'], color: '...' },
  { key: 'negociacion', label: 'Negociación', statuses: ['negotiation'], color: '...' },
  { key: 'riesgo', label: 'Riesgo', statuses: ['risk'], color: '...' },
  { key: 'pendiente_oc', label: 'Pendiente OC', statuses: ['pending_oc'], color: '...' },
];
```
- Los estados terminales (converted, rejected, lost, expired) se muestran en tabla/lista aparte, NO en el Kanban
- `draft` se puede mostrar como sección separada ("Borradores") o como primera columna temporal

**Paso 6: Regla crítica - Las aprobaciones NO cambian el estado**
- Las solicitudes de aprobación de margen, cartera, etc. deben registrarse en `quote_approvals` y notificaciones
- El estado del pipeline se mantiene igual durante el proceso de aprobación
- Solo se bloquea la acción de "Convertir a Pedido" hasta que las aprobaciones estén resueltas
- Validar esto en `create_order_from_quote` RPC

**Archivos a modificar**:
- Migración nueva en BD
- `packages/shared/src/lib/constants.ts`
- `apps/web/app/home/(admin)/quotes/_lib/types.ts`
- `apps/web/app/home/(admin)/quotes/_lib/schema.ts`
- `apps/web/app/home/(admin)/quotes/_components/quotes-kanban.tsx`
- `apps/web/app/home/(admin)/quotes/_components/quote-form-dialog.tsx`
- `apps/web/app/home/(admin)/quotes/_components/quote-detail-modal.tsx`
- `apps/web/app/api/quotes/route.ts` (validar transiciones)

---

## BLOQUE 3: MÓDULO FINANCIERO

**Prioridad**: 🔴 CRÍTICA
**Dependencias**: Ninguna
**Contexto**: Este módulo NO EXISTE en la aplicación pero SÍ está en Figma y es necesario para Laura Burgos (Financiera de Prosuministros)

### 3.1 Estado Actual

| Aspecto | Estado |
|---------|--------|
| Entrada en navegación | ✅ Existe en `top-navigation.tsx` → `/home/finance` |
| Página de ruta | ❌ NO existe `/home/finance/` |
| Permiso `finance:read` | ❌ NO definido en tabla `permissions` |
| Campos de bloqueo en `customers` | ✅ Existen: `is_blocked`, `block_reason` |
| UI para bloquear clientes | ❌ NO existe |
| Validación de crédito (RPC) | ✅ Existe: `validate_credit_limit` |
| Trigger de crédito por pago | ✅ Existe: `update_customer_credit_on_payment` |

### 3.2 Funcionalidad Requerida (CONSOLIDADO §2.3 + EXTRACCION §2.5)

Laura Burgos (Financiera) necesita:

1. **Ver cartera de clientes** - Listado de clientes con saldos, estado de crédito
2. **Registrar bloqueos de cartera** - Activar/desactivar `is_blocked` manualmente
3. **Gestionar pagos** - Adjuntar comprobantes de pago a pedidos
4. **Generar proformas** - Para clientes sin crédito (pago anticipado)
5. **Verificar pagos** - Confirmar que el cliente pagó antes de generar pedido

### 3.3 Plan de Implementación

**Paso 1: Permisos (@db-integration)**

Migración para agregar permisos financieros:
```sql
INSERT INTO permissions (module, action, slug, description) VALUES
  ('finance', 'read', 'finance:read', 'Ver módulo financiero'),
  ('finance', 'manage_credit', 'finance:manage_credit', 'Gestionar crédito y cartera'),
  ('finance', 'block_customer', 'finance:block_customer', 'Bloquear/desbloquear clientes por cartera'),
  ('finance', 'approve_payment', 'finance:approve_payment', 'Verificar y aprobar pagos'),
  ('finance', 'generate_proforma', 'finance:generate_proforma', 'Generar proformas');

-- Asignar a rol finanzas
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'finanzas' AND p.module = 'finance';

-- Asignar finance:read a gerente_general y super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug IN ('gerente_general', 'super_admin') AND p.slug = 'finance:read';
```

**Paso 2: Página Frontend (@fullstack-dev)**

Crear estructura:
```
apps/web/app/home/(admin)/finance/
├── page.tsx                          # Server component
├── _components/
│   ├── finance-page-client.tsx       # Client wrapper
│   ├── cartera-tab.tsx               # Tab: Lista de clientes con cartera
│   ├── customer-credit-dialog.tsx    # Dialog: Bloquear/desbloquear cliente
│   ├── payment-verification-tab.tsx  # Tab: Solicitudes de verificación de pago pendientes
│   ├── proforma-requests-tab.tsx     # Tab: Solicitudes de proforma pendientes
│   └── finance-summary-cards.tsx     # Tarjetas resumen: total cartera, clientes bloqueados, etc.
└── _lib/
    ├── types.ts
    └── schema.ts
```

**Paso 3: Tab de Cartera**
- Tabla con columnas: Cliente, NIT, Cupo Total, Cupo Disponible, Saldo Pendiente, Estado (Activo/Bloqueado), Días Mora
- Acción "Bloquear" → abre dialog con campo de razón obligatorio
- Acción "Desbloquear" → confirma y limpia `is_blocked`
- Al bloquear un cliente: se refleja automáticamente en cotizaciones y pedidos como alerta visual

**Paso 4: Integración con Cotizaciones (@fullstack-dev)**

Cuando un comercial abre una cotización para un cliente bloqueado:
- Mostrar alerta visual permanente: "⚠️ Cliente bloqueado por cartera en mora"
- Permitir cotizar (NO bloquear)
- Bloquear botón "Convertir a Pedido"
- Permitir exportar a PDF y enviar al cliente

**Paso 5: Verificación de Pago**
- Comercial solicita verificación desde cotización/pedido
- Aparece en tab "Verificaciones Pendientes" del módulo financiero
- Laura revisa en banco, aprueba o rechaza
- Notificación al comercial

**Archivos a crear**:
- `apps/web/app/home/(admin)/finance/page.tsx` + componentes
- Migración de permisos financieros
- API route `/api/finance/cartera` (si se necesita endpoint específico)

**Archivos a modificar**:
- `apps/web/app/home/(admin)/quotes/_components/quote-form-dialog.tsx` (alerta de bloqueo)
- `apps/web/app/home/(admin)/quotes/_components/quote-detail-modal.tsx` (alerta de bloqueo)
- Componente que maneja "Convertir a Pedido" (bloquear si cliente bloqueado)

---

## BLOQUE 4: TABLAS MAESTRAS Y FLUJOS FALTANTES

**Prioridad**: 🔴 ALTA
**Dependencias**: Parcialmente independientes entre sí

### 4.1 Tablas Maestras - Estado Actual

| Tabla | BD | Frontend | API | Observación |
|-------|-----|---------|-----|-------------|
| Clientes | ✅ `customers` (10 rows) | ✅ `/home/customers/` | ✅ CRUD + contacts + visits | FUNCIONAL con mejoras pendientes |
| Proveedores | ✅ `suppliers` (4 rows) | ✅ `/home/suppliers/` | ✅ CRUD | FUNCIONAL - formulario verificado |
| Productos | ✅ `products` (13 rows) | ✅ `/home/products/` | ✅ CRUD + price history | FUNCIONAL |

**Resultado**: Las 3 tablas maestras EXISTEN. La preocupación de la EXTRACCIÓN (línea 137) se refiere a que el equipo no las había visto todavía en la reunión con Daniel del 19 Feb, pero SÍ están implementadas.

### 4.2 Mejoras Pendientes en Clientes

**4.2.1 Validación de NIT duplicado en Leads** (EXTRACCION línea 170-176)

| Aspecto | Estado |
|---------|--------|
| En Leads API | ✅ YA EXISTE - `/api/leads/route.ts` valida NIT duplicado |
| En UI de Leads | ❌ Verificar que el error se muestra al usuario |

**Plan**: Verificar que cuando la API retorna error por NIT duplicado, el frontend muestra toast/mensaje claro al usuario. Si no lo hace, agregar manejo de error en `lead-form-dialog.tsx`.

**4.2.2 Contactos de Clientes** (EXTRACCION línea 167-169)

| Aspecto | Estado |
|---------|--------|
| Tabla BD | ✅ `customer_contacts` (11 rows) |
| API | ✅ `/api/customers/[id]/contacts` |
| Frontend | ✅ `customer-contacts-dialog.tsx` |

**Resultado**: YA IMPLEMENTADO. Un cliente puede tener N contactos.

**4.2.3 Información completa del Cliente**

Daniel quiere ver en el detalle del cliente: asesor asignado, cotizaciones, pedidos, visitas.

| Tab | Estado |
|-----|--------|
| Info del cliente + asesor asignado | ✅ `customer-info-tab.tsx` |
| Cotizaciones del cliente | ✅ `customer-quotes-tab.tsx` |
| Pedidos del cliente | ✅ `customer-orders-tab.tsx` |
| Visitas del cliente | ✅ `customer-visits-tab.tsx` |
| Resumen del cliente | ✅ `customer-summary-tab.tsx` |

**Resultado**: YA IMPLEMENTADO con todas las tabs.

### 4.3 Relación Lead → Cotización (CRÍTICO)

**Problema** (EXTRACCION líneas 26-31, 192): Cuando se "convierte" un lead, ¿qué debe pasar?

**Opciones discutidas**:
- **Original (HUs)**: Lead → Crear Cotización directamente
- **Daniel (19 Feb)**: Lead → Pasar a Clientes → Desde ahí crear cotización

**Análisis del repositorio**:
- RPC `create_quote_from_lead` ✅ EXISTE en BD
- En la API de leads (PUT), el estado `converted` crea un `customer` a partir del lead
- Pero NO dispara automáticamente la creación de una cotización

**Plan de implementación**:
1. **Al convertir un lead**:
   - Se crea/vincula el cliente (ya funciona)
   - Se redirige al módulo de Clientes con el cliente seleccionado
   - Desde el detalle del cliente, el comercial crea la cotización
2. **Opcionalmente**: Agregar botón "Crear Cotización" en la confirmación de conversión que lleva directo al formulario de cotización con el cliente pre-seleccionado
3. **Archivos a modificar**:
   - `apps/web/app/home/(admin)/leads/_components/leads-kanban.tsx` (flujo de conversión)
   - `apps/web/app/home/(admin)/leads/_components/lead-form-dialog.tsx` (botón convertir)

### 4.4 Visitas Comerciales

**Estado actual**:
- Tabla `customer_visits` ✅ EXISTE (4 rows)
- Tab de visitas en cliente ✅ `customer-visits-tab.tsx`
- Formulario de visitas ✅ `visit-form-dialog.tsx`
- API `/api/customers/[id]/visits` ✅ EXISTE

**Faltante según CONSOLIDADO §6**:
- Alertas automáticas cuando cliente AAA no ha sido visitado en el mes
- Reglas por categoría: AAA Bogotá = visita mensual, AAA fuera = llamada mensual
- Campo `category` en clientes (AAA, AA, B, C) - verificar si existe

**Plan de implementación**:
1. Agregar campo `customer_category` en tabla `customers` si no existe (AAA, AA, B, C)
2. Crear cron job `/api/cron/visit-alerts` que revise clientes AAA sin visita en 30 días
3. Generar notificación al asesor asignado
4. **Archivos a crear**:
   - `apps/web/app/api/cron/visit-alerts/route.ts`
   - Migración para `customer_category` si no existe

---

## BLOQUE 5: DOCUMENTOS, PDFs Y GESTIÓN DE ARCHIVOS

**Prioridad**: 🟡 ALTA
**Dependencias**: Bloque 3 (módulo financiero para proformas)

### 5.1 PDFs - Estado Actual

| PDF | Template | API Route | Estado |
|-----|----------|-----------|--------|
| Cotización | ✅ `quote-pdf-template.tsx` | ✅ `/api/pdf/quote/[id]` | FUNCIONAL |
| Proforma | ✅ `proforma-pdf-template.tsx` | ✅ `/api/pdf/proforma/[id]` | VERIFICAR funcionamiento |
| Orden de Compra | ✅ `order-pdf-template.tsx` | ✅ `/api/pdf/order/[id]` | FUNCIONAL (bug de selección) |
| Remisión | ❌ NO EXISTE | ❌ NO EXISTE | POR CREAR |

### 5.2 Crear PDF de Remisión (EXTRACCION línea 218)

**Contenido del PDF de Remisión** (CONSOLIDADO §4.1.4):
- Datos de despacho (dirección, ciudad, contacto, teléfono)
- Productos enviados con cantidades
- Transportadora y número de guía
- Número de remisión (consecutivo propio)

**Plan de implementación** (@fullstack-dev):

1. **Crear template** `apps/web/lib/pdf/shipment-pdf-template.tsx`:
   - Header con logo y datos de organización
   - Datos del pedido y cliente
   - Tabla de productos despachados (sku, descripción, cantidad)
   - Datos de transporte (transportadora, guía, fecha)
   - Datos de recepción (contacto, dirección, ciudad, horario)
   - Numeración consecutiva desde `generate_consecutive('shipment')`

2. **Crear endpoint** `apps/web/app/api/pdf/shipment/[id]/route.ts`:
   - Fetch shipment con items, order, customer, org
   - Renderizar con @react-pdf/renderer
   - Subir a Supabase Storage `generated-pdfs/{org_id}/shipments/`
   - Retornar signed URL

3. **Agregar botón** en componente de despachos

4. **Agregar consecutivo** (@db-integration):
   - Insertar en `consecutive_counters` para entity_type `shipment`

### 5.3 Verificar PDF de Proforma

**Flujo correcto** (CONSOLIDADO §4.1.2):
1. Comercial solicita proforma a Financiera
2. Financiera revisa y aprueba
3. **Sistema** genera el PDF (NO el comercial, NO financiera manualmente)
4. Se notifica al comercial
5. Comercial envía al cliente

**Verificar**:
- ¿El endpoint `/api/pdf/proforma/[id]` funciona correctamente?
- ¿Se puede invocar desde el módulo financiero (nueva funcionalidad del Bloque 3)?
- ¿El template tiene formato diferente al de cotización? (CONSOLIDADO §4.1.2: "formato diferente")

### 5.4 Gestión de Documentos Adjuntos (EXTRACCION líneas 259-276)

**Estado actual**:
- Tabla `order_documents` ✅ EXISTE (0 rows)
- API `/api/attachments/` ✅ EXISTE
- Componente `file-uploader.tsx` ✅ EXISTE

**Faltante**: La estructura de 2 carpetas por pedido (CONSOLIDADO §5.1):
- **Carpeta "Documentos Cliente"**: OC del cliente, contratos, pólizas
- **Carpeta "Documentos Proveedor"**: Cotizaciones proveedor, facturas compra, RUT

**Plan de implementación**:

1. **Verificar tabla `order_documents`** (@db-integration):
   - El campo `document_type` debe admitir: `client_document` y `supplier_document`
   - Si no existe esta distinción, agregar migración

2. **Crear componente de gestión de documentos** (@fullstack-dev):
   ```
   apps/web/app/home/(admin)/orders/_components/
   ├── documents-tab.tsx          # Tab principal con 2 secciones
   ├── document-folder.tsx        # Componente reutilizable de carpeta
   └── document-upload-dialog.tsx # Dialog para subir con tipo seleccionado
   ```

3. **Interfaz**:
   - Tab "Documentos" en el detalle del pedido
   - 2 secciones visuales: "Documentos Cliente" y "Documentos Proveedor"
   - Cada documento: nombre, fecha, subido por, descargar, previsualizar
   - Botón "Subir Documento" con selector de carpeta destino
   - Permisos: comercial sube a "Cliente", compras/logística sube a "Proveedor"

4. **Storage** (@db-integration):
   - Bucket: `documents` (ya existe según FASE-08)
   - Path: `{org_id}/orders/{order_id}/client/` y `{org_id}/orders/{order_id}/supplier/`

### 5.5 Reglas Transversales de PDFs

Verificar que se cumplan (CONSOLIDADO §4.2):

| Regla | Verificar en |
|-------|-------------|
| Orden de productos por campo `sort_order` del comercial | `quote-pdf-template.tsx` |
| Transporte interno NO visible al cliente | `quote-pdf-template.tsx`, `proforma-pdf-template.tsx` |
| Cada PDF tiene consecutivo propio | `consecutive_counters` en BD |
| Registro de fecha/hora de envío | Campo `sent_at` en `quotes` |

---

## BLOQUE 6: NOTIFICACIONES, @MENCIONES Y TRAZABILIDAD

**Prioridad**: 🟡 ALTA
**Dependencias**: Bloque 3 (notificaciones financieras)

### 6.1 Sistema de Notificaciones - Estado Actual

| Componente | Estado |
|------------|--------|
| Tabla `notifications` | ✅ 31 registros |
| Campanita (bell) | ✅ `notification-bell.tsx` funcional |
| Realtime hook | ✅ `use-realtime-notifications.ts` |
| Filtro leídas/pendientes | ✅ Existe en el componente |
| API `/api/notifications/` | ✅ GET (listar) + PUT (marcar leída) |
| `createNotification()` helper | ✅ Existe en `lib/notifications/` |
| `notifyAreaTeam()` helper | ✅ Existe |

### 6.2 Notificaciones por Implementar

Según CONSOLIDADO §3.5, se necesitan 18 tipos de notificaciones. Estado:

| # | Notificación | Canal | Estado |
|---|-------------|-------|--------|
| 1 | Captura lead por chatbot | WhatsApp | ⏳ Pendiente número WhatsApp |
| 2 | Seguimiento automático cotizaciones | WhatsApp (cron 8 días) | ⏳ Pendiente número + template Meta |
| 3 | Ruteo "otro motivo" a financiera | WhatsApp → interna | ⏳ Punto abierto |
| 4 | Centro de notificaciones (campanita) | In-app | ✅ FUNCIONAL |
| 5 | Asignación de lead | In-app | ✅ Se crea en `/api/leads/` POST |
| 6 | @Mención en notas | In-app | 🔧 PARCIAL - ver §6.3 |
| 7 | Chat interno + copia email | In-app + Email | 🔧 PARCIAL - comments existen |
| 8 | Proforma generada | In-app | ❌ Necesita módulo financiero |
| 9 | Feedback del cliente (IA) | In-app | ⏳ Pendiente WhatsApp |
| 10 | Aprobación/Rechazo de margen | In-app | 🔧 Existe en approve-margin pero verificar |
| 11 | Solicitud financiera | In-app | ❌ Necesita módulo financiero |
| 12 | Cliente bloqueado cartera | Alerta visual | ❌ Necesita módulo financiero |
| 13 | Margen bajo mínimo | Alerta visual (modal) | 🔧 Verificar margin-approval-dialog |
| 14 | Correo facturación faltante | Alerta visual (bloqueo) | ❌ Verificar en creación de pedido |
| 15 | Lead estancado | Alerta visual | ✅ Cron `lead-followup` existe |
| 16 | Factura duplicada | Alerta visual | ❌ No implementado |
| 17 | Margen aprobado visible | Indicador visual | ❌ No implementado |
| 18 | Infraestructura plataforma | Email corporativo | ⏳ Configuración de Vercel/Supabase |

**Notificaciones a implementar en este sprint**:
- #8: Notificación de proforma generada (con Bloque 3)
- #11: Solicitud financiera (con Bloque 3)
- #12: Alerta visual de cliente bloqueado (con Bloque 3)
- #14: Validación de correo de facturación al crear pedido
- #16: Alerta de factura duplicada
- #17: Indicador de margen aprobado visible en producto

### 6.3 @Menciones en Todos los Módulos

**Estado actual**:
- Componente `comment-thread.tsx` ✅ EXISTE con soporte `@[name](user_id)`
- Tabla `comments` ✅ EXISTE con campo `mentions uuid[]`
- Trigger `notify_mentions` ✅ EXISTE en BD

**Faltante** (EXTRACCION línea 188-191): Freddy confirma que TODOS los módulos deben tener @mención.

**Verificar dónde está el comment-thread**:

| Módulo | Comment Thread | Estado |
|--------|---------------|--------|
| Leads | ✅ `comment-thread.tsx` usado en lead detail | Verificar |
| Cotizaciones | ❓ Verificar si está en quote-detail-modal | Verificar |
| Pedidos | ❓ Verificar si está en order-detail | Verificar |
| Clientes | ❓ Verificar | Verificar |

**Plan**:
1. Verificar en qué módulos ya está integrado el `comment-thread`
2. Para los que falten, agregar como tab o sección en el detalle de cada entidad
3. El componente ya es polimórfico (`entity_type`, `entity_id`), solo hay que instanciarlo

### 6.4 Trazabilidad en Español

**Bug** (EXTRACCION línea 120): Estados en trazabilidad aparecen en inglés.

**Plan**:
1. Crear mapeo de estados en `order-timeline.tsx`:
```typescript
const STATUS_MAP: Record<string, string> = {
  'created': 'Creado',
  'in_process': 'En Proceso',
  'purchase_approved': 'Compra Aprobada',
  'po_sent': 'OC Enviada',
  'merchandise_received': 'Mercancía Recibida',
  'in_shipment': 'En Despacho',
  'delivered': 'Entregado',
  'invoiced': 'Facturado',
  'completed': 'Completado',
  'cancelled': 'Anulado',
};
```

---

## BLOQUE 7: MEJORAS DE UX Y VALIDACIONES DEL PIPELINE

**Prioridad**: 🟡 MEDIA
**Dependencias**: Bloques 1-3

### 7.1 Validaciones en Creación de Cotización (CONSOLIDADO §2.2)

Verificar que estas validaciones existen en el formulario y/o API:

| Validación | Frontend (Zod) | Backend (API) | Estado |
|-----------|----------------|---------------|--------|
| NIT obligatorio | ❓ | ❓ | VERIFICAR |
| Contacto principal obligatorio | ❓ | ❓ | VERIFICAR |
| IVA solo 0%, 5%, 19% | ❓ | ❓ | VERIFICAR |
| Proveedor sugerido por producto | ❓ | ❓ | VERIFICAR |
| Tiempo de entrega por producto | ❓ | ❓ | VERIFICAR |
| Garantía de producto | ❓ | ❓ | VERIFICAR |
| Orden de aparición en PDF | ✅ `sort_order` en `quote_items` | ✅ | OK |

**Plan**: Revisar `apps/web/app/home/(admin)/quotes/_lib/schema.ts` y el componente de formulario para verificar cada validación. Agregar las faltantes.

### 7.2 Validaciones en Generación de Pedido (CONSOLIDADO §2.4)

| Validación | Estado |
|-----------|--------|
| Correo de facturación diligenciado | ❌ IMPLEMENTAR - bloqueante |
| Info de despacho completa (nombre, tel, dirección, ciudad, horario, correo) | ❓ VERIFICAR |
| Datos de despacho INMUTABLES después de guardar | ❓ VERIFICAR |
| TRM actualizada al día del pedido | ❓ VERIFICAR |
| Aprobaciones previas cumplidas | ❓ VERIFICAR en `create_order_from_quote` |

**Plan**: Revisar `create_order_from_quote` RPC y el endpoint POST de `/api/orders/` para verificar cada validación.

### 7.3 Validación de Margen Dual (CONSOLIDADO §2.2.1)

El sistema debe validar margen en DOS dimensiones:

**Por Categoría de Producto:**

| Categoría | Margen Mín |
|-----------|-----------|
| Hardware | 6-7% |
| Software | 4% |
| Servicios | 6% |
| Accesorios | 6% |

**Por Días de Crédito:**

| Plazo | Margen Mín |
|-------|-----------|
| 30 días | 7% |
| 45 días | 10% |
| 60 días | 12% |

**Estado actual**:
- Tabla `margin_rules` ✅ EXISTE (24 registros)
- Fórmula: `Margen = 1 - (Total Costo / Total Venta)`

**Verificar**: ¿La RPC `request_margin_approval` valida contra ambas dimensiones?

### 7.4 Vigencia de Cotización (CONSOLIDADO §1.5)

| Regla | Estado |
|-------|--------|
| Valor por defecto: 5 días | ❓ Campo `validity_days` default es 30 en BD → CORREGIR a 5 |
| Editable por el comercial | ✅ Campo existe |
| Notificación 3 días antes | ✅ Cron `quote-expiry` existe → verificar que notifica 3 días antes, no al vencer |

**Plan**: Cambiar default de `validity_days` de 30 a 5 en la migración.

### 7.5 Consecutivos

| Entidad | Inicio | Estado |
|---------|--------|--------|
| Leads | 100 | ✅ Verificar en `consecutive_counters` |
| Cotizaciones | 30000 | ✅ Verificar en `consecutive_counters` |
| Pedidos | Auto | ✅ Existe |
| Remisión | Auto | ❌ AGREGAR en `consecutive_counters` |

### 7.6 Filtros en Todos los Módulos (EXTRACCION línea 147)

Verificar que los filtros de cada módulo coincidan con los estados correctos:
- Leads: created, pending_assignment, assigned, converted, rejected
- Cotizaciones: draft, offer_created, negotiation, risk, pending_oc, converted, rejected, lost, expired
- Pedidos: verificar que mapeen a los estados reales

---

## RESUMEN DE ARCHIVOS POR BLOQUE

### Bloque 1 - Bugs (~10 archivos)
| Archivo | Acción |
|---------|--------|
| `quotes/_components/margin-approval-dialog.tsx` | Fix error en clic |
| `quotes/_components/quotes-kanban.tsx` | Fix drag-and-drop |
| `orders/_components/shipment-form-dialog.tsx` | Fix selección de items |
| `orders/_components/` (PDF OC) | Fix selección de OC específica |
| Dashboard componentes | Fix fechas default + label duplicado |
| `orders/_components/order-timeline.tsx` | Fix estados en español |
| Admin componentes | Fix permisos y auditoría |

### Bloque 2 - Estados (~8 archivos)
| Archivo | Acción |
|---------|--------|
| Migración BD nueva | ALTER CHECK constraint |
| `packages/shared/src/lib/constants.ts` | Actualizar QUOTE_STATUSES |
| `quotes/_lib/types.ts` | Corregir type union |
| `quotes/_lib/schema.ts` | Corregir enum, labels, kanban columns |
| `quotes/_components/quotes-kanban.tsx` | Reducir a 4 columnas |
| `quotes/_components/quote-form-dialog.tsx` | Actualizar estados |
| `quotes/_components/quote-detail-modal.tsx` | Limpiar campos fantasma |
| `apps/web/app/api/quotes/route.ts` | Validar transiciones |

### Bloque 3 - Módulo Financiero (~8 archivos nuevos)
| Archivo | Acción |
|---------|--------|
| Migración permisos financieros | CREAR |
| `finance/page.tsx` | CREAR |
| `finance/_components/finance-page-client.tsx` | CREAR |
| `finance/_components/cartera-tab.tsx` | CREAR |
| `finance/_components/customer-credit-dialog.tsx` | CREAR |
| `finance/_components/payment-verification-tab.tsx` | CREAR |
| `finance/_components/proforma-requests-tab.tsx` | CREAR |
| Cotizaciones (alerta bloqueo) | MODIFICAR |

### Bloque 4 - Flujos Faltantes (~3-5 archivos)
| Archivo | Acción |
|---------|--------|
| Leads kanban/form (conversión) | MODIFICAR |
| Cron visit-alerts | CREAR |
| Migración customer_category | CREAR si falta |

### Bloque 5 - Documentos y PDFs (~5-7 archivos)
| Archivo | Acción |
|---------|--------|
| `lib/pdf/shipment-pdf-template.tsx` | CREAR |
| `api/pdf/shipment/[id]/route.ts` | CREAR |
| `orders/_components/documents-tab.tsx` | CREAR |
| `orders/_components/document-folder.tsx` | CREAR |
| `orders/_components/document-upload-dialog.tsx` | CREAR |
| Migración para document_type | CREAR si falta |

### Bloque 6 - Notificaciones (~3-5 archivos)
| Archivo | Acción |
|---------|--------|
| `order-timeline.tsx` | MODIFICAR (mapeo español) |
| Comment thread integración | VERIFICAR/AGREGAR en módulos faltantes |
| Notificaciones específicas | AGREGAR en endpoints existentes |

### Bloque 7 - Validaciones (~5-8 archivos)
| Archivo | Acción |
|---------|--------|
| `quotes/_lib/schema.ts` | Agregar validaciones Zod |
| `api/quotes/route.ts` | Agregar validaciones backend |
| `api/orders/route.ts` | Verificar validaciones de pedido |
| Migración validity_days default | CREAR |
| Migración consecutivo remisión | CREAR |

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
SPRINT ACTUAL (Semana 1):
├── BLOQUE 1: Bugs Críticos (1.1, 1.3, 1.5, 1.9)     ← PRIMERO
├── BLOQUE 2: Estados de Cotización (completo)          ← PARALELO
└── BLOQUE 1: Bugs Medios (1.2, 1.4, 1.6, 1.7, 1.8)  ← DESPUÉS

SPRINT SIGUIENTE (Semana 2):
├── BLOQUE 3: Módulo Financiero (completo)              ← PRIMERO
├── BLOQUE 5: PDF Remisión + Documentos                 ← PARALELO
└── BLOQUE 4: Flujos faltantes                          ← PARALELO

SPRINT POSTERIOR (Semana 3):
├── BLOQUE 6: Notificaciones y @menciones               ← PRIMERO
├── BLOQUE 7: Validaciones del pipeline                  ← PARALELO
└── Retesting general                                    ← FINAL
```

---

## REGLAS ARQUITECTÓNICAS A RESPETAR (@arquitecto)

1. **Multi-tenant**: TODO filtro debe incluir `organization_id`
2. **RLS = Solo aislamiento**: NO verificar permisos en RLS
3. **Permisos en API Routes**: `checkPermission('module:action')`
4. **Auth por cookies**: `@supabase/ssr` - NUNCA JWT en localStorage
5. **3 clientes Supabase**: Browser, Server (API), Service (cron/webhooks)
6. **Anti-timeout**: <9s en API routes
7. **PDF con @react-pdf/renderer**: NUNCA Puppeteer/Chromium
8. **No duplicar funciones**: Verificar FASE-06 antes de crear RPCs
9. **Migraciones**: Nombrar como `YYYYMMDDHHMMSS_nombre_snake_case.sql`
10. **Branding**: Primary #2C3E2B, Secondary #E7FF8C, Accent #FF931E

---

## PUNTOS ABIERTOS (Requieren decisión del cliente)

| # | Punto | Contexto | Decisión Necesaria |
|---|-------|----------|-------------------|
| 1 | ¿`draft` (Borrador) se muestra como columna en Kanban? | Daniel dijo 4 estados. Borrador es pre-envío | ¿Incluir como columna 0 o solo en tabla? |
| 2 | ¿`expired` (Vencida) es estado terminal válido? | No mencionado explícitamente por Daniel | ¿Mantener o eliminar? |
| 3 | Flujo de conversión de Lead | Daniel dijo "pasar a Clientes" (19 Feb) vs HU original "crear cotización" | Confirmar con Daniel |
| 4 | Contenido del Dashboard operativo | Laura dice "hay que confirmar con Daniel qué información necesita ver" | Agendar revisión con Daniel |
| 5 | Mecanismo de notificación "otro motivo" del chatbot a financiera | No quedó definido en transcripciones | Definir con Daniel |
| 6 | Migración de datos desde Bemeo/Odoo | Emma debe descargar datos de clientes, proveedores, productos | Pendiente por Emma |
| 7 | Brandbook/logo de Prosuministros | Laura debe buscar en carpeta PM | Pendiente por Laura |

---

> **Documento generado por**: @arquitecto + @fullstack-dev + @db-integration + @business-analyst
> **Fecha**: 2026-02-20
> **Versión**: 1.0
> **Estado**: Plan de implementación - PENDIENTE APROBACIÓN
> **Instrucción**: NO se realizarán cambios hasta aprobación del plan
