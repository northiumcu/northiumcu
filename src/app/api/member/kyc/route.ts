import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  encryptSensitive,
  lastFour,
} from "@/lib/auth/crypto";
import { kycSubmitSchema } from "@/lib/auth/validators";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: application } = await admin
      .from("membership_applications")
      .select("id, status, requested_account_types")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: kyc } = await admin
      .from("kyc_verifications")
      .select("id, status, id_document_type, reviewed_at, rejection_reason")
      .eq("profile_id", user.id)
      .maybeSingle();

    const needsKyc =
      !!application &&
      application.status !== "approved" &&
      (!kyc || kyc.status === "rejected" || application.status === "draft");

    return NextResponse.json({
      applicationStatus: application?.status ?? null,
      requestedAccountTypes: application?.requested_account_types ?? [],
      kycStatus: kyc?.status ?? null,
      idDocumentType: kyc?.id_document_type ?? null,
      rejectionReason: kyc?.rejection_reason ?? null,
      needsKyc,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load KYC status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = kycSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const admin = createAdminClient();

    const { data: openApplication } = await admin
      .from("membership_applications")
      .select("id, status")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!openApplication) {
      return NextResponse.json({ error: "Membership application not found." }, { status: 404 });
    }

    if (openApplication.status === "approved") {
      return NextResponse.json(
        { error: "Membership application is already approved." },
        { status: 400 }
      );
    }

    const { data: existingKyc } = await admin
      .from("kyc_verifications")
      .select("status")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (
      existingKyc?.status === "under_review" ||
      existingKyc?.status === "approved"
    ) {
      return NextResponse.json(
        { error: "Identity verification is already on file." },
        { status: 409 }
      );
    }

    const ssnDigits = data.ssn.replace(/\D/g, "");
    const idNumber = data.idDocumentNumber.trim();

    const kycPayload = {
      profile_id: user.id,
      application_id: openApplication.id,
      status: "under_review" as const,
      ssn_last_four: lastFour(ssnDigits),
      id_document_type: data.idDocumentType,
      id_document_last_four: lastFour(idNumber),
      ssn_encrypted: encryptSensitive(ssnDigits),
      id_document_number_encrypted: encryptSensitive(idNumber),
      id_document_front_encrypted: encryptSensitive(data.idDocumentFront),
      id_document_back_encrypted: data.idDocumentBack
        ? encryptSensitive(data.idDocumentBack)
        : null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await admin
      .from("kyc_verifications")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (existing?.id) {
      const { error: updateError } = await admin
        .from("kyc_verifications")
        .update(kycPayload)
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await admin
        .from("kyc_verifications")
        .insert(kycPayload);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const { error: appError } = await admin
      .from("membership_applications")
      .update({
        status: "under_review",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", openApplication.id);

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    return NextResponse.json({
      message:
        "Identity verification submitted. An administrator will review your documents before your account number is issued.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "KYC submission failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
