import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone } from 'lucide-react';
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

function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
  const [countryCode, setCountryCode] = useState('+1');
  const [form, setForm] = useState({ email: '', phone: '', password: '', otp: '' });
  const [phoneLoginType, setPhoneLoginType] = useState('password'); // 'password' | 'otp'
  const [otpSent, setOtpSent] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const validate = () => {
    const errs = {};
    if (authMethod === 'email') {
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
      if (!form.password) errs.password = 'Password is required';
    } else {
      if (!form.phone.trim()) errs.phone = 'Mobile number is required';
      else if (form.phone.replace(/[^0-9]/g, '').length < 7) errs.phone = 'Enter a valid mobile number';
      
      if (phoneLoginType === 'password') {
        if (!form.password) errs.password = 'Password is required';
      } else {
        if (otpSent && (!form.otp || form.otp.trim().length !== 6)) {
          errs.otp = 'Enter 6-digit OTP code';
        }
      }
    }
    return errs;
  };

  const handleSendLoginOtp = async () => {
    if (!form.phone.trim()) {
      setErrors({ phone: 'Mobile number is required' });
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      const fullPhone = getFullPhoneNumber();
      await api.auth.sendOtp({ phone: fullPhone });
      setOtpSent(true);
    } catch (err) {
      setServerError(err.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    setServerError('');

    try {
      if (authMethod === 'email') {
        await login(form.email.trim(), form.password);
      } else {
        const fullPhone = getFullPhoneNumber();
        if (phoneLoginType === 'password') {
          await login(fullPhone, form.password);
        } else {
          // Verify login with OTP
          await api.auth.verifyOtp({ phone: fullPhone, otp: form.otp, password: 'PhoneUser123!', firstName: 'Member', lastName: '' });
          await login(fullPhone, 'PhoneUser123!');
        }
      }
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.message || 'Login failed. Please check your credentials.');
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
      setServerError(error.message || 'Google sign in failed.');
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
          <p className="auth-card__subtitle">Sign in to continue your journey</p>
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
          <span>or sign in with</span>
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

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          {authMethod === 'email' ? (
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
          ) : (
            <div className="input-group">
              <label className="input-group__label">Mobile Number</label>
              <div className="auth-phone-input-wrap">
                <select
                  className="auth-country-select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
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
                  required
                />
              </div>
              {errors.phone && <span className="input-group__error">{errors.phone}</span>}
            </div>
          )}

          {/* Password field or OTP section for Mobile */}
          {authMethod === 'email' || phoneLoginType === 'password' ? (
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
              suffix={
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              }
            />
          ) : (
            otpSent && (
              <div className="auth-otp-box">
                <div className="auth-otp-header">
                  <span className="auth-otp-title">Enter 6-Digit Code</span>
                  <span className="auth-otp-badge">SMS Sent</span>
                </div>
                <Input
                  name="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={form.otp}
                  onChange={handleChange}
                  error={errors.otp}
                  required
                />
                <div className="auth-otp-actions">
                  <button type="button" className="auth-resend-btn" onClick={handleSendLoginOtp}>
                    Resend Code
                  </button>
                  <button type="button" className="auth-resend-btn" onClick={() => setPhoneLoginType('password')}>
                    Use Password instead
                  </button>
                </div>
              </div>
            )
          )}

          {/* Additional Options */}
          <div className="auth-card__options">
            <label className="checkbox-group">
              <input type="checkbox" defaultChecked />
              <span className="checkbox-group__label">Remember me</span>
            </label>
            {authMethod === 'phone' && (
              <button
                type="button"
                className="auth-card__link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => {
                  if (phoneLoginType === 'password') {
                    setPhoneLoginType('otp');
                    handleSendLoginOtp();
                  } else {
                    setPhoneLoginType('password');
                  }
                }}
              >
                {phoneLoginType === 'password' ? 'Sign in with OTP' : 'Sign in with Password'}
              </button>
            )}
          </div>

          {authMethod === 'phone' && phoneLoginType === 'otp' && !otpSent ? (
            <Button type="button" variant="primary" size="lg" fullWidth onClick={handleSendLoginOtp} loading={loading}>
              Send Login Code
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Sign In
            </Button>
          )}
        </form>

        <p className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-card__link">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
