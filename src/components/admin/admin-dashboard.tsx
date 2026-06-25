import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Total Members",
          "Active Accounts",
          "Outstanding Loans",
          "Pending Approvals",
        ].map((label) => (
          <Card
            key={label}
            className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/55">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-white/35">—</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f2233] p-8 text-center text-sm text-white/50">
        Use <strong className="text-northium-gold">Member Controls</strong> to fund
        accounts, generate transaction history, and configure COT / IMF transfer
        codes per member.
      </div>
    </div>
  );
}
