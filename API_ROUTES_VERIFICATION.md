# Verificación de API Routes - TAREA 1.2.1 y 1.2.4

## Estructura de Archivos Creados

```
apps/web/app/api/
├── customers/
│   ├── [id]/
│   │   └── contacts/
│   │       └── route.ts
│   └── route.ts
├── health/
│   └── route.ts
├── products/          ← NUEVO ✅
│   └── route.ts       (309 líneas)
└── trm/               ← NUEVO ✅
    └── route.ts       (204 líneas)
```

## API Products (`/api/products`)

### Funciones Exportadas
- Line 10: `export async function GET(request: NextRequest)`
- Line 79: `export async function POST(request: NextRequest)`
- Line 188: `export async function PUT(request: NextRequest)`

### Características
- ✅ Autenticación con `requireUser()`
- ✅ Paginación (page, limit)
- ✅ Búsqueda (search en SKU y name)
- ✅ Filtros (category_id, is_active)
- ✅ JOIN con product_categories
- ✅ Validación SKU único
- ✅ UNIQUE constraint handling (error 23505)
- ✅ Actualización selectiva de campos
- ✅ Mensajes de error en español

## API TRM (`/api/trm`)

### Funciones Exportadas
- Line 8: `async function fetchTRMFromBanrep(date: string): Promise<number | null>`
- Line 32: `export async function GET(request: NextRequest)`
- Line 146: `export async function POST(request: NextRequest)`

### Características
- ✅ Función auxiliar para fetch de API externa (Banco República)
- ✅ GET con query param `fetch=true` para sincronizar
- ✅ GET normal usa RPC `get_current_trm()`
- ✅ POST con UPSERT para actualización manual
- ✅ Validación de rate_value > 0
- ✅ Soporte para múltiples fuentes (manual, api_banrep)
- ✅ Conflict resolution en UPSERT

## Integración con Base de Datos

### Products
```sql
Table: products
UNIQUE INDEX: idx_products_org_sku ON (organization_id, sku)
JOIN: product_categories ON category_id
```

### TRM
```sql
Table: trm_rates
UNIQUE: (organization_id, rate_date)  -- usado en UPSERT
RPC: get_current_trm(org_uuid) RETURNS numeric(10,4)
```

## Endpoints Disponibles

### Products
1. `GET /api/products?page=1&limit=10&search=texto&category_id=uuid&is_active=true`
2. `POST /api/products` + body JSON
3. `PUT /api/products` + body JSON (requiere id)

### TRM
1. `GET /api/trm` (retorna TRM actual de DB)
2. `GET /api/trm?fetch=true` (consulta API Banrep y guarda)
3. `POST /api/trm` + body JSON (actualización manual)

## Response Formats

### Products GET
```json
{
  "data": [
    {
      "id": "uuid",
      "sku": "PROD-001",
      "name": "Producto Test",
      "product_categories": {
        "id": "uuid",
        "name": "Categoría",
        "slug": "categoria"
      },
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Products POST/PUT
```json
{
  "data": {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Producto Test",
    ...
  }
}
```

### TRM GET
```json
{
  "data": {
    "rate": 4250.5,
    "date": "2026-02-13",
    "source": "api_banrep"
  }
}
```

### TRM POST
```json
{
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "rate_date": "2026-02-13",
    "rate_value": 4250.5,
    "source": "manual",
    "is_official": false
  }
}
```

## Error Handling

### Status Codes Implementados
- `200` - OK (GET, PUT exitosos)
- `201` - Created (POST exitoso)
- `400` - Bad Request (validación fallida)
- `404` - Not Found (recurso no encontrado)
- `409` - Conflict (SKU duplicado)
- `500` - Internal Server Error (error de servidor/DB)

### Mensajes de Error Comunes

**Products:**
- "sku y name son campos requeridos"
- "Ya existe un producto con este SKU en la organizacion"
- "Producto no encontrado"
- "id es requerido para actualizar"

**TRM:**
- "rate_date y rate_value son campos requeridos"
- "rate_value debe ser un numero positivo"
- "No se pudo obtener la TRM de la API de Banco de la Republica"
- "No hay TRM configurada para esta organizacion"

## Permisos (TODO)

Comentarios en código indican permisos requeridos:
- `products:read` - GET products
- `products:create` - POST products
- `products:update` - PUT products (solo Gerencia General)
- `trm:read` - GET trm
- `trm:update` - POST trm (solo Gerencia)

## Testing Checklist

### Products
- [ ] GET sin filtros retorna lista paginada
- [ ] GET con search filtra correctamente
- [ ] GET con category_id filtra por categoría
- [ ] GET con is_active filtra productos activos/inactivos
- [ ] POST crea producto con datos válidos
- [ ] POST rechaza SKU duplicado (409)
- [ ] POST rechaza sin sku o name (400)
- [ ] PUT actualiza producto existente
- [ ] PUT rechaza producto de otra organización
- [ ] PUT valida SKU único al cambiar

### TRM
- [ ] GET retorna TRM actual de DB
- [ ] GET con fetch=true consulta API Banrep
- [ ] GET con fetch=true guarda en DB
- [ ] POST crea/actualiza TRM manual
- [ ] POST valida rate_value > 0
- [ ] POST hace UPSERT correctamente

## Rutas Absolutas

- Products: `c:\Users\freddyrs\OneDrive - Cegeka\Pscomercial-pro\Pscomercial-pro\apps\web\app\api\products\route.ts`
- TRM: `c:\Users\freddyrs\OneDrive - Cegeka\Pscomercial-pro\Pscomercial-pro\apps\web\app\api\trm\route.ts`

---

**TAREA COMPLETADA** ✅  
Fecha: 2026-02-13  
Agente: @fullstack-dev
