# PROSUMINISTROS Dashboard - Quick Start Guide

## For Developers: Getting Started in 5 Minutes

### 1. Understanding the Layout

Your app now has a new dashboard layout with:
- **Top navigation bar** with 8 modules
- **Mobile bottom tabs** (on small screens)
- **Permission-based filtering**
- **Built-in components** for common UI patterns

### 2. Create Your First Module Page

Copy and paste this template to create a new module page:

```tsx
// apps/web/app/home/YOUR-MODULE/page.tsx
import { PageHeader } from '~/components/shared';
import { Button } from '@kit/ui/shadcn/button';
import { Plus } from 'lucide-react';

export default function YourModulePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Your Module"
        description="Manage your data"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        }
      />

      {/* Your content here */}
      <div className="rounded-lg border border-border bg-card p-6">
        <p>Your module content goes here</p>
      </div>
    </div>
  );
}
```

### 3. Add Stats to Your Page

```tsx
import { StatCard } from '~/components/shared';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

// Add this inside your page component
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard
    title="Total Items"
    value="1,234"
    icon={Users}
    trend={{ value: 12.5, isPositive: true }}
    description="vs last month"
    delay={0}
  />
  <StatCard
    title="Revenue"
    value="$45,231"
    icon={DollarSign}
    trend={{ value: 8.2, isPositive: true }}
    description="vs last month"
    delay={0.1}
  />
  <StatCard
    title="Growth"
    value="23.4%"
    icon={TrendingUp}
    description="this quarter"
    delay={0.2}
  />
</div>
```

### 4. Show Empty States

```tsx
import { EmptyState } from '~/components/shared';
import { FileText } from 'lucide-react';

// When you have no data
{items.length === 0 && (
  <EmptyState
    icon={FileText}
    title="No items yet"
    description="Create your first item to get started"
    action={{
      label: "Create Item",
      onClick: () => router.push('/home/your-module/create')
    }}
  />
)}
```

### 5. Add Loading States

```tsx
import { LoadingSkeleton, StatCardSkeleton, TableSkeleton } from '~/components/shared';

// For stats
{isLoading ? (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
  </div>
) : (
  <YourStatsGrid />
)}

// For tables
{isLoading ? <TableSkeleton rows={10} /> : <YourDataTable />}
```

### 6. Use Status Badges

```tsx
import { StatusBadge } from '~/components/shared';

// Automatically colored based on status
<StatusBadge status="pending" />
<StatusBadge status="approved" />
<StatusBadge status="rejected" />
```

### 7. Check Permissions

```tsx
import { usePermissions } from '~/components/dashboard';

function MyComponent() {
  const { hasPermission } = usePermissions();

  return (
    <>
      {hasPermission('leads:create') && (
        <Button>Create Lead</Button>
      )}

      {hasPermission('quotes:delete') && (
        <Button variant="destructive">Delete</Button>
      )}
    </>
  );
}
```

### 8. Full Page Example

Here's a complete example combining everything:

```tsx
// apps/web/app/home/leads/page.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@kit/ui/shadcn/button';
import {
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
} from '~/components/shared';
import { usePermissions } from '~/components/dashboard';

export default function LeadsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const { hasPermission } = usePermissions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Leads"
        description="Manage your sales leads"
        actions={
          hasPermission('leads:create') && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Lead
            </Button>
          )
        }
      />

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Leads"
            value="1,234"
            icon={UserPlus}
            trend={{ value: 12.5, isPositive: true }}
            description="vs last month"
            delay={0}
          />
          {/* More stats... */}
        </div>
      )}

      {/* List */}
      {leads.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No leads yet"
          description="Create your first lead to get started"
          action={{
            label: "Create Lead",
            onClick: () => {}
          }}
        />
      ) : (
        <div className="space-y-4">
          {leads.map(lead => (
            <div key={lead.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{lead.name}</h3>
                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Common Patterns Cheat Sheet

### Page Structure
```tsx
<div className="space-y-6">
  <PageHeader />
  <StatsGrid />
  <MainContent />
</div>
```

### Stats Grid (Responsive)
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard delay={0} />
  <StatCard delay={0.1} />
  <StatCard delay={0.2} />
  <StatCard delay={0.3} />
</div>
```

### Card Layout
```tsx
<div className="rounded-lg border border-border bg-card p-6">
  {content}
</div>
```

### Action Buttons
```tsx
<div className="flex items-center gap-2">
  <Button>Primary Action</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

### Loading States
```tsx
{isLoading ? <LoadingSkeleton /> : <Content />}
```

### Empty States
```tsx
{items.length === 0 ? <EmptyState /> : <List />}
```

## Available Icons

Import from `lucide-react`:

```tsx
import {
  // Common
  Plus, Edit, Trash, Eye, Download,

  // Navigation
  LayoutDashboard, UserPlus, FileText, ShoppingCart,
  DollarSign, FileOutput, MessageCircle, Settings,

  // Status
  Check, X, AlertCircle, Info, Clock,

  // Trends
  TrendingUp, TrendingDown, ArrowUp, ArrowDown,

  // UI
  Search, Filter, Menu, MoreVertical,
} from 'lucide-react';
```

## Color Classes

```tsx
// Primary (Cyan)
className="bg-primary text-primary-foreground"
className="text-primary"
className="border-primary"

// PROSUMINISTROS Brand
className="bg-pro-cyan text-white"
className="bg-pro-navy text-white"
className="text-pro-cyan"
className="text-pro-navy"

// Gradients (use style)
style={{ background: 'var(--gradient-brand)' }}
```

## Responsive Utilities

```tsx
// Mobile only
className="md:hidden"

// Desktop only
className="hidden md:block"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"

// Responsive flex
className="flex flex-col md:flex-row"

// Responsive spacing
className="gap-4 md:gap-6"
className="p-4 md:p-6"
```

## Import Shortcuts

```tsx
// Dashboard
import { usePermissions } from '~/components/dashboard';

// Shared components (all at once)
import {
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  DataTableWrapper,
} from '~/components/shared';

// UI components
import { Button } from '@kit/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/shadcn/card';
```

## Module Pages Checklist

When creating a new module page:

- [ ] Create page in `apps/web/app/home/[module]/page.tsx`
- [ ] Add PageHeader with title and description
- [ ] Add create button (if user has permission)
- [ ] Show stats with StatCard
- [ ] Add loading states with LoadingSkeleton
- [ ] Show empty state when no data
- [ ] Use StatusBadge for statuses
- [ ] Test on mobile
- [ ] Check permission filtering works

## Next Steps

1. **Create your first module** using the template above
2. **Read the detailed docs**:
   - `DASHBOARD_COMPONENTS.md` - Full component reference
   - `COMPONENT_GUIDE.md` - Quick reference
   - `COMPONENT_ARCHITECTURE.md` - Technical details
3. **Test the layout** on different screen sizes
4. **Set up permissions** in Supabase
5. **Connect real data** to your pages

## Need Help?

Check these files:
- **Quick reference**: `apps/web/components/COMPONENT_GUIDE.md`
- **Full documentation**: `DASHBOARD_COMPONENTS.md`
- **Component examples**: `apps/web/app/home/page.tsx`
- **Component README**: `apps/web/components/dashboard/README.md`

## Common Issues

### Components not importing?
Make sure you're using the correct path:
```tsx
import { PageHeader } from '~/components/shared';  // ✅ Correct
import { PageHeader } from '../components/shared'; // ❌ Wrong
```

### Permissions not working?
1. Check Supabase permissions table exists
2. Verify `get_user_permissions` RPC function is created
3. Check user has permissions assigned

### Animations not working?
Make sure you're using `motion/react`:
```tsx
import { motion } from 'motion/react';  // ✅ Correct
import { motion } from 'framer-motion'; // ❌ Wrong
```

### Mobile tabs not showing?
They only show on small screens (`< 768px`). Test in browser DevTools with mobile viewport.

---

**You're all set!** Start creating your module pages using the templates above.
