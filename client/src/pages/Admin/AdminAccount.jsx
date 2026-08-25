import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
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
  User,
  Eye,
  EyeOff,
  Save,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import './AdminShell.css';

export function AdminAccount() {
  const { user, updateUser, changePassword } = useAuth();
  const fileInputRef = useRef(null);

  // Active Tab: 'profile' | 'security' | 'audit'
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
  });

  // Password Form State & Visibility
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Security data
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2FA Setup Flow State
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaDisableCode, setMfaDisableCode] = useState('');
  const [mfaDisabling, setMfaDisabling] = useState(false);

  // Populate profile form from authenticated user
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const fetchAccountSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, auditRes] = await Promise.all([
        api.auth.getSessions().catch(() => ({ data: [] })),
        api.admin.auditLog({ limit: 10 }).catch(() => ({ data: { logs: [] } })),
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

  // ── Profile Photo Upload from Gallery / Device ──
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'Image file size must be under 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm((prev) => ({ ...prev, avatar: reader.result }));
        setStatusMessage({ type: '', text: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfileForm((prev) => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Profile Updates ──
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setStatusMessage({ type: '', text: '' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      await updateUser({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim() || null,
        avatar: profileForm.avatar || null,
      });
      setStatusMessage({ type: 'success', text: 'Admin account details updated successfully.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update account details.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Password Updates ──
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setStatusMessage({ type: '', text: '' });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      setStatusMessage({ type: 'error', text: 'Current password is required.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
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
      setStatusMessage({ type: 'success', text: res.message || 'Password updated successfully.' });
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSaving(false);
    }
  };

  // ── 2FA Setup Flow ──
  const handleStartMfaSetup = async () => {
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await api.auth.mfaSetup();
      setMfaSetupData(res.data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to generate 2FA setup.' });
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
      setStatusMessage({ type: 'success', text: res.message || 'Two-Factor Authentication is now enabled.' });
      await updateUser({});
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Invalid authenticator code.' });
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
      setStatusMessage({ type: 'success', text: res.message || 'Two-Factor Authentication disabled.' });
      await updateUser({});
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disable 2FA.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Session Management ──
  const handleRevokeOtherSessions = async () => {
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const refreshToken = localStorage.getItem('elevate_refresh_token');
      const res = await api.auth.revokeOtherSessions({ refreshToken });
      setStatusMessage({ type: 'success', text: res.message || 'All other active sessions have been signed out.' });
      fetchAccountSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to sign out other sessions.' });
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
      setStatusMessage({ type: 'error', text: err.message || 'Failed to revoke session.' });
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

  const maskedId = user?.id ? `••••${user.id.slice(-6)}` : '—';

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Admin Account</h1>
          <p className="admin-module__subtitle">Manage your profile, email, phone, credentials, two-factor authentication, and sessions</p>
        </div>
        <button className="admin-btn admin-btn--secondary" onClick={fetchAccountSecurityData} disabled={saving} style={{ fontSize: '12px' }}>
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

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
            color: activeTab === 'profile' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            fontWeight: activeTab === 'profile' ? 600 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <User size={15} /> Profile & Account Details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'security' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
            color: activeTab === 'security' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            fontWeight: activeTab === 'security' ? 600 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Shield size={15} /> Security & 2FA
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
            color: activeTab === 'audit' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            fontWeight: activeTab === 'audit' ? 600 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ScrollText size={15} /> Activity Trail
        </button>
      </div>

      {/* ── TAB 1: Profile & Account Details ── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Identity Summary Card */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">
                <User size={18} style={{ color: 'var(--color-accent-primary)' }} />
                Admin Profile
              </h2>
              <span className="admin-badge admin-badge--gold">Administrator</span>
            </div>
            <div className="admin-panel__body">
              {/* Profile Photo Row with Upload from Gallery */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C5A880 0%, #7E6D56 100%)',
                  color: '#FAF8F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 700,
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: '2px solid var(--color-border)',
                }}>
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.firstName?.charAt(0) || 'A'
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: '11.5px', padding: '6px 12px' }}
                    >
                      <Camera size={13} />
                      <span>Upload from Gallery</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                    {profileForm.avatar && (
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={handleRemovePhoto}
                        style={{ fontSize: '11.5px', padding: '6px 10px' }}
                        title="Remove profile picture"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    JPG, PNG or WebP under 5MB
                  </span>
                </div>
              </div>

              <div style={{
                background: 'var(--color-bg-secondary)',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid var(--color-border-light)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account ID</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-text-primary)', marginTop: 2 }}>
                    {maskedId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="admin-btn admin-btn--secondary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  {copiedId ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Current Email: </span>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{user?.email}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Phone: </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{user?.phone || 'Not added'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Member Since: </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Account Details Form */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Edit Account Details</h2>
            </div>
            <div className="admin-panel__body">
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <Input
                    label="First Name"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                  />
                </div>

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  required
                  hint="Updating your email will change your sign-in address."
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                />

                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  <Save size={14} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Security & 2FA ── */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
            {/* Change Password */}
            <div className="admin-panel">
              <div className="admin-panel__header">
                <h2 className="admin-panel__title">
                  <Lock size={18} style={{ color: 'var(--color-accent-primary)' }} />
                  Change Password
                </h2>
              </div>
              <div className="admin-panel__body">
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  Use at least 8 characters and choose a password you don't use elsewhere.
                </p>

                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    placeholder="New password (min 8 characters)"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <button type="submit" className="admin-btn admin-btn--primary" disabled={saving} style={{ marginTop: 'var(--space-2)' }}>
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>

            {/* Two-Factor Authentication (2FA) */}
            <div className="admin-panel">
              <div className="admin-panel__header">
                <h2 className="admin-panel__title">
                  <Shield size={18} style={{ color: 'var(--color-accent-primary)' }} />
                  Two-Factor Authentication
                </h2>
                {user?.twoFactorEnabled ? (
                  <span className="admin-badge admin-badge--green">Enabled</span>
                ) : (
                  <span className="admin-badge" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-tertiary)' }}>Off</span>
                )}
              </div>
              <div className="admin-panel__body">
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  Add an extra layer of security to your admin account using an authenticator app.
                </p>

                {user?.twoFactorEnabled ? (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'rgba(34, 197, 94, 0.08)',
                      borderRadius: '6px',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      marginBottom: 16,
                    }}>
                      <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                      <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        Two-factor authentication is protecting this account.
                      </span>
                    </div>

                    {!mfaDisabling ? (
                      <button className="admin-btn admin-btn--secondary" onClick={() => setMfaDisabling(true)}>
                        Disable 2FA
                      </button>
                    ) : (
                      <form onSubmit={handleDisableMfa} style={{ maxWidth: 320 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>Enter Current 6-Digit Code</label>
                        <input
                          placeholder="123456"
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
                        <QrCode size={14} /> Set Up Two-Factor Authentication
                      </button>
                    ) : (
                      <div style={{ background: 'var(--color-bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
                        <h4 style={{ fontSize: '13px', marginBottom: 8 }}>Scan QR Code with your Authenticator</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                          {mfaSetupData.qrCodeDataUrl && (
                            <img
                              src={mfaSetupData.qrCodeDataUrl}
                              alt="2FA QR Code"
                              style={{ width: 120, height: 120, borderRadius: 6, border: '1px solid #E8E6DF' }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Setup Key</span>
                            <code style={{ display: 'block', fontSize: '11px', background: '#FFFFFF', padding: '6px 8px', borderRadius: 4, margin: '2px 0 8px', border: '1px solid var(--color-border-light)', wordBreak: 'break-all' }}>
                              {mfaSetupData.secret}
                            </code>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Backup Recovery Codes</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, background: '#FFFFFF', padding: 6, borderRadius: 4, border: '1px solid var(--color-border-light)', fontFamily: 'monospace', fontSize: '10px' }}>
                              {mfaSetupData.recoveryCodes?.map((c, idx) => <span key={idx}>{c}</span>)}
                            </div>
                          </div>
                        </div>

                        <form onSubmit={handleConfirmEnableMfa} style={{ maxWidth: 300 }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: 4 }}>Enter 6-digit code to verify:</label>
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
                              Enable 2FA
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

          {/* Active Sessions */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Laptop size={18} style={{ color: 'var(--color-accent-primary)' }} />
                <h2 className="admin-panel__title">Active Sessions</h2>
              </div>
              {sessions.length > 1 && (
                <button className="admin-btn admin-btn--secondary" onClick={handleRevokeOtherSessions} disabled={saving} style={{ fontSize: '11px', padding: '4px 10px' }}>
                  Sign Out Other Sessions
                </button>
              )}
            </div>
            <div className="admin-panel__body">
              {sessions.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', margin: 0 }}>No additional active sessions.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: sess.isCurrent ? 'rgba(197, 168, 128, 0.08)' : 'var(--color-bg-secondary)',
                        borderRadius: '6px',
                        border: sess.isCurrent ? '1px solid rgba(197, 168, 128, 0.3)' : '1px solid var(--color-border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {sess.device === 'Mobile' ? <Smartphone size={18} /> : <Laptop size={18} />}
                        <div>
                          <strong style={{ fontSize: '13px', display: 'block' }}>
                            {sess.browser || 'Web Browser'} on {sess.os || 'Desktop'} {sess.isCurrent && '— Current Session'}
                          </strong>
                          <span style={{ fontSize: '11.5px', color: 'var(--color-text-tertiary)' }}>
                            Last active: {new Date(sess.lastActiveAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        {sess.isCurrent ? (
                          <span className="admin-badge admin-badge--gold">Current</span>
                        ) : (
                          <button
                            className="admin-action-btn"
                            onClick={() => handleRevokeSingleSession(sess.id)}
                            style={{ color: '#ef4444', fontSize: '11px' }}
                          >
                            Sign Out
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Activity Trail ── */}
      {activeTab === 'audit' && (
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScrollText size={18} style={{ color: 'var(--color-accent-primary)' }} />
              <h2 className="admin-panel__title">Recent Activity</h2>
            </div>
          </div>
          <div className="admin-panel__body">
            {auditLogs.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', margin: 0 }}>No recent security activity.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border-light)',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="admin-badge admin-badge--gold" style={{ fontSize: '10px' }}>{log.action}</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{log.entity}: {log.details || 'Activity logged'}</span>
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
      )}
    </div>
  );
}

export default AdminAccount;
