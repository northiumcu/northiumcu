import { AdminControlSidebar } from "@/components/layout/admin-control-sidebar";
import { AdminControlMobileNav } from "@/components/layout/admin-control-mobile-nav";
import { InactivityLogout } from "@/components/auth/inactivity-logout";
import type { PortalNavItem } from "@/components/layout/portal-nav-shared";

interface AdminControlLayoutProps {
  children: React.ReactNode;
  nav: readonly PortalNavItem[];
}

export function AdminControlLayout({ children, nav }: AdminControlLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#0b1824] text-white">
      <InactivityLogout />
      <AdminControlSidebar nav={nav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminControlMobileNav nav={nav} />
        <main className="flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
