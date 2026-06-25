import { verifyPin } from "@/lib/auth/crypto";

export function assertTransactionPinConfigured(
  transactionPinHash: string | null | undefined
): asserts transactionPinHash is string {
  if (!transactionPinHash) {
    throw new Error(
      "Set up your 4-digit transaction PIN in Security before continuing."
    );
  }
}

export function verifyTransactionPin(
  pin: string,
  transactionPinHash: string | null | undefined
): boolean {
  if (!transactionPinHash) return false;
  return verifyPin(pin, transactionPinHash);
}
