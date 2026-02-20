import {
  PermissionProvider,
} from '@kit/rbac/permission-provider';

import { MobileBottomTabs } from './mobile-bottom-tabs';
import { TopNavigation } from './top-navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <PermissionProvider>
      <div className="min-h-screen bg-background">
        <TopNavigation />

        <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-20 md:pb-4">
          {children}
        </main>

        <MobileBottomTabs />
      </div>
    </PermissionProvider>
  );
}
