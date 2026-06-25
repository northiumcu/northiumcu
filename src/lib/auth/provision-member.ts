import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountType } from "@/lib/database/enums";
import {
  encryptSensitive,
  generateInternalAuthSecret,
  hashPin,
} from "@/lib/auth/crypto";
import { accountTypesWithSavings } from "@/lib/auth/membership-options";
import type { adminCreateMemberSchema } from "@/lib/auth/validators";
import type { z } from "zod";
import { sendWelcomeMemberEmail } from "@/lib/email/send-welcome";

export type AdminCreateMemberInput = z.infer<typeof adminCreateMemberSchema>;

export type ProvisionedMember = {
  profileId: string;
  applicationId: string;
  memberNumber: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  accountTypes: AccountType[];
};

export async function provisionApprovedMember(
  admin: SupabaseClient,
  adminId: string,
  input: AdminCreateMemberInput
): Promise<ProvisionedMember> {
  const normalizedEmail = input.email.toLowerCase().trim();
  const normalizedUsername = input.username.toLowerCase();
  const accountTypes = accountTypesWithSavings(input.requestedAccountType);

  const [{ data: existingEmail }, { data: existingUsername }] = await Promise.all([
    admin.from("profiles").select("id").eq("email", normalizedEmail).maybeSingle(),
    admin
      .from("profiles")
      .select("id")
      .ilike("username", normalizedUsername)
      .maybeSingle(),
  ]);

  if (existingEmail || existingUsername) {
    throw new Error("Username or email is already registered.");
  }

  const internalSecret = generateInternalAuthSecret();
  let profileId: string | null = null;

  try {
    const { data: authUser, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: internalSecret,
      email_confirm: true,
      user_metadata: {
        first_name: input.firstName,
        last_name: input.lastName,
        username: normalizedUsername,
      },
    });

    if (createError || !authUser.user) {
      throw new Error(createError?.message ?? "Failed to create member account.");
    }

    profileId = authUser.user.id;

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        username: normalizedUsername,
        email: normalizedEmail,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone ?? null,
        pin_hash: hashPin(input.pin),
        internal_auth_secret: encryptSensitive(internalSecret),
        email_verified_at: new Date().toISOString(),
        staff_role: "member",
        member_status: "applicant",
      })
      .eq("id", profileId);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { data: application, error: applicationError } = await admin
      .from("membership_applications")
      .insert({
        profile_id: profileId,
        email: normalizedEmail,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone ?? null,
        status: "draft",
        eligibility_category:
          input.eligibilityCategory ?? "Admin provisioned membership",
        requested_account_types: accountTypes,
      })
      .select("id")
      .single();

    if (applicationError || !application) {
      throw new Error(applicationError?.message ?? "Failed to create application.");
    }

    const { data: account, error: approveError } = await admin.rpc(
      "approve_membership_application",
      {
        p_application_id: application.id,
        p_admin_id: adminId,
        p_account_type: accountTypes[0],
        p_require_kyc: false,
      }
    );

    if (approveError || !account) {
      throw new Error(approveError?.message ?? "Failed to approve membership.");
    }

    try {
      await sendWelcomeMemberEmail({
        to: normalizedEmail,
        firstName: input.firstName,
      });
    } catch {
      // Member is fully provisioned even if welcome email fails.
    }

    return {
      profileId,
      applicationId: application.id,
      memberNumber: account.account_number,
      email: normalizedEmail,
      username: normalizedUsername,
      firstName: input.firstName,
      lastName: input.lastName,
      accountTypes,
    };
  } catch (error) {
    if (profileId) {
      await admin.auth.admin.deleteUser(profileId);
    }
    throw error;
  }
}
