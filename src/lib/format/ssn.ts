export function digitsOnlySsn(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

/** Formats as XXX-XX-XXXX while the user types. */
export function formatSSNInput(value: string): string {
  const digits = digitsOnlySsn(value);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function isCompleteSSN(value: string): boolean {
  return digitsOnlySsn(value).length === 9;
}
