export function digitsOnlyPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

/** Formats as (XXX) XXX-XXXX while the user types. */
export function formatUSPhoneInput(value: string): string {
  const digits = digitsOnlyPhone(value);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isCompleteUSPhone(value: string): boolean {
  return digitsOnlyPhone(value).length === 10;
}
