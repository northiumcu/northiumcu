import { PortalLayout } from "@/components/layout/portal-layout";
import { adminNav } from "@/lib/constants";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalLayout nav={adminNav} title="Administration">
      {children}
    </PortalLayout>
  );
}
