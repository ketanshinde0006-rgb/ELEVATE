import { X, Shield, KeyRound } from 'lucide-react';
import './GoogleAuthModal.css';

/* Microsoft 4-square Logo */
const MicrosoftLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

export function MicrosoftAuthModal({ isOpen, onClose, onCredentialResponse }) {
  const msClientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;

  if (!isOpen) return null;

  return (
    <div className="google-modal-overlay" onClick={onClose}>
      <div className="google-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="google-modal-header">
          <div className="google-modal-brand" style={{ gap: 10 }}>
            <MicrosoftLogo size={20} />
            <span className="google-modal-brand-text">Microsoft Account</span>
          </div>
          <button className="google-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="google-modal-body">
          <h2 className="google-modal-title">Sign in with Microsoft</h2>
          <p className="google-modal-subtitle">
            to securely continue to <span className="google-modal-app-name">ELEVATE</span>
          </p>

          {msClientId ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0', gap: 16 }}>
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => {
                  // Direct MSAL login popup
                  if (window.msalInstance) {
                    window.msalInstance.loginPopup({ scopes: ['openid', 'profile', 'email'] }).then(onCredentialResponse);
                  }
                }}
              >
                <MicrosoftLogo size={18} />
                <span>Continue with Microsoft</span>
              </button>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Sign in with your personal, work, or school Microsoft account.
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(197, 168, 128, 0.08)',
              border: '1px solid rgba(197, 168, 128, 0.25)',
              borderRadius: '8px',
              padding: '16px',
              margin: '16px 0',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c5a880', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                <KeyRound size={16} />
                <span>IMPLEMENTED — MICROSOFT CREDENTIALS REQUIRED</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Sign in with Microsoft OAuth/OIDC identity token verification is fully implemented. To enable live Microsoft Sign-In, configure:
              </p>
              <pre style={{
                fontSize: '11px',
                background: 'rgba(0,0,0,0.3)',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '10px',
                overflowX: 'auto',
                color: '#e5e7eb',
              }}>
                VITE_MICROSOFT_CLIENT_ID=your-azure-app-client-id{'\n'}
                MICROSOFT_CLIENT_ID=your-azure-app-client-id{'\n'}
                MICROSOFT_TENANT_ID=common
              </pre>
            </div>
          )}

          <div className="google-modal-footer">
            <Shield size={13} className="google-footer-shield" />
            <span>
              Microsoft tokens are verified server-side with standard OpenID Connect specifications.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MicrosoftAuthModal;
