import { Suspense } from "react";
import { MemberToolsNav } from "@/components/admin/member-tools-nav";

export function MemberToolsLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Member Tools</h1>
        <p className="mt-1 text-sm text-white/55">
          Each task has its own page so you only see the controls you need.
        </p>
      </div>
      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/5" />}>
        <MemberToolsNav />
      </Suspense>
      {children}
    </div>
  );
}
