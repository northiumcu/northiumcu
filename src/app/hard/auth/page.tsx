import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import StaffAuthContent from "@/components/auth/staff-auth-content";

export const metadata: Metadata = {
  title: "Staff access",
  robots: { index: false, follow: false },
};

export default function StaffAuthPage() {
  return (
    <PublicLayout>
      <Suspense>
        <StaffAuthContent />
      </Suspense>
    </PublicLayout>
  );
}
