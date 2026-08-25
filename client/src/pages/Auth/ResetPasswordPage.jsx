import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Auth.css';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!token || !email.trim() || !newPassword) {
      setError('Invalid reset link or missing parameters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.auth.resetPassword({
        token,
        email: email.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may be expired.');
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
          <h1 className="auth-card__title">Choose New Password</h1>
          <p className="auth-card__subtitle">Create a secure new password for your account</p>
        </div>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: 16, fontSize: '13px' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={44} style={{ color: 'var(--color-accent-primary)', marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8, fontSize: '1.1rem' }}>Password Updated!</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: 24 }}>
              Your password has been changed successfully. You can now sign in with your new credentials.
            </p>
            <Link to="/login" className="btn btn--primary" style={{ width: '100%' }}>
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="auth-form">
            <Input
              label="Account Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!emailParam}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: 8 }} loading={loading}>
              Save New Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
