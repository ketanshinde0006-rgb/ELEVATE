import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  Clock,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Code,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.systemHealth();
      setHealth(res.data);
    } catch (err) {
      console.error('System health fetch error:', err);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const StatusIcon = ({ status }) => {
    return status === 'online' ? (
      <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
    ) : (
      <XCircle size={16} style={{ color: 'var(--color-error)' }} />
    );
  };

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">System Health &amp; Infrastructure</h1>
          <p className="admin-module__subtitle">Real-time database connectivity, process uptime, memory utilization, and security architecture</p>
        </div>
        <button className="admin-btn admin-btn--secondary" onClick={fetchHealth}>
          <RefreshCw size={14} /> Ping &amp; Refresh
        </button>
      </div>

      {health ? (
        <>
          {/* Status Matrix */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi">
              <div className="admin-kpi__icon admin-kpi__icon--green">
                <Activity size={20} />
              </div>
              <div className="admin-kpi__data">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="admin-kpi__label">API Status</span>
                  <StatusIcon status={health.apiStatus} />
                </div>
                <div className="admin-kpi__value" style={{ fontSize: '1.25rem', marginTop: 4 }}>
                  {health.apiStatus === 'online' ? 'Operational' : 'Unavailable'}
                </div>
              </div>
            </div>

            <div className="admin-kpi">
              <div className={`admin-kpi__icon ${health.dbStatus === 'online' ? 'admin-kpi__icon--green' : 'admin-kpi__icon--red'}`}>
                <Database size={20} />
              </div>
              <div className="admin-kpi__data">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="admin-kpi__label">MySQL 8.0</span>
                  <StatusIcon status={health.dbStatus} />
                </div>
                <div className="admin-kpi__value" style={{ fontSize: '1.25rem', marginTop: 4 }}>
                  {health.dbStatus === 'online' ? `Connected (${health.dbLatencyMs}ms)` : 'Disconnected'}
                </div>
              </div>
            </div>

            <div className="admin-kpi">
              <div className="admin-kpi__icon admin-kpi__icon--blue">
                <Clock size={20} />
              </div>
              <div className="admin-kpi__data">
                <span className="admin-kpi__label">Process Uptime</span>
                <div className="admin-kpi__value" style={{ fontSize: '1.25rem', marginTop: 4 }}>
                  {health.uptime}
                </div>
              </div>
            </div>

            <div className="admin-kpi">
              <div className="admin-kpi__icon admin-kpi__icon--purple">
                <Code size={20} />
              </div>
              <div className="admin-kpi__data">
                <span className="admin-kpi__label">Node Runtime</span>
                <div className="admin-kpi__value" style={{ fontSize: '1.25rem', marginTop: 4 }}>
                  {health.nodeVersion}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
            {/* Memory Usage */}
            {health.memoryUsage && (
              <div className="admin-panel">
                <div className="admin-panel__header">
                  <h2 className="admin-panel__title">
                    <HardDrive size={18} style={{ color: 'var(--color-accent-primary)' }} />
                    Process Memory Footprint
                  </h2>
                </div>
                <div className="admin-panel__body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <Cpu size={18} style={{ color: 'var(--color-accent-primary)', marginBottom: 4 }} />
                      <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{health.memoryUsage.heapUsed}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Heap Used</div>
                    </div>
                    <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <Cpu size={18} style={{ color: 'var(--color-accent-secondary)', marginBottom: 4 }} />
                      <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{health.memoryUsage.heapTotal}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Heap Total</div>
                    </div>
                    <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <HardDrive size={18} style={{ color: 'var(--color-info)', marginBottom: 4 }} />
                      <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{health.memoryUsage.rss}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Resident RSS</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Architecture Overview */}
            <div className="admin-panel">
              <div className="admin-panel__header">
                <h2 className="admin-panel__title">
                  <ShieldCheck size={18} style={{ color: 'var(--color-accent-primary)' }} />
                  Security &amp; Architecture Matrix
                </h2>
              </div>
              <div className="admin-panel__body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {[
                    ['Environment', health.environment || 'development'],
                    ['Platform Host', health.platform || 'win32'],
                    ['Database Engine', 'MySQL 8.0 with Prisma ORM v6'],
                    ['Authentication', 'JWT Access Tokens (15m) + DB Refresh Token Rotation'],
                    ['Middleware Guards', 'Helmet CSP, CORS allowlist, Express Rate-Limit'],
                    ['Input Sanitization', 'Parameter stripping, SQL parameterization'],
                  ].map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-2) 0',
                        borderBottom: '1px solid var(--color-border-light)',
                        fontSize: 'var(--font-size-xs)',
                      }}
                    >
                      <strong style={{ color: 'var(--color-text-secondary)' }}>{key}</strong>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-panel">
          <div className="admin-panel__body" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <XCircle size={48} strokeWidth={1.2} style={{ color: 'var(--color-error)', opacity: 0.5, marginBottom: 'var(--space-4)' }} />
            <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
              Unable to reach backend health endpoint
            </h3>
            <button className="admin-btn admin-btn--secondary" onClick={fetchHealth} style={{ marginTop: 'var(--space-4)' }}>
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemHealth;
