import { MemberProfileClient } from "@/components/portal/member-profile-client";

export default function MemberProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Profile Settings
        </h1>
        <p className="mt-1 text-northium-muted">
          Personalize your account and manage your information.
        </p>
      </div>
      <MemberProfileClient />
    </div>
  );
}
