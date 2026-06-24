import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function MemberProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Profile Settings
        </h1>
        <p className="mt-1 text-northium-muted">
          Manage your personal information and contact preferences.
        </p>
      </div>
      <Card className="rounded-2xl border-northium-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  defaultValue="Alex"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  defaultValue="Member"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="member@example.com"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                defaultValue="(555) 123-4567"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Member Number</Label>
              <Input
                value="NCU-482910"
                disabled
                className="rounded-xl bg-northium-surface"
              />
            </div>
            <Button className="bg-northium-primary hover:bg-northium-secondary">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
