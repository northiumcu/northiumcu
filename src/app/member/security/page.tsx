import { AlertsPanel } from "@/components/portal/alerts-panel";
import { PortalPageHeader } from "@/components/layout/portal-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const devices = [
  {
    id: "1",
    name: "MacBook Pro — Chrome",
    location: "Richardson, TX",
    lastActive: "Now",
    trusted: true,
  },
  {
    id: "2",
    name: "iPhone 15 — Safari",
    location: "Richardson, TX",
    lastActive: "2 hours ago",
    trusted: true,
  },
];

export default function MemberSecurityPage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        visual="security"
        title="Security Center"
        description="Manage authentication, trusted devices, and security alerts."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Multi-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-northium-muted">Enabled</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
            </div>
            <Button variant="outline" className="rounded-xl border-emerald-200">
              Manage MFA Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-sky-200/70 bg-gradient-to-br from-white to-sky-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-northium-muted">Last changed 45 days ago</p>
            <Button variant="outline" className="rounded-xl border-sky-200">
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Trusted Devices
        </h2>
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
            >
              <div>
                <p className="font-medium text-northium-primary">{device.name}</p>
                <p className="text-sm text-northium-muted">
                  {device.location} · {device.lastActive}
                </p>
              </div>
              {device.trusted && (
                <Badge className="bg-emerald-100 text-emerald-800">Trusted</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Recent Security Alerts
        </h2>
        <AlertsPanel />
      </div>
    </div>
  );
}
