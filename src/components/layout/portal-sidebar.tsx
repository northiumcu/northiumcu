"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import type { PortalNavItem } from "@/components/layout/portal-nav-shared";

export const iconMap = {
  "layout-dashboard": LayoutDashboard,
  wallet: Wallet,
  "arrow-left-right": ArrowLeftRight,
  "credit-card": CreditCard,
  "file-text": FileText,
  landmark: Landmark,
  user: User,
  shield: Shield,
  users: Users,
  "bar-chart-3": BarChart3,
  settings: Settings,
} as const;

interface PortalSidebarProps {
  nav: readonly PortalNavItem[];
  title: string;
  homeHref?: string;
}

export function PortalSidebar({
  nav,
  title,
  homeHref = "/member",
}: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-northium-border bg-white lg:flex">
      <div className="border-b border-northium-border p-6">
        <Logo href={homeHref} />
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-northium-muted">
          {title}
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-4" aria-label={`${title} navigation`}>
        {nav.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href ||
            (item.href !== "/member" &&
              item.href !== "/hard" &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-northium-primary text-white shadow-sm"
                  : "text-northium-text/70 hover:bg-northium-surface hover:text-northium-primary"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-northium-border p-4">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/signout", { method: "POST" });
            window.location.href = "/sign-in";
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-northium-muted transition-colors hover:bg-northium-surface hover:text-northium-primary"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
