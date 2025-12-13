import { Resend } from 'resend';

const resend = new Resend(process.env.API_KEY_EMAIL_SERVICE);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = process.env.APP_NAME || 'Mystovia';

interface SendPasswordResetEmailParams {
  to: string;
  resetToken: string;
  username: string;
}

export const sendPasswordResetEmail = async ({
  to,
  resetToken,
  username
}: SendPasswordResetEmailParams): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `🔐 Password Reset - ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                      <h1 style="margin: 0; color: #fbbf24; font-size: 32px; font-weight: bold;">${APP_NAME}</h1>
                      <p style="margin: 10px 0 0; color: #94a3b8; font-size: 14px;">Password Recovery</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hello, ${username}!</h2>
                      <p style="margin: 0 0 20px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password:
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #0a0a0a; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 20px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                        This link will expire in <strong style="color: #fbbf24;">1 hour</strong>.
                      </p>

                      <p style="margin: 20px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>

                      <!-- Alternative Link -->
                      <div style="margin-top: 30px; padding: 20px; background-color: rgba(0, 0, 0, 0.2); border-radius: 8px;">
                        <p style="margin: 0 0 10px; color: #94a3b8; font-size: 12px;">
                          If the button doesn't work, copy and paste this link:
                        </p>
                        <p style="margin: 0; word-break: break-all;">
                          <a href="${resetLink}" style="color: #fbbf24; font-size: 12px; text-decoration: none;">${resetLink}</a>
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                      <p style="margin: 0; color: #64748b; font-size: 12px;">
                        © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};
