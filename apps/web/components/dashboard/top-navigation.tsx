'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BarChart3,
  Building2,
  DollarSign,
  FileOutput,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  ShoppingCart,
  UserPlus,
} from 'lucide-react';

import { ModeToggle } from '@kit/ui/mode-toggle';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';

import { usePermissions } from '@kit/rbac/permission-provider';

import { NotificationBell } from './notification-bell';

const NAVIGATION_ITEMS = [
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
    label: 'Clientes',
    path: '/home/customers',
    icon: Building2,
    permission: 'customers:read',
  },
  {
    label: 'Proveedores',
    path: '/home/suppliers',
    icon: Package,
    permission: 'purchase_orders:read',
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

export function TopNavigation() {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visibleItems = NAVIGATION_ITEMS.filter((item) =>
    can(item.permission),
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-6">
          <AppLogo />

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                (item.path !== '/home' && pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ModeToggle />
          <ProfileAccountDropdownContainer showProfileName={false} />
        </div>
      </nav>
    </header>
  );
}
