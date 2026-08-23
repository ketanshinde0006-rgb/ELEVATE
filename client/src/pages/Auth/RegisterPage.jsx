import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GoogleAuthModal from '../../components/auth/GoogleAuthModal';
import './Auth.css';

/* Google "G" SVG Logo */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
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

function RegisterPage() {
  const navigate = useNavigate();
  const { register, verifyOtpAndRegister, loginWithGoogle } = useAuth();
  
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
  const [countryCode, setCountryCode] = useState('+1');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // 6 separate digit boxes for OTP
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = useRef([]);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (serverError) setServerError('');
  };

  const getFullPhoneNumber = () => {
    const raw = form.phone.trim().replace(/^0+/, '');
    if (raw.startsWith('+')) return raw;
    return `${countryCode}${raw}`;
  };

  // OTP Digits input handling with auto-advance and backspace
  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      // Pasted multi-digit string
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((char, idx) => {
        if (index + idx < 6) newDigits[index + idx] = char;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(index + pasted.length, 5);
      digitRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);
    if (errors.otp) setErrors({ ...errors, otp: '' });

    if (cleanVal && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const validateCommon = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreed) errs.agreed = 'You must accept the terms';
    return errs;
  };

  const validateEmailForm = () => {
    const errs = validateCommon();
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    return errs;
  };

  const validatePhoneForm = () => {
    const errs = validateCommon();
    if (!form.phone.trim()) errs.phone = 'Mobile number is required';
    else if (form.phone.replace(/[^0-9]/g, '').length < 7) errs.phone = 'Enter a valid mobile number';
    const currentOtp = digits.join('');
    if (otpSent && currentOtp.length !== 6) {
      errs.otp = 'Enter complete 6-digit verification code';
    }
    return errs;
  };

  // Step 1: Send OTP to Mobile Number
  const handleSendOtp = async () => {
    const errs = validateCommon();
    if (!form.phone.trim()) errs.phone = 'Mobile number is required';
    else if (form.phone.replace(/[^0-9]/g, '').length < 7) errs.phone = 'Enter a valid mobile number';

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      const fullPhone = getFullPhoneNumber();
      await api.auth.sendOtp({ phone: fullPhone });
      setOtpSent(true);
      setOtpCountdown(30);
      setTimeout(() => digitRefs.current[0]?.focus(), 150);
    } catch (err) {
      setServerError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Register
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    const errs = validatePhoneForm();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      const fullPhone = getFullPhoneNumber();
      const otpCode = digits.join('');
      await verifyOtpAndRegister({
        phone: fullPhone,
        otp: otpCode,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Email Registration
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const errs = validateEmailForm();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccountSelected = async (googleProfile) => {
    setServerError('');
    try {
      await loginWithGoogle(googleProfile);
      setGoogleModalOpen(false);
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.message || 'Google sign up failed.');
    }
  };

  return (
    <div className="auth-page">
      {/* Google OAuth Modal */}
      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSelectAccount={handleGoogleAccountSelected}
      />

      <div className="auth-card auth-card--wide animate-fade-in-up">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo" aria-label="ELEVATE Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" fill="#C5A880" />
              <circle cx="12" cy="12" r="1.5" fill="#161514" />
            </svg>
            <span>E L E V A T E</span>
          </Link>
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Start your personal development & style journey</p>
        </div>

        {/* 1. Google Continue Button */}
        <button
          type="button"
          className="auth-social-btn"
          onClick={() => setGoogleModalOpen(true)}
          disabled={loading}
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span>or create with</span>
        </div>

        {/* 2. Method Switcher Tabs */}
        <div className="auth-method-tabs">
          <button
            type="button"
            className={`auth-method-tab ${authMethod === 'email' ? 'auth-method-tab--active' : ''}`}
            onClick={() => { setAuthMethod('email'); setErrors({}); setServerError(''); }}
          >
            <Mail size={15} strokeWidth={1.8} />
            <span>Email</span>
          </button>
          <button
            type="button"
            className={`auth-method-tab ${authMethod === 'phone' ? 'auth-method-tab--active' : ''}`}
            onClick={() => { setAuthMethod('phone'); setErrors({}); setServerError(''); }}
          >
            <Phone size={15} strokeWidth={1.8} />
            <span>Mobile Number</span>
          </button>
        </div>

        {serverError && (
          <div className="auth-card__error" role="alert">
            {serverError}
          </div>
        )}

        <form className="auth-card__form" onSubmit={authMethod === 'email' ? handleEmailSubmit : handleVerifyOtpAndRegister} noValidate>
          <div className="auth-card__row">
            <Input label="First Name" name="firstName" placeholder="Alex" value={form.firstName} onChange={handleChange} error={errors.firstName} required />
            <Input label="Last Name" name="lastName" placeholder="Morgan" value={form.lastName} onChange={handleChange} error={errors.lastName} required />
          </div>

          {authMethod === 'email' ? (
            <Input label="Email Address" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} required />
          ) : (
            <div className="input-group">
              <label className="input-group__label">Mobile Number</label>
              <div className="auth-phone-input-wrap">
                <select
                  className="auth-country-select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={otpSent}
                  aria-label="Country Code"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.country} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  className={`input-group__input ${errors.phone ? 'input-group__input--error' : ''}`}
                  placeholder="555-0199 or 9876543210"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={otpSent}
                  required
                />
              </div>
              {errors.phone && <span className="input-group__error">{errors.phone}</span>}
            </div>
          )}

          <Input label="Password" name="password" type="password" placeholder="Min 8 characters" value={form.password} onChange={handleChange} error={errors.password} required hint="Use letters, numbers, and symbols" />
          <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />

          {/* OTP Verification Box for Mobile Method */}
          {authMethod === 'phone' && otpSent && (
            <div className="auth-otp-box">
              <div className="auth-otp-header">
                <span className="auth-otp-title">Enter 6-Digit Code</span>
                <span className="auth-otp-badge">SMS Sent</span>
              </div>
              <p className="auth-otp-helper">
                Verification code sent to <strong>{getFullPhoneNumber()}</strong>
              </p>

              {/* 6 Digit Input Grid */}
              <div className="auth-digits-grid">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (digitRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className={`auth-digit-box ${digit ? 'auth-digit-box--filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  />
                ))}
              </div>
              {errors.otp && <span className="input-group__error">{errors.otp}</span>}

              <div className="auth-otp-actions">
                <button
                  type="button"
                  className="auth-resend-btn"
                  onClick={handleSendOtp}
                  disabled={otpCountdown > 0 || loading}
                >
                  {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Resend Code'}
                </button>
                <button
                  type="button"
                  className="auth-resend-btn"
                  onClick={() => { setOtpSent(false); setDigits(['', '', '', '', '', '']); }}
                >
                  Change Number
                </button>
              </div>
            </div>
          )}

          <label className="checkbox-group">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span className="checkbox-group__label">
              I agree to the <Link to="/terms" className="auth-card__link">Terms of Service</Link> and <Link to="/privacy" className="auth-card__link">Privacy Policy</Link>
            </span>
          </label>
          {errors.agreed && <span className="input-group__error">{errors.agreed}</span>}

          {authMethod === 'phone' && !otpSent ? (
            <Button type="button" variant="primary" size="lg" fullWidth onClick={handleSendOtp} loading={loading}>
              Send Verification Code <ArrowRight size={16} style={{ marginLeft: 8 }} />
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {authMethod === 'phone' ? 'Verify & Create Account' : 'Create Account'}
            </Button>
          )}
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
