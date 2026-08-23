import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  ListChecks,
  Shirt,
  Layers,
  Palette,
  Tag,
  ShieldAlert,
  ScrollText,
  Image as ImageIcon,
  BarChart3,
  Server,
  RefreshCw,
  Clock,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

function CommandCenter() {
  const [stats, setStats] = useState(null);
  const [recentAudit, setRecentAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, auditRes] = await Promise.all([
        api.admin.stats(),
        api.admin.auditLog({ limit: 8 }),
      ]);
      setStats(statsRes.data);
      setRecentAudit(auditRes.data?.logs || auditRes.data || []);
    } catch (err) {
      console.error('Command Center fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const kpis = [
    { label: 'Registered Users', value: stats?.users || 0, icon: Users, color: '', to: '/admin/users' },
    { label: 'Active Users', value: stats?.activeUsers || 0, icon: Users, color: 'green', to: '/admin/users' },
    { label: 'Goals Tracked', value: stats?.goals || 0, icon: Target, color: 'purple' },
    { label: 'Tasks Managed', value: stats?.tasks || 0, icon: ListChecks, color: 'blue' },
    { label: 'Wardrobe Items', value: stats?.wardrobeItems || 0, icon: Shirt, color: 'orange' },
    { label: 'Outfits Created', value: stats?.outfits || 0, icon: Layers, color: 'blue' },
    { label: 'Fashion Styles', value: stats?.styles || 0, icon: Palette, color: '', to: '/admin/fashion?tab=styles' },
    { label: 'Brand Directory', value: stats?.brands || 0, icon: Tag, color: 'purple', to: '/admin/brands' },
    { label: 'Pending Reports', value: stats?.pendingReports || 0, icon: ShieldAlert, color: stats?.pendingReports > 0 ? 'red' : 'green', to: '/admin/reports' },
    { label: 'Audit Events', value: stats?.auditEvents || 0, icon: ScrollText, color: 'blue', to: '/admin/audit' },
  ];

  const quickActions = [
    { label: 'User Directory', desc: 'Manage user accounts and roles', icon: Users, to: '/admin/users' },
    { label: 'Brand Directory', desc: 'Update brands and price segments', icon: Tag, to: '/admin/brands' },
    { label: 'Fashion Taxonomy', desc: 'Edit categories and style records', icon: Palette, to: '/admin/fashion' },
    { label: 'Media Library', desc: 'Upload and manage image assets', icon: ImageIcon, to: '/admin/media' },
    { label: 'Moderation Queue', desc: 'Review flagged content reports', icon: ShieldAlert, to: '/admin/reports' },
    { label: 'Platform Analytics', desc: 'Inspect trends and engagement', icon: BarChart3, to: '/admin/analytics' },
    { label: 'Security Audit Log', desc: 'Inspect administrative event trail', icon: ScrollText, to: '/admin/audit' },
    { label: 'System Health', desc: 'Check database & runtime status', icon: Server, to: '/admin/system' },
  ];

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Operations Overview</h1>
          <p className="admin-module__subtitle">Platform telemetry, real-time inventory counts, and recent administrator activity</p>
        </div>
        <button className="admin-btn admin-btn--secondary" onClick={fetchData}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Grid */}
      <div className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="admin-kpi"
            onClick={() => kpi.to && navigate(kpi.to)}
            style={{ cursor: kpi.to ? 'pointer' : 'default' }}
          >
            <div className={`admin-kpi__icon ${kpi.color ? `admin-kpi__icon--${kpi.color}` : ''}`}>
              <kpi.icon size={20} strokeWidth={1.8} />
            </div>
            <div className="admin-kpi__data">
              <div className="admin-kpi__value">{kpi.value.toLocaleString()}</div>
              <div className="admin-kpi__label">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Recent Activity Timeline */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Clock size={18} style={{ color: 'var(--color-accent-primary)' }} />
              Recent Operations Log
            </h2>
            <button className="admin-action-btn" onClick={() => navigate('/admin/audit')} style={{ fontSize: 'var(--font-size-xs)' }}>
              View Full Trail →
            </button>
          </div>
          <div className="admin-panel__body">
            {recentAudit.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                No recent administrative activity recorded in the database.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {recentAudit.slice(0, 7).map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-3)',
                      paddingBottom: 'var(--space-2)',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                  >
                    <span className="admin-badge admin-badge--gold" style={{ marginTop: 2 }}>
                      {log.action}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {log.entity}: {log.details || 'Event logged'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                        {log.user ? `${log.user.firstName} (${log.user.email})` : 'System'} · {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Workspaces */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Layers size={18} style={{ color: 'var(--color-accent-primary)' }} />
              Management Workspaces
            </h2>
          </div>
          <div className="admin-panel__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-light)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-light)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <action.icon size={18} style={{ color: 'var(--color-accent-primary)', marginBottom: 6 }} />
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {action.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {action.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandCenter;
