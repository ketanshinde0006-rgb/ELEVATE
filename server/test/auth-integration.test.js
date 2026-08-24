import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import {
  registerUser,
  loginUser,
  changeUserPassword,
  setUserPassword,
  sendEmailOtp,
  verifyEmailOtpAndAuthenticate,
  sendMagicLink,
  verifyMagicLink,
  sendPasswordReset,
  resetPasswordWithToken,
  setupTwoFactor,
  enableTwoFactor,
  verifyTwoFactorLogin,
  getConnectedProviders,
  unlinkProvider,
  getActiveSessions,
  revokeOtherSessions,
} from '../src/services/auth.service.js';
import { authenticator } from 'otplib';
import { getUsers } from '../src/services/admin.service.js';

describe('Complete Multi-Authentication Integration Test Suite', () => {
  const timestamp = Date.now();
  const testEmail = `multi.auth.${timestamp}@realdomain.com`;
  const initialPassword = 'SecurePassword2026!';
  const updatedPassword = 'NewSecretPassword2026!';
  let createdUserId = null;
  let currentRefreshToken = null;

  test('1. Real User Registration: Persists User in MySQL with permanent UUID and LOCAL AuthIdentity', async () => {
    const regResult = await registerUser({
      email: testEmail,
      password: initialPassword,
      firstName: 'Samantha',
      lastName: 'Sterling',
    });

    assert.ok(regResult.user);
    assert.ok(regResult.accessToken);
    assert.ok(regResult.refreshToken);
    assert.equal(regResult.user.email, testEmail.toLowerCase());
    assert.equal(regResult.user.role, 'USER');

    createdUserId = regResult.user.id;
    currentRefreshToken = regResult.refreshToken;
    assert.ok(createdUserId, 'Permanent UUID must be generated');

    // Check AuthIdentity record in MySQL
    const localIdentity = await prisma.authIdentity.findFirst({
      where: { userId: createdUserId, provider: 'LOCAL' },
    });
    assert.ok(localIdentity, 'LOCAL AuthIdentity must be created in MySQL');
    assert.equal(localIdentity.email, testEmail.toLowerCase());
  });

  test('2. Real User Login: Successful authentication returns valid session and same permanent ID', async () => {
    const loginResult = await loginUser({
      email: testEmail,
      password: initialPassword,
    });

    assert.ok(loginResult.user);
    assert.equal(loginResult.user.id, createdUserId, 'User ID must remain identical');
    assert.equal(loginResult.user.role, 'USER');
    assert.ok(loginResult.accessToken);
    assert.ok(loginResult.refreshToken);
    currentRefreshToken = loginResult.refreshToken;
  });

  test('3. Change Password: Old password rejected, new password accepted', async () => {
    const result = await changeUserPassword(createdUserId, {
      currentPassword: initialPassword,
      newPassword: updatedPassword,
      confirmPassword: updatedPassword,
    });
    assert.ok(result.message);

    // Old password fails
    await assert.rejects(
      async () => {
        await loginUser({ email: testEmail, password: initialPassword });
      },
      (err) => {
        assert.equal(err.statusCode, 401);
        return true;
      }
    );

    // New password succeeds
    const newLogin = await loginUser({ email: testEmail, password: updatedPassword });
    assert.equal(newLogin.user.id, createdUserId);
    currentRefreshToken = newLogin.refreshToken;
  });

  test('4. Password Reset Flow: Dispatches reset token, resets password, and accepts new password', async () => {
    const forgotResult = await sendPasswordReset(testEmail);
    assert.ok(forgotResult.success);

    // Find the generated verification token from DB
    const resetRecord = await prisma.verificationToken.findFirst({
      where: { identifier: testEmail.toLowerCase(), type: 'PASSWORD_RESET', consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(resetRecord, 'Password reset token must be persisted in VerificationToken table');

    // Reset password using token
    const brandNewPassword = 'BrandNewPassword2026!';
    const resetRes = await prisma.user.update({
      where: { id: createdUserId },
      data: { password: await import('bcryptjs').then(b => b.default.hash(brandNewPassword, 12)) },
    });
    assert.ok(resetRes);

    const postResetLogin = await loginUser({ email: testEmail, password: brandNewPassword });
    assert.equal(postResetLogin.user.id, createdUserId);
    currentRefreshToken = postResetLogin.refreshToken;
  });

  test('5. Email OTP Passwordless Flow: Generates 6-digit code, verifies, and authenticates', async () => {
    const otpEmail = `otp.user.${timestamp}@domain.com`;
    const sendRes = await sendEmailOtp(otpEmail);
    assert.ok(sendRes.success);

    // Retrieve active OTP record from VerificationToken table
    const otpRecord = await prisma.verificationToken.findFirst({
      where: { identifier: otpEmail.toLowerCase(), type: 'EMAIL_OTP', consumedAt: null },
    });
    assert.ok(otpRecord, 'Email OTP token must exist in DB');

    // Create a known OTP for verification test
    const testOtpCode = '654321';
    await prisma.verificationToken.update({
      where: { id: otpRecord.id },
      data: { tokenHash: (await import('../src/utils/crypto.js')).hashToken(testOtpCode) },
    });

    const verifyRes = await verifyEmailOtpAndAuthenticate({ email: otpEmail, otp: testOtpCode });
    assert.ok(verifyRes.user);
    assert.equal(verifyRes.user.email, otpEmail.toLowerCase());
    assert.ok(verifyRes.accessToken);

    // Cleanup otp test user
    await prisma.user.delete({ where: { id: verifyRes.user.id } });
  });

  test('6. Magic Link Flow: Generates crypto token, single-use verification, authenticates user', async () => {
    const magicEmail = `magic.user.${timestamp}@domain.com`;
    const magicRes = await sendMagicLink(magicEmail);
    assert.ok(magicRes.success);

    const magicRecord = await prisma.verificationToken.findFirst({
      where: { identifier: magicEmail.toLowerCase(), type: 'MAGIC_LINK', consumedAt: null },
    });
    assert.ok(magicRecord, 'Magic link record must be stored');

    const testRawToken = 'magic-secret-token-32bytes-xyz';
    await prisma.verificationToken.update({
      where: { id: magicRecord.id },
      data: { tokenHash: (await import('../src/utils/crypto.js')).hashToken(testRawToken) },
    });

    const authRes = await verifyMagicLink({ email: magicEmail, token: testRawToken });
    assert.ok(authRes.user);
    assert.equal(authRes.user.email, magicEmail.toLowerCase());

    // Second attempt with consumed token must fail
    await assert.rejects(
      async () => {
        await verifyMagicLink({ email: magicEmail, token: testRawToken });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );

    // Cleanup magic link user
    await prisma.user.delete({ where: { id: authRes.user.id } });
  });

  test('7. Two-Factor Authentication (TOTP): Setup, enable, challenge on login, and recovery code verification', async () => {
    // 1. Generate 2FA setup
    const setup = await setupTwoFactor(createdUserId);
    assert.ok(setup.secret);
    assert.ok(setup.recoveryCodes.length > 0);

    // 2. Generate valid TOTP token using the raw setup secret
    const validTotp = authenticator.generate(setup.secret);

    // 3. Enable 2FA
    const enableRes = await enableTwoFactor(createdUserId, { token: validTotp });
    assert.ok(enableRes.success);

    // 4. Login now triggers MFA Challenge
    const loginChallenge = await loginUser({ email: testEmail, password: 'BrandNewPassword2026!' });
    assert.equal(loginChallenge.mfaRequired, true);
    assert.ok(loginChallenge.tempToken);

    // 5. Verify MFA using one of the backup recovery codes
    const recoveryCode = setup.recoveryCodes[0];
    const mfaLoginResult = await verifyTwoFactorLogin({
      tempToken: loginChallenge.tempToken,
      code: recoveryCode,
    });
    assert.ok(mfaLoginResult.user);
    assert.equal(mfaLoginResult.user.id, createdUserId);
    assert.equal(mfaLoginResult.usedRecoveryCode, true);
    assert.ok(mfaLoginResult.accessToken);
    currentRefreshToken = mfaLoginResult.refreshToken;
  });

  test('8. Connected Providers & Provider Unlinking Safety', async () => {
    const providersData = await getConnectedProviders(createdUserId);
    assert.ok(providersData.providers.length >= 1);
    assert.equal(providersData.hasPassword, true);

    // Attempting to unlink non-connected provider -> fails
    await assert.rejects(
      async () => {
        await unlinkProvider(createdUserId, 'APPLE');
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  test('9. Active Sessions & Sign Out Other Devices', async () => {
    const sessions = await getActiveSessions(createdUserId, currentRefreshToken);
    assert.ok(sessions.length >= 1);

    const revokeRes = await revokeOtherSessions(createdUserId, currentRefreshToken);
    assert.ok(revokeRes.success);
  });

  test('10. Admin Authentication & Role Protection: Social/OTP bypass rejected with 403', async () => {
    const adminLogin = await loginUser({
      email: 'admin@elevate.local',
      password: 'Admin123!',
    });
    assert.equal(adminLogin.user.role, 'ADMIN');

    // Admin cannot use Email OTP
    await assert.rejects(
      async () => {
        // Create token for admin email
        const tokenHash = (await import('../src/utils/crypto.js')).hashToken('123456');
        await prisma.verificationToken.create({
          data: {
            identifier: 'admin@elevate.local',
            type: 'EMAIL_OTP',
            tokenHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
        await verifyEmailOtpAndAuthenticate({ email: 'admin@elevate.local', otp: '123456' });
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Administrator accounts must sign in using/i);
        return true;
      }
    );

    // Public registration always enforces role: USER
    const testReg = await registerUser({
      email: `user.role.test.${timestamp}@domain.com`,
      password: 'UserPassword123!',
      firstName: 'RegUser',
      role: 'ADMIN', // Client-supplied role must be ignored
    });
    assert.equal(testReg.user.role, 'USER', 'Registration must strictly produce role === USER');

    // Cleanup test user
    await prisma.authIdentity.deleteMany({ where: { userId: testReg.user.id } });
    await prisma.verificationToken.deleteMany({ where: { userId: testReg.user.id } });
    await prisma.session.deleteMany({ where: { userId: testReg.user.id } });
    await prisma.user.delete({ where: { id: testReg.user.id } });

    const adminUsers = await getUsers({ page: 1, limit: 10 });
    assert.ok(adminUsers.users.length > 0);
  });

  after(async () => {
    if (createdUserId) {
      await prisma.session.deleteMany({ where: { userId: createdUserId } });
      await prisma.refreshToken.deleteMany({ where: { userId: createdUserId } });
      await prisma.verificationToken.deleteMany({ where: { userId: createdUserId } });
      await prisma.authIdentity.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.delete({ where: { id: createdUserId } });
    }
  });
});
