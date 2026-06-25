const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** USD with grouping — e.g. $1,234,567.89 */
export function formatCurrency(value: number | string | null | undefined): string {
  return currencyFormatter.format(toNumber(value));
}

/** Grouped number — e.g. 1,234,567.89 */
export function formatNumber(value: number | string | null | undefined): string {
  return numberFormatter.format(toNumber(value));
}

/** Strip currency symbols, grouping, and parse — e.g. "$1,234.56" → 1234.56 */
export function parseAmountInput(value: string): number {
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned || cleaned === ".") return NaN;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Format user typing in amount fields with thousands separators. */
export function formatAmountInput(
  raw: string,
  options: { allowDecimals?: boolean } = {}
): string {
  const allowDecimals = options.allowDecimals ?? true;

  if (!raw) return "";

  if (!allowDecimals) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    return integerFormatter.format(Number(digits));
  }

  let cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    cleaned =
      cleaned.slice(0, dotIndex + 1) +
      cleaned.slice(dotIndex + 1).replace(/\./g, "");
  }

  const [intPart = "", decPart] = cleaned.split(".");
  const limitedDec = decPart !== undefined ? decPart.slice(0, 2) : undefined;

  if (!intPart && dotIndex === -1) return "";

  const formattedInt =
    intPart === ""
      ? dotIndex !== -1
        ? "0"
        : ""
      : integerFormatter.format(Number(intPart));

  if (dotIndex !== -1) {
    if (limitedDec !== undefined) {
      return `${formattedInt || "0"}.${limitedDec}`;
    }
    return `${formattedInt || "0"}.`;
  }

  return formattedInt;
}
