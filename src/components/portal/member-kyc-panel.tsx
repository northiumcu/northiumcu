"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, ShieldAlert } from "lucide-react";
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
      <CardContent className="pt-6">
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
