import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  LogOut,
  Camera,
  Trash2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Globe,
  RefreshCw,
  Unlink,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Textarea, Select } from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import './Profile.css';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, changePassword, setPassword, logout } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
    bio: '',
    preferredStyles: 'Minimal',
    preferredColors: 'Neutrals',
    primaryOccasion: 'Casual',
    seasonFocus: 'All Season',
    profileVisibility: 'private',
    wardrobeVisibility: 'private',
    emailNotifications: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Security Sub-states
  const [connectedProviders, setConnectedProviders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  // 2FA Setup Flow State
  const [mfaSetupData, setMfaSetupData] = useState(null); // { secret, otpauthUri, qrCodeDataUrl, recoveryCodes }
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaDisableCode, setMfaDisableCode] = useState('');
  const [mfaDisabling, setMfaDisabling] = useState(false);

  useEffect(() => {
    if (user) {
      let prefStyles = 'Minimal';
      let prefColors = 'Neutrals';
      try {
        if (user.preferredStyles) {
          const parsed = typeof user.preferredStyles === 'string' ? JSON.parse(user.preferredStyles) : user.preferredStyles;
          if (Array.isArray(parsed) && parsed.length) prefStyles = parsed[0];
        }
        if (user.preferredColors) {
          const parsed = typeof user.preferredColors === 'string' ? JSON.parse(user.preferredColors) : user.preferredColors;
          if (Array.isArray(parsed) && parsed.length) prefColors = parsed[0];
        }
      } catch {}

      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        preferredStyles: prefStyles,
        preferredColors: prefColors,
        primaryOccasion: user.primaryOccasion || 'Casual',
        seasonFocus: user.seasonFocus || 'All Season',
        profileVisibility: user.profileVisibility || 'private',
        wardrobeVisibility: user.wardrobeVisibility || 'private',
        emailNotifications: user.emailNotifications !== false,
      });
    }
  }, [user]);

  // Load Security data (Providers + Sessions) when entering security tab
  useEffect(() => {
    if (activeSection === 'security') {
      loadSecurityData();
    }
  }, [activeSection]);

  const loadSecurityData = async () => {
    setLoadingSecurity(true);
    try {
      const [providersRes, sessionsRes] = await Promise.all([
        api.auth.getProviders().catch(() => ({ data: { providers: [] } })),
        api.auth.getSessions().catch(() => ({ data: [] })),
      ]);
      setConnectedProviders(providersRes.data?.providers || []);
      setSessions(sessionsRes.data || []);
    } catch {
      // safe fallback
    } finally {
      setLoadingSecurity(false);
    }
  };

  const handleCopyUserId = () => {
    if (user?.id) {
      navigator.clipboard?.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'Image size must be less than 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, avatar: reader.result }));
        if (!editing) setEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      await updateUser({
        firstName: form.firstName,
        lastName: form.lastName,
        avatar: form.avatar,
        bio: form.bio,
        preferredStyles: JSON.stringify([form.preferredStyles]),
        preferredColors: JSON.stringify([form.preferredColors]),
        primaryOccasion: form.primaryOccasion,
        seasonFocus: form.seasonFocus,
        profileVisibility: form.profileVisibility,
        wardrobeVisibility: form.wardrobeVisibility,
        emailNotifications: form.emailNotifications,
      });
      setEditing(false);
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
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
      if (user?.hasPassword === false) {
        const res = await setPassword({
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setStatusMessage({ type: 'success', text: res.message || 'Password established successfully!' });
      } else {
        if (!passwordForm.currentPassword) {
          setStatusMessage({ type: 'error', text: 'Current password is required' });
          setSaving(false);
          return;
        }
        const res = await changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setStatusMessage({ type: 'success', text: res.message || 'Password updated successfully!' });
      }
      loadSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update password' });
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
      setStatusMessage({ type: 'success', text: res.message || 'Two-Factor Authentication is now enabled!' });
      await updateUser({}); // refresh user object
      loadSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Invalid 2FA code' });
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
      loadSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disable 2FA' });
    } finally {
      setSaving(false);
    }
  };

  // Unlink Provider
  const handleUnlinkProvider = async (providerType) => {
    if (!confirm(`Are you sure you want to disconnect ${providerType} from your account?`)) return;

    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await api.auth.unlinkProvider(providerType);
      setStatusMessage({ type: 'success', text: res.message || `Disconnected ${providerType}` });
      loadSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || `Failed to disconnect ${providerType}` });
    } finally {
      setSaving(false);
    }
  };

  // Sign out other sessions
  const handleSignOutOtherSessions = async () => {
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const refreshToken = localStorage.getItem('elevate_refresh_token');
      const res = await api.auth.revokeOtherSessions({ refreshToken });
      setStatusMessage({ type: 'success', text: res.message || 'Signed out from all other devices.' });
      loadSecurityData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to sign out other sessions' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sections = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'preferences', label: 'Style Preferences', icon: SlidersHorizontal },
    { id: 'security', label: 'Security & Auth', icon: ShieldCheck },
    { id: 'privacy', label: 'Privacy Settings', icon: Lock },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-sidebar__avatar">
              <div className="profile-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} className="profile-avatar__img" alt={user.firstName} />
                ) : (
                  `${user?.firstName?.charAt(0) || 'U'}${user?.lastName?.charAt(0) || ''}`
                )}
              </div>
              <h3>{user?.firstName} {user?.lastName}</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
                <Badge variant={user?.role === 'ADMIN' ? 'error' : 'primary'} size="sm">
                  {user?.role || 'USER'}
                </Badge>
                {user?.twoFactorEnabled && (
                  <Badge variant="success" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={11} /> 2FA Active
                  </Badge>
                )}
              </div>
            </div>

            <nav className="profile-nav">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    className={`profile-nav__item ${activeSection === s.id ? 'profile-nav__item--active' : ''}`}
                    onClick={() => { setActiveSection(s.id); setStatusMessage({ type: '', text: '' }); }}
                  >
                    <Icon size={16} strokeWidth={1.8} style={{ marginRight: 8 }} />
                    {s.label}
                  </button>
                );
              })}
              <button className="profile-nav__item profile-nav__item--danger" onClick={handleLogout}>
                <LogOut size={16} strokeWidth={1.8} style={{ marginRight: 8 }} />
                Sign Out
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="profile-content">
            {statusMessage.text && (
              <div className={`alert ${statusMessage.type === 'error' ? 'alert--error' : 'alert--success'}`} style={{ marginBottom: 'var(--space-4)' }}>
                {statusMessage.text}
              </div>
            )}

            {/* Profile Tab */}
            {activeSection === 'profile' && (
              <Card variant="elevated">
                <Card.Body spacious>
                  <div className="flex-between" style={{ marginBottom: 'var(--space-6)' }}>
                    <h2>Account Information</h2>
                    <Button
                      variant={editing ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => (editing ? handleSaveProfile() : setEditing(true))}
                      loading={saving}
                    >
                      {editing ? 'Save Changes' : 'Edit Profile'}
                    </Button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-3)',
                    background: 'var(--color-bg-secondary)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-6)',
                    border: '1px solid var(--color-border-light)',
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Permanent User ID</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '2px' }}>
                        <code style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
                          {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : '—'}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyUserId}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent-primary)', padding: 2 }}
                          title="Copy Full ID"
                        >
                          {copiedId ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Since</span>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', marginTop: '2px' }}>
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Status</span>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {user?.emailVerified ? (
                          <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={13} /> Unverified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="auth-card__form">
                    <div className="profile-photo-row">
                      <div className="profile-photo-preview">
                        {form.avatar ? (
                          <img src={form.avatar} alt="Avatar preview" />
                        ) : (
                          `${form.firstName?.charAt(0) || 'U'}${form.lastName?.charAt(0) || ''}`
                        )}
                      </div>
                      <div className="profile-photo-actions">
                        <div className="profile-photo-btns">
                          <label className="btn btn--secondary btn--sm" style={{ cursor: editing ? 'pointer' : 'default', opacity: editing ? 1 : 0.6 }}>
                            <Camera size={14} style={{ marginRight: 6 }} /> Upload Picture
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleFileUpload}
                              disabled={!editing}
                            />
                          </label>
                          {form.avatar && editing && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setForm((prev) => ({ ...prev, avatar: '' }))}
                              style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                            >
                              <Trash2 size={14} style={{ marginRight: 6 }} /> Remove Photo
                            </Button>
                          )}
                        </div>
                        <p className="profile-photo-hint">
                          Upload JPG, PNG or WebP image under 2MB, or paste a photo URL below.
                        </p>
                      </div>
                    </div>

                    {editing && (
                      <Input
                        label="Avatar Image URL"
                        name="avatar"
                        value={form.avatar}
                        onChange={handleChange}
                        placeholder="https://images.unsplash.com/... or paste image URL"
                        hint="You can also paste a direct image URL for your profile picture."
                      />
                    )}

                    <div className="auth-card__row">
                      <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} disabled={!editing} />
                      <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} disabled={!editing} />
                    </div>
                    <Input label="Email" name="email" type="email" value={form.email} disabled hint="Email address is stored securely in MySQL and is your permanent login identifier" />
                    <Input label="Mobile Phone" name="phone" type="tel" value={form.phone} disabled hint="Manage your verified phone in Security & Auth settings" />
                    <Textarea label="Bio" name="bio" value={form.bio} onChange={handleChange} disabled={!editing} rows={3} placeholder="Tell us about yourself..." />
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Preferences Tab */}
            {activeSection === 'preferences' && (
              <Card variant="elevated">
                <Card.Body spacious>
                  <h2 style={{ marginBottom: 'var(--space-6)' }}>Style Preferences</h2>
                  <div className="auth-card__form">
                    <Select
                      label="Preferred Style"
                      name="preferredStyles"
                      value={form.preferredStyles}
                      onChange={handleChange}
                      options={['Minimal', 'Casual', 'Smart Casual', 'Formal', 'Streetwear', 'Aesthetic', 'Vintage', 'Athleisure'].map((s) => ({ value: s, label: s }))}
                    />
                    <Select
                      label="Preferred Color Palette"
                      name="preferredColors"
                      value={form.preferredColors}
                      onChange={handleChange}
                      options={['Neutrals', 'Earth Tones', 'Bold Colors', 'Pastels', 'Monochrome'].map((s) => ({ value: s, label: s }))}
                    />
                    <Select
                      label="Primary Occasion"
                      name="primaryOccasion"
                      value={form.primaryOccasion}
                      onChange={handleChange}
                      options={['Casual', 'Business', 'Formal', 'Active', 'Date Night'].map((s) => ({ value: s, label: s }))}
                    />
                    <Select
                      label="Season Focus"
                      name="seasonFocus"
                      value={form.seasonFocus}
                      onChange={handleChange}
                      options={['All Season', 'Spring/Summer', 'Fall/Winter'].map((s) => ({ value: s, label: s }))}
                    />
                    <Button variant="primary" onClick={handleSaveProfile} loading={saving}>Save Preferences</Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Security & Multi-Auth Tab */}
            {activeSection === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* 1. Connected Identities */}
                <Card variant="elevated">
                  <Card.Body spacious>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <KeyRound size={20} style={{ color: 'var(--color-accent-primary)' }} />
                      <h2 style={{ margin: 0 }}>Connected Login Methods</h2>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                      All connected identities resolve to your single permanent ELEVATE account.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Email/Password Row */}
                      <div className="flex-between" style={{ padding: '14px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                        <div>
                          <strong style={{ fontSize: '14px', display: 'block' }}>Email & Password</strong>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {user?.hasPassword !== false ? user?.email : 'No local password set'}
                          </span>
                        </div>
                        <div>
                          {user?.hasPassword !== false ? (
                            <Badge variant="success" size="sm">Active</Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">Not Configured</Badge>
                          )}
                        </div>
                      </div>

                      {/* Google Row */}
                      <div className="flex-between" style={{ padding: '14px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                        <div>
                          <strong style={{ fontSize: '14px', display: 'block' }}>Google Sign-In</strong>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {connectedProviders.find((p) => p.provider === 'GOOGLE')?.email || 'Not connected'}
                          </span>
                        </div>
                        <div>
                          {connectedProviders.some((p) => p.provider === 'GOOGLE') ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUnlinkProvider('GOOGLE')}
                              loading={saving}
                              style={{ fontSize: '12px', padding: '4px 10px' }}
                            >
                              <Unlink size={13} style={{ marginRight: 4 }} /> Disconnect
                            </Button>
                          ) : (
                            <Badge variant="secondary" size="sm">Not Connected</Badge>
                          )}
                        </div>
                      </div>

                      {/* Apple Row */}
                      <div className="flex-between" style={{ padding: '14px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                        <div>
                          <strong style={{ fontSize: '14px', display: 'block' }}>Sign in with Apple</strong>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {connectedProviders.find((p) => p.provider === 'APPLE')?.email || 'Not connected'}
                          </span>
                        </div>
                        <div>
                          {connectedProviders.some((p) => p.provider === 'APPLE') ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUnlinkProvider('APPLE')}
                              loading={saving}
                              style={{ fontSize: '12px', padding: '4px 10px' }}
                            >
                              <Unlink size={13} style={{ marginRight: 4 }} /> Disconnect
                            </Button>
                          ) : (
                            <Badge variant="secondary" size="sm">Not Connected</Badge>
                          )}
                        </div>
                      </div>

                      {/* Microsoft Row */}
                      <div className="flex-between" style={{ padding: '14px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                        <div>
                          <strong style={{ fontSize: '14px', display: 'block' }}>Microsoft Account</strong>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {connectedProviders.find((p) => p.provider === 'MICROSOFT')?.email || 'Not connected'}
                          </span>
                        </div>
                        <div>
                          {connectedProviders.some((p) => p.provider === 'MICROSOFT') ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUnlinkProvider('MICROSOFT')}
                              loading={saving}
                              style={{ fontSize: '12px', padding: '4px 10px' }}
                            >
                              <Unlink size={13} style={{ marginRight: 4 }} /> Disconnect
                            </Button>
                          ) : (
                            <Badge variant="secondary" size="sm">Not Connected</Badge>
                          )}
                        </div>
                      </div>

                      {/* Mobile Phone Row */}
                      <div className="flex-between" style={{ padding: '14px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                        <div>
                          <strong style={{ fontSize: '14px', display: 'block' }}>Mobile SMS Phone</strong>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {user?.phone || 'No phone number linked'}
                          </span>
                        </div>
                        <div>
                          {user?.phoneVerified ? (
                            <Badge variant="success" size="sm">Verified</Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">Not Linked</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* 2. Password Management */}
                <Card variant="elevated">
                  <Card.Body spacious>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Lock size={20} style={{ color: 'var(--color-accent-primary)' }} />
                      <h2 style={{ margin: 0 }}>
                        {user?.hasPassword === false ? 'Set Account Password' : 'Change Password'}
                      </h2>
                    </div>

                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
                      {user?.hasPassword === false
                        ? 'Setting a local password allows you to sign in with either your email & password or your social provider.'
                        : 'Update your account password. Password must be at least 8 characters long.'}
                    </p>

                    <form onSubmit={handleUpdatePassword} className="auth-card__form">
                      {user?.hasPassword !== false && (
                        <Input
                          label="Current Password"
                          name="currentPassword"
                          type="password"
                          placeholder="Enter current password"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      )}
                      <Input
                        label={user?.hasPassword === false ? 'Create Password' : 'New Password'}
                        name="newPassword"
                        type="password"
                        placeholder="Enter password (min 8 chars)"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <Input
                        label={user?.hasPassword === false ? 'Confirm Password' : 'Confirm New Password'}
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <Button type="submit" variant="primary" loading={saving}>
                        {user?.hasPassword === false ? 'Set Password' : 'Change Password'}
                      </Button>
                    </form>
                  </Card.Body>
                </Card>

                {/* 3. Two-Factor Authentication (2FA) */}
                <Card variant="elevated">
                  <Card.Body spacious>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <ShieldCheck size={20} style={{ color: 'var(--color-accent-primary)' }} />
                      <h2 style={{ margin: 0 }}>Two-Factor Authentication (2FA)</h2>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                      Protect your account with an extra security layer using standard authenticator apps (Google Authenticator, Microsoft Authenticator, or Apple Passwords).
                    </p>

                    {user?.twoFactorEnabled ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'rgba(52, 168, 83, 0.08)', borderRadius: '8px', border: '1px solid rgba(52, 168, 83, 0.2)', marginBottom: 16 }}>
                          <CheckCircle2 size={24} style={{ color: '#34A853' }} />
                          <div>
                            <strong style={{ display: 'block', color: '#161514', fontSize: '14px' }}>Two-Factor Authentication is Active</strong>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Your account requires an authenticator code on login.</span>
                          </div>
                        </div>

                        {!mfaDisabling ? (
                          <Button variant="secondary" size="sm" onClick={() => setMfaDisabling(true)}>
                            Disable 2FA
                          </Button>
                        ) : (
                          <form onSubmit={handleDisableMfa} style={{ maxWidth: 360 }}>
                            <Input
                              label="Enter Current 2FA Code or Password"
                              placeholder="6-digit code or account password"
                              value={mfaDisableCode}
                              onChange={(e) => setMfaDisableCode(e.target.value)}
                              required
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                              <Button type="submit" variant="secondary" size="sm" loading={saving} style={{ color: 'var(--color-error)' }}>
                                Confirm Disable
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setMfaDisabling(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    ) : (
                      <div>
                        {!mfaSetupData ? (
                          <Button variant="primary" size="sm" onClick={handleStartMfaSetup} loading={saving}>
                            <QrCode size={15} style={{ marginRight: 6 }} /> Set Up Two-Factor Authentication
                          </Button>
                        ) : (
                          <div style={{ background: 'var(--color-bg-secondary)', padding: 20, borderRadius: 12, border: '1px solid var(--color-border-light)' }}>
                            <h3 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Scan QR Code</h3>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                              Open your authenticator app and scan the code below, or manually enter the setup key.
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', marginBottom: 20 }}>
                              {mfaSetupData.qrCodeDataUrl ? (
                                <img
                                  src={mfaSetupData.qrCodeDataUrl}
                                  alt="2FA QR Code"
                                  style={{ width: 160, height: 160, borderRadius: 8, border: '1px solid #E8E6DF' }}
                                />
                              ) : (
                                <div style={{ width: 160, height: 160, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E8E6DF', borderRadius: 8 }}>
                                  <QrCode size={48} color="#C5A880" />
                                </div>
                              )}

                              <div style={{ flex: 1, minWidth: 220 }}>
                                <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Manual Setup Key</label>
                                <code style={{ display: 'block', fontSize: '14px', background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, margin: '4px 0 12px', border: '1px solid var(--color-border-light)', wordBreak: 'break-all' }}>
                                  {mfaSetupData.secret}
                                </code>

                                <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>One-Time Backup Recovery Codes</label>
                                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '2px 0 6px' }}>Save these in a secure place. Each code can be used once if you lose access to your authenticator app:</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: '#FFFFFF', padding: 8, borderRadius: 6, border: '1px solid var(--color-border-light)', fontFamily: 'monospace', fontSize: '11px' }}>
                                  {mfaSetupData.recoveryCodes?.map((code, idx) => (
                                    <span key={idx}>{code}</span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <form onSubmit={handleConfirmEnableMfa} style={{ maxWidth: 360, marginTop: 16 }}>
                              <Input
                                label="Enter 6-Digit Code From App to Activate"
                                placeholder="123456"
                                value={mfaVerifyCode}
                                onChange={(e) => setMfaVerifyCode(e.target.value)}
                                required
                                autoFocus
                                style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '16px', fontWeight: 600 }}
                              />
                              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <Button type="submit" variant="primary" size="sm" loading={saving}>
                                  Verify & Enable 2FA
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setMfaSetupData(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* 4. Active Device Sessions */}
                <Card variant="elevated">
                  <Card.Body spacious>
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Laptop size={20} style={{ color: 'var(--color-accent-primary)' }} />
                        <h2 style={{ margin: 0 }}>Active Sessions & Devices</h2>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSignOutOtherSessions}
                        loading={saving}
                        style={{ fontSize: '12px' }}
                      >
                        Sign Out Other Devices
                      </Button>
                    </div>

                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                      Manage your active logins across devices and browsers.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {sessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="flex-between"
                          style={{
                            padding: '14px',
                            background: sess.isCurrent ? 'rgba(197, 168, 128, 0.08)' : 'var(--color-bg-secondary)',
                            borderRadius: '8px',
                            border: sess.isCurrent ? '1px solid rgba(197, 168, 128, 0.3)' : '1px solid var(--color-border-light)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {sess.device === 'Mobile' ? <Smartphone size={20} /> : <Laptop size={20} />}
                            <div>
                              <strong style={{ fontSize: '13.5px', display: 'block' }}>
                                {sess.browser} on {sess.os} {sess.isCurrent && '(This Device)'}
                              </strong>
                              <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                                IP: {sess.ipAddress} • Last active: {new Date(sess.lastActiveAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div>
                            {sess.isCurrent ? (
                              <Badge variant="primary" size="sm">Current Session</Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  await api.auth.revokeSession(sess.id);
                                  loadSecurityData();
                                }}
                                style={{ fontSize: '11px', color: 'var(--color-error)' }}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Privacy Tab */}
            {activeSection === 'privacy' && (
              <Card variant="elevated">
                <Card.Body spacious>
                  <h2 style={{ marginBottom: 'var(--space-6)' }}>Privacy Settings</h2>
                  <div className="auth-card__form">
                    <div className="flex-between">
                      <div>
                        <h4>Profile Visibility</h4>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Control who can see your profile details</p>
                      </div>
                      <Select
                        name="profileVisibility"
                        value={form.profileVisibility}
                        onChange={handleChange}
                        options={[{ value: 'private', label: 'Private' }, { value: 'public', label: 'Public' }]}
                        placeholder=""
                      />
                    </div>
                    <div className="flex-between">
                      <div>
                        <h4>Wardrobe Visibility</h4>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Control who can view your wardrobe items</p>
                      </div>
                      <Select
                        name="wardrobeVisibility"
                        value={form.wardrobeVisibility}
                        onChange={handleChange}
                        options={[{ value: 'private', label: 'Private' }, { value: 'public', label: 'Public' }]}
                        placeholder=""
                      />
                    </div>
                    <div className="flex-between">
                      <div>
                        <h4>Email Notifications</h4>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Receive email reminders for goals and habits</p>
                      </div>
                      <label className="checkbox-group">
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={form.emailNotifications}
                          onChange={handleChange}
                        />
                        <span className="checkbox-group__label">{form.emailNotifications ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>
                    <Button variant="primary" onClick={handleSaveProfile} loading={saving}>Save Privacy Settings</Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
