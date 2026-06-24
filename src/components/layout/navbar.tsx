"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { publicNav } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-northium-border/80 bg-white/95 shadow-sm shadow-northium-primary/5 backdrop-blur-md">
      <Container>
        <nav
          className="flex h-16 items-center justify-between sm:h-[4.5rem]"
          aria-label="Main navigation"
        >
          <Logo />

          <div className="hidden items-center gap-8 lg:flex">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-northium-text/80 transition-colors hover:text-northium-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Button variant="ghost" size="lg" render={<Link href="/sign-in" />}>
              Sign In
            </Button>
            <Button
              size="lg"
              className="bg-northium-primary text-white hover:bg-northium-secondary"
              render={<Link href="/apply" />}
            >
              Become A Member
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex size-10 items-center justify-center rounded-lg lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5 text-northium-primary" />
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full max-w-sm flex-col bg-white p-0">
              <div className="flex items-center justify-between border-b border-northium-border p-4 sm:p-6">
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-lg"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                {publicNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium text-northium-text transition-colors hover:bg-northium-surface"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-3 border-t border-northium-border p-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  render={
                    <Link href="/sign-in" onClick={() => setOpen(false)} />
                  }
                >
                  Sign In
                </Button>
                <Button
                  size="lg"
                  className="w-full bg-northium-primary text-white hover:bg-northium-secondary"
                  render={<Link href="/apply" onClick={() => setOpen(false)} />}
                >
                  Become A Member
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </Container>
    </header>
  );
}
