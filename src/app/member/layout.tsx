import { PortalLayout } from "@/components/layout/portal-layout";
import { memberNav } from "@/lib/constants";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalLayout nav={memberNav} title="Member Portal">
      {children}
    </PortalLayout>
  );
}
