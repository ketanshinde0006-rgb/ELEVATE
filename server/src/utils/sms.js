import env from '../config/env.js';
import logger from './logger.js';

export function isTwilioConfigured() {
  const sid = process.env.TWILIO_ACCOUNT_SID || env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN || env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID || env.TWILIO_VERIFY_SERVICE_SID;
  return !!(sid && token && verifySid);
}

/**
 * Normalize phone number to international E.164 format (+[country_code][number])
 */
export function normalizePhoneNumber(phone, defaultCountryCode = '+1') {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = `${defaultCountryCode}${cleaned.replace(/^0+/, '')}`;
  }
  return cleaned;
}

/**
 * Start verification via Twilio Verify v2
 */
export async function sendTwilioVerification(phone) {
  const e164Phone = normalizePhoneNumber(phone);
  if (!isTwilioConfigured()) {
    logger.warn(`Twilio Verify skipped for ${e164Phone} — Twilio credentials not configured.`);
    return {
      sent: false,
      status: 'IMPLEMENTED — SMS PROVIDER CONFIGURATION REQUIRED',
      phone: e164Phone,
    };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID || env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN || env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID || env.TWILIO_VERIFY_SERVICE_SID;

  const url = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`;
  const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: e164Phone,
      Channel: 'sms',
    }).toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    logger.error('Twilio Verify request failed: ' + (data.message || JSON.stringify(data)));
    throw new Error(data.message || 'Failed to dispatch SMS verification via Twilio Verify');
  }

  return {
    sent: true,
    status: 'VERIFIED — SMS SENT',
    phone: e164Phone,
    sid: data.sid,
  };
}

/**
 * Check verification code via Twilio Verify v2
 */
export async function checkTwilioVerification(phone, code) {
  const e164Phone = normalizePhoneNumber(phone);
  if (!isTwilioConfigured()) {
    return {
      approved: false,
      status: 'IMPLEMENTED — SMS PROVIDER CONFIGURATION REQUIRED',
      phone: e164Phone,
    };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID || env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN || env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID || env.TWILIO_VERIFY_SERVICE_SID;

  const url = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;
  const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: e164Phone,
      Code: code.toString().trim(),
    }).toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    logger.warn('Twilio Verification check failed: ' + (data.message || JSON.stringify(data)));
    return { approved: false, status: 'INVALID_CODE', message: data.message };
  }

  return {
    approved: data.status === 'approved',
    status: data.status === 'approved' ? 'VERIFIED — CODE APPROVED' : 'INVALID_CODE',
    phone: e164Phone,
  };
}

export default {
  isTwilioConfigured,
  normalizePhoneNumber,
  sendTwilioVerification,
  checkTwilioVerification,
};
