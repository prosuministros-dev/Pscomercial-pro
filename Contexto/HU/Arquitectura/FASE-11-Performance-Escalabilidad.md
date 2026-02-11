# FASE 11: Performance y Escalabilidad

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11

---

## 1. MÉTRICAS OBJETIVO

| Métrica | Objetivo | Justificación |
|---------|----------|---------------|
| **Transacciones/día/usuario** | >1,000 | Requisito del negocio |
| **Usuarios concurrentes** | 50 | Plantilla inicial |
| **Tiempo respuesta API** | <500ms p95 | UX aceptable |
| **Tiempo carga página** | <2s LCP | Core Web Vitals |
| **Disponibilidad** | 99.9% | SLA estándar SaaS |
| **Throughput total** | >50,000 tx/día | 50 usuarios × 1,000 tx |

---

## 2. OPTIMIZACIÓN DE BASE DE DATOS

### 2.1 Estrategia de Índices

```sql
-- ═══════════════════════════════════════════
-- ÍNDICES CRÍTICOS PARA RENDIMIENTO
-- ═══════════════════════════════════════════

-- === Tenant Isolation (TODOS los queries pasan por organization_id) ===
-- Estos índices ya están definidos en FASE-01, confirmamos su criticidad:

-- Leads: filtrado frecuente por estado + asesor
CREATE INDEX idx_leads_org_status ON leads (organization_id, status);
CREATE INDEX idx_leads_org_advisor ON leads (organization_id, assigned_advisor_id);
CREATE INDEX idx_leads_org_created ON leads (organization_id, created_at DESC);

-- Quotes: filtrado por estado + asesor + vencimiento
CREATE INDEX idx_quotes_org_status ON quotes (organization_id, status);
CREATE INDEX idx_quotes_org_advisor ON quotes (organization_id, advisor_id);
CREATE INDEX idx_quotes_org_expires ON quotes (organization_id, valid_until)
  WHERE status NOT IN ('won', 'lost');

-- Orders: filtrado por estado + flujo operativo
CREATE INDEX idx_orders_org_status ON orders (organization_id, status);
CREATE INDEX idx_orders_org_created ON orders (organization_id, created_at DESC);

-- Purchase Orders
CREATE INDEX idx_po_org_status ON purchase_orders (organization_id, status);
CREATE INDEX idx_po_org_supplier ON purchase_orders (organization_id, supplier_id);

-- Audit Logs: particionado por fecha (tabla más grande)
CREATE INDEX idx_audit_org_created ON audit_logs (organization_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);

-- Notifications: lectura frecuente de no leídos
CREATE INDEX idx_notif_user_unread ON notifications (user_id, is_read)
  WHERE is_read = false;
CREATE INDEX idx_notif_user_created ON notifications (user_id, created_at DESC);

-- Products: búsqueda por nombre y referencia
CREATE INDEX idx_products_org_ref ON products (organization_id, reference);
CREATE INDEX idx_products_org_name ON products USING gin (
  to_tsvector('spanish', name)
);

-- Customers: búsqueda por NIT y razón social
CREATE INDEX idx_customers_org_nit ON customers (organization_id, nit);
CREATE INDEX idx_customers_org_name ON customers USING gin (
  to_tsvector('spanish', company_name)
);

-- Quote Items: join frecuente con cotización
CREATE INDEX idx_quote_items_quote ON quote_items (quote_id);

-- Order Items: join frecuente con pedido
CREATE INDEX idx_order_items_order ON order_items (order_id);
```

### 2.2 Particionamiento de Tablas Grandes

```sql
-- ═══════════════════════════════════════════
-- PARTICIONAMIENTO POR RANGO DE FECHA
-- Para tablas que crecen >100K filas/mes
-- ═══════════════════════════════════════════

-- audit_logs: particionamiento mensual (tabla de mayor crecimiento)
CREATE TABLE audit_logs (
  id uuid DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Crear particiones automáticamente (ejecutar mensualmente vía cron)
CREATE OR REPLACE FUNCTION create_audit_partition()
RETURNS void AS $$
DECLARE
  v_start date;
  v_end date;
  v_name text;
BEGIN
  v_start := date_trunc('month', now() + interval '1 month');
  v_end := v_start + interval '1 month';
  v_name := 'audit_logs_' || to_char(v_start, 'YYYY_MM');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
     FOR VALUES FROM (%L) TO (%L)',
    v_name, v_start, v_end
  );

  -- Crear índice local en la partición
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I (organization_id, created_at DESC)',
    v_name || '_org_idx', v_name
  );
END;
$$ LANGUAGE plpgsql;

-- Política de retención: archivar particiones >12 meses
-- (detach partition → mover a cold storage si es necesario)
CREATE OR REPLACE FUNCTION archive_old_audit_partitions()
RETURNS void AS $$
DECLARE
  v_cutoff date;
  v_name text;
BEGIN
  v_cutoff := date_trunc('month', now() - interval '12 months');
  v_name := 'audit_logs_' || to_char(v_cutoff, 'YYYY_MM');

  -- Solo detach, no eliminar (mover a archivo si se necesita)
  EXECUTE format(
    'ALTER TABLE audit_logs DETACH PARTITION %I CONCURRENTLY',
    v_name
  );
END;
$$ LANGUAGE plpgsql;
```

### 2.3 Vistas Materializadas para Dashboards

```sql
-- ═══════════════════════════════════════════
-- VISTAS MATERIALIZADAS
-- Evitan queries complejos en tiempo real
-- Se refrescan periódicamente (cada 5-15 min)
-- ═══════════════════════════════════════════

-- Dashboard Comercial: resumen de pipeline por asesor
CREATE MATERIALIZED VIEW mv_commercial_dashboard AS
SELECT
  q.organization_id,
  q.advisor_id,
  q.status,
  COUNT(*) as total_quotes,
  SUM(q.total_with_iva) as total_value,
  SUM(CASE WHEN q.valid_until < now() THEN 1 ELSE 0 END) as expired_count,
  SUM(CASE WHEN q.valid_until BETWEEN now() AND now() + interval '3 days' THEN 1 ELSE 0 END) as expiring_soon,
  AVG(q.weighted_margin_pct) as avg_margin
FROM quotes q
WHERE q.status NOT IN ('lost')
GROUP BY q.organization_id, q.advisor_id, q.status;

CREATE UNIQUE INDEX idx_mv_commercial ON mv_commercial_dashboard (organization_id, advisor_id, status);

-- Dashboard Operativo: resumen de pedidos por estado
CREATE MATERIALIZED VIEW mv_operational_dashboard AS
SELECT
  o.organization_id,
  o.status,
  COUNT(*) as total_orders,
  SUM(o.total_with_iva) as total_value,
  SUM(CASE WHEN o.promised_date < now() AND o.status NOT IN ('entregado', 'facturado')
      THEN 1 ELSE 0 END) as overdue_count,
  AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at))/86400) as avg_days_in_status
FROM orders o
GROUP BY o.organization_id, o.status;

CREATE UNIQUE INDEX idx_mv_operational ON mv_operational_dashboard (organization_id, status);

-- Dashboard KPIs: métricas mensuales agregadas
CREATE MATERIALIZED VIEW mv_monthly_kpis AS
SELECT
  organization_id,
  date_trunc('month', created_at) as month,
  -- Leads
  COUNT(*) FILTER (WHERE entity_type = 'leads') as leads_created,
  -- Cotizaciones
  COUNT(*) FILTER (WHERE entity_type = 'quotes' AND action = 'insert') as quotes_created,
  COUNT(*) FILTER (WHERE entity_type = 'quotes' AND action = 'update'
    AND changes->>'status'->>'new' = 'won') as quotes_won,
  -- Pedidos
  COUNT(*) FILTER (WHERE entity_type = 'orders' AND action = 'insert') as orders_created
FROM audit_logs
GROUP BY organization_id, date_trunc('month', created_at);

CREATE UNIQUE INDEX idx_mv_kpis ON mv_monthly_kpis (organization_id, month);

-- Función para refrescar todas las vistas materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_commercial_dashboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_operational_dashboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_kpis;
END;
$$ LANGUAGE plpgsql;
```

### 2.4 Optimización de Queries Frecuentes

```sql
-- ═══════════════════════════════════════════
-- FUNCIONES RPC OPTIMIZADAS
-- Evitan N+1 y reducen roundtrips
-- ═══════════════════════════════════════════

-- Pipeline comercial completo (1 query en lugar de 5+)
CREATE OR REPLACE FUNCTION get_commercial_pipeline(
  p_org_id uuid,
  p_advisor_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'leads', (
      SELECT jsonb_agg(jsonb_build_object(
        'status', status, 'count', cnt, 'today', today_cnt
      ))
      FROM (
        SELECT status, COUNT(*) as cnt,
          COUNT(*) FILTER (WHERE created_at::date = current_date) as today_cnt
        FROM leads
        WHERE organization_id = p_org_id
          AND (p_advisor_id IS NULL OR assigned_advisor_id = p_advisor_id)
        GROUP BY status
      ) s
    ),
    'quotes', (
      SELECT jsonb_agg(jsonb_build_object(
        'status', status, 'count', cnt, 'total_value', total_val
      ))
      FROM (
        SELECT status, COUNT(*) as cnt, SUM(total_with_iva) as total_val
        FROM quotes
        WHERE organization_id = p_org_id
          AND (p_advisor_id IS NULL OR advisor_id = p_advisor_id)
        GROUP BY status
      ) s
    ),
    'orders', (
      SELECT jsonb_agg(jsonb_build_object(
        'status', status, 'count', cnt
      ))
      FROM (
        SELECT status, COUNT(*) as cnt
        FROM orders
        WHERE organization_id = p_org_id
        GROUP BY status
      ) s
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 3. CACHING STRATEGY

### 3.1 TanStack Query (Frontend)

```typescript
// lib/query-config.ts
// Configuración global de cache por tipo de dato

export const QUERY_STALE_TIMES = {
  // Datos que cambian raramente (cache largo)
  STATIC: 1000 * 60 * 60,      // 1 hora
  // Ejemplos: roles, permisos, categorías, configuración sistema

  // Datos que cambian con moderación
  MODERATE: 1000 * 60 * 5,      // 5 minutos
  // Ejemplos: productos, proveedores, clientes, TRM

  // Datos que cambian frecuentemente
  DYNAMIC: 1000 * 60 * 1,       // 1 minuto
  // Ejemplos: leads, cotizaciones, pedidos (listas)

  // Datos en tiempo real (no cachear)
  REALTIME: 0,                   // Sin cache
  // Ejemplos: notificaciones, chat WhatsApp, dashboard en vivo
} as const;

export const QUERY_GC_TIMES = {
  STATIC: 1000 * 60 * 120,      // 2 horas
  MODERATE: 1000 * 60 * 30,     // 30 minutos
  DYNAMIC: 1000 * 60 * 10,      // 10 minutos
  REALTIME: 1000 * 60 * 5,      // 5 minutos
} as const;
```

```typescript
// hooks/use-quotes.ts
// Ejemplo de hook con cache strategy

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIMES } from '@/lib/query-config';

const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  list: (filters: QuoteFilters) => [...quoteKeys.lists(), filters] as const,
  detail: (id: string) => [...quoteKeys.all, 'detail', id] as const,
};

export function useQuotes(filters: QuoteFilters) {
  return useQuery({
    queryKey: quoteKeys.list(filters),
    queryFn: () => fetchQuotes(filters),
    staleTime: QUERY_STALE_TIMES.DYNAMIC,    // 1 min
    gcTime: 1000 * 60 * 10,                   // 10 min
    placeholderData: keepPreviousData,         // Evita flash al paginar
  });
}

export function useQuoteDetail(id: string) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: () => fetchQuoteDetail(id),
    staleTime: QUERY_STALE_TIMES.DYNAMIC,
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      // Invalidar listas (se re-fetch automático)
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateQuoteStatus,
    onMutate: async ({ quoteId, newStatus }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: quoteKeys.detail(quoteId) });
      const previous = queryClient.getQueryData(quoteKeys.detail(quoteId));
      queryClient.setQueryData(quoteKeys.detail(quoteId), (old: any) => ({
        ...old,
        status: newStatus,
      }));
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback en error
      if (context?.previous) {
        queryClient.setQueryData(
          quoteKeys.detail(variables.quoteId),
          context.previous
        );
      }
    },
    onSettled: (data, error, { quoteId }) => {
      // Siempre re-validar del servidor
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(quoteId) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}
```

### 3.2 Prefetching Inteligente

```typescript
// lib/prefetch.ts
// Prefetch de datos al navegar (hover en sidebar)

import { QueryClient } from '@tanstack/react-query';

export function prefetchOnHover(queryClient: QueryClient) {
  return {
    // Cuando el usuario hace hover sobre "Cotizaciones" en sidebar
    quotes: () => {
      queryClient.prefetchQuery({
        queryKey: ['quotes', 'list', { page: 1 }],
        queryFn: () => fetchQuotes({ page: 1 }),
        staleTime: QUERY_STALE_TIMES.DYNAMIC,
      });
    },

    // Cuando el usuario hace hover sobre un lead específico
    leadDetail: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: ['leads', 'detail', id],
        queryFn: () => fetchLeadDetail(id),
        staleTime: QUERY_STALE_TIMES.DYNAMIC,
      });
    },

    // Dashboard: prefetch al login
    dashboard: () => {
      queryClient.prefetchQuery({
        queryKey: ['dashboard', 'commercial'],
        queryFn: () => fetchCommercialDashboard(),
        staleTime: QUERY_STALE_TIMES.MODERATE,
      });
    },
  };
}
```

### 3.3 Cache HTTP (Vercel Edge)

```typescript
// app/api/products/route.ts
// Cache de productos a nivel CDN (datos que cambian poco)

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const products = await getProducts(orgId);

  return NextResponse.json(products, {
    headers: {
      // Cache en CDN por 5 min, revalidar en background
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      // Variar por organización (multi-tenant)
      'Vary': 'X-Organization-Id',
    },
  });
}

// Para datos dinámicos: NO cachear en CDN
export async function GET(request: Request) {
  const quotes = await getQuotes(orgId, filters);

  return NextResponse.json(quotes, {
    headers: {
      'Cache-Control': 'private, no-cache',
    },
  });
}
```

---

## 4. ANTI-TIMEOUT PATTERNS

### 4.1 Chunked Processing (Operaciones Masivas)

```typescript
// lib/bulk-operations.ts
// Procesamiento en chunks para evitar timeout de 10s en Vercel

const CHUNK_SIZE = 50;
const VERCEL_TIMEOUT = 9000; // 9s safety margin (límite es 10s en hobby)

export async function bulkUpdatePrices(
  supabase: SupabaseClient,
  orgId: string,
  updates: PriceUpdate[]
): Promise<BulkResult> {
  const results: BulkResult = { success: 0, errors: [] };
  const chunks = chunkArray(updates, CHUNK_SIZE);
  const startTime = Date.now();

  for (const chunk of chunks) {
    // Verificar timeout antes de cada chunk
    if (Date.now() - startTime > VERCEL_TIMEOUT) {
      // Encolar chunks restantes para procesamiento async
      await enqueueRemainingChunks(orgId, chunks.slice(chunks.indexOf(chunk)));
      results.partial = true;
      break;
    }

    const { data, error } = await supabase
      .from('products')
      .upsert(
        chunk.map(u => ({
          id: u.productId,
          organization_id: orgId,
          price: u.newPrice,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );

    if (error) {
      results.errors.push({ chunk: chunks.indexOf(chunk), error: error.message });
    } else {
      results.success += chunk.length;
    }
  }

  return results;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### 4.2 Streaming para Exportaciones

```typescript
// app/api/exports/quotes/route.ts
// Streaming CSV para exportar grandes volúmenes

import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId')!;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Header CSV
      controller.enqueue(encoder.encode(
        'Consecutivo,Cliente,Asesor,Estado,Total,Fecha\n'
      ));

      // Paginar para no cargar todo en memoria
      let page = 0;
      const pageSize = 500;
      let hasMore = true;

      while (hasMore) {
        const { data: quotes } = await supabase
          .from('quotes')
          .select('consecutive, customer:customers(company_name), advisor:profiles(full_name), status, total_with_iva, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (!quotes || quotes.length === 0) {
          hasMore = false;
          break;
        }

        for (const q of quotes) {
          const line = `${q.consecutive},"${q.customer?.company_name}","${q.advisor?.full_name}",${q.status},${q.total_with_iva},${q.created_at}\n`;
          controller.enqueue(encoder.encode(line));
        }

        if (quotes.length < pageSize) hasMore = false;
        page++;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cotizaciones_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
```

### 4.3 Background Jobs (Supabase Edge Functions)

```typescript
// supabase/functions/bulk-email/index.ts
// Edge Function para envío masivo de emails (sin timeout de Vercel)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { orgId, templateId, recipientIds } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Obtener template y destinatarios
  const [{ data: template }, { data: recipients }] = await Promise.all([
    supabase.from('email_templates').select('*').eq('id', templateId).single(),
    supabase.from('profiles').select('email, full_name').in('id', recipientIds),
  ]);

  // Enviar en batches de 100 (límite SendGrid)
  const batches = chunkArray(recipients!, 100);
  let sent = 0;

  for (const batch of batches) {
    const personalizations = batch.map(r => ({
      to: [{ email: r.email, name: r.full_name }],
      dynamic_template_data: { name: r.full_name },
    }));

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations,
        from: { email: template.from_email, name: template.from_name },
        subject: template.subject,
        content: [{ type: 'text/html', value: template.html_body }],
      }),
    });

    if (response.ok) sent += batch.length;

    // Log progreso
    await supabase.from('email_logs').insert(
      batch.map(r => ({
        organization_id: orgId,
        to_email: r.email,
        template_id: templateId,
        status: response.ok ? 'sent' : 'failed',
      }))
    );
  }

  return new Response(JSON.stringify({ sent, total: recipients!.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 4.4 Cron Jobs (Vercel)

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
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/refresh-trm",
      "schedule": "0 5 * * 1-5"
    },
    {
      "path": "/api/cron/refresh-materialized-views",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/create-audit-partition",
      "schedule": "0 0 25 * *"
    },
    {
      "path": "/api/cron/check-license-renewals",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

```typescript
// app/api/cron/refresh-materialized-views/route.ts
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: Request) {
  // Verificar que es Vercel Cron (no acceso público)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc('refresh_materialized_views');

  if (error) {
    console.error('Failed to refresh materialized views:', error);
    return new Response('Error', { status: 500 });
  }

  return new Response('OK');
}
```

---

## 5. OPTIMIZACIÓN FRONTEND

### 5.1 Code Splitting y Lazy Loading

```typescript
// app/(dashboard)/layout.tsx
// Módulos cargados dinámicamente

import dynamic from 'next/dynamic';

// Componentes pesados cargados bajo demanda
const QuotePDFPreview = dynamic(
  () => import('@/components/quotes/pdf-preview'),
  { loading: () => <Skeleton className="h-96" /> }
);

const KanbanBoard = dynamic(
  () => import('@/components/shared/kanban-board'),
  { loading: () => <Skeleton className="h-64" /> }
);

const WhatsAppChat = dynamic(
  () => import('@/components/whatsapp/chat-panel'),
  { ssr: false } // Solo client-side
);

const RichTextEditor = dynamic(
  () => import('@/components/shared/rich-text-editor'),
  { ssr: false }
);
```

### 5.2 Virtualización de Listas Largas

```typescript
// components/shared/virtual-data-table.tsx
// TanStack Table + virtualización para tablas >500 filas

import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualDataTable<T>({ table, estimateSize = 48 }: Props<T>) {
  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 10, // Renderizar 10 filas extra fuera de viewport
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-white z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          <tr style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            <td colSpan={table.getAllColumns().length} style={{ padding: 0 }}>
              {virtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

### 5.3 Optimización de Imágenes y Assets

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Formatos modernos automáticos
    formats: ['image/avif', 'image/webp'],
  },

  // Turbopack para desarrollo más rápido
  experimental: {
    turbo: {},
  },
};

export default config;
```

### 5.4 Debounce en Búsquedas

```typescript
// hooks/use-debounced-search.ts
import { useState, useDeferredValue } from 'react';

export function useDebouncedSearch(delay = 300) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  // React 19: useDeferredValue es suficiente, no necesita lodash debounce
  return {
    search,
    deferredSearch,
    setSearch,
    isSearching: search !== deferredSearch,
  };
}

// Uso en componente de búsqueda de productos
function ProductSearch() {
  const { search, deferredSearch, setSearch, isSearching } = useDebouncedSearch();

  const { data: products } = useQuery({
    queryKey: ['products', 'search', deferredSearch],
    queryFn: () => searchProducts(deferredSearch),
    enabled: deferredSearch.length >= 2,
    staleTime: QUERY_STALE_TIMES.MODERATE,
  });

  return (
    <div>
      <Input
        placeholder="Buscar producto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isSearching && <Spinner size="sm" />}
      {/* Resultados */}
    </div>
  );
}
```

---

## 6. SUPABASE CONNECTION MANAGEMENT

### 6.1 Uso Correcto del SDK (Sin Pooler Directo)

```
┌────────────────────────────────────────────────────┐
│  IMPORTANTE: NO usar conexiones PostgreSQL directas │
│                                                      │
│  El Supabase SDK usa PostgREST internamente,        │
│  que ya tiene connection pooling integrado.           │
│                                                      │
│  ✅ supabase.from('table').select()  ← Usa PostgREST│
│  ✅ supabase.rpc('function_name')    ← Usa PostgREST│
│  ❌ pg.Pool() / postgres://          ← NO usar       │
│  ❌ @vercel/postgres                 ← NO necesario  │
└────────────────────────────────────────────────────┘
```

### 6.2 Tres Tipos de Cliente

```typescript
// lib/supabase/browser.ts - Para componentes Client
import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts - Para Server Components y API Routes
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// lib/supabase/service.ts - Para operaciones admin (cron, webhooks)
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

### 6.3 Límites del Plan Supabase

| Plan | Conexiones | Requests/s | Storage | Bandwidth | Realtime |
|------|-----------|-----------|---------|-----------|----------|
| **Free** | 60 | 500 | 1GB | 2GB | 200 concurrent |
| **Pro ($25/mo)** | 200 | 5,000 | 8GB | 250GB | 500 concurrent |
| **Team ($599/mo)** | 300 | 10,000 | 100GB | Unlimited | 2,000 concurrent |

**Recomendación para Pscomercial:** Iniciar con **Pro**, escalar a **Team** cuando se superen 100 usuarios o 5,000 req/s.

---

## 7. MONITOREO Y OBSERVABILIDAD

### 7.1 Logging Estructurado

```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export function createLogger(module: string) {
  return {
    info: (message: string, context?: Record<string, unknown>) =>
      log('info', module, message, context),
    warn: (message: string, context?: Record<string, unknown>) =>
      log('warn', module, message, context),
    error: (message: string, context?: Record<string, unknown>) =>
      log('error', module, message, context),
  };
}

function log(level: LogLevel, module: string, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message: `[${module}] ${message}`,
    context,
    timestamp: new Date().toISOString(),
  };

  // En Vercel, console.log se captura automáticamente
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// Uso:
const logger = createLogger('quotes');
logger.info('Quote created', { quoteId, orgId, advisorId });
logger.error('Failed to create quote', { error: err.message, orgId });
```

### 7.2 Métricas de Performance

```typescript
// lib/performance.ts
// Medición de tiempos de API Routes

export function withPerformanceLogging<T>(
  handler: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = performance.now();

  return handler().finally(() => {
    const duration = performance.now() - start;
    console.log(JSON.stringify({
      metric: 'api_duration_ms',
      operation: operationName,
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
    }));

    // Alertar si supera umbral
    if (duration > 3000) {
      console.warn(JSON.stringify({
        level: 'warn',
        message: `Slow operation: ${operationName}`,
        duration: Math.round(duration),
      }));
    }
  });
}
```

### 7.3 Health Check Endpoint

```typescript
// app/api/health/route.ts
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: string; latency?: number }> = {};

  // Check Supabase
  try {
    const supabase = createServiceClient();
    const dbStart = Date.now();
    await supabase.from('system_settings').select('id').limit(1);
    checks.database = { status: 'ok', latency: Date.now() - dbStart };
  } catch {
    checks.database = { status: 'error' };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');

  return Response.json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    totalLatency: Date.now() - start,
    timestamp: new Date().toISOString(),
  }, {
    status: allOk ? 200 : 503,
  });
}
```

---

## 8. SEGURIDAD Y RATE LIMITING

### 8.1 Rate Limiting por Organización

```typescript
// lib/rate-limiter.ts
// Rate limiting simple usando Supabase (sin Redis)

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  'api:default':     { max: 100, windowMs: 60_000 },    // 100 req/min
  'api:search':      { max: 30,  windowMs: 60_000 },    // 30 búsquedas/min
  'api:export':      { max: 5,   windowMs: 300_000 },   // 5 exports/5min
  'api:pdf':         { max: 10,  windowMs: 60_000 },    // 10 PDFs/min
  'api:whatsapp':    { max: 60,  windowMs: 60_000 },    // 60 mensajes/min
  'webhook:inbound': { max: 200, windowMs: 60_000 },    // 200 webhooks/min
};

// Implementación con Map en memoria (se resetea por cold start,
// lo cual es aceptable para Vercel serverless)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  category: string = 'api:default'
): { allowed: boolean; remaining: number; resetAt: number } {
  const limit = RATE_LIMITS[category] ?? RATE_LIMITS['api:default'];
  const now = Date.now();
  const storeKey = `${category}:${key}`;

  const existing = rateLimitStore.get(storeKey);

  if (!existing || existing.resetAt < now) {
    rateLimitStore.set(storeKey, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, remaining: limit.max - 1, resetAt: now + limit.windowMs };
  }

  if (existing.count >= limit.max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { allowed: true, remaining: limit.max - existing.count, resetAt: existing.resetAt };
}
```

### 8.2 Input Sanitization

```typescript
// lib/sanitize.ts
// Sanitización de inputs para prevenir XSS e inyecciones

import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

export function sanitizeSearchQuery(query: string): string {
  // Escapar caracteres especiales de PostgreSQL full-text search
  return query.replace(/[&|!():<>*\\]/g, '');
}
```

---

## 9. PLAN DE ESCALABILIDAD

### 9.1 Fases de Crecimiento

```
Fase 1: Lanzamiento (1-50 usuarios)
├── Supabase Pro ($25/mo)
├── Vercel Pro ($20/mo)
├── SendGrid Free (100 emails/día)
├── Meta WhatsApp API (1,000 msgs/día gratis)
└── Total: ~$45/mo

Fase 2: Crecimiento (50-200 usuarios)
├── Supabase Pro + Add-ons ($50-100/mo)
├── Vercel Pro ($20/mo)
├── SendGrid Essentials ($20/mo, 50K emails/mo)
├── Meta WhatsApp API (pago por conversación)
├── Agregar: Materialized views, particionamiento
└── Total: ~$150/mo

Fase 3: Escala (200-1000 usuarios)
├── Supabase Team ($599/mo)
├── Vercel Enterprise (contactar ventas)
├── SendGrid Pro ($90/mo, 100K emails/mo)
├── Meta WhatsApp API (tier de volumen)
├── Agregar: Read replicas, CDN para assets
└── Total: ~$800-1500/mo
```

### 9.2 Checklist de Performance Pre-Producción

| # | Verificación | Herramienta |
|---|-------------|-------------|
| 1 | Todas las tablas tienen índice en `organization_id` | `\di` en psql |
| 2 | Queries del dashboard usan vistas materializadas | Verificar código |
| 3 | RLS policies usan funciones `STABLE` | Revisar `pg_proc` |
| 4 | No hay N+1 en listados principales | Supabase Dashboard → Logs |
| 5 | TanStack Query tiene `staleTime` configurado | Revisar hooks |
| 6 | Componentes pesados usan `dynamic()` import | Verificar bundle |
| 7 | API Routes con operaciones masivas usan chunks | Revisar código |
| 8 | Cron jobs configurados en `vercel.json` | Verificar config |
| 9 | Particionamiento activo en `audit_logs` | Verificar particiones |
| 10 | Health check endpoint responde en <100ms | Probar `/api/health` |
| 11 | Rate limiting activo en APIs públicas | Probar con load test |
| 12 | Imágenes usando `next/image` con formatos modernos | Verificar HTML |

---

## 10. RESUMEN

| Capa | Estrategia | Impacto |
|------|-----------|---------|
| **Database** | Índices compuestos, particionamiento, materialized views | Queries <50ms |
| **API** | RPC consolidados, anti-N+1, chunking, streaming | <500ms p95 |
| **Cache** | TanStack Query (4 niveles staleTime), HTTP cache CDN | -60% requests |
| **Frontend** | Code splitting, virtualización, prefetch, debounce | LCP <2s |
| **Background** | Edge Functions, Vercel Cron, streaming exports | Sin timeouts |
| **Conexiones** | SDK PostgREST (built-in pooling), no pg directo | Eficiente |
| **Seguridad** | Rate limiting, input sanitization | Protección DDoS |
| **Monitoreo** | Structured logging, performance metrics, health check | Observabilidad |
