import { AdminSecurityPanel } from "@/components/admin/admin-security-panel";

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Security & Compliance
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Audit logs, risk monitoring, and security configuration.
        </p>
      </div>

      <AdminSecurityPanel />
    </div>
  );
}
