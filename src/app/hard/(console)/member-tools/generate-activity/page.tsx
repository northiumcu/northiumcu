"use client";

import { MemberActivityGeneratorPanel } from "@/components/admin/member-activity-generator-panel";
import { MemberToolPage } from "@/components/admin/member-tool-page";

export default function GenerateActivityPage() {
  return (
    <MemberToolPage
      title="Generate Activity"
      description="Simulate payroll deposits and everyday debits across a date range."
    >
      {(context) => (
        <MemberActivityGeneratorPanel
          selected={context.selected!}
          accounts={context.accounts}
          selectedAccountId={context.selectedAccountId}
          onAccountChange={context.setSelectedAccountId}
          onUpdated={() => void context.load()}
        />
      )}
    </MemberToolPage>
  );
}
