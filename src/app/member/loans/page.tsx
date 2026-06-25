import { MemberLoansClient } from "@/components/portal/member-loans-client";

export default function MemberLoansPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Loans & Mortgages
        </h1>
        <p className="mt-1 text-northium-muted">
          {`View approved loans or apply for personal, auto, and mortgage financing.`}
        </p>
      </div>
      <MemberLoansClient />
    </div>
  );
}
