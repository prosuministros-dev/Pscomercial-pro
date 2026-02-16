'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BarChart3,
  DollarSign,
  FileOutput,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShoppingCart,
  UserPlus,
} from 'lucide-react';

import { usePermissions } from '@kit/rbac/permission-provider';

const MOBILE_TABS = [
  {
    label: 'Dashboard',
    path: '/home',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
  },
  {
    label: 'Leads',
    path: '/home/leads',
    icon: UserPlus,
    permission: 'leads:read',
  },
  {
    label: 'Cotizaciones',
    path: '/home/quotes',
    icon: FileText,
    permission: 'quotes:read',
  },
  {
    label: 'Pedidos',
    path: '/home/orders',
    icon: ShoppingCart,
    permission: 'orders:read',
  },
  {
    label: 'Reportes',
    path: '/home/reports',
    icon: BarChart3,
    permission: 'reports:read',
  },
  {
    label: 'Financiero',
    path: '/home/finance',
    icon: DollarSign,
    permission: 'finance:read',
  },
  {
    label: 'Formatos',
    path: '/home/formats',
    icon: FileOutput,
    permission: 'formats:read',
  },
  {
    label: 'WhatsApp',
    path: '/home/whatsapp',
    icon: MessageCircle,
    permission: 'whatsapp:read',
  },
  {
    label: 'Admin',
    path: '/home/admin',
    icon: Settings,
    permission: 'admin:read',
  },
] as const;

export function MobileBottomTabs() {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visibleTabs = MOBILE_TABS.filter((tab) =>
    can(tab.permission),
  );

  // Show max 5 items on mobile to avoid crowding
  const displayTabs = visibleTabs.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-lg md:hidden supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around px-2 py-2">
        {displayTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.path ||
            (tab.path !== '/home' && pathname.startsWith(tab.path));

          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-primary/10' : ''}`} />
              <span className="truncate text-xs font-medium">{tab.label}</span>
              {isActive && (
                <div className="h-0.5 w-full rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
