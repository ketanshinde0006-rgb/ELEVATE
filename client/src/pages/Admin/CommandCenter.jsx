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
  ExternalLink,
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

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
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
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 className="admin-module__title">Operations Overview</h1>
          <p className="admin-module__subtitle">Platform telemetry, real-time inventory counts, and administrator event stream</p>
        </div>
        <button className="admin-btn admin-btn--secondary" onClick={fetchData} style={{ fontSize: '12px' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Grid (5x2 cards) */}
      <div className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="admin-kpi"
            onClick={() => kpi.to && navigate(kpi.to)}
            style={{ cursor: kpi.to ? 'pointer' : 'default' }}
          >
            <div className={`admin-kpi__icon ${kpi.color ? `admin-kpi__icon--${kpi.color}` : ''}`}>
              <kpi.icon size={18} strokeWidth={1.8} />
            </div>
            <div className="admin-kpi__data">
              <div className="admin-kpi__value">{kpi.value.toLocaleString()}</div>
              <div className="admin-kpi__label" title={kpi.label}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lower Section: 2 Balanced Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        {/* Recent Activity Timeline */}
        <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Clock size={17} style={{ color: 'var(--color-accent-primary)' }} />
              Recent Operations Log
            </h2>
            <button className="admin-action-btn" onClick={() => navigate('/admin/audit')} style={{ fontSize: '11px' }}>
              View Full Trail →
            </button>
          </div>
          <div className="admin-panel__body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {recentAudit.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                No recent administrative activity recorded in the database.
              </div>
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
                    <span className="admin-badge admin-badge--gold" style={{ marginTop: 2, fontSize: '10px' }}>
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
        <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Layers size={17} style={{ color: 'var(--color-accent-primary)' }} />
              Management Workspaces
            </h2>
          </div>
          <div className="admin-panel__body" style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-light)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    minHeight: '74px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
                    e.currentTarget.style.background = 'rgba(197, 168, 128, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-light)';
                    e.currentTarget.style.background = 'var(--color-bg-secondary)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <action.icon size={15} style={{ color: 'var(--color-accent-primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {action.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-tertiary)', lineHeight: 1.3 }}>
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
