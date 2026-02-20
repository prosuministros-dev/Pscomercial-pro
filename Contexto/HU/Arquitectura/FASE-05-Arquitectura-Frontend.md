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
│       │   │   └── layout.tsx        # Layout sin navegacion
│       │   │
│       │   ├── (dashboard)/          # Grupo: paginas protegidas (con top nav bar)
│       │   │   ├── layout.tsx        # Layout con top nav + ThemeProvider + PermissionsProvider
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

### 4.2 Branding PROSUMINISTROS (del Template Figma - Fuente de Verdad)

**Fuente de verdad**: `Contexto/Template Figma/Generate Mock Data (2)/src/styles/globals.css`

```css
:root {
  /* Brand Colors */
  --brand-cyan: #00C8CF;
  --brand-navy: #161052;

  /* Gradientes oficiales */
  --grad-brand: linear-gradient(135deg, #00C8CF 0%, #161052 100%);
  --grad-hero: linear-gradient(180deg, #00C8CF 0%, #0099A8 50%, #161052 100%);
  --grad-accent: linear-gradient(90deg, #00C8CF 0%, #00A8B8 100%);
  --grad-soft: linear-gradient(135deg, rgba(0,200,207,0.1) 0%, rgba(22,16,82,0.1) 100%);

  /* Theme tokens - Light mode */
  --background: #ffffff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --primary: #00C8CF;           /* Cyan */
  --primary-foreground: #ffffff;
  --secondary: #f5f5f7;         /* Gris claro */
  --secondary-foreground: #0a0a0a;
  --muted: #f5f5f7;
  --muted-foreground: #6e6e73;
  --accent: #161052;            /* Navy */
  --accent-foreground: #ffffff;
  --destructive: #ff3b30;
  --border: rgba(0, 0, 0, 0.06);
  --input-background: #f5f5f7;
  --ring: #00C8CF;
  --radius: 0.75rem;

  /* Charts */
  --chart-1: #00C8CF;
  --chart-2: #161052;
  --chart-3: #0099A8;
  --chart-4: #2E2680;
  --chart-5: #00E5ED;
}

.dark {
  --background: #000000;
  --foreground: #f5f5f7;
  --card: #1c1c1e;
  --primary: #00E5ED;
  --primary-foreground: #000000;
  --secondary: #2c2c2e;
  --accent: #00C8CF;
  --accent-foreground: #000000;
  --destructive: #ff453a;
  --border: rgba(255, 255, 255, 0.1);
  --ring: #00E5ED;
}
```

### 4.3 Dark Mode (OBLIGATORIO)

- ThemeProvider con toggle light/dark + gradients on/off
- Persistencia en localStorage
- Toggle Moon/Sun en header (derecha)
- Clase `.dark` en `document.documentElement`

### 4.4 Animaciones - Framer Motion (OBLIGATORIO)

```tsx
import { motion } from 'motion/react';

// Entrada estandar
<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
  {content}
</motion.div>
```

### 4.5 Efectos Visuales

```css
/* Glass morphism */
.glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); }
.dark .glass { background: rgba(28,28,30,0.7); }

/* Sombras Apple */
.shadow-subtle   /* 0 1px 3px rgba(0,0,0,0.04) */
.shadow-medium   /* 0 4px 6px rgba(0,0,0,0.05) */
.shadow-elevated /* 0 10px 15px rgba(0,0,0,0.08) */
```

---

## 5. LAYOUT PRINCIPAL (del Template Figma)

### 5.1 Dashboard Layout (Top Navigation Bar, NO Sidebar)

**IMPORTANTE**: La navegacion es una BARRA HORIZONTAL SUPERIOR, no un sidebar lateral.
Referencia: `Contexto/Template Figma/Generate Mock Data (2)/src/components/layout/navigation.tsx`

```tsx
// app/(dashboard)/layout.tsx
import { createClient } from '@kit/supabase/server';
import { PermissionsProvider } from '@kit/features/permissions';
import { ThemeProvider } from '@/components/theme-provider';
import { Navigation } from '@/components/layout/navigation';
import { Toaster } from '@/components/ui/sonner';

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
    <ThemeProvider>
      <PermissionsProvider userId={user.id}>
        <div className="min-h-screen bg-background flex flex-col">
          <Navigation user={profile} />

          {/* Main con padding para nav fija: pt-36 mobile (header+tabs), md:pt-20 desktop */}
          <main className="flex-1 w-full px-3 pt-36 pb-4 md:pt-20 md:px-6 lg:px-8 overflow-auto">
            <div className="h-full w-full max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>

          <Toaster /> {/* sonner */}
        </div>
      </PermissionsProvider>
    </ThemeProvider>
  );
}
```

### 5.2 Top Navigation Bar con Permisos

```tsx
// _components/navigation.tsx (TOP BAR - del Template Figma)
'use client';
import { useCanAccessModule } from '@kit/features/permissions';
import { useTheme } from '@/components/theme-provider';

// 8 items de navegacion (del Template Figma)
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'leads', label: 'Leads', icon: Megaphone, href: '/leads' },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, href: '/quotes' },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart, href: '/orders' },
  { id: 'financiero', label: 'Financiero', icon: DollarSign, href: '/billing' },
  { id: 'formatos', label: 'Formatos', icon: Files, href: '/formats' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, href: '/whatsapp' },
  { id: 'admin', label: 'Admin', icon: Settings, href: '/admin' },
];

export function Navigation({ user }: { user: Profile }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Izquierda: Logo + Nav items (desktop) */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-brand" />
              <span className="text-sm tracking-tight hidden sm:inline">Prosuministros</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Derecha: Notificaciones + Theme toggle + Avatar */}
          <div className="flex items-center gap-2">
            <NotificationBell /> {/* Sheet panel, no dropdown */}
            <ThemeToggle />      {/* Moon/Sun */}
            <UserAvatar user={user} />
          </div>
        </div>
      </div>

      {/* Mobile: Bottom tab bar con 8 items */}
      <div className="md:hidden border-t border-border bg-background">
        <div className="flex items-center justify-around py-1">
          {navItems.map((item) => (
            <MobileNavItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </nav>
  );
}

// Estilos de items:
// Activo desktop: "bg-primary/10 text-primary"
// Inactivo desktop: "text-muted-foreground hover:bg-secondary hover:text-foreground"
// Activo mobile: "text-primary"
// Inactivo mobile: "text-muted-foreground"
// Iconos: h-4 w-4 (desktop y mobile)
// Labels mobile: text-[8px]
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

| Metrica | Valor |
|---|---|
| **Modulos Navegacion** | 8 (Dashboard, Leads, Cotizaciones, Pedidos, Financiero, Formatos, WhatsApp, Admin) |
| **Paginas (routes)** | ~30 |
| **Componentes compartidos** | 16+ |
| **Componentes Shadcn/UI** | 47+ |
| **React Query hooks** | ~10 por modulo |
| **Zod schemas** | 1 por formulario |
| **Realtime channels** | 2 (notifications, whatsapp) |
| **Layout groups** | 2 (auth, dashboard) |
| **View modes** | Kanban + Table (togglable) |
| **Navegacion** | Top horizontal bar (NO sidebar) + mobile bottom tabs |
| **Animaciones** | Framer Motion (motion/react) |
| **Dark mode** | Obligatorio (ThemeProvider con toggle) |
| **Toasts** | sonner |
| **Branding** | Cyan #00C8CF + Navy #161052 (del Template Figma) |

### Decisiones Clave:
1. **Top Navigation Bar** (no sidebar) → Segun Template Figma, fuente de verdad visual
2. **Dark mode obligatorio** → ThemeProvider con toggle Moon/Sun, gradients toggle
3. **Framer Motion** → Animaciones de entrada en todas las vistas (opacity+y)
4. **Server Components para data fetching inicial** → SEO + performance
5. **Client Components para interactividad** → forms, modals, kanban
6. **TanStack Query para cache** → staleTime 30s, invalidation on mutation
7. **URL state para filtros** → shareable, back-button friendly
8. **No Redux/Zustand** → TanStack Query + Context es suficiente
9. **Componentes en packages/** → reutilizables entre apps del monorepo
10. **Shadcn/UI como base** → 47+ componentes, customizable, no vendor lock-in
11. **sonner para toasts** → Consistente con Template Figma
12. **Glass morphism + sombras custom** → Estilo Apple/Tesla minimalista
