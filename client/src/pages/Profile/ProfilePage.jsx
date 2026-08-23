import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, SlidersHorizontal, ShieldCheck, Lock, LogOut, Check, AlertTriangle, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Textarea, Select } from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import './Profile.css';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
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
        setForm(prev => ({ ...prev, avatar: reader.result }));
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
      await api.auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStatusMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to change password' });
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
    { id: 'security', label: 'Security & Password', icon: ShieldCheck },
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
              <Badge variant="primary" size="sm" style={{ marginTop: 'var(--space-2)' }}>{user?.role || 'USER'}</Badge>
            </div>
            <nav className="profile-nav">
              {sections.map(s => {
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

            {activeSection === 'profile' && (
              <Card variant="elevated">
                <Card.Body spacious>
                  <div className="flex-between" style={{ marginBottom: 'var(--space-6)' }}>
                    <h2>Profile Information</h2>
                    <Button
                      variant={editing ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                      loading={saving}
                    >
                      {editing ? 'Save Changes' : 'Edit Profile'}
                    </Button>
                  </div>
                  <div className="auth-card__form">
                    {/* Profile Picture Control */}
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
                          <label className={`btn btn--secondary btn--sm`} style={{ cursor: editing ? 'pointer' : 'default', opacity: editing ? 1 : 0.6 }}>
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
                              onClick={() => setForm(prev => ({ ...prev, avatar: '' }))}
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
                    <Input label="Email" name="email" type="email" value={form.email} disabled hint="Email address is used for login and cannot be modified directly" />
                    <Textarea label="Bio" name="bio" value={form.bio} onChange={handleChange} disabled={!editing} rows={3} placeholder="Tell us about yourself..." />
                  </div>
                </Card.Body>
              </Card>
            )}

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
                      options={['Minimal','Casual','Smart Casual','Formal','Streetwear','Aesthetic','Vintage','Athleisure'].map(s => ({value:s,label:s}))}
                    />
                    <Select
                      label="Preferred Color Palette"
                      name="preferredColors"
                      value={form.preferredColors}
                      onChange={handleChange}
                      options={['Neutrals','Earth Tones','Bold Colors','Pastels','Monochrome'].map(s => ({value:s,label:s}))}
                    />
                    <Select
                      label="Primary Occasion"
                      name="primaryOccasion"
                      value={form.primaryOccasion}
                      onChange={handleChange}
                      options={['Casual','Business','Formal','Active','Date Night'].map(s => ({value:s,label:s}))}
                    />
                    <Select
                      label="Season Focus"
                      name="seasonFocus"
                      value={form.seasonFocus}
                      onChange={handleChange}
                      options={['All Season','Spring/Summer','Fall/Winter'].map(s => ({value:s,label:s}))}
                    />
                    <Button variant="primary" onClick={handleSaveProfile} loading={saving}>Save Preferences</Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {activeSection === 'security' && (
              <Card variant="elevated">
                <Card.Body spacious>
                  <h2 style={{ marginBottom: 'var(--space-6)' }}>Security Settings</h2>
                  <form onSubmit={handleUpdatePassword} className="auth-card__form">
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
                      placeholder="Enter new password (min 8 chars)"
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
                    <Button type="submit" variant="primary" loading={saving}>Update Password</Button>
                  </form>
                </Card.Body>
              </Card>
            )}

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
                        options={[{value:'private',label:'Private'},{value:'public',label:'Public'}]}
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
                        options={[{value:'private',label:'Private'},{value:'public',label:'Public'}]}
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
