"use client";

import { useCallback, useEffect, useState } from "react";
import { KycVerificationForm } from "@/components/auth/kyc-verification-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KycStatus {
  applicationStatus: string | null;
  kycStatus: string | null;
  needsKyc: boolean;
  rejectionReason: string | null;
}

export function MemberKycPanel() {
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/member/kyc");
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setStatus(data);
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
      <Card className="rounded-2xl border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Identity Verification In Review
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-northium-muted">
          Your documents are being reviewed. An administrator will issue your
          12-digit account number after approval.
        </CardContent>
      </Card>
    );
  }

  if (!status?.needsKyc) {
    return null;
  }

  return (
    <Card className="rounded-2xl border-northium-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="font-heading text-lg text-northium-primary">
          Complete Your Membership
        </CardTitle>
        <Badge variant="outline">Action Required</Badge>
      </CardHeader>
      <CardContent>
        {status.rejectionReason && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Previous verification was rejected: {status.rejectionReason}
          </p>
        )}
        <KycVerificationForm onSubmitted={load} />
      </CardContent>
    </Card>
  );
}
