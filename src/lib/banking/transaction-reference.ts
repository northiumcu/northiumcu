const PREFIX = "NCU";

/** Institutional transaction reference — e.g. NCU-1782350884589 */
export function buildTransactionReference(seed?: string | number): string {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return `${PREFIX}-${Math.trunc(seed)}`;
  }

  if (typeof seed === "string" && seed.length > 0) {
    const digits = seed.replace(/\D/g, "");
    if (digits.length >= 8) {
      return `${PREFIX}-${digits.slice(0, 13)}`;
    }

    const compact = seed.replace(/-/g, "").toUpperCase();
    if (compact.length >= 8) {
      return `${PREFIX}-${compact.slice(0, 13)}`;
    }
  }

  return `${PREFIX}-${Date.now()}`;
}

export function buildTransferReference(transferId: string): string {
  return buildTransactionReference(transferId);
}
