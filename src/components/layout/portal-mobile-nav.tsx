"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { iconMap } from "@/components/layout/portal-sidebar";
import type { PortalNavItem } from "@/components/layout/portal-nav-shared";

interface PortalMobileNavProps {
  nav: readonly PortalNavItem[];
  title: string;
}

export function PortalMobileNav({
  nav,
  title,
}: PortalMobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeItem =
    nav.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/member" &&
          item.href !== "/hard" &&
          pathname.startsWith(item.href))
    ) ?? nav[0]!;

  const ActiveIcon = iconMap[activeItem.icon];

  return (
    <div className="border-b border-northium-border bg-white lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-northium-muted">
            {title}
          </p>
          <p className="truncate font-heading text-sm font-semibold text-northium-primary">
            {activeItem.label}
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-northium-border bg-northium-surface px-3 text-sm font-medium text-northium-primary"
            aria-label={`Open ${title} menu`}
          >
            <ActiveIcon className="size-4" />
            <span className="hidden sm:inline">Menu</span>
            <ChevronDown className="size-4 text-northium-muted" />
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl p-0">
            <div className="border-b border-northium-border px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-northium-muted">
                {title}
              </p>
              <p className="font-heading text-lg font-semibold text-northium-primary">
                Navigate
              </p>
            </div>
            <nav
              className="grid gap-1 p-4 sm:grid-cols-2"
              aria-label={`${title} mobile navigation`}
            >
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
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-northium-primary text-white"
                        : "bg-northium-surface text-northium-text hover:bg-northium-primary/5"
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
                  window.location.href = "/";
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-northium-border px-4 py-3 text-sm font-medium text-northium-primary"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
