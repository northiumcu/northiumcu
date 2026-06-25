export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

export { isEmailDeliveryConfigured } from "@/lib/email/resolve-credentials";
