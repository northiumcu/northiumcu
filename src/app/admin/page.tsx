import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { PortalBanner } from "@/components/layout/portal-banner";

export default function AdminPage() {
  return (
    <>
      <PortalBanner
        visual="institution"
        title="Institution Overview"
        description="Operational metrics will appear here once reporting services are connected."
      />
      <AdminDashboard />
    </>
  );
}
