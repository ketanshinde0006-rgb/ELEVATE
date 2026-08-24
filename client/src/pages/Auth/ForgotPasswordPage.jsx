import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Auth.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.auth.forgotPassword({ email: email.trim() });
      setMessage(res.message || 'If an account exists with this email, password reset instructions have been dispatched.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to dispatch password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-up" style={{ maxWidth: 440 }}>
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo" aria-label="ELEVATE Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" fill="#C5A880" />
              <circle cx="12" cy="12" r="1.5" fill="#161514" />
            </svg>
            <span>E L E V A T E</span>
          </Link>
          <h1 className="auth-card__title">Reset Password</h1>
          <p className="auth-card__subtitle">Enter your email to receive recovery instructions</p>
        </div>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: 16, fontSize: '13px' }}>
            {error}
          </div>
        )}

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--color-accent-primary)', marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8, fontSize: '1.1rem' }}>Check Your Email</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: 24 }}>
              {message}
            </p>
            <Link to="/login" className="btn btn--secondary" style={{ width: '100%' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              hint="We will email you a secure link to reset your account password."
            />

            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: 8 }} loading={loading}>
              Send Reset Link
            </Button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
