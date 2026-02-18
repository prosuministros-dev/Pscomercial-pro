# TEST DATA REFERENCE - PSCOMERCIAL-PRO

> **Archivo de referencia para todos los agentes de testing y preparacion de datos.**
> Usado por: `@testing-expert`, `@db-integration`
> Actualizado: 2026-02-17

---

## 1. SUPABASE DEV PROJECT

```
Project ID:  jmevnusslcdaldtzymax
URL:         https://jmevnusslcdaldtzymax.supabase.co
Anon Key:    (usar variable NEXT_PUBLIC_SUPABASE_ANON_KEY de .env.local)
Service Key: (usar variable SUPABASE_SERVICE_ROLE_KEY de .env.local)
```

## 2. APP URLs

```
Local:       http://localhost:3000
Vercel Dev:  (usar URL de preview de Vercel si aplica)
```

## 3. ORGANIZACION DE PRUEBA PRINCIPAL (Org 1)

```json
{
  "id": "GENERAR_UUID_NUEVO",
  "name": "PROSUMINISTROS TEST SAS",
  "nit": "900111222-3",
  "legal_name": "PROSUMINISTROS TEST S.A.S.",
  "phone": "+57 601 234 5678",
  "address": "Calle 100 # 15-30, Bogota, Colombia",
  "website": "https://prosuministros-test.com",
  "logo_url": null,
  "is_active": true
}
```

## 4. ORGANIZACION DE PRUEBA SECUNDARIA (Org 2 - Multi-Tenant)

```json
{
  "id": "GENERAR_UUID_NUEVO",
  "name": "OTRA EMPRESA TEST SAS",
  "nit": "800999888-1",
  "legal_name": "OTRA EMPRESA TEST S.A.S.",
  "phone": "+57 601 987 6543",
  "address": "Carrera 50 # 20-10, Medellin, Colombia",
  "website": null,
  "logo_url": null,
  "is_active": true
}
```

## 5. USUARIOS DE PRUEBA - ORGANIZACION 1

> **IMPORTANTE**: Crear en Supabase Auth (auth.users) y luego en profiles.
> El password para TODOS los usuarios de prueba es: `TestPscom2026!`

### 5.1 Matriz de Usuarios por Rol

| # | Email | Nombre | Rol | Slug | Org |
|---|-------|--------|-----|------|-----|
| 1 | `admin@prosutest.com` | Admin Principal | Super Admin | `super_admin` | Org 1 |
| 2 | `gerente@prosutest.com` | Carlos Gerente | Gerente General | `gerente_general` | Org 1 |
| 3 | `director@prosutest.com` | Diana Directora | Director Comercial | `director_comercial` | Org 1 |
| 4 | `gcomercial@prosutest.com` | Gustavo Comercial | Gerente Comercial | `gerente_comercial` | Org 1 |
| 5 | `asesor1@prosutest.com` | Andrea Asesora | Asesor Comercial | `asesor_comercial` | Org 1 |
| 6 | `asesor2@prosutest.com` | Bernardo Asesor | Asesor Comercial | `asesor_comercial` | Org 1 |
| 7 | `compras@prosutest.com` | Camila Compras | Compras | `compras` | Org 1 |
| 8 | `logistica@prosutest.com` | Luis Logistica | Logistica | `logistica` | Org 1 |
| 9 | `finanzas@prosutest.com` | Fernanda Finanzas | Finanzas | `finanzas` | Org 1 |
| 10 | `facturacion@prosutest.com` | Felipe Facturacion | Facturacion | `facturacion` | Org 1 |
| 11 | `operaciones@prosutest.com` | Oscar Operaciones | Operaciones | `operaciones` | Org 1 |
| 12 | `revisor@prosutest.com` | Roberto Revisor | Revisor | `revisor` | Org 1 |

### 5.2 Usuarios Multi-Tenant (Org 2)

| # | Email | Nombre | Rol | Slug | Org |
|---|-------|--------|-----|------|-----|
| 13 | `admin@otratest.com` | Admin Otra | Super Admin | `super_admin` | Org 2 |
| 14 | `asesor@otratest.com` | Ana Otra | Asesor Comercial | `asesor_comercial` | Org 2 |

## 6. ROLES DEL SISTEMA (12 Roles)

> Los roles deben existir en la tabla `roles` con `is_system = true`

```json
[
  { "slug": "super_admin", "name": "Super Administrador", "is_system": true },
  { "slug": "gerente_general", "name": "Gerente General", "is_system": true },
  { "slug": "director_comercial", "name": "Director Comercial", "is_system": true },
  { "slug": "gerente_comercial", "name": "Gerente Comercial", "is_system": true },
  { "slug": "asesor_comercial", "name": "Asesor Comercial", "is_system": true },
  { "slug": "compras", "name": "Compras", "is_system": true },
  { "slug": "logistica", "name": "Logistica", "is_system": true },
  { "slug": "finanzas", "name": "Finanzas", "is_system": true },
  { "slug": "facturacion", "name": "Facturacion", "is_system": true },
  { "slug": "operaciones", "name": "Operaciones", "is_system": true },
  { "slug": "revisor", "name": "Revisor", "is_system": true },
  { "slug": "cliente", "name": "Cliente", "is_system": true }
]
```

## 7. PERMISOS BASE (~65 slugs)

```json
[
  "leads:read", "leads:create", "leads:update", "leads:delete", "leads:assign",
  "quotes:read", "quotes:create", "quotes:update", "quotes:delete", "quotes:approve_margin", "quotes:send",
  "orders:read", "orders:create", "orders:update", "orders:delete", "orders:manage_billing",
  "purchase_orders:read", "purchase_orders:create", "purchase_orders:update",
  "shipments:read", "shipments:create", "shipments:update",
  "invoices:read", "invoices:create", "invoices:update",
  "products:read", "products:create", "products:update", "products:delete",
  "customers:read", "customers:create", "customers:update", "customers:delete",
  "whatsapp:read", "whatsapp:send", "whatsapp:config",
  "reports:read", "reports:export",
  "dashboard:read",
  "admin:manage_users", "admin:manage_roles", "admin:manage_settings", "admin:view_audit",
  "notifications:read", "notifications:manage",
  "licenses:read", "licenses:create", "licenses:update"
]
```

## 8. DATOS DE PRUEBA POR MODULO

### 8.1 Clientes de Prueba (Org 1)

```json
[
  {
    "company_name": "EMPRESA ALFA SAS",
    "nit": "900222333-4",
    "contact_name": "Maria Garcia",
    "contact_email": "maria@empresaalfa.com",
    "contact_phone": "+57 310 111 2222",
    "city": "Bogota",
    "address": "Calle 80 # 10-20",
    "credit_status": "approved",
    "credit_limit": 50000000
  },
  {
    "company_name": "INDUSTRIAS BETA LTDA",
    "nit": "800333444-5",
    "contact_name": "Juan Rodriguez",
    "contact_email": "juan@industriasbeta.com",
    "contact_phone": "+57 320 333 4444",
    "city": "Medellin",
    "address": "Carrera 43A # 18-35",
    "credit_status": "pending",
    "credit_limit": 0
  },
  {
    "company_name": "COMERCIAL GAMMA SA",
    "nit": "900444555-6",
    "contact_name": "Laura Martinez",
    "contact_email": "laura@comercialgamma.com",
    "contact_phone": "+57 315 555 6666",
    "city": "Cali",
    "address": "Avenida 5N # 22-45",
    "credit_status": "blocked",
    "credit_limit": 30000000
  }
]
```

### 8.2 Productos de Prueba (Org 1)

```json
[
  {
    "name": "Valvula Industrial 2 pulgadas",
    "sku": "VAL-IND-002",
    "category": "Valvulas",
    "unit_price_usd": 120.00,
    "description": "Valvula de bola industrial acero inoxidable 2 pulg",
    "is_active": true
  },
  {
    "name": "Sensor de Temperatura PT100",
    "sku": "SEN-TMP-PT1",
    "category": "Sensores",
    "unit_price_usd": 85.50,
    "description": "Sensor de temperatura RTD PT100 clase A",
    "is_active": true
  },
  {
    "name": "Bomba Centrifuga 5HP",
    "sku": "BOM-CEN-005",
    "category": "Bombas",
    "unit_price_usd": 1250.00,
    "description": "Bomba centrifuga horizontal 5HP trifasica",
    "is_active": true
  },
  {
    "name": "PLC Siemens S7-1200",
    "sku": "PLC-S71-200",
    "category": "Automatizacion",
    "unit_price_usd": 650.00,
    "description": "PLC Siemens SIMATIC S7-1200 CPU 1214C",
    "is_active": true
  },
  {
    "name": "Cable Control 4x16 AWG",
    "sku": "CAB-CTL-416",
    "category": "Cables",
    "unit_price_usd": 2.50,
    "description": "Cable de control multiconductor 4x16 AWG por metro",
    "is_active": true
  }
]
```

### 8.3 Proveedores de Prueba (Org 1)

```json
[
  {
    "name": "PROVEEDOR DELTA SAS",
    "nit": "900555666-7",
    "contact_name": "Pedro Proveedor",
    "email": "pedro@provdelta.com",
    "phone": "+57 300 777 8888",
    "city": "Bogota",
    "payment_terms": "credito_30"
  },
  {
    "name": "IMPORTADORA EPSILON LTDA",
    "nit": "800666777-8",
    "contact_name": "Sandra Epsilon",
    "email": "sandra@impepsilon.com",
    "phone": "+57 311 888 9999",
    "city": "Cartagena",
    "payment_terms": "contado"
  }
]
```

### 8.4 Categorias de Producto

```json
[
  { "name": "Valvulas", "margin_min": 20, "margin_target": 30 },
  { "name": "Sensores", "margin_min": 25, "margin_target": 35 },
  { "name": "Bombas", "margin_min": 18, "margin_target": 28 },
  { "name": "Automatizacion", "margin_min": 22, "margin_target": 32 },
  { "name": "Cables", "margin_min": 15, "margin_target": 25 }
]
```

### 8.5 TRM de Prueba

```json
{
  "value": 4250.50,
  "date": "2026-02-17",
  "source": "test_data"
}
```

## 9. LEADS DE PRUEBA (Org 1)

> Crear para probar todos los estados del pipeline

```json
[
  {
    "company_name": "LEAD NUEVO SAS",
    "nit": "900111000-1",
    "contact_name": "Nuevo Contacto",
    "contact_phone": "+57 310 000 0001",
    "contact_email": "nuevo@leadnuevo.com",
    "channel": "manual",
    "status": "created",
    "requirement": "Necesitamos 20 valvulas industriales"
  },
  {
    "company_name": "LEAD ASIGNADO SAS",
    "nit": "900111000-2",
    "contact_name": "Asignado Contacto",
    "contact_phone": "+57 310 000 0002",
    "contact_email": "asignado@leadasignado.com",
    "channel": "whatsapp",
    "status": "assigned",
    "requirement": "Cotizacion de sensores"
  },
  {
    "company_name": "LEAD CONVERTIDO SAS",
    "nit": "900111000-3",
    "contact_name": "Convertido Contacto",
    "contact_phone": "+57 310 000 0003",
    "contact_email": "convertido@leadconvertido.com",
    "channel": "web",
    "status": "converted",
    "requirement": "Compra de bombas centrifugas"
  }
]
```

## 10. CREDENCIALES PARA LOGIN EN PLAYWRIGHT

> Estas son las cuentas que Playwright usara para navegar la app

| Escenario | Email | Password | Rol |
|-----------|-------|----------|-----|
| Login Admin | `admin@prosutest.com` | `TestPscom2026!` | Super Admin |
| Login Asesor | `asesor1@prosutest.com` | `TestPscom2026!` | Asesor Comercial |
| Login Compras | `compras@prosutest.com` | `TestPscom2026!` | Compras |
| Login Logistica | `logistica@prosutest.com` | `TestPscom2026!` | Logistica |
| Login Finanzas | `finanzas@prosutest.com` | `TestPscom2026!` | Finanzas |
| Login Revisor | `revisor@prosutest.com` | `TestPscom2026!` | Revisor |
| Login Multi-tenant | `admin@otratest.com` | `TestPscom2026!` | Super Admin (Org 2) |

## 11. INSTRUCCIONES PARA @db-integration

### 11.1 Preparacion de Datos Base (EJECUTAR UNA VEZ)

```markdown
ORDEN DE EJECUCION:
1. Crear organizaciones (org1, org2)
2. Crear usuarios en auth.users (14 usuarios)
3. Crear profiles asociados a cada usuario
4. Crear roles del sistema (12 roles)
5. Crear permisos (~65 slugs)
6. Crear role_permissions (asignar permisos a roles)
7. Crear user_roles (asignar roles a usuarios)
8. Crear categorias de producto
9. Crear productos de prueba
10. Crear clientes de prueba
11. Crear proveedores de prueba
12. Insertar TRM inicial
13. Crear leads de prueba en diferentes estados
```

### 11.2 Preparacion de Datos por Fase de Testing

| Fase Testing | Datos Necesarios | Preparar Antes |
|-------------|-----------------|----------------|
| T1 (Auth) | Usuarios con credenciales | Datos base (11.1) |
| T2 (RBAC) | Usuarios con roles, permisos | Datos base (11.1) |
| T3 (Leads) | Leads en diferentes estados, asesores activos | Datos base + leads |
| T4 (Cotizaciones) | Leads convertibles, productos, TRM, clientes | Datos base + leads + productos |
| T5 (Pedidos) | Cotizaciones ganadas | T4 completado |
| T6 (Compras) | Pedidos aprobados, proveedores | T5 completado |
| T7 (Logistica) | OC con mercancia recibida | T6 completado |
| T8 (Facturacion) | Pedidos entregados | T7 completado |
| T9 (Licencias) | Items de pedido tipo software | T5 completado |
| T10 (Dashboards) | Datos en todos los estados del pipeline | T1-T8 con datos |
| T13 (WhatsApp) | Cuenta WhatsApp configurada | Config especial |
| T14 (Email) | Templates de email, SendGrid config | Config especial |
| T19 (Multi-tenant) | Org 2 con datos propios | Datos base org 2 |

### 11.3 Limpieza de Datos entre Tests

```markdown
REGLA: NO eliminar datos base (orgs, users, roles, permisos).
SOLO limpiar datos transaccionales si un test deja estado inconsistente:
- Leads de prueba temporal -> DELETE WHERE company_name LIKE '%TEST_TEMPORAL%'
- Cotizaciones de prueba -> DELETE WHERE observations LIKE '%TEST_TEMPORAL%'
- etc.
Preferir: crear datos nuevos para cada test en vez de limpiar.
```

## 12. MAPEO USUARIO -> MODULOS VISIBLES

| Rol | Dashboard | Leads | Cotiz. | Pedidos | Compras | Logist. | Factur. | Clientes | Productos | WhatsApp | Reportes | Admin |
|-----|:---------:|:-----:|:------:|:-------:|:-------:|:-------:|:-------:|:--------:|:---------:|:--------:|:--------:|:-----:|
| super_admin | X | X | X | X | X | X | X | X | X | X | X | X |
| gerente_general | X | X | X | X | X | X | X | X | X | X | X | - |
| director_comercial | X | X | X | X | - | - | - | X | X | X | X | - |
| gerente_comercial | X | X | X | X | - | - | - | X | X | - | X | - |
| asesor_comercial | X | X | X | X | - | - | - | X | X | - | - | - |
| compras | X | - | - | X | X | - | - | - | X | - | - | - |
| logistica | X | - | - | X | - | X | - | - | - | - | - | - |
| finanzas | X | - | X | X | - | - | X | X | - | - | X | - |
| facturacion | X | - | - | X | - | - | X | - | - | - | - | - |
| operaciones | X | - | - | X | X | X | - | - | - | - | X | - |
| revisor | X | X | X | X | X | X | X | X | X | - | X | - |

---

**Version**: 1.0
**Fecha**: 2026-02-17
**Mantenido por**: @testing-expert + @db-integration
