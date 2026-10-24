import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

// Initialize transporter if SMTP credentials are provided
if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

/**
 * Send an OTP verification code to user's email
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.otp - 6-digit verification code
 * @param {string} options.deviceInfo - Information about the logging-in device
 * @returns {Promise<{ sent: boolean, provider: string }>}
 */
export async function sendOtpEmail({ to, name, otp, deviceInfo = 'New Device' }) {
  const subject = `Your MeetFlow Security Verification Code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #1e293b;">
      <div style="display: flex; align-items: center; margin-bottom: 24px;">
        <div style="background: #6366f1; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; margin-right: 12px; text-align: center; line-height: 36px;">MF</div>
        <h2 style="margin: 0; color: #ffffff; font-size: 20px;">MeetFlow Security</h2>
      </div>
      <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">Hello ${name || 'there'},</p>
      <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
        A login request was made from a new or unverified device: <strong style="color: #ffffff;">${deviceInfo}</strong>.
      </p>
      <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
        Please enter the following 6-digit one-time verification code to approve this login session:
      </p>
      <div style="background: #1e1b4b; border: 1px solid #4f46e5; border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #a5b4fc;">${otp}</span>
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
        This code expires in <strong>10 minutes</strong>. If you did not request this code, please change your password immediately.
      </p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} MeetFlow. Automated security notification.
      </p>
    </div>
  `;

  // If SMTP transporter is configured, send email via SMTP
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      console.log(`[Mailer] OTP email dispatched via SMTP to ${to}`);
      return { sent: true, provider: 'smtp' };
    } catch (err) {
      console.error('[Mailer] SMTP delivery error:', err.message);
      // Fall through to console log for resilience in test/dev
    }
  }

  // Development / fallback logger
  console.log('===========================================================');
  console.log(`[AUTH EMAIL NOTIFICATION - DEVELOPMENT MODE]`);
  console.log(`To: ${to}`);
  console.log(`Security Code (OTP): ${otp}`);
  console.log(`Device: ${deviceInfo}`);
  console.log(`Valid for: 10 minutes`);
  console.log('===========================================================');

  return { sent: true, provider: 'console-development' };
}
