# PROSUMINISTROS Component Quick Reference

## Dashboard Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ TopNavigation (Fixed Top, z-40, backdrop-blur)             │
│ ┌─────┐ [Dashboard] [Leads] [Quotes] ... [🔔] [🌙] [👤]  │
│ │ Logo│                                                     │
│ └─────┘                                                     │
└─────────────────────────────────────────────────────────────┘
│                                                             │
│  Main Content Area (max-w-[1400px])                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ PageHeader                                          │  │
│  │   Title + Description + Actions                     │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Your Page Content                                   │  │
│  │   - StatCards                                       │  │
│  │   - DataTables                                      │  │
│  │   - Charts, etc.                                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ MobileBottomTabs (Fixed Bottom, md:hidden)                 │
│ [Dashboard] [Leads] [Quotes] [Orders] [Finance]            │
└─────────────────────────────────────────────────────────────┘
```

## Component Checklist

### Basic Page Setup
```tsx
// ✅ apps/web/app/home/your-module/page.tsx
import { PageHeader } from '~/components/shared';
import { Button } from '@kit/ui/button';

export default function YourModulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Module"
        description="Description here"
        actions={<Button>Action</Button>}
      />

      {/* Your content */}
    </div>
  );
}
```

### Stats Grid
```tsx
import { StatCard } from '~/components/shared';
import { DollarSign } from 'lucide-react';

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard
    title="Metric Name"
    value="1,234"
    icon={DollarSign}
    trend={{ value: 12.5, isPositive: true }}
    description="vs last month"
    delay={0}
  />
  {/* More cards */}
</div>
```

### Data Table
```tsx
import { DataTableWrapper } from '~/components/shared';

<DataTableWrapper
  data={items}
  columns={columns}
  pageSize={10}
  pageIndex={0}
/>
```

### Empty State
```tsx
import { EmptyState } from '~/components/shared';
import { UserPlus } from 'lucide-react';

{items.length === 0 && (
  <EmptyState
    icon={UserPlus}
    title="No items yet"
    description="Get started by creating your first item"
    action={{
      label: "Create Item",
      onClick: handleCreate
    }}
  />
)}
```

### Loading State
```tsx
import { LoadingSkeleton, StatCardSkeleton, TableSkeleton } from '~/components/shared';

{isLoading ? (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
  </div>
) : (
  <StatsGrid />
)}

{isLoading ? <TableSkeleton rows={10} /> : <DataTable />}
```

### Status Badges
```tsx
import { StatusBadge } from '~/components/shared';

<StatusBadge status="pending" />
<StatusBadge status="approved" />
<StatusBadge status="rejected" />
```

## Predefined Status Colors

| Status | Color | Use Case |
|--------|-------|----------|
| `new` | info (blue) | New leads |
| `contacted` | warning (orange) | Contacted leads |
| `qualified` | success (green) | Qualified leads |
| `unqualified` | destructive (red) | Unqualified leads |
| `draft` | secondary (gray) | Draft quotes |
| `pending` | warning (orange) | Pending quotes |
| `sent` | info (blue) | Sent quotes |
| `approved` | success (green) | Approved quotes |
| `rejected` | destructive (red) | Rejected quotes |
| `expired` | outline (gray) | Expired quotes |
| `confirmed` | info (blue) | Confirmed orders |
| `processing` | warning (orange) | Processing orders |
| `shipped` | success (green) | Shipped orders |
| `delivered` | success (green) | Delivered orders |
| `cancelled` | destructive (red) | Cancelled orders |
| `unpaid` | warning (orange) | Unpaid invoices |
| `partial` | info (blue) | Partially paid |
| `paid` | success (green) | Fully paid |
| `overdue` | destructive (red) | Overdue payments |

## Animation Delays

Use staggered delays for list items:

```tsx
{items.map((item, index) => (
  <StatCard
    key={item.id}
    delay={index * 0.1} // 0, 0.1, 0.2, 0.3, etc.
    {...item}
  />
))}
```

## Responsive Grid Patterns

### Stats Grid (1-2-4 columns)
```tsx
className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
```

### Content Grid (1-2-3 columns)
```tsx
className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
```

### Two Column Layout
```tsx
className="grid grid-cols-1 gap-4 lg:grid-cols-2"
```

## Common Icons (from lucide-react)

```tsx
import {
  // Navigation
  LayoutDashboard, UserPlus, FileText, ShoppingCart,
  DollarSign, FileOutput, MessageCircle, Settings,

  // Actions
  Plus, Edit, Trash, Eye, Download, Upload,

  // Status
  Check, X, Clock, AlertCircle, Info,

  // Trends
  TrendingUp, TrendingDown, ArrowUp, ArrowDown,

  // UI
  Search, Filter, Menu, MoreVertical,
} from 'lucide-react';
```

## Permission Checks

### In Client Components
```tsx
import { usePermissions } from '~/components/dashboard';

function MyComponent() {
  const { hasPermission } = usePermissions();

  return (
    <>
      {hasPermission('leads:create') && (
        <Button>Create Lead</Button>
      )}
    </>
  );
}
```

### In Server Components
```tsx
import { checkPermission } from '@kit/rbac';

async function MyServerComponent() {
  const hasPermission = await checkPermission(userId, 'leads:create');

  return (
    <>
      {hasPermission && <CreateButton />}
    </>
  );
}
```

## Color Utilities

### PROSUMINISTROS Colors
```tsx
// Background
className="bg-pro-cyan"
className="bg-pro-navy"

// Text
className="text-pro-cyan"
className="text-pro-navy"

// Border
className="border-pro-cyan"
className="border-pro-navy"

// Hover states
className="hover:bg-pro-cyan hover:text-white"
```

### Using Gradients
```tsx
// As inline style
style={{ background: 'var(--gradient-brand)' }}
style={{ background: 'var(--gradient-hero)' }}

// For text gradient
className="bg-gradient-to-r from-pro-cyan to-pro-navy bg-clip-text text-transparent"
```

## Common Patterns

### Card with Gradient Accent
```tsx
<Card className="relative overflow-hidden">
  <CardContent>
    {/* Your content */}
  </CardContent>

  {/* Gradient accent bar */}
  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pro-cyan to-pro-navy opacity-50" />
</Card>
```

### Glass Morphism Effect
```tsx
className="backdrop-blur-lg bg-background/95 supports-[backdrop-filter]:bg-background/60"
```

### Subtle Shadow
```tsx
style={{ boxShadow: 'var(--shadow-subtle)' }}
```

## Import Shortcuts

```tsx
// Single import for all dashboard components
import {
  DashboardLayout,
  usePermissions,
  TopNavigation,
  MobileBottomTabs,
  NotificationBell,
} from '~/components/dashboard';

// Single import for all shared components
import {
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  DataTableWrapper,
} from '~/components/shared';
```

## Pro Tips

1. **Always use PageHeader** on module pages for consistency
2. **Add delays to StatCards** for smooth staggered animation (0.1s increments)
3. **Use StatusBadge** instead of manual Badge components for predefined statuses
4. **Wrap DataTables** with DataTableWrapper for consistent styling and animations
5. **Show EmptyState** when lists/tables have no data
6. **Use LoadingSkeleton** instead of generic spinners
7. **Check permissions** before showing create/edit/delete actions
8. **Use motion.div** for custom animations following existing patterns
9. **Keep max-w-[1400px]** for content containers to match layout
10. **Test mobile** - ensure bottom tabs don't overlap content

## Common Mistakes to Avoid

❌ Don't use absolute positioning without considering mobile bottom tabs
❌ Don't forget to add `space-y-6` or `space-y-8` to page containers
❌ Don't use custom colors - stick to PROSUMINISTROS palette
❌ Don't skip loading states - always show LoadingSkeleton
❌ Don't hardcode permissions - use the permissions system
❌ Don't use old PageBody/PageHeader from @kit/ui - use our custom ones
❌ Don't forget responsive classes for mobile
❌ Don't skip empty states for lists/tables

## Quick Copy-Paste Templates

### Full Page Template
```tsx
import { PageHeader } from '~/components/shared';
import { Button } from '@kit/ui/button';
import { Plus } from 'lucide-react';

export default function ModulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Module Name"
        description="Module description"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Item
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* StatCards here */}
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {/* Tables, charts, etc. */}
      </div>
    </div>
  );
}
```

### Stats Row Template
```tsx
import { StatCard } from '~/components/shared';
import { DollarSign, TrendingUp, Users, FileText } from 'lucide-react';

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
    title="Conversion"
    value="23.4%"
    icon={TrendingUp}
    trend={{ value: 3.1, isPositive: false }}
    description="vs last month"
    delay={0.2}
  />
  <StatCard
    title="Documents"
    value="856"
    icon={FileText}
    description="total generated"
    delay={0.3}
  />
</div>
```
