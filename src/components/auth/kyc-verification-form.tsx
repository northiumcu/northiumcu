"use client";

import { useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ID_DOCUMENT_OPTIONS } from "@/lib/auth/membership-options";
import { formatSSNInput } from "@/lib/format/ssn";
import { cn } from "@/lib/utils";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

interface KycVerificationFormProps {
  onSubmitted?: () => void;
}

export function KycVerificationForm({ onSubmitted }: KycVerificationFormProps) {
  const [ssn, setSsn] = useState("");
  const [idDocumentType, setIdDocumentType] = useState<
    "drivers_license" | "state_id" | "passport"
  >("drivers_license");
  const [idDocumentNumber, setIdDocumentNumber] = useState("");
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [frontData, setFrontData] = useState<string | null>(null);
  const [backData, setBackData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const needsBack = idDocumentType !== "passport";

  async function handleFile(
    file: File | undefined,
    side: "front" | "back"
  ) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Each file must be 5 MB or smaller.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      setError("Upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    if (side === "front") {
      setFrontData(dataUrl);
      setFrontPreview(file.type.startsWith("image/") ? dataUrl : null);
    } else {
      setBackData(dataUrl);
      setBackPreview(file.type.startsWith("image/") ? dataUrl : null);
    }
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!frontData) {
      setError("Upload the front of your ID.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/member/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ssn,
        idDocumentType,
        idDocumentNumber,
        idDocumentFront: frontData,
        idDocumentBack: needsBack ? backData : undefined,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Submission failed.");
      return;
    }

    setSuccess(true);
    onSubmitted?.();
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
        <p className="mt-3 font-heading text-lg font-semibold text-northium-primary">
          Verification submitted
        </p>
        <p className="mt-2 text-sm text-northium-muted">
          An administrator will review your documents before your 12-digit account
          number is issued.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="font-heading text-sm font-semibold text-northium-primary">
        Identity Verification (KYC)
      </h3>

      <div className="space-y-2">
        <Label htmlFor="kyc-ssn">Social Security Number</Label>
        <Input
          id="kyc-ssn"
          value={ssn}
          onChange={(e) => setSsn(formatSSNInput(e.target.value))}
          className="rounded-xl"
          placeholder="XXX-XX-XXXX"
          inputMode="numeric"
          maxLength={11}
          autoComplete="off"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-id-type">ID Document Type</Label>
          <select
            id="kyc-id-type"
            value={idDocumentType}
            onChange={(e) => {
              const value = e.target.value as typeof idDocumentType;
              setIdDocumentType(value);
              if (value === "passport") {
                setBackData(null);
                setBackPreview(null);
              }
            }}
            className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
          >
            {ID_DOCUMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-id-number">ID Number</Label>
          <Input
            id="kyc-id-number"
            value={idDocumentNumber}
            onChange={(e) => setIdDocumentNumber(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-front">ID Front Copy</Label>
          <label
            htmlFor="kyc-front"
            className={cn(
              "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-northium-border bg-white p-4 text-center text-sm text-northium-muted transition-colors hover:border-northium-gold hover:bg-northium-surface",
              frontPreview && "border-solid"
            )}
          >
            {frontPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frontPreview}
                alt="ID front preview"
                className="max-h-28 rounded-lg object-contain"
              />
            ) : (
              <>
                <Upload className="mb-2 size-5 text-northium-primary" />
                Upload front of ID
              </>
            )}
          </label>
          <input
            id="kyc-front"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0], "front")}
          />
        </div>

        {needsBack ? (
          <div className="space-y-2">
            <Label htmlFor="kyc-back">ID Back Copy</Label>
            <label
              htmlFor="kyc-back"
              className={cn(
                "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-northium-border bg-white p-4 text-center text-sm text-northium-muted transition-colors hover:border-northium-gold hover:bg-northium-surface",
                backPreview && "border-solid"
              )}
            >
              {backPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={backPreview}
                  alt="ID back preview"
                  className="max-h-28 rounded-lg object-contain"
                />
              ) : (
                <>
                  <Upload className="mb-2 size-5 text-northium-primary" />
                  Upload back of ID
                </>
              )}
            </label>
            <input
              id="kyc-back"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0], "back")}
            />
          </div>
        ) : (
          <div className="flex min-h-32 items-center rounded-xl border border-northium-border bg-northium-surface p-4 text-sm text-northium-muted">
            Passport requires a front copy only.
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-northium-gold text-northium-primary hover:bg-northium-gold/90"
      >
        {loading ? "Submitting..." : "Submit Identity Verification"}
      </Button>
    </form>
  );
}
