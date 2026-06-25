import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StaffPasswordForm } from "@/components/auth/staff-password-form";
import { institution } from "@/lib/institution";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Institution Settings
        </h1>
        <p className="mt-1 text-northium-muted">
          Configure institution-wide settings and staff account security.
        </p>
      </div>

      <Card className="rounded-2xl border-northium-border">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Staff password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-northium-muted">
            Change your staff console password after first sign-in. Use a unique
            password you do not reuse elsewhere.
          </p>
          <StaffPasswordForm />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-northium-border">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institutionName">Institution Name</Label>
            <Input
              id="institutionName"
              defaultValue={institution.name}
              className="rounded-xl"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              defaultValue={institution.supportEmail}
              className="rounded-xl"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Primary Domain</Label>
            <Input
              id="domain"
              defaultValue={institution.domain}
              className="rounded-xl"
              readOnly
            />
          </div>
          <p className="text-xs text-northium-muted">
            Institutional identity values are governed by INSTITUTION.lock.md
            and require executive approval to change.
          </p>
          <Button className="bg-northium-primary hover:bg-northium-secondary">
            Save Operational Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
