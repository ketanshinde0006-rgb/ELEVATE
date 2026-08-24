import { X, Shield, KeyRound } from 'lucide-react';
import './GoogleAuthModal.css';

/* Apple Logo SVG */
const AppleLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.76 1.04-1.82.93-2.87-.9.04-2 .6-2.64 1.36-.56.65-1.06 1.73-.93 2.76 1.01.08 2.02-.49 2.64-1.25z" />
  </svg>
);

export function AppleAuthModal({ isOpen, onClose, onCredentialResponse }) {
  const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;

  if (!isOpen) return null;

  return (
    <div className="google-modal-overlay" onClick={onClose}>
      <div className="google-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="google-modal-header">
          <div className="google-modal-brand" style={{ gap: 10 }}>
            <AppleLogo size={22} />
            <span className="google-modal-brand-text">Sign in with Apple</span>
          </div>
          <button className="google-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="google-modal-body">
          <h2 className="google-modal-title">Sign in with Apple ID</h2>
          <p className="google-modal-subtitle">
            to securely continue to <span className="google-modal-app-name">ELEVATE</span>
          </p>

          {appleClientId ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0', gap: 16 }}>
              <button
                type="button"
                className="auth-social-btn"
                style={{ background: '#000000', color: '#FFFFFF', borderColor: '#000000' }}
                onClick={() => {
                  if (window.AppleID) {
                    window.AppleID.auth.signIn().then(onCredentialResponse);
                  }
                }}
              >
                <AppleLogo size={18} />
                <span>Continue with Apple</span>
              </button>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Use your Apple ID to sign in with Touch ID, Face ID, or your Apple password.
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
                <span>IMPLEMENTED — APPLE CREDENTIALS REQUIRED</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Sign in with Apple server token verification and identity mapping are fully implemented. To enable live Sign in with Apple for your organization, configure:
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
                VITE_APPLE_CLIENT_ID=com.elevate.web{'\n'}
                APPLE_CLIENT_ID=com.elevate.web{'\n'}
                APPLE_TEAM_ID=your-team-id{'\n'}
                APPLE_KEY_ID=your-key-id
              </pre>
            </div>
          )}

          <div className="google-modal-footer">
            <Shield size={13} className="google-footer-shield" />
            <span>
              Apple authentication validates cryptographically signed JWT identity tokens server-side.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppleAuthModal;
