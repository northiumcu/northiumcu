import type { Metadata } from "next";
import { Suspense } from "react";
import StaffAuthContent from "@/components/auth/staff-auth-content";

export const metadata: Metadata = {
  title: "Staff access",
  robots: { index: false, follow: false },
};

export default function StaffAuthPage() {
  return (
    <div className="min-h-screen bg-[#06121c]">
      <Suspense>
        <StaffAuthContent />
      </Suspense>
    </div>
  );
}
