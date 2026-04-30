import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as SMTPTransport.Options);

const FROM = `MKR Sports <${process.env.SMTP_USER}>`;
const BASE_URL = process.env.NEXTAUTH_URL;
const PORTAL_URL = process.env.NEXTPORTAL_URL;

function logoRow() {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px">
      <tr>
        <td>
          <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">MKR</span>
          <span style="font-size:11px;font-weight:700;color:#ffea00;letter-spacing:0.25em;text-transform:uppercase;margin-left:6px">SPORTS</span>
        </td>
      </tr>
    </table>`;
}

function wrapper(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9;padding:40px 0">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" border="0"
      style="background-color:#0f1623;border-radius:12px;overflow:hidden;max-width:480px;width:100%">
      <tr><td style="padding:36px 40px 40px 40px">
        ${logoRow()}
        ${body}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function primaryButton(href: string, label: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px">
      <tr><td align="center">
        <a href="${href}"
          style="display:block;width:100%;box-sizing:border-box;background-color:#2a79b5;color:#ffffff;font-size:13px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;text-align:center;padding:16px 0;border-radius:6px;line-height:1">
          ${label}
        </a>
      </td></tr>
    </table>`;
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
    <tr><td style="border-top:1px solid #1e2d42;font-size:0">&nbsp;</td></tr>
  </table>`;
}

function directUrl(href: string) {
  return `
    <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#4a5f7a;letter-spacing:0.15em;text-transform:uppercase">DIRECT URL:</p>
    <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all">
      <a href="${href}" style="color:#2a79b5;text-decoration:none">${href}</a>
    </p>`;
}

const ROLE_LABELS: Record<string, string> = {
  turf_manager: "Turf Manager",
  // extend here as new partner roles are added
};

function roleLabel(role: string): string {
  return (
    ROLE_LABELS[role] ??
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// Emails 

/**
 * Sent when an admin creates a new partner account.
 * The link points to the Partner Portal password-setup page.
 */
export async function sendPartnerInviteEmail(
  email: string,
  name: string,
  token: string,
  role: string = "turf_manager",
) {
  const link = `${PORTAL_URL}/setup-password?token=${token}`;
  const label = roleLabel(role);

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to MKR Sports as a ${label}`,
    html: wrapper(`
      <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#ffea00;letter-spacing:0.2em;text-transform:uppercase">
        PARTNER PORTAL INVITE
      </p>
      <p style="margin:0 0 16px 0;font-size:26px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-0.5px;line-height:1.1">
        WELCOME, ${name.toUpperCase()}
      </p>
      <p style="margin:0 0 8px 0;font-size:14px;color:#8a9ab5;line-height:1.6">
        You've been added to the MKR Sports Partner Portal as a <strong style="color:#ffffff">${label}</strong>.
      </p>
      <p style="margin:0 0 32px 0;font-size:14px;color:#8a9ab5;line-height:1.6">
        Set up your password below to activate your account and access your partner dashboard.
      </p>
      ${primaryButton(link, "ACTIVATE MY ACCOUNT")}
      <p style="margin:0 0 28px 0;font-size:11px;font-weight:700;color:#ffea00;letter-spacing:0.15em;text-transform:uppercase;text-align:center">
        THIS LINK EXPIRES IN 48 HOURS
      </p>
      <p style="margin:0;font-size:12px;color:#4a5f7a;text-align:center">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
      ${divider()}
      ${directUrl(link)}
    `),
  });
}

/**
 * Sent when an admin creates a new system_user (admin panel operator) account.
 */
export async function sendAdminWelcomeEmail(
  email: string,
  name: string,
  token: string,
) {
  const link = `${BASE_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Your MKR Sports Admin account has been created",
    html: wrapper(`
      <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#2a79b5;letter-spacing:0.2em;text-transform:uppercase">
        ADMIN PORTAL
      </p>
      <p style="margin:0 0 16px 0;font-size:26px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-0.5px;line-height:1.1">
        WELCOME, ${name.toUpperCase()}
      </p>
      <p style="margin:0 0 32px 0;font-size:14px;color:#8a9ab5;line-height:1.6">
        An admin account has been created for you on the MKR Sports Admin Portal.
        Click below to set your password and activate your account.
      </p>
      ${primaryButton(link, "SET MY PASSWORD")}
      <p style="margin:0 0 28px 0;font-size:11px;font-weight:700;color:#ffea00;letter-spacing:0.15em;text-transform:uppercase;text-align:center">
        THIS LINK EXPIRES IN 24 HOURS
      </p>
      <p style="margin:0;font-size:12px;color:#4a5f7a;text-align:center">
        If you did not expect this email, please contact your administrator.
      </p>
      ${divider()}
      ${directUrl(link)}
    `),
  });
}

/**
 * Sent when an admin requests a password reset for their own account.
 */
export async function sendAdminPasswordResetEmail(
  email: string,
  name: string,
  token: string,
) {
  const link = `${BASE_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "MKR Sports Admin — Password Reset Request",
    html: wrapper(`
      <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#2a79b5;letter-spacing:0.2em;text-transform:uppercase">
        ADMIN PORTAL
      </p>
      <p style="margin:0 0 16px 0;font-size:26px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-0.5px;line-height:1.1">
        PASSWORD RESET
      </p>
      <p style="margin:0 0 32px 0;font-size:14px;color:#8a9ab5;line-height:1.6">
        Hi ${name}, a password reset was requested for your admin account.
        Click below to set a new password.
      </p>
      ${primaryButton(link, "RESET PASSWORD")}
      <p style="margin:0 0 28px 0;font-size:11px;font-weight:700;color:#ffea00;letter-spacing:0.15em;text-transform:uppercase;text-align:center">
        THIS LINK EXPIRES IN 30 MINUTES
      </p>
      <p style="margin:0;font-size:12px;color:#4a5f7a;text-align:center">
        If you didn't request this, someone may be trying to access your account — contact your admin immediately.
      </p>
      ${divider()}
      ${directUrl(link)}
    `),
  });
}
