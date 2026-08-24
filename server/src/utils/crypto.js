import crypto from 'node:crypto';
import env from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte encryption key from TOTP_ENCRYPTION_KEY or JWT_SECRET
 */
function getEncryptionKey() {
  const secret = process.env.TOTP_ENCRYPTION_KEY || env.JWT_SECRET || 'elevate_default_totp_secret_key_32bytes!!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns formatted string: ivHex:authTagHex:encryptedHex
 */
export function encryptSecret(plainText) {
  if (!plainText) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 */
export function decryptSecret(encryptedPayload) {
  if (!encryptedPayload) return null;
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Compute SHA-256 hash of a token or code for secure DB lookup
 */
export function hashToken(token) {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Generate cryptographically secure random recovery codes
 * Returns: { plainCodes: string[], hashedCodes: Array<{ hash: string, consumed: boolean }> }
 */
export function generateRecoveryCodes(count = 8) {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const randomHex = crypto.randomBytes(5).toString('hex').toUpperCase();
    const formattedCode = `${randomHex.slice(0, 5)}-${randomHex.slice(5, 10)}`;
    plainCodes.push(formattedCode);
    hashedCodes.push({
      hash: hashToken(formattedCode),
      consumed: false,
      createdAt: new Date().toISOString(),
    });
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verify and consume a recovery code against stored hashed recovery codes JSON
 */
export function verifyAndConsumeRecoveryCode(inputCode, storedRecoveryCodesJson) {
  if (!inputCode || !storedRecoveryCodesJson) return { valid: false, updatedJson: storedRecoveryCodesJson };

  let list = [];
  try {
    list = typeof storedRecoveryCodesJson === 'string' ? JSON.parse(storedRecoveryCodesJson) : storedRecoveryCodesJson;
  } catch {
    return { valid: false, updatedJson: storedRecoveryCodesJson };
  }

  const inputHash = hashToken(inputCode);
  const codeIndex = list.findIndex(item => item.hash === inputHash && !item.consumed);

  if (codeIndex === -1) {
    return { valid: false, updatedJson: storedRecoveryCodesJson };
  }

  list[codeIndex].consumed = true;
  list[codeIndex].consumedAt = new Date().toISOString();

  return {
    valid: true,
    updatedJson: JSON.stringify(list),
  };
}

export default {
  encryptSecret,
  decryptSecret,
  hashToken,
  generateRecoveryCodes,
  verifyAndConsumeRecoveryCode,
};
