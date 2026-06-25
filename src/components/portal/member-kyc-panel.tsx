"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, ShieldAlert } from "lucide-react";
import { KycVerificationForm } from "@/components/auth/kyc-verification-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionPinSetupForm } from "@/components/portal/transaction-pin-setup-form";

interface KycStatus {
  applicationStatus: string | null;
  kycStatus: string | null;
  needsKyc: boolean;
  rejectionReason: string | null;
}

export function MemberKycPanel() {
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionPinConfigured, setTransactionPinConfigured] = useState<
    boolean | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [kycResponse, pinResponse] = await Promise.all([
      fetch("/api/member/kyc"),
      fetch("/api/member/transaction-pin"),
    ]);
    const data = await kycResponse.json();
    const pinData = await pinResponse.json();
    setLoading(false);
    if (kycResponse.ok) {
      setStatus(data);
    }
    if (pinResponse.ok) {
      setTransactionPinConfigured(Boolean(pinData.configured));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return null;
  }

  if (!status?.needsKyc && status?.kycStatus === "under_review") {
    return (
      <Card className="mb-8 overflow-hidden rounded-2xl border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
            <Clock3 className="size-5" />
          </span>
          <div>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Identity Verification In Review
            </CardTitle>
            <p className="mt-1 text-sm text-northium-muted">
              Your documents are being reviewed by our membership team.
            </p>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!status?.needsKyc) {
    return null;
  }

  return (
    <Card className="mb-8 overflow-hidden rounded-2xl border-sky-200/80 bg-gradient-to-br from-white via-sky-50/50 to-emerald-50/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-sky-100/80 bg-white/50">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-600 text-white shadow-md">
            <ShieldAlert className="size-5" />
          </span>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Complete Your Membership
          </CardTitle>
        </div>
        <Badge className="border-amber-300/60 bg-amber-100 text-amber-900">
          Action Required
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {status.rejectionReason && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Previous verification was rejected: {status.rejectionReason}
          </p>
        )}
        {transactionPinConfigured === false && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
            <h3 className="font-heading text-sm font-semibold text-northium-primary">
              Transaction PIN
            </h3>
            <p className="mt-1 mb-4 text-sm text-northium-muted">
              Create your 4-digit transaction PIN now. It must be different from
              your 6-digit account sign-in PIN.
            </p>
            <TransactionPinSetupForm
              configured={false}
              onConfigured={() => setTransactionPinConfigured(true)}
              variant="compact"
              idPrefix="kyc"
              submitLabel="Set your transaction PIN"
            />
          </div>
        )}
        <KycVerificationForm onSubmitted={load} />
      </CardContent>
    </Card>
  );
}
