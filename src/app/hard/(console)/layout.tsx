import type { Metadata } from "next";
import { AdminControlLayout } from "@/components/layout/admin-control-layout";
import { adminNav } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Control System",
  robots: { index: false, follow: false },
};

export default function StaffConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminControlLayout nav={adminNav}>{children}</AdminControlLayout>;
}
