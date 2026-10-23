import nodemailer from "nodemailer";

interface SendVerificationEmailOptions {
  to: string;
  name: string;
  code: string;
  type?: "signup" | "login";
}

/**
 * Creates a Nodemailer transport instance
 */
function createEmailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a modern, minimalist HTML verification email with OTP and button
 */
export async function sendVerificationEmail({
  to,
  name,
  code,
  type = "signup",
}: SendVerificationEmailOptions): Promise<{ success: boolean; previewUrl?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(to)}&code=${encodeURIComponent(code)}`;

  const subject =
    type === "login"
      ? `${code} is your ThreadCraft Sign-in Code`
      : `Verify your ThreadCraft Account - Code: ${code}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #171717;
        }
        .container {
          max-width: 540px;
          margin: 40px auto;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .header {
          background-color: #0a0a0a;
          color: #ffffff;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 22px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .header p {
          margin: 4px 0 0 0;
          font-size: 10px;
          letter-spacing: 0.25em;
          color: #a3a3a3;
          text-transform: uppercase;
        }
        .body-content {
          padding: 36px 32px;
          text-align: center;
        }
        .body-content h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #0a0a0a;
        }
        .body-content p {
          font-size: 14px;
          line-height: 1.6;
          color: #525252;
          margin: 0 0 24px 0;
        }
        .code-box {
          display: inline-block;
          background-color: #f5f5f5;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 16px 36px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 0.35em;
          color: #000000;
          margin: 8px 0 28px 0;
        }
        .btn {
          display: inline-block;
          background-color: #000000;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .footer {
          border-top: 1px solid #f0f0f0;
          padding: 24px 32px;
          text-align: center;
          font-size: 11px;
          color: #737373;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ThreadCraft</h1>
          <p>Studio &bull; Essentials</p>
        </div>
        <div class="body-content">
          <h2>${type === "login" ? "Sign-in Verification" : "Welcome to ThreadCraft"}</h2>
          <p>Hi ${name || "there"},<br>
          ${
            type === "login"
              ? "Use the 6-digit verification code below to complete your secure login, or click the direct verification button."
              : "Thank you for joining our conscious clothing collective. Please verify your email address using the 6-digit code below or click the button."
          }</p>

          <div>
            <div class="code-box">${code}</div>
          </div>

          <div>
            <a href="${verifyUrl}" class="btn" target="_blank">Verify Email Now</a>
          </div>

          <p style="font-size: 12px; color: #a3a3a3; margin-top: 16px;">
            This security code will expire in <strong>15 minutes</strong>.<br>
            If you did not initiate this request, you can safely disregard this email.
          </p>
        </div>
        <div class="footer">
          &copy; 2026 ThreadCraft Studio Inc. All rights reserved.<br>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
ThreadCraft Verification
-------------------------
Hi ${name || "there"},

Your verification code is: ${code}

Or verify directly by opening this link in your browser:
${verifyUrl}

This code expires in 15 minutes.
  `;

  // Always log to server terminal for instant inspection/dev testing
  console.log("\n========================================================");
  console.log(`[ThreadCraft Nodemailer] Verification code for: ${to}`);
  console.log(`Code: ${code}`);
  console.log(`Direct Link: ${verifyUrl}`);
  console.log("========================================================\n");

  const transporter = createEmailTransporter();

  if (transporter) {
    try {
      const from =
        process.env.EMAIL_FROM || '"ThreadCraft Studio" <no-reply@threadcraft.com>';
      await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    } catch (error) {
      console.error("[Nodemailer Error] Could not send email via SMTP:", error);
      // Fallback succeeded via console log
      return { success: false };
    }
  } else {
    // If SMTP is not yet configured, notify console
    console.log(
      "[Nodemailer Info] SMTP credentials not set in .env.local. The verification code has been printed above."
    );
    return { success: true };
  }
}

/**
 * Sends a welcome email to a new newsletter subscriber
 */
export async function sendNewsletterWelcomeEmail(
  to: string
): Promise<{ success: boolean }> {
  const subject = "Welcome to the ThreadCraft Studio Circle";
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { margin: 0; padding: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #171717; }
        .container { max-width: 520px; margin: 40px auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden; }
        .header { background: #0a0a0a; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-family: Georgia, serif; font-size: 22px; letter-spacing: 0.12em; text-transform: uppercase; }
        .body { padding: 36px 32px; text-align: center; }
        .title { font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #525252; margin-bottom: 24px; }
        .button { display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 28px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 6px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 11px; color: #737373; border-top: 1px solid #e5e5e5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ThreadCraft</h1>
        </div>
        <div class="body">
          <div class="title">You Are Now in the Circle</div>
          <div class="desc">
            Thank you for subscribing to our studio newsletter. You will be the first to receive notice of limited seasonal capsule releases, archival restocks, and private studio events.
          </div>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/shop" class="button">Explore Collection</a>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ThreadCraft Studio. Consciously crafted essentials.
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n[ThreadCraft Newsletter] New subscriber welcomed: ${to}\n`);

  const transporter = createEmailTransporter();
  if (transporter) {
    try {
      const from =
        process.env.EMAIL_FROM || '"ThreadCraft Studio" <no-reply@threadcraft.com>';
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });
      return { success: true };
    } catch (err) {
      console.error("[Nodemailer Error] Could not send newsletter welcome email:", err);
      return { success: false };
    }
  }

  return { success: true };
}
