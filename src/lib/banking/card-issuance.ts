import { encryptSensitive, lastFour } from "@/lib/auth/crypto";

const MASTERCARD_BIN = "542518";

export type IssuedCardCredentials = {
  pan: string;
  cvv: string;
  expiresAt: string;
  lastFour: string;
  panEncrypted: string;
  cvvEncrypted: string;
};

function computeLuhnCheckDigit(digitsWithoutCheck: string): string {
  const digits = digitsWithoutCheck.split("").map(Number);
  let sum = 0;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = digits[i]!;
    const positionFromRight = digits.length + 1 - i;
    if (positionFromRight % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return String((10 - (sum % 10)) % 10);
}

export function generateMastercardPan(): string {
  let body = MASTERCARD_BIN;
  while (body.length < 15) {
    body += Math.floor(Math.random() * 10);
  }
  return body + computeLuhnCheckDigit(body);
}

export function generateCardCvv(): string {
  return String(100 + Math.floor(Math.random() * 900));
}

export function generateCardExpiry(yearsFromNow = 5): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + yearsFromNow);
  return date.toISOString().slice(0, 10);
}

export function formatPanDisplay(pan: string): string {
  const digits = pan.replace(/\D/g, "");
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiryDisplay(expiresAt: string): string {
  const date = new Date(`${expiresAt}T12:00:00`);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${year}`;
}

export function issueMastercardCredentials(): IssuedCardCredentials {
  const pan = generateMastercardPan();
  const cvv = generateCardCvv();
  const expiresAt = generateCardExpiry(5);

  return {
    pan,
    cvv,
    expiresAt,
    lastFour: lastFour(pan),
    panEncrypted: encryptSensitive(pan),
    cvvEncrypted: encryptSensitive(cvv),
  };
}

export function maskedPanFromLastFour(lastFourDigits: string): string {
  return `5425 18•• •••• ${lastFourDigits}`;
}
