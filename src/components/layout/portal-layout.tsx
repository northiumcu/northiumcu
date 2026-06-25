import { PortalMobileNav } from "@/components/layout/portal-mobile-nav";
import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { MemberPausedBanner } from "@/components/portal/member-paused-banner";
import { MemberWelcomeBar } from "@/components/portal/member-welcome-bar";
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
  const isMemberPortal = title === "Member Portal";

  return (
    <div className="member-portal flex min-h-screen">
      <PortalSidebar nav={nav} title={title} homeHref={homeHref} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#eef6ff_0%,#f7f9fb_38%,#f3fbf8_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,166,74,0.16)_0%,transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(15,118,110,0.12)_0%,transparent_40%)]"
          aria-hidden
        />
        <PortalMobileNav nav={nav} title={title} homeHref={homeHref} />
        <main className="relative flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {isMemberPortal && <MemberWelcomeBar />}
          {isMemberPortal && <MemberPausedBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
