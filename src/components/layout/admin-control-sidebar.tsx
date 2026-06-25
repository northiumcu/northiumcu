"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconMap } from "@/components/layout/portal-sidebar";
import type { PortalNavItem } from "@/components/layout/portal-nav-shared";
import { ADMIN_AUTH_PATH } from "@/lib/auth/admin-paths";

interface AdminControlSidebarProps {
  nav: readonly PortalNavItem[];
}

export function AdminControlSidebar({ nav }: AdminControlSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-[#06121c] lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-northium-gold/15">
            <Shield className="size-5 text-northium-gold" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-white">Northium</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Control System
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3" aria-label="Admin control navigation">
        {nav.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href ||
            (item.href !== "/hard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-northium-gold text-[#06121c]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/signout", { method: "POST" });
            window.location.href = ADMIN_AUTH_PATH;
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
