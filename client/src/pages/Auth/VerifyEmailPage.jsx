import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import './Auth.css';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing verification parameters.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        await api.auth.verifyEmail({ token, email });
        setSuccess(true);
      } catch (err) {
        setError(err.message || 'Verification link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, email]);

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-up" style={{ maxWidth: 440, textAlign: 'center' }}>
        <Link to="/" className="auth-card__logo" aria-label="ELEVATE Home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" fill="#C5A880" />
            <circle cx="12" cy="12" r="1.5" fill="#161514" />
          </svg>
          <span>E L E V A T E</span>
        </Link>

        {loading && (
          <div style={{ padding: '32px 0' }}>
            <Loader2 className="spinner" size={36} style={{ color: 'var(--color-accent-primary)', margin: '0 auto 16px' }} />
            <h3>Verifying Email Address...</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Please wait while we confirm your account.</p>
          </div>
        )}

        {!loading && success && (
          <div style={{ padding: '16px 0' }}>
            <CheckCircle2 size={44} style={{ color: 'var(--color-accent-primary)', margin: '0 auto 16px' }} />
            <h2 className="auth-card__title" style={{ fontSize: '1.4rem' }}>Email Verified!</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', lineHeight: 1.6, margin: '12px 0 24px' }}>
              Your email address <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong> has been verified successfully.
            </p>
            <Link to="/dashboard" className="btn btn--primary" style={{ width: '100%' }}>
              Go to Dashboard
            </Link>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '16px 0' }}>
            <AlertCircle size={44} style={{ color: 'var(--color-error)', margin: '0 auto 16px' }} />
            <h2 className="auth-card__title" style={{ fontSize: '1.4rem' }}>Verification Failed</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', lineHeight: 1.6, margin: '12px 0 24px' }}>
              {error}
            </p>
            <Link to="/login" className="btn btn--secondary" style={{ width: '100%' }}>
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
