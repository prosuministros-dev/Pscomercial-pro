# FASE 3: Arquitectura Backend/Middleware

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Perspectivas:** Arquitecto | DB-Integration | Business Analyst | Fullstack Dev | UX/UI Designer
**Stack:** Next.js 15 (App Router) + Supabase + Vercel

---

## 1. ARQUITECTURA GENERAL DEL BACKEND

### 1.1 Visión General

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (Edge + Serverless)                │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ Middleware   │→ │ Next.js App      │→ │ API Routes         │ │
│  │ (Edge)      │  │ (Server          │  │ (Serverless Fns)   │ │
│  │             │  │  Components)     │  │                    │ │
│  │ - Auth check│  │ - SSR pages      │  │ - /api/leads       │ │
│  │ - Org resolv│  │ - Data fetching  │  │ - /api/quotes      │ │
│  │ - Redirect  │  │ - Streaming      │  │ - /api/orders      │ │
│  └─────────────┘  └──────────────────┘  │ - /api/webhooks    │ │
│                                          │ - /api/pdf         │ │
│                                          │ - /api/cron        │ │
│                                          └────────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
         ┌────────────┼────────────────────┐
         │            │                    │
         ▼            ▼                    ▼
┌──────────────┐ ┌──────────┐    ┌───────────────┐
│ Supabase     │ │ SendGrid │    │ Meta WhatsApp │
│              │ │ API      │    │ Cloud API     │
│ - PostgreSQL │ │          │    │               │
│ - Auth       │ └──────────┘    └───────────────┘
│ - Storage    │
│ - Realtime   │
│ - Edge Fns   │
└──────────────┘
```

### 1.2 Principios de Backend
1. **Serverless-first**: Todo corre en Vercel Serverless Functions (max 60s Pro)
2. **No estado en servidor**: Sin Redis, sin sesiones en memoria. Todo en Supabase + cookies
3. **Cookie-based auth**: `@supabase/ssr` con cookies HTTP-only para autenticación
4. **Connection pooling**: Supavisor (pool de conexiones de Supabase) para alta concurrencia
5. **Anti-timeout**: Operaciones largas divididas en chunks o delegadas a Supabase Edge Functions
6. **Anti N+1**: Usar `select()` con relaciones embebidas de Supabase o funciones RPC

---

## 2. AUTENTICACIÓN CON COOKIES

### 2.1 Configuración de @supabase/ssr

```typescript
// packages/supabase/src/clients/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar en Server Components (read-only)
          }
        },
      },
    }
  );
}
```

```typescript
// packages/supabase/src/clients/browser.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// packages/supabase/src/clients/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response };
}
```

### 2.2 Ventajas de Cookies vs localStorage
| Aspecto | Cookies (elegido) | localStorage |
|---------|------------------|-------------|
| **Acceso en Middleware** | SI (Edge Runtime) | NO |
| **Acceso en Server Components** | SI | NO |
| **Protección CSRF** | HTTP-only + SameSite | Vulnerable |
| **Tamaño** | ~4KB (suficiente para JWT) | 5-10MB |
| **Expiración automática** | SI (max-age) | Manual |
| **SSR/SSG compatible** | SI | NO |

### 2.3 Cookie Configuration

```typescript
// Supabase configura automáticamente estas cookies:
// sb-{project-ref}-auth-token → JWT del usuario
// sb-{project-ref}-auth-token-code-verifier → PKCE

// Configuración implícita:
const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 7 días
};
```

---

## 3. MIDDLEWARE DE NEXT.JS

### 3.1 Estructura del Middleware

```typescript
// apps/web/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@kit/supabase/middleware';

// Rutas públicas que NO requieren autenticación
const PUBLIC_ROUTES = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/callback',
  '/auth/forgot-password',
  '/api/webhooks/whatsapp',  // Webhook de Meta (verificación)
  '/api/webhooks/sendgrid',  // Webhook de SendGrid
  '/api/cron',               // Cron jobs de Vercel
];

// Rutas que son archivos estáticos o API internas
const IGNORED_ROUTES = [
  '/_next',
  '/favicon.ico',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ignorar rutas estáticas
  if (IGNORED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Rutas públicas: permitir sin auth
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // 3. Crear cliente Supabase con cookies
  const { supabase, response } = createMiddlewareClient(request);

  // 4. Refrescar sesión (CRÍTICO: esto refresca el JWT si está próximo a expirar)
  const { data: { user }, error } = await supabase.auth.getUser();

  // 5. Si no hay sesión válida → redirigir a login
  if (error || !user) {
    const redirectUrl = new URL('/auth/sign-in', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 6. Inyectar headers con info del usuario (para Server Components)
  response.headers.set('x-user-id', user.id);

  return response;
}

export const config = {
  matcher: [
    // Ejecutar en todas las rutas excepto archivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 3.2 Flujo del Middleware

```
Request
  │
  ▼
┌──────────────────────┐
│ 1. Is static file?   │──YES──→ NextResponse.next()
└──────────┬───────────┘
           │ NO
           ▼
┌──────────────────────┐
│ 2. Is public route?  │──YES──→ NextResponse.next()
└──────────┬───────────┘
           │ NO
           ▼
┌──────────────────────┐
│ 3. Create Supabase   │
│    client (cookies)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. getUser()         │──ERROR──→ Redirect /auth/sign-in
│    (refresh JWT)      │
└──────────┬───────────┘
           │ OK
           ▼
┌──────────────────────┐
│ 5. Set x-user-id     │
│    header             │
└──────────┬───────────┘
           │
           ▼
       Response
```

### 3.3 Por qué NO verificar permisos en el Middleware

El middleware de Next.js corre en Edge Runtime (~1ms-5ms). Verificar permisos requeriría:
1. Consultar `profiles` para obtener `organization_id`
2. Consultar `user_roles` + `role_permissions` + `permissions`

Esto añadiría ~20-50ms por request. En su lugar:
- **Middleware**: Solo verifica que hay sesión válida (1 operación)
- **Server Components/API Routes**: Verifican permisos específicos (con cache de TanStack Query)
- **RLS de Supabase**: Verifica automáticamente en cada query

---

## 4. CONNECTION POOLING (SUPAVISOR)

### 4.1 Configuración de Conexiones

Supabase ofrece 3 modos de conexión:

| Modo | Puerto | Uso | Cuándo usar |
|------|--------|-----|-------------|
| **Direct** | 5432 | Conexión PostgreSQL directa | Migrations, admin tasks |
| **Session Pool** | 5432 (pgbouncer) | Pool con estado por sesión | Long-running queries, LISTEN/NOTIFY |
| **Transaction Pool** | 6543 | Pool sin estado por transacción | **DEFAULT para serverless** |

### 4.2 Configuración Recomendada para Vercel

```env
# .env.local

# Para operaciones normales (API Routes, Server Components)
# Usa Transaction Pooler (puerto 6543)
DATABASE_URL=postgresql://postgres.jmevnusslcdaldtzymax:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Para migraciones y operaciones admin
# Usa conexión directa (puerto 5432)
DIRECT_DATABASE_URL=postgresql://postgres.jmevnusslcdaldtzymax:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# El cliente JS de Supabase usa la API REST (no necesita pool)
NEXT_PUBLIC_SUPABASE_URL=https://jmevnusslcdaldtzymax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4.3 Cuándo Usar Cada Tipo de Conexión

```typescript
// El SDK de JavaScript de Supabase NO usa conexión PostgreSQL directa.
// Usa la API REST de PostgREST → ya tiene connection pooling built-in.
// Por lo tanto, para la mayoría de operaciones, simplemente usar createClient().

// Solo necesitamos DATABASE_URL para:
// 1. Migraciones con Supabase CLI
// 2. Si usamos un ORM como Drizzle/Prisma (NO recomendado en este proyecto)
// 3. Scripts de seed data

// DECISIÓN ARQUITECTÓNICA:
// ✅ Usar el SDK de Supabase (createClient) para todo → usa PostgREST API (ya pooled)
// ✅ Usar funciones RPC para queries complejos → ejecutan en PostgreSQL
// ❌ NO usar ORM adicional → duplicaría la capa de acceso a datos
// ❌ NO usar conexión directa desde API Routes → no escala en serverless
```

### 4.4 Limites de Pool en Supabase

| Plan | Pool Connections | Direct Connections | API Rate Limit |
|------|-----------------|-------------------|----------------|
| Free | 15 | 5 | 200 req/s |
| Pro | 150 | 15 | 1,000 req/s |
| Team | 300 | 30 | 3,000 req/s |

Para >1000 tx/día/usuario con 50 usuarios:
- ~50,000 tx/día ≈ ~3.5 tx/min promedio ≈ picos de ~50 tx/min
- El plan Pro con 1,000 req/s es más que suficiente

---

## 5. ANTI-TIMEOUT PATTERNS

### 5.1 Límites de Vercel

| Plan | Serverless Function Timeout | Edge Function Timeout |
|------|----------------------------|----------------------|
| Hobby | 10 segundos | 25 segundos |
| Pro | 60 segundos | 25 segundos |
| Enterprise | 900 segundos | 25 segundos |

### 5.2 Estrategias Anti-Timeout

#### Estrategia 1: Dividir en Chunks (Bulk Operations)

```typescript
// api/bulk-operations/route.ts
// Para operaciones como "enviar cotización a 100 clientes"

export async function POST(request: Request) {
  const { items, operation } = await request.json();

  // Si hay más de 50 items, procesar en chunks
  if (items.length > 50) {
    // Crear un "job" en la base de datos
    const supabase = await createClient();
    const { data: job } = await supabase
      .from('background_jobs')
      .insert({
        type: operation,
        payload: { items },
        status: 'pending',
        total_items: items.length,
        processed_items: 0,
      })
      .select()
      .single();

    // Disparar el procesamiento vía Supabase Edge Function
    await supabase.functions.invoke('process-bulk-job', {
      body: { jobId: job.id },
    });

    return Response.json({
      status: 'processing',
      jobId: job.id,
      message: `Processing ${items.length} items in background`,
    });
  }

  // Si son pocos items, procesar inline
  const results = await processItems(items, operation);
  return Response.json({ status: 'completed', results });
}
```

#### Estrategia 2: Streaming Response para Reportes

```typescript
// api/reports/export/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const supabase = await createClient();
      let offset = 0;
      const batchSize = 500;

      // Enviar header del CSV
      controller.enqueue(encoder.encode('id,date,customer,total\n'));

      while (true) {
        const { data, error } = await supabase
          .from('orders')
          .select('id, created_at, customer:customers(business_name), total')
          .range(offset, offset + batchSize - 1)
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) break;

        // Enviar chunk de datos
        const csv = data.map(row =>
          `${row.id},${row.created_at},${row.customer.business_name},${row.total}`
        ).join('\n') + '\n';

        controller.enqueue(encoder.encode(csv));
        offset += batchSize;

        if (data.length < batchSize) break;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="orders-export.csv"',
    },
  });
}
```

#### Estrategia 3: Supabase Edge Functions para Procesos Largos

```typescript
// supabase/functions/process-bulk-job/index.ts
// Edge Function de Supabase (timeout de 150s en Pro)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { jobId } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Obtener el job
  const { data: job } = await supabase
    .from('background_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  // Procesar items uno a uno
  const items = job.payload.items;
  for (let i = 0; i < items.length; i++) {
    await processItem(supabase, items[i], job.type);

    // Actualizar progreso cada 10 items
    if (i % 10 === 0) {
      await supabase
        .from('background_jobs')
        .update({ processed_items: i + 1, status: 'processing' })
        .eq('id', jobId);
    }
  }

  // Marcar como completado
  await supabase
    .from('background_jobs')
    .update({ status: 'completed', processed_items: items.length })
    .eq('id', jobId);

  return new Response(JSON.stringify({ success: true }));
});
```

#### Estrategia 4: Vercel Cron Jobs para Tareas Programadas

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/expire-quotes",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 8 * * 1-5"
    },
    {
      "path": "/api/cron/refresh-trm",
      "schedule": "0 7 * * 1-5"
    },
    {
      "path": "/api/cron/check-license-renewals",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

```typescript
// api/cron/expire-quotes/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Verificar que viene de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createServiceClient(); // usa service_role_key

  // Expirar cotizaciones vencidas
  const { data, error } = await supabase
    .from('quotes')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .in('status', ['offer_created', 'negotiation', 'risk'])
    .select('id, quote_number, advisor_id');

  // Notificar a los asesores
  if (data && data.length > 0) {
    const notifications = data.map(quote => ({
      user_id: quote.advisor_id,
      type: 'quote_expired',
      title: `Cotización #${quote.quote_number} venció`,
      message: 'La cotización ha superado su fecha de validez.',
      entity_type: 'quote',
      entity_id: quote.id,
    }));

    await supabase.from('notifications').insert(notifications);
  }

  return Response.json({
    expired: data?.length ?? 0,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 6. PREVENCIÓN DE CONSULTAS EN CASCADA (Anti N+1)

### 6.1 Problema N+1 con Supabase

```typescript
// ❌ MALO: N+1 queries
const { data: orders } = await supabase.from('orders').select('*');
for (const order of orders) {
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);  // 1 query por pedido!
  order.items = items;
}
```

### 6.2 Solución: Relaciones Embebidas de Supabase

```typescript
// ✅ BUENO: 1 sola query con relaciones embebidas
const { data: orders } = await supabase
  .from('orders')
  .select(`
    *,
    customer:customers(id, business_name, nit),
    advisor:profiles!advisor_id(id, full_name, avatar_url),
    items:order_items(
      id, sku, description, quantity, unit_price, total, item_status,
      product:products(id, name, brand)
    ),
    quote:quotes(id, quote_number)
  `)
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .range(0, 49);

// PostgREST traduce esto a JOINs eficientes en PostgreSQL
```

### 6.3 Solución: Funciones RPC para Queries Complejos

```sql
-- Para el dashboard que necesita múltiples aggregaciones
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_org_id uuid,
  p_user_id uuid,
  p_date_from timestamptz DEFAULT now() - interval '30 days',
  p_date_to timestamptz DEFAULT now()
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'leads', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending_assignment'),
        'assigned', COUNT(*) FILTER (WHERE status = 'assigned'),
        'converted', COUNT(*) FILTER (WHERE status = 'converted')
      )
      FROM leads
      WHERE organization_id = p_org_id
        AND created_at BETWEEN p_date_from AND p_date_to
    ),
    'quotes', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'total_value', COALESCE(SUM(total), 0),
        'by_status', jsonb_object_agg(status, cnt)
      )
      FROM (
        SELECT status, COUNT(*) as cnt
        FROM quotes
        WHERE organization_id = p_org_id
          AND created_at BETWEEN p_date_from AND p_date_to
        GROUP BY status
      ) sq
    ),
    'orders', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'total_value', COALESCE(SUM(total), 0),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'in_progress', COUNT(*) FILTER (WHERE status NOT IN ('completed', 'cancelled'))
      )
      FROM orders
      WHERE organization_id = p_org_id
        AND created_at BETWEEN p_date_from AND p_date_to
    ),
    'revenue', (
      SELECT jsonb_build_object(
        'invoiced', COALESCE(SUM(total), 0),
        'collected', COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0),
        'pending', COALESCE(SUM(total) FILTER (WHERE status = 'pending'), 0)
      )
      FROM invoices
      WHERE organization_id = p_org_id
        AND invoice_date BETWEEN p_date_from::date AND p_date_to::date
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 6.4 Patrón de Data Fetching por Módulo

```typescript
// Cada módulo tiene un archivo de queries centralizado
// packages/supabase/src/queries/orders.ts

import { SupabaseClient } from '@supabase/supabase-js';

// Query estándar para listado con paginación
export async function getOrders(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    status?: string;
    advisorId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }
) {
  const { page = 1, pageSize = 25 } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, total, currency,
      delivery_date, created_at,
      customer:customers!inner(id, business_name, nit),
      advisor:profiles!advisor_id(id, full_name),
      items_count:order_items(count)
    `, { count: 'exact' })
    .eq('organization_id', params.organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.advisorId) {
    query = query.eq('advisor_id', params.advisorId);
  }
  if (params.search) {
    query = query.or(
      `order_number.eq.${params.search},` +
      `customer.business_name.ilike.%${params.search}%`
    );
  }

  return query;
}

// Query para detalle con todas las relaciones
export async function getOrderDetail(
  supabase: SupabaseClient,
  orderId: string
) {
  return supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      advisor:profiles!advisor_id(id, full_name, email, phone, avatar_url),
      quote:quotes(id, quote_number, quote_date),
      items:order_items(
        *,
        product:products(id, name, sku, brand, is_license),
        purchase_items:purchase_order_items(
          id, quantity_ordered, quantity_received, status,
          purchase_order:purchase_orders(id, po_number, supplier:suppliers(name), status)
        ),
        shipment_items:shipment_items(
          id, quantity_shipped,
          shipment:shipments(id, shipment_number, status, tracking_number, carrier)
        ),
        license:license_records(*)
      ),
      status_history:order_status_history(*, changed_by_profile:profiles!changed_by(full_name)),
      pending_tasks:order_pending_tasks(*, assigned_profile:profiles!assigned_to(full_name)),
      documents:order_documents(*),
      comments:comments(
        *,
        author:profiles!author_id(id, full_name, avatar_url)
      )
    `)
    .eq('id', orderId)
    .single();
}
```

---

## 7. ESTRUCTURA DE API ROUTES

### 7.1 Organización de Carpetas

```
apps/web/app/api/
├── auth/
│   └── callback/route.ts          # OAuth callback
├── leads/
│   ├── route.ts                   # GET (list), POST (create)
│   ├── [id]/route.ts              # GET (detail), PATCH (update), DELETE
│   ├── [id]/assign/route.ts       # POST (assign/reassign)
│   └── [id]/convert/route.ts      # POST (convert to quote)
├── quotes/
│   ├── route.ts                   # GET, POST
│   ├── [id]/route.ts              # GET, PATCH, DELETE
│   ├── [id]/approve/route.ts      # POST (approve margin)
│   ├── [id]/proforma/route.ts     # POST (generate PDF)
│   └── [id]/send/route.ts         # POST (send to client)
├── orders/
│   ├── route.ts                   # GET, POST
│   ├── [id]/route.ts              # GET, PATCH
│   └── [id]/status/route.ts       # PATCH (change status)
├── purchase-orders/
│   ├── route.ts                   # GET, POST
│   └── [id]/route.ts              # GET, PATCH
├── shipments/
│   ├── route.ts                   # GET, POST
│   └── [id]/route.ts              # GET, PATCH
├── invoices/
│   ├── route.ts                   # GET, POST
│   └── [id]/route.ts              # GET, PATCH
├── products/
│   └── route.ts                   # GET, POST
├── customers/
│   └── route.ts                   # GET, POST
├── notifications/
│   ├── route.ts                   # GET
│   └── [id]/read/route.ts         # PATCH (mark as read)
├── pdf/
│   ├── quote/[id]/route.ts        # GET (generate quote PDF)
│   ├── proforma/[id]/route.ts     # GET (generate proforma PDF)
│   └── order/[id]/route.ts        # GET (generate order PDF)
├── webhooks/
│   ├── whatsapp/route.ts          # POST (Meta webhook)
│   └── sendgrid/route.ts          # POST (SendGrid webhook)
├── cron/
│   ├── expire-quotes/route.ts     # Cron: expirar cotizaciones
│   ├── send-reminders/route.ts    # Cron: enviar recordatorios
│   └── refresh-trm/route.ts       # Cron: actualizar TRM
└── dashboard/
    └── summary/route.ts           # GET (dashboard RPC)
```

### 7.2 Patrón Base de API Route

```typescript
// Patrón estándar para todas las API Routes
// lib/api/create-api-handler.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@kit/supabase/server';
import { checkPermission } from '@/lib/permissions/check-permission';

type ApiHandler = (
  request: NextRequest,
  context: {
    supabase: ReturnType<typeof createClient>;
    userId: string;
    organizationId: string;
    params?: Record<string, string>;
  }
) => Promise<NextResponse>;

export function createApiHandler(options: {
  permission: string;
  handler: ApiHandler;
}) {
  return async function(request: NextRequest, { params }: { params?: Promise<Record<string, string>> }) {
    try {
      // 1. Verificar permiso
      const auth = await checkPermission(options.permission);
      if (!auth.allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 2. Crear cliente Supabase
      const supabase = await createClient();

      // 3. Resolver params
      const resolvedParams = params ? await params : {};

      // 4. Ejecutar handler
      return await options.handler(request, {
        supabase,
        userId: auth.userId,
        organizationId: auth.organizationId,
        params: resolvedParams,
      });
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

// Uso:
// export const GET = createApiHandler({
//   permission: 'orders:read',
//   handler: async (request, { supabase, organizationId }) => {
//     const { data } = await getOrders(supabase, { organizationId });
//     return NextResponse.json(data);
//   },
// });
```

---

## 8. MANEJO DE ERRORES

### 8.1 Error Handler Centralizado

```typescript
// lib/api/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// Respuesta estandarizada de error
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code, fields: (error as any).fields },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

---

## 9. WEBHOOK HANDLING

### 9.1 WhatsApp Webhook (Meta)

```typescript
// api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET: Verificación del webhook por Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// POST: Mensajes entrantes
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verificar firma de Meta (seguridad)
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifyMetaSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Procesar en background para responder rápido a Meta (<15s)
  // Meta requiere response 200 en <20 segundos
  processWhatsAppWebhook(body).catch(console.error);

  return new Response('OK', { status: 200 });
}
```

### 9.2 SendGrid Webhook

```typescript
// api/webhooks/sendgrid/route.ts
export async function POST(request: NextRequest) {
  const events = await request.json();
  const supabase = createServiceClient();

  // Actualizar estado de emails en batch
  const updates = events.map((event: any) => ({
    sendgrid_message_id: event.sg_message_id,
    status: mapSendGridEvent(event.event), // delivered, opened, bounced, etc.
    metadata: event,
  }));

  // Bulk update en una sola operación
  for (const update of updates) {
    await supabase
      .from('email_logs')
      .update({ status: update.status, metadata: update.metadata })
      .eq('sendgrid_message_id', update.sendgrid_message_id);
  }

  return new Response('OK', { status: 200 });
}
```

---

## 10. RESUMEN DE DECISIONES ARQUITECTÓNICAS

| Decisión | Elección | Razón |
|----------|----------|-------|
| **Autenticación** | Cookie-based (@supabase/ssr) | Compatible con SSR, middleware, seguro |
| **Pool de conexiones** | SDK JS (PostgREST API built-in) | No necesita pool externo |
| **Anti-timeout** | Chunks + Edge Functions + Cron | Divide operaciones largas |
| **Anti N+1** | Selects con relaciones + RPC | 1 query en lugar de N |
| **Middleware** | Solo auth check (no permisos) | Rendimiento: <5ms por request |
| **API pattern** | createApiHandler wrapper | Consistencia + auth en todas las rutas |
| **Background jobs** | Supabase Edge Functions | Sin infraestructura adicional |
| **Cron** | Vercel Cron | Integrado, sin costo adicional |
| **Error handling** | AppError hierarchy | Errores tipados y predecibles |
| **Webhooks** | Respuesta rápida + background | Cumplir timeout de Meta/SendGrid |

### Métricas Esperadas:
- **Middleware latency**: <5ms (solo cookie check)
- **API Route latency**: <200ms (query simple) / <500ms (query complejo con RPC)
- **Max concurrent connections**: 150 (Supabase Pro plan)
- **Timeout budget**: 60s (Vercel Pro) - suficiente para operaciones normales
- **Cron jobs**: 4 tareas programadas (diaria + semanal)
