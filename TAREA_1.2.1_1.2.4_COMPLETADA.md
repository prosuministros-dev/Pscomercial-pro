# TAREA 1.2.1 y 1.2.4 - API Routes Completadas

## Archivos Creados

### 1. `/apps/web/app/api/products/route.ts` (309 líneas)

#### Endpoints implementados:

**GET /api/products**
- Lista paginada de productos con filtros opcionales
- Query params soportados:
  - `page`: Número de página (default: 1)
  - `limit`: Registros por página (default: 10)
  - `search`: Búsqueda por SKU o nombre (ILIKE)
  - `category_id`: Filtrar por categoría
  - `is_active`: Filtrar por estado activo/inactivo
- Incluye JOIN con `product_categories` para mostrar nombre de categoría
- Response: `{ data: Product[], pagination: { page, limit, total, totalPages } }`
- Permission: `products:read`

**POST /api/products**
- Crear nuevo producto
- Campos requeridos: `sku`, `name`
- Campos opcionales: `description`, `category_id`, `brand`, `unit_cost_usd`, `unit_cost_cop`, `suggested_price_cop`, `currency`, `is_service`, `is_license`, `is_active`
- Validación de SKU único por organización (usando UNIQUE constraint e índice)
- Manejo de error 23505 (duplicado) con mensaje personalizado
- Auto-asigna `organization_id` y `created_by`
- Response: `{ data: Product }` con status 201
- Permission: `products:create`

**PUT /api/products**
- Actualizar producto existente
- Requiere `id` en el body
- Validaciones:
  - Producto pertenece a la organización del usuario
  - SKU único si se está modificando
- Actualiza automáticamente `updated_at`
- Actualización selectiva (solo campos enviados)
- Permission: `products:update`
- Nota: Según permisos, solo Gerencia General puede modificar (comentado en código)

### 2. `/apps/web/app/api/trm/route.ts` (204 líneas)

#### Función auxiliar:

**fetchTRMFromBanrep(date: string)**
- Consulta API de Banco de la República (datos.gov.co)
- Endpoint: `https://www.datos.gov.co/resource/32sa-8pi3.json`
- Parámetro: `vigenciadesde='YYYY-MM-DD'`
- Extrae campo `valor` y convierte de string a number
- Manejo de errores con return null

#### Endpoints implementados:

**GET /api/trm**
- Obtener TRM actual o consultar API externa
- Query params:
  - `fetch=true`: Consulta API de Banrep, guarda en DB y retorna
  - Sin params: Retorna TRM actual de la DB usando RPC
- Con `fetch=true`:
  - Consulta `fetchTRMFromBanrep()` con fecha actual
  - UPSERT en `trm_rates` con:
    - `organization_id`, `rate_date`, `rate_value`
    - `source='api_banrep'`, `is_official=true`
  - Conflict resolution: `organization_id,rate_date`
  - Response: `{ data: { rate, date, source, saved: true } }`
- Sin `fetch`:
  - Llama RPC `get_current_trm(user.organization_id)`
  - Obtiene detalles de la TRM más reciente de `trm_rates`
  - Response: `{ data: { rate, date, source } }`
- Permission: `trm:read`

**POST /api/trm**
- Registrar/actualizar TRM manualmente
- Body requerido: `rate_date`, `rate_value`
- Body opcional: `source` (default: 'manual')
- Validaciones:
  - `rate_value` debe ser número positivo
- UPSERT en `trm_rates`:
  - Conflict resolution: `organization_id,rate_date`
  - `is_official = (source === 'api_banrep')`
- Response: `{ data: TRMRate }` con status 201
- Permission: `trm:update` (solo Gerencia - comentado en código)

## Características Comunes

### Autenticación y Autorización
- Todos los endpoints usan `requireUser(client)` para validar sesión
- Placeholder `// TODO: Implementar checkPermission()` para futuro sistema de permisos
- Filtrado automático por `organization_id` del usuario autenticado

### Manejo de Errores
- Try-catch en todos los endpoints
- Logging de errores con `console.error()`
- Respuestas HTTP apropiadas:
  - 200: OK
  - 201: Created
  - 400: Bad Request (validaciones)
  - 404: Not Found
  - 409: Conflict (duplicados)
  - 500: Internal Server Error
- Mensajes de error descriptivos en español

### Patrón de Código
- Imports consistentes: `NextRequest`, `NextResponse`, `getSupabaseServerClient`, `requireUser`
- Documentación JSDoc en cada endpoint
- Validaciones de input antes de queries
- Uso de Supabase client para queries
- Paginación estándar con offset/limit
- Select con count para totales

## Integración con Schema

### Tabla `products`
- Constraint `idx_products_org_sku` (UNIQUE) validado en POST y PUT
- Join con `product_categories` en GET
- Campos timestamp manejados automáticamente

### Tabla `trm_rates`
- UPSERT basado en `organization_id,rate_date`
- Integración con RPC `get_current_trm(org_uuid)`
- Soporte para fuentes múltiples (manual, api_banrep)

## Testing Manual Sugerido

```bash
# Products
GET /api/products?page=1&limit=10&search=laptop
POST /api/products { "sku": "TEST-001", "name": "Test Product", "unit_cost_cop": 100000 }
PUT /api/products { "id": "uuid", "suggested_price_cop": 150000 }

# TRM
GET /api/trm
GET /api/trm?fetch=true
POST /api/trm { "rate_date": "2026-02-13", "rate_value": 4250.5 }
```

## Próximos Pasos
1. Implementar sistema de permisos (`checkPermission()`)
2. Crear tipos TypeScript para request/response
3. Agregar validación de esquema con Zod
4. Tests unitarios e integración
5. Rate limiting para API de Banrep
6. Cache para TRM actual

## Archivos Generados
- `apps/web/app/api/products/route.ts` ✅
- `apps/web/app/api/trm/route.ts` ✅

**Status: COMPLETADO ✅**
