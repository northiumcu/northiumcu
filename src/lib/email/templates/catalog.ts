import { institution } from "@/lib/institution";
import { escapeHtml } from "@/lib/email/escape";
import {
  buildEmailLayout,
  codeBlock,
  detailRow,
} from "@/lib/email/templates/layout";

export type EmailTemplateId =
  | "otp-login"
  | "otp-signup"
  | "otp-pin-reset"
  | "contact-internal"
  | "contact-confirmation"
  | "welcome-member";

export type EmailMessage = {
  subject: string;
  html: string;
  text: string;
};

export type EmailTemplateMeta = {
  id: EmailTemplateId;
  name: string;
  description: string;
  trigger: string;
  sampleData: Record<string, string>;
};

const topicLabels: Record<string, string> = {
  general: "General inquiry",
  account: "Account support",
  membership: "Membership",
  loans: "Loans",
  security: "Security / fraud",
};

export const emailTemplateCatalog: EmailTemplateMeta[] = [
  {
    id: "otp-login",
    name: "Sign-in verification",
    description: "Sent when a member or staff user signs in with username and PIN.",
    trigger: "POST /api/auth/login",
    sampleData: { code: "482916", recipientName: "Member" },
  },
  {
    id: "otp-signup",
    name: "Membership verification",
    description: "Sent during membership application before the account is created.",
    trigger: "POST /api/auth/signup",
    sampleData: { code: "719304", recipientName: "Applicant" },
  },
  {
    id: "otp-pin-reset",
    name: "PIN reset verification",
    description: "Sent when a member requests to reset their account PIN.",
    trigger: "POST /api/auth/forgot-pin",
    sampleData: { code: "305184", recipientName: "Member" },
  },
  {
    id: "contact-internal",
    name: "Contact form (internal)",
    description: "Sent to helpdesk when someone submits the public contact form.",
    trigger: "POST /api/contact",
    sampleData: {
      name: "Jordan Lee",
      email: "jordan@example.com",
      topic: "membership",
      message: "I would like information about joining Northium and opening checking and savings accounts.",
    },
  },
  {
    id: "contact-confirmation",
    name: "Contact form (confirmation)",
    description: "Auto-reply confirming receipt of a contact form message.",
    trigger: "POST /api/contact",
    sampleData: {
      name: "Jordan Lee",
      topic: "membership",
    },
  },
  {
    id: "welcome-member",
    name: "Welcome (new member)",
    description: "Sent after email verification when membership application is created.",
    trigger: "POST /api/auth/verify-otp (signup)",
    sampleData: { firstName: "Jordan" },
  },
];

export function buildOtpLoginEmail(code: string): EmailMessage {
  const subject = `${institution.shortName} sign-in verification code`;
  const text = `Your ${institution.shortName} sign-in verification code is: ${code}

This code expires in 10 minutes. If you did not request this, contact ${institution.supportEmail} immediately.

${institution.name}
${institution.tagline}`;

  const html = buildEmailLayout({
    preheader: `Your sign-in code is ${code}. It expires in 10 minutes.`,
    eyebrow: "Secure sign-in",
    title: "Verify your sign-in",
    bodyHtml: `<p style="margin:0 0 12px">Use this one-time verification code to complete your sign-in to ${escapeHtml(institution.shortName)}.</p>
      ${codeBlock(code)}
      <p style="margin:0;color:#667085">This code expires in <strong>10 minutes</strong>. For your protection, a new code is required every time you sign in.</p>`,
    footerNote: "Never share this code. Northium will never ask for it by phone or text.",
  });

  return { subject, html, text };
}

export function buildOtpSignupEmail(code: string): EmailMessage {
  const subject = `${institution.shortName} membership verification code`;
  const text = `Your ${institution.shortName} membership verification code is: ${code}

This code expires in 10 minutes. If you did not apply for membership, contact ${institution.supportEmail} immediately.

${institution.name}
${institution.tagline}`;

  const html = buildEmailLayout({
    preheader: `Your membership verification code is ${code}.`,
    eyebrow: "Membership application",
    title: "Verify your email",
    bodyHtml: `<p style="margin:0 0 12px">Thank you for applying to ${escapeHtml(institution.name)}. Enter this code to verify your email and continue your application.</p>
      ${codeBlock(code)}
      <p style="margin:0;color:#667085">After verification you can sign in, complete identity review, and finish opening your accounts.</p>`,
    cta: { label: "Continue application", href: `${institution.productionUrl}/apply` },
    footerNote: "If you did not start a membership application, ignore this email.",
  });

  return { subject, html, text };
}

export function buildOtpPinResetEmail(code: string): EmailMessage {
  const subject = `${institution.shortName} PIN reset verification code`;
  const text = `Your ${institution.shortName} PIN reset verification code is: ${code}

This code expires in 10 minutes. If you did not request a PIN reset, contact ${institution.supportEmail} immediately.

${institution.name}
${institution.tagline}`;

  const html = buildEmailLayout({
    preheader: `Your PIN reset code is ${code}. It expires in 10 minutes.`,
    eyebrow: "Account security",
    title: "Reset your account PIN",
    bodyHtml: `<p style="margin:0 0 12px">Use this one-time verification code to reset your Northium account PIN.</p>
      ${codeBlock(code)}
      <p style="margin:0;color:#667085">After you enter this code you can choose a new 6-digit PIN and sign in.</p>`,
    cta: { label: "Go to sign in", href: `${institution.productionUrl}/sign-in` },
    footerNote: "Never share this code. Northium will never ask for it by phone or text.",
  });

  return { subject, html, text };
}

export function buildContactInternalEmail(data: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): EmailMessage {
  const topicLabel = topicLabels[data.topic] ?? data.topic;
  const subject = `[Contact] ${topicLabel} — ${data.name}`;
  const text = `New contact form submission on ${institution.domain}

Name: ${data.name}
Email: ${data.email}
Topic: ${topicLabel}

Message:
${data.message}`;

  const html = buildEmailLayout({
    preheader: `New contact message from ${data.name}.`,
    eyebrow: "Member services",
    title: "New contact form message",
    bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px">
      ${detailRow("Name", data.name)}
      ${detailRow("Email", data.email)}
      ${detailRow("Topic", topicLabel)}
    </table>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#667085">Message</p>
    <p style="margin:0;padding:16px;border-radius:12px;background:#F7F9FB;border:1px solid #E5E7EB;white-space:pre-wrap">${escapeHtml(data.message)}</p>`,
    footerNote: "Reply directly to the sender email when responding.",
  });

  return { subject, html, text };
}

export function buildContactConfirmationEmail(data: {
  name: string;
  topic: string;
}): EmailMessage {
  const topicLabel = topicLabels[data.topic] ?? data.topic;
  const subject = `We received your message — ${institution.shortName}`;
  const text = `Hello ${data.name},

Thank you for contacting ${institution.name}. We received your message regarding "${topicLabel}" and a member services representative will respond shortly.

${institution.supportEmail}
${institution.name}`;

  const html = buildEmailLayout({
    preheader: "Your message was received by Northium member services.",
    eyebrow: "Message received",
    title: `Thank you, ${data.name.split(" ")[0] || "there"}`,
    bodyHtml: `<p style="margin:0 0 12px">We received your message about <strong>${escapeHtml(topicLabel)}</strong>. Our team typically responds within one business day.</p>
      <p style="margin:0;color:#667085">If your matter is urgent — especially fraud or suspicious activity — reply to this email with <strong>Security</strong> in the subject line.</p>`,
    cta: { label: "Visit Northium", href: institution.productionUrl },
  });

  return { subject, html, text };
}

export function buildWelcomeMemberEmail(firstName: string): EmailMessage {
  const subject = `Welcome to ${institution.name}`;
  const text = `Welcome to ${institution.name}, ${firstName}!

Your email is verified. Sign in to complete identity verification and finish opening your accounts.

Sign in: ${institution.productionUrl}/sign-in

${institution.tagline}`;

  const html = buildEmailLayout({
    preheader: "Welcome to Northium — complete identity verification in your member portal.",
    eyebrow: "Welcome",
    title: `Welcome to ${institution.shortName}`,
    bodyHtml: `<p style="margin:0 0 12px">Hello ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 12px">Your membership application is underway. Sign in to your secure member portal to complete identity verification and receive your account details after approval.</p>
      <ul style="margin:0;padding-left:20px;color:#667085;line-height:1.8">
        <li>Sign in with your username and PIN</li>
        <li>Submit identity verification documents</li>
        <li>Await administrator review</li>
      </ul>`,
    cta: { label: "Go to member portal", href: `${institution.productionUrl}/sign-in` },
    footerNote: institution.tagline,
  });

  return { subject, html, text };
}

export function renderEmailTemplate(
  id: EmailTemplateId,
  data: Record<string, string>
): EmailMessage {
  switch (id) {
    case "otp-login":
      return buildOtpLoginEmail(data.code ?? "000000");
    case "otp-signup":
      return buildOtpSignupEmail(data.code ?? "000000");
    case "otp-pin-reset":
      return buildOtpPinResetEmail(data.code ?? "000000");
    case "contact-internal":
      return buildContactInternalEmail({
        name: data.name ?? "Member",
        email: data.email ?? "member@example.com",
        topic: data.topic ?? "general",
        message: data.message ?? "Sample message.",
      });
    case "contact-confirmation":
      return buildContactConfirmationEmail({
        name: data.name ?? "Member",
        topic: data.topic ?? "general",
      });
    case "welcome-member":
      return buildWelcomeMemberEmail(data.firstName ?? "Member");
    default:
      return buildOtpLoginEmail("000000");
  }
}
