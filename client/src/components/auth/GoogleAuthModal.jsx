import { useState } from 'react';
import { User, Plus, X, ArrowRight, Shield } from 'lucide-react';
import './GoogleAuthModal.css';

/* Google Multi-color G Logo */
const GoogleLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
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

const PRESET_ACCOUNTS = [
  {
    id: '1',
    name: 'Alex Rivers',
    email: 'alex.rivers@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
    color: '#4285F4',
  },
  {
    id: '2',
    name: 'Ketan Dave',
    email: 'ketan.dave@gmail.com',
    avatar: null,
    color: '#34A853',
  },
];

export function GoogleAuthModal({ isOpen, onClose, onSelectAccount }) {
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  if (!isOpen) return null;

  const handleSelect = (account) => {
    setSelectedId(account.id || 'custom');
    setTimeout(() => {
      onSelectAccount({
        email: account.email,
        firstName: account.name.split(' ')[0] || 'User',
        lastName: account.name.split(' ').slice(1).join(' ') || '',
        avatar: account.avatar || null,
      });
    }, 450);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim() || !/\S+@\S+\.\S+/.test(customEmail)) {
      setError('Enter a valid Google email address');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    handleSelect({
      id: 'custom',
      name,
      email: customEmail.trim(),
      avatar: null,
    });
  };

  return (
    <div className="google-modal-overlay" onClick={onClose}>
      <div className="google-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="google-modal-header">
          <div className="google-modal-brand">
            <GoogleLogo size={24} />
            <span className="google-modal-brand-text">Sign in with Google</span>
          </div>
          <button className="google-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="google-modal-body">
          <h2 className="google-modal-title">Choose an account</h2>
          <p className="google-modal-subtitle">
            to continue to <span className="google-modal-app-name">ELEVATE</span>
          </p>

          {!customMode ? (
            <div className="google-accounts-list">
              {PRESET_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className={`google-account-item ${selectedId === acc.id ? 'google-account-item--loading' : ''}`}
                  onClick={() => handleSelect(acc)}
                  disabled={selectedId !== null}
                >
                  <div className="google-account-avatar">
                    {acc.avatar ? (
                      <img src={acc.avatar} alt={acc.name} />
                    ) : (
                      <div className="google-account-initial" style={{ background: acc.color }}>
                        {acc.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="google-account-info">
                    <span className="google-account-name">{acc.name}</span>
                    <span className="google-account-email">{acc.email}</span>
                  </div>
                  {selectedId === acc.id ? (
                    <div className="google-spinner" />
                  ) : (
                    <ArrowRight size={16} className="google-account-arrow" />
                  )}
                </button>
              ))}

              {/* Use another account */}
              <button
                type="button"
                className="google-account-item google-account-item--add"
                onClick={() => setCustomMode(true)}
                disabled={selectedId !== null}
              >
                <div className="google-account-avatar google-account-avatar--icon">
                  <Plus size={18} />
                </div>
                <div className="google-account-info">
                  <span className="google-account-name">Use another account</span>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="google-custom-form">
              {error && <div className="google-form-error">{error}</div>}
              <div className="google-input-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Lee"
                  value={customName}
                  onChange={(e) => { setCustomName(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>
              <div className="google-input-group">
                <label>Google Email address</label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={customEmail}
                  onChange={(e) => { setCustomEmail(e.target.value); setError(''); }}
                  required
                />
              </div>
              <div className="google-custom-actions">
                <button
                  type="button"
                  className="google-btn-secondary"
                  onClick={() => setCustomMode(false)}
                >
                  Back to accounts
                </button>
                <button type="submit" className="google-btn-primary" disabled={selectedId !== null}>
                  {selectedId === 'custom' ? 'Signing in...' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {/* Footer Security Notice */}
          <div className="google-modal-footer">
            <Shield size={13} className="google-footer-shield" />
            <span>
              To continue, Google will securely share your name, email address, and profile photo with ELEVATE.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default GoogleAuthModal;
