import { PortalMobileNav } from "@/components/layout/portal-mobile-nav";
import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { MemberAvatarBadge } from "@/components/portal/member-avatar-badge";
import { MemberPausedBanner } from "@/components/portal/member-paused-banner";
import { MEMBER_HOME } from "@/lib/auth/member-shell";

interface NavItem {
  label: string;
  href: string;
  icon:
    | "layout-dashboard"
    | "wallet"
    | "arrow-left-right"
    | "credit-card"
    | "file-text"
    | "landmark"
    | "user"
    | "shield"
    | "users"
    | "bar-chart-3"
    | "settings";
}

interface PortalLayoutProps {
  children: React.ReactNode;
  nav: readonly NavItem[];
  title: string;
  homeHref?: string;
}

export function PortalLayout({
  children,
  nav,
  title,
  homeHref = MEMBER_HOME,
}: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen bg-northium-surface">
      <PortalSidebar nav={nav} title={title} homeHref={homeHref} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalMobileNav nav={nav} title={title} homeHref={homeHref} />
        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {title === "Member Portal" && <MemberAvatarBadge />}
          {title === "Member Portal" && <MemberPausedBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
