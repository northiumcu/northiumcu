import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Control Dashboard
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Operational overview for Northium administration.
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
