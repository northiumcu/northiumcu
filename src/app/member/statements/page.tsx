import { StatementsClient } from "@/components/portal/statements-client";

export default function MemberStatementsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Statements
        </h1>
        <p className="mt-1 text-northium-muted">
          View activity and download professional PDF statements for any period.
        </p>
      </div>
      <StatementsClient />
    </div>
  );
}
