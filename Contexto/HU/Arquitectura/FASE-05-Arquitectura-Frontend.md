# FASE 5: Arquitectura Frontend

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Perspectivas:** Arquitecto | Fullstack Dev | UX/UI Designer
**Stack:** Next.js 15 (App Router) | React 19 | TailwindCSS 4 | Shadcn/UI | TanStack Query + Table

---

## 1. ESTRUCTURA DEL MONOREPO

### 1.1 Turborepo Workspace

```
pscomercial-pro/
├── apps/
│   └── web/                          # Next.js 15 App
│       ├── app/                      # App Router (pages + layouts)
│       │   ├── (auth)/               # Grupo: páginas de autenticación
│       │   │   ├── auth/
│       │   │   │   ├── sign-in/page.tsx
│       │   │   │   ├── sign-up/page.tsx
│       │   │   │   ├── callback/route.ts
│       │   │   │   └── forgot-password/page.tsx
│       │   │   └── layout.tsx        # Layout sin sidebar
│       │   │
│       │   ├── (dashboard)/          # Grupo: páginas protegidas (con sidebar)
│       │   │   ├── layout.tsx        # Layout con sidebar + header + PermissionsProvider
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── leads/
│       │   │   │   ├── page.tsx      # Listado kanban/tabla
│       │   │   │   └── [id]/page.tsx # Detalle de lead
│       │   │   ├── quotes/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── new/page.tsx  # Nueva cotización
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── orders/
│       │   │   │   ├── page.tsx      # Panel principal de pedidos
│       │   │   │   ├── new/page.tsx  # Crear pedido
│       │   │   │   └── [id]/page.tsx # Detalle con tabs
│       │   │   ├── purchase-orders/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── logistics/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── billing/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── products/
│       │   │   │   └── page.tsx
│       │   │   ├── whatsapp/
│       │   │   │   └── page.tsx      # Panel WhatsApp (chat)
│       │   │   ├── reports/
│       │   │   │   └── page.tsx
│       │   │   ├── operations/
│       │   │   │   └── page.tsx      # Tablero operativo (semáforo)
│       │   │   ├── team/
│       │   │   │   └── page.tsx
│       │   │   ├── admin/
│       │   │   │   ├── page.tsx      # Panel admin
│       │   │   │   ├── roles/page.tsx
│       │   │   │   ├── settings/page.tsx
│       │   │   │   └── audit/page.tsx
│       │   │   └── notifications/
│       │   │       └── page.tsx      # Todas las notificaciones
│       │   │
│       │   ├── api/                  # API Routes (ver FASE 3)
│       │   ├── layout.tsx            # Root layout
│       │   └── not-found.tsx
│       │
│       ├── middleware.ts             # Auth middleware
│       ├── supabase/                 # Supabase config + migrations
│       └── next.config.ts
│
├── packages/
│   ├── ui/                           # Componentes Shadcn/UI base
│   │   └── src/
│   │       └── components/
│   │           ├── button.tsx
│   │           ├── card.tsx
│   │           ├── dialog.tsx
│   │           ├── table.tsx
│   │           └── ... (Shadcn components)
│   │
│   ├── supabase/                     # Clientes + Queries + Types
│   │   └── src/
│   │       ├── clients/
│   │       │   ├── server.ts
│   │       │   ├── browser.ts
│   │       │   └── middleware.ts
│   │       ├── queries/              # Queries centralizados por módulo
│   │       │   ├── leads.ts
│   │       │   ├── quotes.ts
│   │       │   ├── orders.ts
│   │       │   ├── products.ts
│   │       │   ├── customers.ts
│   │       │   ├── purchase-orders.ts
│   │       │   ├── shipments.ts
│   │       │   ├── invoices.ts
│   │       │   ├── notifications.ts
│   │       │   └── dashboard.ts
│   │       ├── hooks/                # React Query hooks centralizados
│   │       │   ├── use-leads.ts
│   │       │   ├── use-quotes.ts
│   │       │   ├── use-orders.ts
│   │       │   ├── use-products.ts
│   │       │   ├── use-notifications.ts
│   │       │   └── use-dashboard.ts
│   │       └── types/                # Tipos TypeScript generados
│   │           └── database.ts       # supabase gen types
│   │
│   ├── features/                     # Feature packages
│   │   ├── auth/                     # Autenticación
│   │   │   └── src/
│   │   │       ├── components/
│   │   │       └── hooks/
│   │   ├── accounts/                 # Gestión de cuenta/org
│   │   └── permissions/              # Sistema de permisos
│   │       └── src/
│   │           ├── context.tsx
│   │           ├── hooks.ts
│   │           ├── gate.tsx
│   │           └── types.ts
│   │
│   └── shared/                       # Utilidades compartidas
│       └── src/
│           ├── lib/
│           │   ├── utils.ts          # cn(), formatCurrency(), formatDate()
│           │   ├── constants.ts      # STATUS_COLORS, MODULES, etc.
│           │   └── validators.ts     # Zod schemas compartidos
│           └── types/
│               └── index.ts          # Tipos compartidos
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 2. MÓDULOS FRONTEND (12 módulos)

### 2.1 Mapa de Módulos vs Templates Figma

| # | Módulo | Route | Template Figma | Componentes Clave |
|---|--------|-------|---------------|-------------------|
| 1 | Dashboard | `/dashboard` | dashboard.tsx | KPI cards, charts, funnel |
| 2 | Leads | `/leads` | leads.tsx, leads-kanban.tsx | Kanban board, create/view modals |
| 3 | Cotizaciones | `/quotes` | cotizaciones.tsx, cotizaciones-kanban.tsx | Kanban, create modal, product table |
| 4 | Pedidos | `/orders` | pedidos-nuevo/*.tsx (8 files) | Panel principal, crear, detalle, tabs |
| 5 | Órdenes de Compra | `/purchase-orders` | ordenes-compra.tsx | Table, create form |
| 6 | Logística | `/logistics` | gestion-despachos.tsx | Dispatch list, tracking |
| 7 | Facturación | `/billing` | financiero.tsx | Invoice list, register form |
| 8 | Productos | `/products` | (inline in cotización) | CRUD table |
| 9 | WhatsApp | `/whatsapp` | whatsapp-panel.tsx | Chat interface, conversations |
| 10 | Reportes | `/reports` | analytics.tsx | Charts, filters, export |
| 11 | Tablero Operativo | `/operations` | tablero-operativo.tsx, vista-kanban-ejecutiva.tsx | Traffic light, kanban |
| 12 | Admin | `/admin/*` | admin-panel.tsx, roles-permisos.tsx, control-financiero.tsx | Roles matrix, users table, audit log |

### 2.2 Formatos PDF

| Formato | Route | Template Figma | Generación |
|---------|-------|---------------|------------|
| Cotización | `/api/pdf/quote/[id]` | cotizacion-formato.tsx | Backend (pdf-lib/react-pdf) |
| Proforma | `/api/pdf/proforma/[id]` | proforma-formato.tsx | Backend |
| Orden/Pedido | `/api/pdf/order/[id]` | orden-formato.tsx | Backend |

---

## 3. PATRONES DE COMPONENTES

### 3.1 Jerarquía de Componentes

```
Page (Server Component)
  └── PageClient (Client Component wrapper)
       ├── PageHeader (título, breadcrumbs, acciones)
       ├── Filters (búsqueda, filtros por estado, fecha)
       ├── ViewToggle (tabla ↔ kanban)
       ├── DataTable / KanbanBoard (datos)
       │    ├── TableRow / KanbanCard
       │    └── Pagination
       ├── CreateModal / DetailModal
       │    ├── Form (React Hook Form + Zod)
       │    └── Actions (submit, cancel)
       └── EmptyState
```

### 3.2 Patrón: Server Component + Client Wrapper

```tsx
// app/(dashboard)/leads/page.tsx (Server Component)
import { createClient } from '@kit/supabase/server';
import { LeadsPageClient } from './_components/leads-page-client';

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Pre-fetch initial data on server
  const { data: initialLeads } = await supabase
    .from('leads')
    .select('*, assigned_to_profile:profiles!assigned_to(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(50);

  return <LeadsPageClient initialData={initialLeads ?? []} userId={user!.id} />;
}
```

```tsx
// app/(dashboard)/leads/_components/leads-page-client.tsx
'use client';

import { useState } from 'react';
import { useLeads } from '@kit/supabase/hooks/use-leads';
import { PermissionGate } from '@kit/features/permissions';
import { LeadsKanban } from './leads-kanban';
import { LeadsTable } from './leads-table';
import { CreateLeadModal } from './create-lead-modal';

export function LeadsPageClient({ initialData, userId }: Props) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: leads, isLoading } = useLeads({ initialData });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Leads</h1>
        <div className="flex gap-2">
          <ViewToggle value={view} onChange={setView} />
          <PermissionGate permission="leads:create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lead
            </Button>
          </PermissionGate>
        </div>
      </div>

      {view === 'kanban' ? (
        <LeadsKanban leads={leads} />
      ) : (
        <LeadsTable leads={leads} />
      )}

      <CreateLeadModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
```

### 3.3 Patrón: React Query Hook Centralizado

```typescript
// packages/supabase/src/hooks/use-leads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../clients/browser';
import { getLeads, getLeadDetail, createLead, updateLead } from '../queries/leads';

// Keys factory para invalidación precisa
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
};

// Hook: Listar leads
export function useLeads(params?: {
  status?: string;
  page?: number;
  initialData?: any[];
}) {
  const supabase = createClient();

  return useQuery({
    queryKey: leadKeys.list({ status: params?.status, page: params?.page }),
    queryFn: () => getLeads(supabase, params),
    initialData: params?.initialData,
    staleTime: 30 * 1000,      // 30 segundos
    gcTime: 5 * 60 * 1000,     // 5 minutos
  });
}

// Hook: Detalle de lead
export function useLeadDetail(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => getLeadDetail(supabase, id),
    enabled: !!id,
  });
}

// Hook: Crear lead
export function useCreateLead() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadInput) => createLead(supabase, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

// Hook: Actualizar lead
export function useUpdateLead() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadInput }) =>
      updateLead(supabase, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}
```

### 3.4 Patrón: Formularios con React Hook Form + Zod

```typescript
// Esquema Zod compartido (packages/shared/src/lib/validators.ts)
import { z } from 'zod';

export const createLeadSchema = z.object({
  business_name: z.string().min(1, 'La razón social es requerida'),
  nit: z.string().min(1, 'El NIT es requerido'),
  contact_name: z.string().min(1, 'El nombre del contacto es requerido'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Teléfono inválido'),
  email: z.string().email('Email inválido'),
  requirement: z.string().min(1, 'El requerimiento es requerido'),
  channel: z.enum(['whatsapp', 'web', 'manual']),
  lead_date: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
```

```tsx
// Componente de formulario
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, type CreateLeadInput } from '@kit/shared/validators';
import { useCreateLead } from '@kit/supabase/hooks/use-leads';

export function CreateLeadForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate: createLead, isPending } = useCreateLead();

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      channel: 'manual',
    },
  });

  const onSubmit = (data: CreateLeadInput) => {
    createLead(data, {
      onSuccess: () => {
        form.reset();
        onSuccess();
        toast.success('Lead creado exitosamente');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ... form fields using Shadcn FormField ... */}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creando...' : 'Crear Lead'}
        </Button>
      </form>
    </Form>
  );
}
```

### 3.5 Patrón: TanStack Table para Listados

```tsx
// Columnas reutilizables con TanStack Table
import { ColumnDef } from '@tanstack/react-table';

export const leadsColumns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'lead_number',
    header: '#',
    cell: ({ row }) => <span className="font-mono">{row.getValue('lead_number')}</span>,
    size: 80,
  },
  {
    accessorKey: 'business_name',
    header: 'Empresa',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue('business_name')}</p>
        <p className="text-xs text-muted-foreground">{row.original.contact_name}</p>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} entity="lead" />,
    filterFn: 'equals',
  },
  {
    accessorKey: 'channel',
    header: 'Canal',
    cell: ({ row }) => <ChannelBadge channel={row.getValue('channel')} />,
  },
  {
    accessorKey: 'assigned_to_profile',
    header: 'Asesor',
    cell: ({ row }) => <UserAvatar user={row.original.assigned_to_profile} />,
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    cell: ({ row }) => formatDate(row.getValue('created_at')),
  },
];
```

---

## 4. COMPONENTES COMPARTIDOS CLAVE

### 4.1 Catálogo de Componentes Reutilizables

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| `StatusBadge` | packages/ui | Badge de estado con colores por entidad |
| `ChannelBadge` | packages/ui | Badge de canal (WhatsApp, Web, Manual) |
| `UserAvatar` | packages/ui | Avatar con nombre del usuario |
| `PermissionGate` | packages/features/permissions | Condicionar UI por permiso |
| `DataTable` | packages/ui | Tabla genérica con TanStack Table |
| `KanbanBoard` | packages/ui | Board genérico drag & drop |
| `PageHeader` | packages/ui | Header de página con breadcrumbs |
| `EmptyState` | packages/ui | Estado vacío con ilustración |
| `ConfirmDialog` | packages/ui | Dialog de confirmación genérico |
| `CommentThread` | packages/ui | Hilo de comentarios con @menciones |
| `NotificationBell` | packages/ui | Campanita con badge de no leídas |
| `SearchInput` | packages/ui | Input de búsqueda con debounce |
| `DateRangePicker` | packages/ui | Selector de rango de fechas |
| `CurrencyDisplay` | packages/ui | Formato de moneda (COP/USD) |
| `TrafficLightBadge` | packages/ui | Semáforo (green/yellow/red) |
| `FileUploader` | packages/ui | Uploader de archivos a Supabase Storage |

### 4.2 Branding (PODENZA/PROSUMINISTROS)

```css
/* Colores de la marca (del fullstack-dev agent) */
:root {
  --color-primary: #2C3E2B;     /* Verde oscuro */
  --color-secondary: #E7FF8C;   /* Verde lima */
  --color-accent: #FF931E;      /* Naranja */

  --grad-brand: linear-gradient(135deg, #2C3E2B, #3D5A3C);
  --grad-accent: linear-gradient(135deg, #FF931E, #FFB347);
  --grad-lime: linear-gradient(135deg, #E7FF8C, #C4E64E);
}
```

---

## 5. LAYOUT PRINCIPAL

### 5.1 Dashboard Layout

```tsx
// app/(dashboard)/layout.tsx
import { createClient } from '@kit/supabase/server';
import { PermissionsProvider } from '@kit/features/permissions';
import { Sidebar } from './_components/sidebar';
import { Header } from './_components/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(id, name, logo_url)')
    .eq('id', user.id)
    .single();

  return (
    <PermissionsProvider userId={user.id}>
      <div className="flex h-screen">
        <Sidebar user={profile} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={profile} />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
```

### 5.2 Sidebar con Permisos

```tsx
// _components/sidebar.tsx
'use client';
import { useCanAccessModule } from '@kit/features/permissions';
import { MAIN_NAVIGATION } from '@/config/navigation';

export function Sidebar({ user }: { user: Profile }) {
  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <img src={user.organization.logo_url} alt="" className="h-8" />
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {MAIN_NAVIGATION.map((item) => (
          <SidebarItem key={item.href} item={item} />
        ))}
      </nav>

      <div className="p-4 border-t">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}

function SidebarItem({ item }: { item: NavItem }) {
  // El módulo se extrae del permiso: 'leads:read' → 'leads'
  const module = item.requiredPermission.split(':')[0];
  const canAccess = useCanAccessModule(module);

  if (!canAccess) return null;

  return (
    <Link href={item.href} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent">
      <Icon name={item.icon} className="h-4 w-4" />
      <span className="text-sm">{item.label}</span>
    </Link>
  );
}
```

---

## 6. MANEJO DE ESTADO

### 6.1 Estrategia de Estado

| Tipo de Estado | Herramienta | Ejemplo |
|---------------|-------------|---------|
| **Server state** | TanStack Query | Leads, quotes, orders, products |
| **UI state local** | React useState | Modal open, selected tab, form values |
| **URL state** | Next.js searchParams | Filtros, paginación, vista (kanban/tabla) |
| **Auth state** | Supabase Auth (cookies) | Sesión, user info |
| **Permissions** | React Context (cached) | Set de permisos del usuario |
| **Realtime** | Supabase Realtime (suscripción) | Notificaciones, chat WhatsApp |

### 6.2 URL State para Filtros

```tsx
// Usar searchParams para filtros persistentes y compartibles
'use client';
import { useSearchParams, useRouter } from 'next/navigation';

export function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = {
    status: searchParams.get('status') ?? undefined,
    search: searchParams.get('q') ?? undefined,
    page: Number(searchParams.get('page') ?? 1),
    view: (searchParams.get('view') ?? 'kanban') as 'kanban' | 'table',
  };

  const setFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page'); // Reset page on filter change
    router.push(`?${params.toString()}`);
  };

  return { filters, setFilter };
}
```

---

## 7. REALTIME SUBSCRIPTIONS

### 7.1 Notificaciones en Tiempo Real

```tsx
// hooks/use-realtime-notifications.ts
'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@kit/supabase/browser';
import { notificationKeys } from '@kit/supabase/hooks/use-notifications';

export function useRealtimeNotifications(userId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invalidar cache de notificaciones
          queryClient.invalidateQueries({ queryKey: notificationKeys.all });

          // Mostrar toast de nueva notificación
          toast(payload.new.title, {
            description: payload.new.message,
            action: payload.new.action_url
              ? { label: 'Ver', onClick: () => router.push(payload.new.action_url) }
              : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
```

---

## 8. RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| **Módulos Frontend** | 12 + Admin |
| **Páginas (routes)** | ~30 |
| **Componentes compartidos** | 16+ |
| **React Query hooks** | ~10 por módulo |
| **Zod schemas** | 1 por formulario |
| **Realtime channels** | 2 (notifications, whatsapp) |
| **Layout groups** | 2 (auth, dashboard) |
| **View modes** | Kanban + Table (togglable) |

### Decisiones Clave:
1. **Server Components para data fetching inicial** → SEO + performance
2. **Client Components para interactividad** → forms, modals, kanban
3. **TanStack Query para cache** → staleTime 30s, invalidation on mutation
4. **URL state para filtros** → shareable, back-button friendly
5. **No Redux/Zustand** → TanStack Query + Context es suficiente
6. **Componentes en packages/** → reutilizables entre apps del monorepo
7. **Shadcn/UI como base** → customizable, no vendor lock-in
