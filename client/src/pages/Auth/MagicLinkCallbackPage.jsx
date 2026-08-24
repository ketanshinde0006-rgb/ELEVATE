import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MfaLoginModal from '../../components/auth/MfaLoginModal';
import './Auth.css';

export function MagicLinkCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const { loginWithMagicLinkVerify, verifyMfa } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [tempMfaToken, setTempMfaToken] = useState(null);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or expired Magic Link parameters.');
      setLoading(false);
      return;
    }

    const authenticate = async () => {
      try {
        const res = await loginWithMagicLinkVerify({ token, email });
        if (res?.mfaRequired) {
          setTempMfaToken(res.tempToken);
          setMfaModalOpen(true);
        } else {
          const userRole = res?.role || res?.user?.role;
          navigate(userRole === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
        }
      } catch (err) {
        setError(err.message || 'Magic Link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, [token, email, loginWithMagicLinkVerify, navigate]);

  const handleMfaSuccess = async ({ tempToken, code }) => {
    const res = await verifyMfa({ tempToken, code });
    setMfaModalOpen(false);
    const userRole = res?.role || res?.user?.role;
    navigate(userRole === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
  };

  return (
    <div className="auth-page">
      <MfaLoginModal
        isOpen={mfaModalOpen}
        tempToken={tempMfaToken}
        onClose={() => setMfaModalOpen(false)}
        onVerifySuccess={handleMfaSuccess}
      />

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
            <h3>Authenticating Magic Link...</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Signing you in to ELEVATE securely.</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '16px 0' }}>
            <AlertCircle size={44} style={{ color: 'var(--color-error)', margin: '0 auto 16px' }} />
            <h2 className="auth-card__title" style={{ fontSize: '1.4rem' }}>Authentication Failed</h2>
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

export default MagicLinkCallbackPage;
