import { formatHeadquartersAddress, institution } from "@/lib/institution";
import { escapeHtml } from "@/lib/email/escape";

export const emailColors = {
  navy: "#081827",
  navyMid: "#10263A",
  gold: "#D4A64A",
  surface: "#F7F9FB",
  text: "#0B1220",
  muted: "#667085",
  border: "#E5E7EB",
  white: "#FFFFFF",
} as const;

type EmailLayoutOptions = {
  preheader: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footerNote?: string;
};

export function buildEmailLayout({
  preheader,
  eyebrow,
  title,
  bodyHtml,
  cta,
  footerNote,
}: EmailLayoutOptions): string {
  const address = escapeHtml(formatHeadquartersAddress());
  const ctaBlock = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px">
        <tr>
          <td style="border-radius:12px;background:${emailColors.gold}">
            <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:${emailColors.navy};text-decoration:none">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${emailColors.surface};color:${emailColors.text}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${emailColors.surface};padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${emailColors.white};border:1px solid ${emailColors.border};border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(8,24,39,0.08)">
          <tr>
            <td style="background:linear-gradient(135deg,${emailColors.navy} 0%,${emailColors.navyMid} 100%);padding:28px 32px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${emailColors.gold}">Northium</td>
                  <td align="right" style="font-family:Inter,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.65)">Member-owned</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:18px;font-family:Inter,Arial,sans-serif;font-size:26px;line-height:1.2;font-weight:800;color:${emailColors.white}">${escapeHtml(institution.shortName)} Credit Union</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 12px;font-family:Inter,Arial,sans-serif">
              ${eyebrow ? `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${emailColors.gold}">${escapeHtml(eyebrow)}</p>` : ""}
              <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;font-weight:800;color:${emailColors.navy}">${escapeHtml(title)}</h1>
              <div style="font-size:15px;line-height:1.7;color:${emailColors.text}">${bodyHtml}</div>
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.6;color:${emailColors.muted}">
              ${footerNote ? `<p style="margin:0 0 12px">${escapeHtml(footerNote)}</p>` : ""}
              <p style="margin:0 0 4px">${escapeHtml(institution.name)}</p>
              <p style="margin:0 0 4px">${address}</p>
              <p style="margin:0"><a href="mailto:${escapeHtml(institution.supportEmail)}" style="color:${emailColors.navy};text-decoration:none">${escapeHtml(institution.supportEmail)}</a></p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.5;color:${emailColors.muted};max-width:600px">
          This message was sent by ${escapeHtml(institution.name)}. If you did not request it, contact ${escapeHtml(institution.supportEmail)} immediately.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function codeBlock(code: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%">
    <tr>
      <td align="center" style="padding:20px 16px;border-radius:16px;background:${emailColors.surface};border:1px solid ${emailColors.border}">
        <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:0.35em;color:${emailColors.navy}">${escapeHtml(code)}</span>
      </td>
    </tr>
  </table>`;
}

export function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid ${emailColors.border};font-size:13px;font-weight:600;color:${emailColors.muted};width:34%">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${emailColors.border};font-size:14px;color:${emailColors.text}">${escapeHtml(value)}</td>
  </tr>`;
}
