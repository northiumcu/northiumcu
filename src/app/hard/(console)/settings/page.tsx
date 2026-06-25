import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StaffPasswordForm } from "@/components/auth/staff-password-form";
import { AdminEmailSettingsPanel } from "@/components/admin/admin-email-settings-panel";
import { institution } from "@/lib/institution";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Institution Settings
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Configure institution-wide settings and staff account security.
        </p>
      </div>

      <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-white">
            Staff password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-white/55">
            Change your staff console password after first sign-in. Use a unique
            password you do not reuse elsewhere.
          </p>
          <StaffPasswordForm variant="admin" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-white">
            Email delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEmailSettingsPanel />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-white">
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institutionName">Institution Name</Label>
            <Input
              id="institutionName"
              defaultValue={institution.name}
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              defaultValue={institution.supportEmail}
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Primary Domain</Label>
            <Input
              id="domain"
              defaultValue={institution.domain}
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
              readOnly
            />
          </div>
          <p className="text-xs text-white/45">
            Institutional identity values are governed by INSTITUTION.lock.md
            and require executive approval to change.
          </p>
          <Button className="bg-northium-gold text-[#06121c] hover:bg-northium-gold/90">
            Save Operational Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
