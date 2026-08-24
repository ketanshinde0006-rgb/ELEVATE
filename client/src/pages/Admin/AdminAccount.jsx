import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  LogOut,
  ScrollText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import './AdminShell.css';

export function AdminAccount() {
  const { user, updateUser, changePassword } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Security data
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2FA Setup Flow State
  const [mfaSetupData, setMfaSetupData] = useState(null); // { secret, otpauthUri, qrCodeDataUrl, recoveryCodes }
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaDisableCode, setMfaDisableCode] = useState('');
  const [mfaDisabling, setMfaDisabling] = useState(false);

  const fetchAccountSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, auditRes] = await Promise.all([
        api.auth.getSessions().catch(() => ({ data: [] })),
        api.admin.auditLog({ limit: 6 }).catch(() => ({ data: { logs: [] } })),
      ]);
      setSessions(sessionsRes.data || []);
      setAuditLogs(auditRes.data?.logs || auditRes.data || []);
    } catch (err) {
      console.error('Error fetching admin security data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountSecurityData();
  }, [fetchAccountSecurityData]);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard?.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setStatusMessage({ type: '', text: '' });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      setStatusMessage({ type: 'error', text: 'Current password is required' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStatusMessage({ type: 'success', text: res.message || 'Administrator password updated successfully' });
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update administrator password' });
    } finally {
      setSaving(false);
    }
  };

  // 2FA Setup
  const handleStartMfaSetup = async () => {
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await api.auth.mfaSetup();
      setMfaSetupData(res.data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to generate 2FA setup' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmEnableMfa = async (e) => {
    e.preventDefault();
    if (!mfaVerifyCode.trim()) return;

    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await api.auth.mfaEnable({ token: mfaVerifyCode.trim() });
      setMfaSetupData(null);
      setMfaVerifyCode('');
      setStatusMessage({ type: 'success', text: res.message || 'Two-Factor Authentication is now active on your administrator account!' });
      await updateUser({});
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Invalid authenticator code' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await api.auth.mfaDisable({ code: mfaDisableCode.trim() });
      setMfaDisabling(false);
      setMfaDisableCode('');
      setStatusMessage({ type: 'success', text: res.message || 'Two-Factor Authentication disabled' });
      await updateUser({});
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disable 2FA' });
    } finally {
      setSaving(false);
    }
  };

  // Session Management
  const handleRevokeOtherSessions = async () => {
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const refreshToken = localStorage.getItem('elevate_refresh_token');
      const res = await api.auth.revokeOtherSessions({ refreshToken });
      setStatusMessage({ type: 'success', text: res.message || 'All other active administrator sessions have been signed out.' });
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to revoke other sessions' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId) => {
    setSaving(true);
    try {
      await api.auth.revokeSession(sessionId);
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to revoke session' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Administrator Account & Security</h1>
          <p className="admin-module__subtitle">Manage your operator credentials, multi-factor authentication, active sessions, and security trail</p>
        </div>
        <button className="admin-btn admin-btn--secondary" onClick={fetchAccountSecurityData} disabled={saving}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {statusMessage.text && (
        <div
          className={`admin-alert ${statusMessage.type === 'error' ? 'admin-alert--error' : 'admin-alert--success'}`}
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: 'var(--space-6)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: statusMessage.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
            color: statusMessage.type === 'error' ? '#ef4444' : '#22c55e',
          }}
        >
          {statusMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. Administrator Identity Card */}
      <div className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">
            <UserCheck size={18} style={{ color: 'var(--color-accent-primary)' }} />
            Administrator Identity
          </h2>
          <span className="admin-badge admin-badge--gold">ROLE: ADMINISTRATOR</span>
        </div>
        <div className="admin-panel__body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
            background: 'var(--color-bg-secondary)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-light)',
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Permanent Admin UUID</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '4px' }}>
                <code style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
                  {user?.id ? `${user.id.slice(0, 12)}...${user.id.slice(-6)}` : '—'}
                </code>
                <button
                  type="button"
                  onClick={handleCopyId}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent-primary)', padding: 2 }}
                  title="Copy Full UUID"
                >
                  {copiedId ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrator Name</span>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {user?.firstName} {user?.lastName}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Operator Email</span>
              <div style={{ fontSize: '13.5px', color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {user?.email}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Provisioned</span>
              <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* 2. Password Security */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Lock size={18} style={{ color: 'var(--color-accent-primary)' }} />
              Change Administrator Password
            </h2>
          </div>
          <div className="admin-panel__body">
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Password must be at least 8 characters and is hashed with bcrypt (12 rounds).
            </p>

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border-light)',
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password (min 8 chars)"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border-light)',
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border-light)',
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <button type="submit" className="admin-btn admin-btn--primary" disabled={saving} style={{ marginTop: 'var(--space-2)' }}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* 3. Two-Factor Authentication (2FA) */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Shield size={18} style={{ color: 'var(--color-accent-primary)' }} />
              Two-Factor Authentication (TOTP)
            </h2>
            {user?.twoFactorEnabled && (
              <span className="admin-badge admin-badge--green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> 2FA Active
              </span>
            )}
          </div>
          <div className="admin-panel__body">
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Protect platform administrative access with time-based one-time passwords (RFC 6238).
            </p>

            {user?.twoFactorEnabled ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'rgba(34, 197, 94, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  marginBottom: 16,
                }}>
                  <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-primary)' }}>MFA Verification Required on Login</strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Secret is encrypted with AES-256-GCM at rest in MySQL.</span>
                  </div>
                </div>

                {!mfaDisabling ? (
                  <button className="admin-btn admin-btn--secondary" onClick={() => setMfaDisabling(true)}>
                    Disable 2FA
                  </button>
                ) : (
                  <form onSubmit={handleDisableMfa} style={{ maxWidth: 320 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>Enter Current 2FA Code or Password</label>
                    <input
                      placeholder="6-digit code or account password"
                      value={mfaDisableCode}
                      onChange={(e) => setMfaDisableCode(e.target.value)}
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border-light)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        marginBottom: 8,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="admin-btn admin-btn--danger" disabled={saving}>
                        Confirm Disable
                      </button>
                      <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setMfaDisabling(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div>
                {!mfaSetupData ? (
                  <button className="admin-btn admin-btn--primary" onClick={handleStartMfaSetup} disabled={saving}>
                    <QrCode size={14} /> Set Up 2FA for Administrator
                  </button>
                ) : (
                  <div style={{ background: 'var(--color-bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
                    <h4 style={{ fontSize: '13px', marginBottom: 8 }}>Scan QR Code with Authenticator App</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                      {mfaSetupData.qrCodeDataUrl && (
                        <img
                          src={mfaSetupData.qrCodeDataUrl}
                          alt="2FA QR Code"
                          style={{ width: 130, height: 130, borderRadius: 6, border: '1px solid #E8E6DF' }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Manual Setup Key</span>
                        <code style={{ display: 'block', fontSize: '12px', background: '#FFFFFF', padding: '6px 10px', borderRadius: 4, margin: '2px 0 8px', border: '1px solid var(--color-border-light)', wordBreak: 'break-all' }}>
                          {mfaSetupData.secret}
                        </code>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>One-Time Backup Recovery Codes</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, background: '#FFFFFF', padding: 6, borderRadius: 4, border: '1px solid var(--color-border-light)', fontFamily: 'monospace', fontSize: '10px' }}>
                          {mfaSetupData.recoveryCodes?.map((c, idx) => <span key={idx}>{c}</span>)}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleConfirmEnableMfa} style={{ maxWidth: 300 }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: 4 }}>Enter 6-digit code from app to activate:</label>
                      <input
                        placeholder="123456"
                        value={mfaVerifyCode}
                        onChange={(e) => setMfaVerifyCode(e.target.value)}
                        required
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          textAlign: 'center',
                          letterSpacing: '0.2em',
                          fontWeight: 600,
                          fontSize: '16px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border-light)',
                          background: 'var(--color-bg-primary)',
                          marginBottom: 8,
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                          Verify & Enable
                        </button>
                        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setMfaSetupData(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Active Sessions */}
      <div className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Laptop size={18} style={{ color: 'var(--color-accent-primary)' }} />
            <h2 className="admin-panel__title">Active Administrator Sessions</h2>
          </div>
          <button className="admin-btn admin-btn--secondary" onClick={handleRevokeOtherSessions} disabled={saving} style={{ fontSize: '11px', padding: '4px 10px' }}>
            Sign Out Other Sessions
          </button>
        </div>
        <div className="admin-panel__body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((sess) => (
              <div
                key={sess.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: sess.isCurrent ? 'rgba(197, 168, 128, 0.08)' : 'var(--color-bg-secondary)',
                  borderRadius: '6px',
                  border: sess.isCurrent ? '1px solid rgba(197, 168, 128, 0.3)' : '1px solid var(--color-border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {sess.device === 'Mobile' ? <Smartphone size={18} /> : <Laptop size={18} />}
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>
                      {sess.browser} on {sess.os} {sess.isCurrent && '— This Session'}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      IP Address: {sess.ipAddress} • Last Active: {new Date(sess.lastActiveAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div>
                  {sess.isCurrent ? (
                    <span className="admin-badge admin-badge--gold">CURRENT SESSION</span>
                  ) : (
                    <button
                      className="admin-action-btn"
                      onClick={() => handleRevokeSingleSession(sess.id)}
                      style={{ color: '#ef4444', fontSize: '11px' }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Recent Admin Security Trail */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScrollText size={18} style={{ color: 'var(--color-accent-primary)' }} />
            <h2 className="admin-panel__title">Recent Administrator Security Events</h2>
          </div>
        </div>
        <div className="admin-panel__body">
          {auditLogs.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', margin: 0 }}>No administrative audit events recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 6,
                    borderBottom: '1px solid var(--color-border-light)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="admin-badge admin-badge--gold" style={{ fontSize: '10px' }}>{log.action}</span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{log.entity}: {log.details || 'Action logged'}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAccount;
