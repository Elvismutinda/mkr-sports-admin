import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as SMTPTransport.Options);

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `MKR Sports <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your MKR Sports account",
    html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Account Verification</title>
        </head>
        <body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;padding:40px 0">
            <tr>
            <td align="center">

                <table width="480" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#0f1623;border-radius:12px;overflow:hidden;max-width:480px;width:100%">
                <tr>
                    <td style="padding:36px 40px 40px 40px">

                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px">
                        <tr>
                        <td>
                            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">MKR</span>
                            <span style="font-size:11px;font-weight:700;color:#ffea00;letter-spacing:0.25em;text-transform:uppercase;margin-left:6px">SPORTS</span>
                        </td>
                        </tr>
                    </table>

                    <p style="margin:0 0 16px 0;font-size:26px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-0.5px;line-height:1.1">
                        ACCOUNT VERIFICATION
                    </p>

                    <p style="margin:0 0 32px 0;font-size:14px;color:#8a9ab5;line-height:1.6">
                        Greetings, Player. You have requested registration on the MKR Sports System.
                        Kindly verify your email to access your personalized dashboard.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
                        <tr>
                        <td align="center">
                            <a href="${confirmLink}"
                            style="display:block;width:100%;box-sizing:border-box;background-color:#ffea00;color:#111111;font-size:13px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;text-align:center;padding:16px 0;border-radius:6px;line-height:1">
                            VERIFY
                            </a>
                        </td>
                        </tr>
                    </table>

                    <p style="margin:0 0 28px 0;font-size:11px;font-weight:700;color:#ffea00;letter-spacing:0.15em;text-transform:uppercase;text-align:center">
                        THIS VERIFICATION LINK EXPIRES IN 2 MINUTES
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
                        <tr>
                        <td style="border-top:1px solid #1e2d42;font-size:0">&nbsp;</td>
                        </tr>
                    </table>

                    <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#4a5f7a;letter-spacing:0.15em;text-transform:uppercase">
                        DIRECT URL:
                    </p>

                    <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all">
                        <a href="${confirmLink}" style="color:#ffea00;text-decoration:none">${confirmLink}</a>
                    </p>

                    </td>
                </tr>
                </table>
                <!-- End Card -->

            </td>
            </tr>
        </table>
        </body>
        </html>
    `,
  });
};

export const sendMatchRegistrationEmail = async ({
  email,
  name,
  match,
  playerCount = 1,
}: {
  email: string;
  name?: string | null;
  match: { id: string; location: string; date: Date | string };
  playerCount?: number;
}) => {
  const matchDate = new Date(match.date);
  const matchLink = `${process.env.NEXT_PUBLIC_BASE_URL}/matches/${match.id}`;

  await transporter.sendMail({
    from: `MKR Sports <${process.env.SMTP_USER}>`,
    to: email,
    subject: "✅ Match Registration Confirmed",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#111">You're In! ⚽</h2>
        <p>Hi ${name ?? "Captain"},</p>
        <p>
          Your payment was successful and <strong>${playerCount} player${playerCount > 1 ? "s have" : " has"} been
          confirmed</strong> for the match.
        </p>
        <hr style="margin:24px 0"/>
        <p><strong>📍 Venue:</strong> ${match.location}</p>
        <p><strong>📅 Date:</strong> ${matchDate.toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })}</p>
        <p><strong>⏰ Time:</strong> ${matchDate.toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit",
        })}</p>
        <div style="margin:32px 0">
          <a href="${matchLink}"
            style="background:#ffea00;color:#111;padding:12px 18px;border-radius:6px;font-weight:bold;text-decoration:none;display:inline-block;">
            View Match Details
          </a>
        </div>
        <p style="font-size:13px;color:#666">If you have any questions, reply to this email.</p>
        <p style="font-size:12px;color:#999;margin-top:40px">© ${new Date().getFullYear()} MKR Sports</p>
      </div>
    `,
  });
};