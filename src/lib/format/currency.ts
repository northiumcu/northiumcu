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

/** Grouped whole number — e.g. 1,234,567 */
export function formatInteger(value: number | string | null | undefined): string {
  return integerFormatter.format(toNumber(value));
}
