import { authenticator } from 'otplib';
import { encryptSecret, decryptSecret, generateRecoveryCodes, verifyAndConsumeRecoveryCode } from './crypto.js';
import logger from './logger.js';

// Configure authenticator options (RFC 6238 standard)
authenticator.options = {
  window: 1, // Allow 1 step (30s) before/after for slight clock drift
  step: 30,
};

/**
 * Generate a new TOTP setup object for user
 * Returns unencrypted secret (for display during setup ONLY), encryptedSecret (to store temporarily in DB),
 * otpauthUri, and QR code Data URL.
 */
export async function generateTotpSetup(userEmail, appName = 'ELEVATE') {
  const secret = authenticator.generateSecret();
  const otpauthUri = authenticator.keyuri(userEmail, appName, secret);
  const encryptedSecret = encryptSecret(secret);
  const { plainCodes, hashedCodes } = generateRecoveryCodes(8);

  let qrCodeDataUrl = '';
  try {
    const QRCode = await import('qrcode');
    qrCodeDataUrl = await QRCode.default.toDataURL(otpauthUri, {
      margin: 2,
      width: 240,
      color: {
        dark: '#161514',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    logger.warn('QRCode generation fallback: ' + err.message);
  }

  return {
    secret, // Raw secret to display to user ONLY during setup
    encryptedSecret, // Encrypted secret to store in DB
    otpauthUri,
    qrCodeDataUrl,
    plainRecoveryCodes: plainCodes,
    hashedRecoveryCodes: hashedCodes,
  };
}

/**
 * Verify a TOTP token against an encrypted secret stored in DB
 */
export function verifyTotpToken(token, encryptedSecret) {
  if (!token || !encryptedSecret) return false;
  try {
    const rawSecret = decryptSecret(encryptedSecret);
    return authenticator.verify({
      token: token.toString().trim(),
      secret: rawSecret,
    });
  } catch (err) {
    logger.error('TOTP token verification error: ' + err.message);
    return false;
  }
}

/**
 * Verify either a TOTP token or a recovery code
 */
export function verifyTotpOrRecoveryCode(code, encryptedSecret, recoveryCodesJson) {
  if (!code) return { valid: false, usedRecoveryCode: false, updatedRecoveryCodesJson: recoveryCodesJson };

  const cleanCode = code.toString().trim();

  // Try standard 6-digit TOTP first
  if (/^\d{6}$/.test(cleanCode) && encryptedSecret) {
    const isValidTotp = verifyTotpToken(cleanCode, encryptedSecret);
    if (isValidTotp) {
      return { valid: true, usedRecoveryCode: false, updatedRecoveryCodesJson: recoveryCodesJson };
    }
  }

  // Try recovery code format (e.g. A3K98-8F2X0 or 10-char formatted)
  if (recoveryCodesJson) {
    const recoveryResult = verifyAndConsumeRecoveryCode(cleanCode, recoveryCodesJson);
    if (recoveryResult.valid) {
      return { valid: true, usedRecoveryCode: true, updatedRecoveryCodesJson: recoveryResult.updatedJson };
    }
  }

  return { valid: false, usedRecoveryCode: false, updatedRecoveryCodesJson: recoveryCodesJson };
}

export default {
  generateTotpSetup,
  verifyTotpToken,
  verifyTotpOrRecoveryCode,
};
