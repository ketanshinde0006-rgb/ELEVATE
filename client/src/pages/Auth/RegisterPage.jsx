import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GoogleAuthModal from '../../components/auth/GoogleAuthModal';
import AppleAuthModal from '../../components/auth/AppleAuthModal';
import MicrosoftAuthModal from '../../components/auth/MicrosoftAuthModal';
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

function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, loginWithApple, loginWithMicrosoft } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [appleModalOpen, setAppleModalOpen] = useState(false);
  const [microsoftModalOpen, setMicrosoftModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerError('');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.password) return;

    if (form.password !== form.confirmPassword) {
      setServerError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setServerError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setLoading(true);
    setGoogleModalOpen(false);
    try {
      await loginWithGoogle({ credential });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Google signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleCredential = async (payload) => {
    setLoading(true);
    setAppleModalOpen(false);
    try {
      await loginWithApple(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Apple signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftCredential = async (payload) => {
    setLoading(true);
    setMicrosoftModalOpen(false);
    try {
      await loginWithMicrosoft(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Microsoft signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <GoogleAuthModal isOpen={googleModalOpen} onClose={() => setGoogleModalOpen(false)} onCredentialResponse={handleGoogleCredential} />
      <AppleAuthModal isOpen={appleModalOpen} onClose={() => setAppleModalOpen(false)} onCredentialResponse={handleAppleCredential} />
      <MicrosoftAuthModal isOpen={microsoftModalOpen} onClose={() => setMicrosoftModalOpen(false)} onCredentialResponse={handleMicrosoftCredential} />

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
          <p className="auth-card__subtitle">Join the modern sanctuary for personal mastery</p>
        </div>

        {serverError && (
          <div className="alert alert--error" style={{ marginBottom: 20, fontSize: '13px' }}>
            {serverError}
          </div>
        )}

        {/* Social Sign Up Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className="auth-social-btn"
            onClick={() => setGoogleModalOpen(true)}
            disabled={loading}
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
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

        <div className="auth-divider">
          <span>or create with email</span>
        </div>

        <form onSubmit={handleRegisterSubmit} className="auth-form">
          <div className="auth-card__row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="First Name"
              name="firstName"
              placeholder="e.g. Clara"
              value={form.firstName}
              onChange={handleChange}
              required
              autoFocus
            />
            <Input
              label="Last Name"
              name="lastName"
              placeholder="e.g. Daniels"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="Password (min 8 chars)"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: 8 }} loading={loading}>
            Create Account
          </Button>
        </form>

        <div className="auth-card__footer" style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-text-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
