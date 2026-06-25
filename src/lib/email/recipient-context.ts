import { escapeHtml } from "@/lib/email/escape";
import { detailRow } from "@/lib/email/templates/layout";

export type EmailRecipientContext = {
  firstName?: string | null;
  username?: string | null;
};

export function recipientGreetingText(firstName?: string | null): string {
  const name = firstName?.trim();
  return name ? `Hello ${name},` : "Hello,";
}

export function recipientGreetingHtml(firstName?: string | null): string {
  const name = firstName?.trim();
  return name
    ? `<p style="margin:0 0 12px">Hello ${escapeHtml(name)},</p>`
    : `<p style="margin:0 0 12px">Hello,</p>`;
}

export function usernameDetailRow(username?: string | null): string {
  if (!username?.trim()) return "";
  return detailRow("Username", username.trim());
}

export function usernameTextLine(username?: string | null): string {
  if (!username?.trim()) return "";
  return `\nUsername: ${username.trim()}`;
}
