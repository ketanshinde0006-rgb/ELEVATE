import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
} from '../src/services/auth.service.js';
import {
  encryptSecret,
  decryptSecret,
  hashToken,
  generateRecoveryCodes,
  verifyAndConsumeRecoveryCode,
} from '../src/utils/crypto.js';
import {
  generateTotpSetup,
  verifyTotpToken,
  verifyTotpOrRecoveryCode,
} from '../src/utils/totp.js';
import { successResponse, paginationMeta } from '../src/utils/apiResponse.js';
import { goalSchema, taskSchema, habitSchema, wardrobeSchema } from '../src/validators/domain.validator.js';
import {
  changePasswordSchema,
  setPasswordSchema,
  googleAuthSchema,
  appleAuthSchema,
  microsoftAuthSchema,
  phoneSendOtpSchema,
  phoneVerifyOtpSchema,
  emailOtpSendSchema,
  emailOtpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema,
  mfaEnableSchema,
  mfaVerifyLoginSchema,
} from '../src/validators/auth.validator.js';

describe('Auth Service & Password Tests', () => {
  test('hashPassword generates valid bcrypt hash and comparePassword verifies correctly', async () => {
    const password = 'TestSecret123!';
    const hash = await hashPassword(password);
    assert.ok(hash);
    assert.notEqual(hash, password);

    const isMatch = await comparePassword(password, hash);
    assert.equal(isMatch, true);

    const isWrongMatch = await comparePassword('WrongPassword', hash);
    assert.equal(isWrongMatch, false);
  });

  test('comparePassword safely handles null, undefined, or empty passwords without throwing', async () => {
    const isNullMatch1 = await comparePassword(null, '$2a$12$somevalidhash');
    assert.equal(isNullMatch1, false);

    const isNullMatch2 = await comparePassword('password', null);
    assert.equal(isNullMatch2, false);

    const isNullMatch3 = await comparePassword(undefined, undefined);
    assert.equal(isNullMatch3, false);
  });

  test('generateAccessToken returns a non-empty JWT token string', () => {
    const token = generateAccessToken('user_123', 'USER');
    assert.equal(typeof token, 'string');
    assert.equal(token.split('.').length, 3);
  });
});

describe('Crypto & Secrets Encryption Tests', () => {
  test('encryptSecret and decryptSecret successfully round-trip sensitive TOTP secrets', () => {
    const rawSecret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(rawSecret);
    assert.ok(encrypted);
    assert.notEqual(encrypted, rawSecret);
    assert.equal(encrypted.split(':').length, 3);

    const decrypted = decryptSecret(encrypted);
    assert.equal(decrypted, rawSecret);
  });

  test('hashToken produces deterministic SHA-256 hex string', () => {
    const token = 'my-secret-token-123';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });

  test('generateRecoveryCodes creates 8 unique codes and verifyAndConsumeRecoveryCode marks single-use', () => {
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
    assert.equal(plainCodes.length, 8);
    assert.equal(hashedCodes.length, 8);

    const firstCode = plainCodes[0];
    const initialJson = JSON.stringify(hashedCodes);

    const result1 = verifyAndConsumeRecoveryCode(firstCode, initialJson);
    assert.equal(result1.valid, true);

    // Attempt to reuse consumed recovery code -> must fail
    const result2 = verifyAndConsumeRecoveryCode(firstCode, result1.updatedJson);
    assert.equal(result2.valid, false);
  });
});

describe('TOTP & 2FA Utilities', () => {
  test('generateTotpSetup creates otpauth URI, encrypted secret, and recovery codes', async () => {
    const setup = await generateTotpSetup('alex@elevate.local');
    assert.ok(setup.secret);
    assert.ok(setup.encryptedSecret);
    assert.ok(setup.otpauthUri.startsWith('otpauth://totp/'));
    assert.equal(setup.plainRecoveryCodes.length, 8);
  });

  test('verifyTotpOrRecoveryCode correctly verifies recovery code and returns updated JSON', () => {
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
    const recoveryCode = plainCodes[2];
    const encryptedSecret = encryptSecret('JBSWY3DPEHPK3PXP');

    const result = verifyTotpOrRecoveryCode(recoveryCode, encryptedSecret, JSON.stringify(hashedCodes));
    assert.equal(result.valid, true);
    assert.equal(result.usedRecoveryCode, true);
  });
});

describe('Auth Joi Validators', () => {
  test('changePasswordSchema validates valid change password data', () => {
    const valid = { currentPassword: 'OldPassword123!', newPassword: 'NewPassword123!', confirmPassword: 'NewPassword123!' };
    const { error } = changePasswordSchema.validate(valid);
    assert.equal(error, undefined);
  });

  test('changePasswordSchema rejects new password under 8 chars', () => {
    const tooShort = { currentPassword: 'OldPassword123!', newPassword: 'short', confirmPassword: 'short' };
    const { error } = changePasswordSchema.validate(tooShort);
    assert.ok(error);
  });

  test('setPasswordSchema validates set password for Google users', () => {
    const valid = { newPassword: 'FirstPassword123!', confirmPassword: 'FirstPassword123!' };
    const { error } = setPasswordSchema.validate(valid);
    assert.equal(error, undefined);
  });

  test('appleAuthSchema and microsoftAuthSchema accept credential or idToken', () => {
    assert.equal(appleAuthSchema.validate({ credential: 'token' }).error, undefined);
    assert.equal(microsoftAuthSchema.validate({ idToken: 'token' }).error, undefined);
  });

  test('phoneSendOtpSchema and phoneVerifyOtpSchema validate mobile fields', () => {
    assert.equal(phoneSendOtpSchema.validate({ phone: '+15551234567' }).error, undefined);
    assert.equal(phoneVerifyOtpSchema.validate({ phone: '+15551234567', code: '123456' }).error, undefined);
  });

  test('emailOtpSendSchema and magicLinkSendSchema validate email', () => {
    assert.equal(emailOtpSendSchema.validate({ email: 'user@example.com' }).error, undefined);
    assert.equal(magicLinkSendSchema.validate({ email: 'user@example.com' }).error, undefined);
  });

  test('mfaEnableSchema and mfaVerifyLoginSchema validate MFA codes', () => {
    assert.equal(mfaEnableSchema.validate({ token: '123456' }).error, undefined);
    assert.equal(mfaVerifyLoginSchema.validate({ tempToken: 'jwt', code: '123456' }).error, undefined);
  });
});

describe('API Response Helpers', () => {
  test('paginationMeta calculates pages and hasNext/hasPrev correctly', () => {
    const meta = paginationMeta(1, 10, 25);
    assert.equal(meta.totalPages, 3);
    assert.equal(meta.hasNext, true);
    assert.equal(meta.hasPrev, false);
  });

  test('successResponse formats structured payload on Express res', () => {
    const mockRes = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; },
    };
    successResponse(mockRes, { item: 'blazer' }, 'Fetched item', 200);
    assert.equal(mockRes.statusCode, 200);
    assert.equal(mockRes.body.success, true);
  });
});

describe('Domain Validators', () => {
  test('goalSchema validates valid goal data', () => {
    const validGoal = { title: 'Run a 10k race', priority: 'HIGH', progress: 50 };
    const { error } = goalSchema.validate(validGoal);
    assert.equal(error, undefined);
  });

  test('taskSchema, habitSchema, wardrobeSchema work as expected', () => {
    assert.equal(taskSchema.validate({ title: 'Task', category: 'General' }).error, undefined);
    assert.equal(habitSchema.validate({ title: 'Habit', frequency: 'Daily' }).error, undefined);
    assert.equal(wardrobeSchema.validate({ name: 'Jacket', category: 'Outerwear' }).error, undefined);
  });
});
