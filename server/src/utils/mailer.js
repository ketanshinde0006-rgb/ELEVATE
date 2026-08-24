import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from './logger.js';

let transporter = null;

export function isSmtpConfigured() {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export function getMailer() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const mailer = getMailer();
  if (!mailer) {
    logger.warn(`Email sending skipped for ${to} — SMTP credentials not configured.`);
    return {
      sent: false,
      status: 'IMPLEMENTED — EMAIL PROVIDER CONFIGURATION REQUIRED',
    };
  }

  const mailOptions = {
    from: env.EMAIL_FROM || 'ELEVATE Security <noreply@elevate.local>',
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    return {
      sent: true,
      messageId: info.messageId,
      status: 'VERIFIED — EMAIL SENT',
    };
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    return {
      sent: false,
      status: 'FAILED — SMTP ERROR',
      error: err.message,
    };
  }
}

/**
 * Send Email Verification link
 */
export async function sendEmailVerificationMessage(email, token, appUrl = 'http://localhost:5173') {
  const verifyLink = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  return sendEmail({
    to: email,
    subject: 'Verify your ELEVATE account',
    text: `Welcome to ELEVATE. Please verify your email address by visiting: ${verifyLink}`,
    html: `
      <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #161514;">
        <h2 style="letter-spacing: 0.1em; color: #C5A880; font-family: serif;">E L E V A T E</h2>
        <h3 style="margin-top: 16px;">Verify your email address</h3>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Thank you for creating your ELEVATE account. Click the button below to verify your email address and activate all features.
        </p>
        <div style="margin: 28px 0;">
          <a href="${verifyLink}" style="background: #161514; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">This link will expire in 24 hours. If you did not create an ELEVATE account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send Password Reset link
 */
export async function sendPasswordResetMessage(email, token, appUrl = 'http://localhost:5173') {
  const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  return sendEmail({
    to: email,
    subject: 'Reset your ELEVATE password',
    text: `You requested a password reset for your ELEVATE account. Visit the following link to set a new password: ${resetLink}`,
    html: `
      <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #161514;">
        <h2 style="letter-spacing: 0.1em; color: #C5A880; font-family: serif;">E L E V A T E</h2>
        <h3 style="margin-top: 16px;">Reset your password</h3>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to choose a new password.
        </p>
        <div style="margin: 28px 0;">
          <a href="${resetLink}" style="background: #C5A880; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">This link will expire in 1 hour. If you did not request a password reset, your account is safe and you can ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send Email OTP Login Code
 */
export async function sendEmailOtpMessage(email, otpCode) {
  return sendEmail({
    to: email,
    subject: `Your ELEVATE login code: ${otpCode}`,
    text: `Your ELEVATE verification code is: ${otpCode}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #161514;">
        <h2 style="letter-spacing: 0.1em; color: #C5A880; font-family: serif;">E L E V A T E</h2>
        <h3 style="margin-top: 16px;">Your Login Code</h3>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Use the following 6-digit code to sign in to your ELEVATE account:
        </p>
        <div style="margin: 24px 0; background: #F8F7F4; border: 1px solid #E8E6DF; padding: 16px; border-radius: 8px; text-align: center;">
          <span style="font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.25em; color: #161514;">${otpCode}</span>
        </div>
        <p style="color: #999; font-size: 12px;">Valid for 10 minutes. Never share this code with anyone.</p>
      </div>
    `,
  });
}

/**
 * Send Magic Link Login
 */
export async function sendMagicLinkMessage(email, token, appUrl = 'http://localhost:5173') {
  const magicLink = `${appUrl}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`;
  return sendEmail({
    to: email,
    subject: 'Sign in to ELEVATE with your Magic Link',
    text: `Click the link below to sign in instantly to ELEVATE: ${magicLink}`,
    html: `
      <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #161514;">
        <h2 style="letter-spacing: 0.1em; color: #C5A880; font-family: serif;">E L E V A T E</h2>
        <h3 style="margin-top: 16px;">Sign in with Magic Link</h3>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Click the button below to sign in instantly to your ELEVATE account without entering a password.
        </p>
        <div style="margin: 28px 0;">
          <a href="${magicLink}" style="background: #161514; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Sign In to ELEVATE
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">This link is single-use and will expire in 15 minutes. If you did not request this link, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export default {
  isSmtpConfigured,
  getMailer,
  sendEmail,
  sendEmailVerificationMessage,
  sendPasswordResetMessage,
  sendEmailOtpMessage,
  sendMagicLinkMessage,
};
