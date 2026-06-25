"use client";

import { Suspense } from "react";
import { MemberToolsLayoutShell } from "@/components/admin/member-tools-layout-shell";
import { MemberSelectorCard } from "@/components/admin/member-selector-card";
import { useAdminMembers } from "@/components/admin/use-admin-members";

interface MemberToolPageContentProps {
  title: string;
  description: string;
  refreshToken?: number;
  children: (context: ReturnType<typeof useAdminMembers>) => React.ReactNode;
}

function MemberToolPageContent({
  title,
  description,
  refreshToken = 0,
  children,
}: MemberToolPageContentProps) {
  const context = useAdminMembers(refreshToken);

  return (
    <MemberToolsLayoutShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-white/55">{description}</p>
        </div>
        <MemberSelectorCard
          members={context.members}
          selectedId={context.selectedId}
          onSelect={context.setSelectedId}
          loading={context.loading}
          loadError={context.loadError}
          selected={context.selected}
        />
        {context.selected ? children(context) : null}
      </div>
    </MemberToolsLayoutShell>
  );
}

export function MemberToolPage(props: MemberToolPageContentProps) {
  return (
    <Suspense
      fallback={
        <MemberToolsLayoutShell>
          <p className="text-sm text-white/50">Loading member tools...</p>
        </MemberToolsLayoutShell>
      }
    >
      <MemberToolPageContent {...props} />
    </Suspense>
  );
}
