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

const navAccent: Record<string, string> = {
  "/member": "from-sky-400/30 to-blue-500/10 text-sky-200",
  "/member/accounts": "from-emerald-400/30 to-teal-500/10 text-emerald-200",
  "/member/transfers": "from-amber-400/30 to-orange-500/10 text-amber-200",
  "/member/cards": "from-violet-400/30 to-purple-500/10 text-violet-200",
  "/member/statements": "from-cyan-400/30 to-sky-500/10 text-cyan-200",
  "/member/loans": "from-rose-400/30 to-pink-500/10 text-rose-200",
  "/member/profile": "from-northium-gold/30 to-amber-500/10 text-amber-200",
  "/member/security": "from-teal-400/30 to-emerald-500/10 text-teal-200",
};

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
    <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#06121c] via-northium-primary to-[#0c2d45] text-white shadow-xl shadow-northium-primary/20 lg:flex">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,166,74,0.14)_0%,transparent_45%)]"
        aria-hidden
      />
      <div className="relative border-b border-white/10 p-6">
        <Logo
          href={homeHref}
          className="[&_.text-northium-muted]:text-white/55 [&_span]:text-white"
        />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-northium-gold/90">
          {title}
        </p>
      </div>
      <nav className="relative flex-1 space-y-1.5 p-4" aria-label={`${title} navigation`}>
        {nav.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href ||
            (item.href !== "/member" &&
              item.href !== "/hard" &&
              pathname.startsWith(item.href));
          const accent = navAccent[item.href] ?? "from-white/10 to-white/5 text-white/80";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-northium-gold to-amber-400 text-northium-primary shadow-lg shadow-amber-500/20"
                  : "text-white/75 hover:bg-white/8 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg bg-gradient-to-br transition-transform group-hover:scale-105",
                  isActive ? "bg-northium-primary/15 text-northium-primary" : accent
                )}
              >
                <Icon className="size-4 shrink-0" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="relative border-t border-white/10 p-4">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/signout", { method: "POST" });
            window.location.href = "/sign-in";
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/8 hover:text-white"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/8">
            <LogOut className="size-4" />
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
