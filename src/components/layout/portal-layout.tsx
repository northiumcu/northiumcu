import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PortalMobileNav } from "@/components/layout/portal-mobile-nav";
import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { MemberAvatarBadge } from "@/components/portal/member-avatar-badge";

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
}

export function PortalLayout({
  children,
  nav,
  title,
}: PortalLayoutProps) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 bg-northium-surface">
        <PortalSidebar nav={nav} title={title} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalMobileNav nav={nav} title={title} />
          <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {title === "Member Portal" && <MemberAvatarBadge />}
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
