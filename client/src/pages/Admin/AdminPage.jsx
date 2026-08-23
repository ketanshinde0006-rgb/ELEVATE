import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Users, 
  Target, 
  ListChecks, 
  Shirt, 
  Layers, 
  ScrollText, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/StateDisplay';
import './AdminPage.css';

function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, auditRes] = await Promise.all([
        api.admin.stats(),
        api.admin.users({ search: search || undefined }),
        api.admin.auditLog()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data?.users || []);
      setAuditLogs(auditRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load admin panel data');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    setUpdatingUserId(userId);
    try {
      await api.admin.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="pd-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 className="page__title">Platform Administration</h1>
              <Badge variant="error" size="sm">ADMIN ONLY</Badge>
            </div>
            <p className="page__subtitle">System overview, user management, and security audit log</p>
          </div>
          <Button variant="secondary" onClick={fetchAdminData}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh Data
          </Button>
        </div>

        {/* Admin Tabs */}
        <div className="pd-tabs" role="tablist">
          <button
            className={`pd-tab ${activeTab === 'overview' ? 'pd-tab--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="pd-tab__icon">
              <Shield size={16} strokeWidth={1.8} />
            </span>
            <span className="pd-tab__label">System Overview</span>
          </button>
          <button
            className={`pd-tab ${activeTab === 'users' ? 'pd-tab--active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="pd-tab__icon">
              <Users size={16} strokeWidth={1.8} />
            </span>
            <span className="pd-tab__label">Users ({users.length})</span>
          </button>
          <button
            className={`pd-tab ${activeTab === 'audit' ? 'pd-tab--active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <span className="pd-tab__icon">
              <ScrollText size={16} strokeWidth={1.8} />
            </span>
            <span className="pd-tab__label">Audit Log ({auditLogs.length})</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Error loading admin panel" description={error} action={fetchAdminData} actionLabel="Try Again" />
        ) : (
          <div className="admin-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="admin-overview">
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__icon">
                      <Users size={22} strokeWidth={1.8} />
                    </span>
                    <div className="admin-stat-card__info">
                      <span className="admin-stat-card__value">{stats?.users || 0}</span>
                      <span className="admin-stat-card__label">Total Registered Users</span>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__icon">
                      <Target size={22} strokeWidth={1.8} />
                    </span>
                    <div className="admin-stat-card__info">
                      <span className="admin-stat-card__value">{stats?.goals || 0}</span>
                      <span className="admin-stat-card__label">Goals Tracked</span>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__icon">
                      <ListChecks size={22} strokeWidth={1.8} />
                    </span>
                    <div className="admin-stat-card__info">
                      <span className="admin-stat-card__value">{stats?.tasks || 0}</span>
                      <span className="admin-stat-card__label">Tasks Managed</span>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__icon">
                      <Shirt size={22} strokeWidth={1.8} />
                    </span>
                    <div className="admin-stat-card__info">
                      <span className="admin-stat-card__value">{stats?.wardrobeItems || 0}</span>
                      <span className="admin-stat-card__label">Wardrobe Items</span>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__icon">
                      <Layers size={22} strokeWidth={1.8} />
                    </span>
                    <div className="admin-stat-card__info">
                      <span className="admin-stat-card__value">{stats?.outfits || 0}</span>
                      <span className="admin-stat-card__label">Outfits Created</span>
                    </div>
                  </div>
                </div>

                <Card variant="elevated" style={{ marginTop: 'var(--space-6)' }}>
                  <Card.Body>
                    <Card.Title>System Health & Architecture</Card.Title>
                    <div className="admin-system-info">
                      <div className="admin-system-row">
                        <strong>Database:</strong> <span>MySQL 8.0 with Prisma ORM</span>
                      </div>
                      <div className="admin-system-row">
                        <strong>Auth Strategy:</strong> <span>JWT Access Token (15m) + Refresh Token Rotation in MySQL (7d)</span>
                      </div>
                      <div className="admin-system-row">
                        <strong>Security Protections:</strong> <span>Helmet Headers, CORS allowlist, Rate-limiting, Input Validation (Joi)</span>
                      </div>
                      <div className="admin-system-row">
                        <strong>API Status:</strong> <Badge variant="success" size="sm">Online & Operational</Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="admin-users">
                <div className="admin-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
                  <Input placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)} size="sm" />
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Entities</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="admin-user-cell">
                              <span className="admin-user-avatar">{u.firstName?.charAt(0)}</span>
                              <span>{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <Badge variant={u.role === 'ADMIN' ? 'error' : 'default'} size="sm">
                              {u.role}
                            </Badge>
                          </td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <Badge variant="primary" size="sm">
                                <Target size={11} style={{ marginRight: 3 }} /> {u._count?.goals || 0}
                              </Badge>
                              <Badge variant="secondary" size="sm">
                                <Shirt size={11} style={{ marginRight: 3 }} /> {u._count?.wardrobeItems || 0}
                              </Badge>
                              <Badge variant="default" size="sm">
                                <Layers size={11} style={{ marginRight: 3 }} /> {u._count?.outfits || 0}
                              </Badge>
                            </div>
                          </td>
                          <td>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={updatingUserId === u.id}
                              onClick={() => handleRoleToggle(u.id, u.role)}
                            >
                              {u.role === 'ADMIN' ? 'Demote to USER' : 'Promote to ADMIN'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <div className="admin-audit">
                <Card variant="elevated">
                  <Card.Body>
                    <Card.Title>Security & Access Audit Logs</Card.Title>
                    {auditLogs.length === 0 ? (
                      <p style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-4) 0' }}>
                        No audit events recorded yet.
                      </p>
                    ) : (
                      <div className="admin-audit-list">
                        {auditLogs.map(log => (
                          <div key={log.id} className="admin-audit-item">
                            <div className="admin-audit-item__header">
                              <Badge variant="primary" size="sm">{log.action}</Badge>
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p style={{ margin: 'var(--space-2) 0', fontSize: 'var(--font-size-sm)' }}>
                              <strong>{log.user ? `${log.user.firstName} (${log.user.email})` : 'System'}:</strong> {log.entity} {log.details ? `— ${log.details}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
