import { useState } from 'react';
import { ShieldCheck, KeyRound, X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export function MfaLoginModal({ isOpen, tempToken, onClose, onVerifySuccess }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError(useRecoveryCode ? 'Enter your recovery code' : 'Enter your 6-digit authenticator code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onVerifySuccess({ tempToken, code: code.trim() });
    } catch (err) {
      setError(err.message || 'Invalid 2FA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="google-modal-overlay" onClick={onClose}>
      <div className="google-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="google-modal-header">
          <div className="google-modal-brand">
            <ShieldCheck size={22} style={{ color: 'var(--color-accent-primary)' }} />
            <span className="google-modal-brand-text">Two-Factor Authentication</span>
          </div>
          <button className="google-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="google-modal-body">
          <h2 className="google-modal-title" style={{ fontSize: '1.3rem' }}>
            {useRecoveryCode ? 'Enter Backup Recovery Code' : 'Security Verification'}
          </h2>
          <p className="google-modal-subtitle" style={{ marginBottom: 20 }}>
            {useRecoveryCode
              ? 'Enter one of the 8-character backup codes you saved during 2FA setup.'
              : 'Enter the 6-digit verification code from your authenticator app (Google Authenticator, Microsoft Authenticator, or Apple Passwords).'}
          </p>

          {error && (
            <div className="alert alert--error" style={{ marginBottom: 16, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label={useRecoveryCode ? 'Recovery Code' : '6-Digit Authenticator Code'}
              placeholder={useRecoveryCode ? 'e.g. A3K9-8F2X' : '123456'}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              autoFocus
              required
              style={{
                textAlign: 'center',
                letterSpacing: useRecoveryCode ? '0.15em' : '0.25em',
                fontSize: '18px',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
            />

            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: 16 }} loading={loading}>
              Verify & Sign In
            </Button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => { setUseRecoveryCode(!useRecoveryCode); setCode(''); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent-primary)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {useRecoveryCode ? 'Use 6-digit authenticator code instead' : 'Lost access to your app? Use a recovery code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MfaLoginModal;
