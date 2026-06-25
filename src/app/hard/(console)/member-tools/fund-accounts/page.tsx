"use client";

import { MemberFundingPanel } from "@/components/admin/member-funding-panel";
import { MemberToolPage } from "@/components/admin/member-tool-page";

export default function FundAccountsPage() {
  return (
    <MemberToolPage
      title="Fund Accounts"
      description="Credit or debit a member account balance. Choose the account and amount carefully."
    >
      {(context) => (
        <MemberFundingPanel
          accounts={context.accounts}
          selectedAccountId={context.selectedAccountId}
          onAccountChange={context.setSelectedAccountId}
          onUpdated={() => void context.load()}
        />
      )}
    </MemberToolPage>
  );
}
