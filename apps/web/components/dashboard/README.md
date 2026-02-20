# PROSUMINISTROS Dashboard Components

This directory contains the core dashboard layout components for the PROSUMINISTROS CRM application.

## Components Overview

### DashboardLayout
The main layout wrapper for the dashboard application.

**Location**: `dashboard-layout.tsx`

**Usage**:
```tsx
import { DashboardLayout } from '~/components/dashboard';

export default function MyLayout({ children }) {
  const permissions = ['dashboard:view', 'leads:view'];

  return (
    <DashboardLayout permissions={permissions}>
      {children}
    </DashboardLayout>
  );
}
```

**Features**:
- Wraps content with TopNavigation and MobileBottomTabs
- Provides PermissionsProvider context
- Responsive padding (mobile: pt-20 + pb-20, desktop: pt-20 + pb-4)
- Max width container (1400px) with auto margins

---

### TopNavigation
Fixed top navigation bar with horizontal menu.

**Location**: `top-navigation.tsx`

**Features**:
- Fixed positioning (z-40)
- Backdrop blur effect
- 8 navigation modules:
  - Dashboard (LayoutDashboard icon)
  - Leads (UserPlus icon)
  - Cotizaciones (FileText icon)
  - Pedidos (ShoppingCart icon)
  - Financiero (DollarSign icon)
  - Formatos (FileOutput icon)
  - WhatsApp (MessageCircle icon)
  - Admin (Settings icon)
- Permission-based visibility
- Active link highlighting with primary color
- Right-side actions: NotificationBell, ModeToggle, ProfileDropdown

---

### MobileBottomTabs
Fixed bottom tab bar for mobile devices.

**Location**: `mobile-bottom-tabs.tsx`

**Features**:
- Only visible on mobile (hidden on md+ breakpoints)
- Shows up to 5 items to prevent crowding
- Same navigation items as TopNavigation
- Icon + label layout
- Active indicator (primary color bar)
- Permission-based filtering

---

### NotificationBell
Notification bell with Sheet panel.

**Location**: `notification-bell.tsx`

**Features**:
- Bell icon with badge count
- Animated pulse on unread notifications
- Opens Sheet panel (not dropdown)
- Shows list of notifications
- Mark as read functionality
- Mark all as read button
- Currently uses mock data (will connect to Supabase)

---

### PermissionsProvider
Context provider for user permissions.

**Location**: `permissions-provider.tsx`

**Usage**:
```tsx
import { PermissionsProvider, usePermissions } from '~/components/dashboard';

// In a server component
<PermissionsProvider permissions={['dashboard:view', 'leads:create']}>
  {children}
</PermissionsProvider>

// In a client component
const { hasPermission } = usePermissions();

if (hasPermission('leads:create')) {
  // Show create button
}
```

**API**:
- `permissions: string[]` - Array of permission slugs
- `hasPermission(permission: string): boolean` - Check if user has permission

---

## Shared Components

### PageHeader
Animated page header with title, description, and actions.

**Location**: `../shared/page-header.tsx`

**Usage**:
```tsx
import { PageHeader } from '~/components/shared';

<PageHeader
  title="Dashboard"
  description="Bienvenido a PROSUMINISTROS CRM"
  actions={
    <Button>Action</Button>
  }
/>
```

---

### StatusBadge
Reusable status badge with predefined color variants.

**Location**: `../shared/status-badge.tsx`

**Usage**:
```tsx
import { StatusBadge } from '~/components/shared';

<StatusBadge status="pending" />
<StatusBadge status="approved" variant="success" />
```

**Predefined Statuses**:
- Leads: new, contacted, qualified, unqualified
- Quotes: draft, pending, sent, approved, rejected, expired
- Orders: created, confirmed, processing, shipped, delivered, cancelled
- Payments: unpaid, partial, paid, overdue
- General: active, inactive, deleted, archived

---

### StatCard
Animated metric card with trend indicator.

**Location**: `../shared/stat-card.tsx`

**Usage**:
```tsx
import { StatCard } from '~/components/shared';
import { DollarSign } from 'lucide-react';

<StatCard
  title="Revenue"
  value="$125,430"
  icon={DollarSign}
  trend={{ value: 23.1, isPositive: true }}
  description="vs last month"
  delay={0.1}
/>
```

---

### EmptyState
Empty state component for lists/tables.

**Location**: `../shared/empty-state.tsx`

**Usage**:
```tsx
import { EmptyState } from '~/components/shared';
import { UserPlus } from 'lucide-react';

<EmptyState
  icon={UserPlus}
  title="No leads yet"
  description="Create your first lead to get started"
  action={{
    label: "Create Lead",
    onClick: () => {}
  }}
/>
```

---

### Loading Skeletons
Skeleton loaders for various components.

**Location**: `../shared/loading-skeleton.tsx`

**Usage**:
```tsx
import { LoadingSkeleton, StatCardSkeleton, TableSkeleton } from '~/components/shared';

<LoadingSkeleton rows={5} />
<StatCardSkeleton />
<TableSkeleton rows={10} />
```

---

## Theme & Styling

### PROSUMINISTROS Colors
All components use the PROSUMINISTROS color scheme defined in `apps/web/styles/shadcn-ui.css`:

**Brand Colors**:
- `--pro-cyan: #00C8CF` (Primary)
- `--pro-navy: #161052` (Accent)

**Light Mode Variations**:
- `--pro-cyan-light: #E6F9FA`
- `--pro-cyan-dark: #00a3a9`
- `--pro-navy-light: #3d3785`
- `--pro-navy-dark: #0e0a38`

**Gradients**:
- `--gradient-brand`: Cyan to Navy (135deg)
- `--gradient-hero`: Navy to Cyan (180deg)
- `--gradient-accent`: Cyan shades (135deg)
- `--gradient-soft`: Light backgrounds

---

## Animations

All components use Framer Motion (`motion/react`) for animations:

**Common Patterns**:
```tsx
import { motion } from 'motion/react';

// Fade in from bottom
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: 0.1 }}
>
  {children}
</motion.div>
```

---

## Permissions

The dashboard uses a permission-based system integrated with Supabase:

**Permission Format**: `module:action`

**Examples**:
- `dashboard:view`
- `leads:create`
- `quotes:read`
- `orders:delete`
- `admin:manage`

**Server-Side**: Use `checkPermission()` from `@kit/rbac`
**Client-Side**: Use `usePermissions()` hook

---

## Navigation Structure

The dashboard supports 8 main modules:

1. **Dashboard** (`/home`) - Overview and metrics
2. **Leads** (`/home/leads`) - Lead management
3. **Cotizaciones** (`/home/quotes`) - Quote management
4. **Pedidos** (`/home/orders`) - Order management
5. **Financiero** (`/home/finance`) - Financial reports
6. **Formatos** (`/home/formats`) - Document templates
7. **WhatsApp** (`/home/whatsapp`) - WhatsApp integration
8. **Admin** (`/home/admin`) - System administration

Each module is filtered by permissions and highlighted when active.

---

## Responsive Behavior

### Desktop (md+)
- TopNavigation: Visible
- MobileBottomTabs: Hidden
- Content padding: `pt-20 pb-4`

### Mobile (<md)
- TopNavigation: Visible (collapsed menu)
- MobileBottomTabs: Visible
- Content padding: `pt-20 pb-20`
- Max 5 tabs shown in bottom bar

---

## Next Steps

### Upcoming Features
1. Connect NotificationBell to Supabase realtime
2. Add user preferences for navigation layout
3. Implement breadcrumb navigation
4. Add keyboard shortcuts
5. Create dashboard widgets system

### Integration Points
- Supabase: User permissions, notifications
- WhatsApp API: Message integration
- PDF generation: Format templates
- Email: Quote/order notifications
