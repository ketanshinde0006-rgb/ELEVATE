import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone, Sparkles, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GoogleAuthModal from '../../components/auth/GoogleAuthModal';
import AppleAuthModal from '../../components/auth/AppleAuthModal';
import MicrosoftAuthModal from '../../components/auth/MicrosoftAuthModal';
import MfaLoginModal from '../../components/auth/MfaLoginModal';
import './Auth.css';

/* Google "G" SVG Logo */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.76 1.04-1.82.93-2.87-.9.04-2 .6-2.64 1.36-.56.65-1.06 1.73-.93 2.76 1.01.08 2.02-.49 2.64-1.25z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="17" height="17" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'US (+1)' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'IN (+91)' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'UK (+44)' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'AU (+61)' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'DE (+49)' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'FR (+33)' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE (+971)' },
];

function LoginPage() {
  const navigate = useNavigate();
  const {
    login,
    verifyMfa,
    loginWithGoogle,
    loginWithApple,
    loginWithMicrosoft,
    loginWithPhoneVerify,
    loginWithEmailOtpVerify,
    loginWithMagicLinkVerify,
  } = useAuth();

  // Mode: 'password' | 'phone' | 'email_otp' | 'magic_link'
  const [authMode, setAuthMode] = useState('password');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // MFA Challenge State
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [tempMfaToken, setTempMfaToken] = useState(null);

  // Modals for Socials
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [appleModalOpen, setAppleModalOpen] = useState(false);
  const [microsoftModalOpen, setMicrosoftModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleMfaOrNavigate = (res) => {
    if (res?.mfaRequired) {
      setTempMfaToken(res.tempToken);
      setMfaModalOpen(true);
    } else {
      const userRole = res?.role || res?.user?.role;
      if (userRole === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  // 1. Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setServerMessage({ type: '', text: '' });

    try {
      const res = await login(email.trim(), password);
      handleMfaOrNavigate(res);
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Login failed. Please check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Mobile SMS OTP Login
  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    const fullPhone = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
    setLoading(true);
    setServerMessage({ type: '', text: '' });

    try {
      const res = await api.auth.phoneSendOtp({ phone: fullPhone });
      setOtpSent(true);
      setServerMessage({ type: 'info', text: res.data?.message || 'Verification code dispatched via SMS.' });
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Failed to dispatch SMS verification code.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    const fullPhone = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
    setLoading(true);
    setServerMessage({ type: '', text: '' });

    try {
      const res = await loginWithPhoneVerify({ phone: fullPhone, code: otpCode });
      handleMfaOrNavigate(res);
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Invalid verification code.' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Email OTP Login
  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerMessage({ type: '', text: '' });

    try {
      const res = await api.auth.emailOtpSend({ email: email.trim() });
      setOtpSent(true);
      setServerMessage({ type: 'info', text: res.data?.message || 'A 6-digit login code has been sent to your email.' });
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Failed to send login code.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerMessage({ type: '', text: '' });

    try {
      const res = await loginWithEmailOtpVerify({ email: email.trim(), otp: otpCode });
      handleMfaOrNavigate(res);
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Invalid or expired login code.' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Magic Link Login
  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerMessage({ type: '', text: '' });

    try {
      const res = await api.auth.magicLinkSend({ email: email.trim() });
      setServerMessage({ type: 'info', text: res.data?.message || 'Magic Link dispatched! Check your email to sign in.' });
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Failed to send Magic Link.' });
    } finally {
      setLoading(false);
    }
  };

  // Social Handlers
  const handleGoogleCredential = async (credential) => {
    setLoading(true);
    setGoogleModalOpen(false);
    try {
      const res = await loginWithGoogle({ credential });
      handleMfaOrNavigate(res);
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Google authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAppleCredential = async (payload) => {
    setLoading(true);
    setAppleModalOpen(false);
    try {
      const res = await loginWithApple(payload);
      handleMfaOrNavigate(res);
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Apple authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftCredential = async (payload) => {
    setLoading(true);
    setMicrosoftModalOpen(false);
    try {
      const res = await loginWithMicrosoft(payload);
      handleMfaOrNavigate(res);
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Microsoft authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSuccess = async ({ tempToken, code }) => {
    const res = await verifyMfa({ tempToken, code });
    setMfaModalOpen(false);
    if (res?.role === 'ADMIN' || res?.user?.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      {/* Modals */}
      <GoogleAuthModal isOpen={googleModalOpen} onClose={() => setGoogleModalOpen(false)} onCredentialResponse={handleGoogleCredential} />
      <AppleAuthModal isOpen={appleModalOpen} onClose={() => setAppleModalOpen(false)} onCredentialResponse={handleAppleCredential} />
      <MicrosoftAuthModal isOpen={microsoftModalOpen} onClose={() => setMicrosoftModalOpen(false)} onCredentialResponse={handleMicrosoftCredential} />
      <MfaLoginModal isOpen={mfaModalOpen} tempToken={tempMfaToken} onClose={() => setMfaModalOpen(false)} onVerifySuccess={handleMfaSuccess} />

      <div className="auth-card animate-fade-in-up">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo" aria-label="ELEVATE Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" fill="#C5A880" />
              <circle cx="12" cy="12" r="1.5" fill="#161514" />
            </svg>
            <span>E L E V A T E</span>
          </Link>
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Sign in to your personal sanctuary</p>
        </div>

        {serverMessage.text && (
          <div
            className={`alert ${serverMessage.type === 'error' ? 'alert--error' : 'alert--info'}`}
            style={{ marginBottom: 20, fontSize: '13px', lineHeight: 1.5 }}
          >
            {serverMessage.text}
          </div>
        )}

        {/* Social Authentication Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className="auth-social-btn"
            onClick={() => setGoogleModalOpen(true)}
            disabled={loading}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => setAppleModalOpen(true)}
              disabled={loading}
              style={{ fontSize: '13px', padding: '0 8px' }}
            >
              <AppleIcon />
              <span>Apple</span>
            </button>
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => setMicrosoftModalOpen(true)}
              disabled={loading}
              style={{ fontSize: '13px', padding: '0 8px' }}
            >
              <MicrosoftIcon />
              <span>Microsoft</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or sign in with</span>
        </div>

        {/* Auth Method Navigation */}
        <div className="auth-method-tabs" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`auth-method-tab ${authMode === 'password' ? 'auth-method-tab--active' : ''}`}
            onClick={() => { setAuthMode('password'); setOtpSent(false); setServerMessage({ type: '', text: '' }); }}
          >
            Password
          </button>
          <button
            type="button"
            className={`auth-method-tab ${authMode === 'phone' ? 'auth-method-tab--active' : ''}`}
            onClick={() => { setAuthMode('phone'); setOtpSent(false); setServerMessage({ type: '', text: '' }); }}
          >
            Mobile SMS
          </button>
          <button
            type="button"
            className={`auth-method-tab ${authMode === 'email_otp' ? 'auth-method-tab--active' : ''}`}
            onClick={() => { setAuthMode('email_otp'); setOtpSent(false); setServerMessage({ type: '', text: '' }); }}
          >
            Email Code
          </button>
          <button
            type="button"
            className={`auth-method-tab ${authMode === 'magic_link' ? 'auth-method-tab--active' : ''}`}
            onClick={() => { setAuthMode('magic_link'); setOtpSent(false); setServerMessage({ type: '', text: '' }); }}
          >
            Magic Link
          </button>
        </div>

        {/* Mode 1: Email + Password */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="auth-form">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--color-accent-primary)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" style={{ width: '100%' }} loading={loading}>
              Sign In
            </Button>
          </form>
        )}

        {/* Mode 2: Mobile SMS OTP */}
        {authMode === 'phone' && (
          <form onSubmit={otpSent ? handleVerifyPhoneOtp : handleSendPhoneOtp} className="auth-form">
            <div className="auth-phone-row" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ width: '110px' }}>
                <label className="input__label">Country</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={otpSent}
                  className="input__field"
                  style={{ height: '42px', padding: '0 8px' }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="555 0199"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={otpSent}
                  required
                  autoFocus
                />
              </div>
            </div>

            {otpSent && (
              <div style={{ marginBottom: 16 }}>
                <Input
                  label="6-Digit SMS Verification Code"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  autoFocus
                  style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '18px', fontWeight: 600 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Change phone number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Resend SMS
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" style={{ width: '100%' }} loading={loading}>
              {otpSent ? 'Verify Code & Sign In' : 'Send Verification Code via SMS'}
            </Button>
          </form>
        )}

        {/* Mode 3: Email OTP Login */}
        {authMode === 'email_otp' && (
          <form onSubmit={otpSent ? handleVerifyEmailOtp : handleSendEmailOtp} className="auth-form">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent}
              required
              autoFocus
            />

            {otpSent && (
              <div style={{ marginBottom: 16 }}>
                <Input
                  label="6-Digit Email Code"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  autoFocus
                  style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '18px', fontWeight: 600 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" style={{ width: '100%' }} loading={loading}>
              {otpSent ? 'Verify Code & Sign In' : 'Email Me a Login Code'}
            </Button>
          </form>
        )}

        {/* Mode 4: Magic Link Login */}
        {authMode === 'magic_link' && (
          <form onSubmit={handleSendMagicLink} className="auth-form">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              hint="We will email you a secure link that logs you in instantly."
            />

            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: 8 }} loading={loading}>
              Send Magic Link
            </Button>
          </form>
        )}

        <div className="auth-card__footer" style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-text-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
