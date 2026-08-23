import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  ListChecks,
  Shirt,
  Layers,
  ShieldAlert,
  Tag,
  Palette,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.analytics();
      setData(res.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-panel">
        <div className="admin-panel__body" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <p style={{ color: 'var(--color-error)' }}>Failed to compute analytics from database.</p>
          <button className="admin-btn admin-btn--secondary" onClick={fetchAnalytics}>
            <RefreshCw size={14} /> Retry Query
          </button>
        </div>
      </div>
    );
  }

  const maxGrowth = Math.max(...(data.userGrowth || []).map((d) => d.count), 1);
  const engagement = data.engagement || {};
  const reports = data.reports || {};

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Platform Analytics</h1>
          <p className="admin-module__subtitle">Database aggregations, lifecycle completions, and community preferences</p>
        </div>
        <button className="admin-btn admin-btn--secondary" onClick={fetchAnalytics}>
          <RefreshCw size={14} /> Refresh Analytics
        </button>
      </div>

      {/* 1. Real User Growth Bar Chart */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">
            <TrendingUp size={18} style={{ color: 'var(--color-accent-primary)' }} />
            User Registrations (Last 6 Months)
          </h2>
        </div>
        <div className="admin-panel__body">
          <div className="admin-bar-chart">
            {(data.userGrowth || []).map((d) => (
              <div key={d.key} className="admin-bar-chart__bar-group">
                <div
                  className="admin-bar-chart__bar"
                  style={{ height: `${Math.max((d.count / maxGrowth) * 100, 4)}%` }}
                  data-value={d.count}
                />
                <div className="admin-bar-chart__label">{d.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
        {/* 2. Personal Development Completion Stats */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Target size={18} style={{ color: 'var(--color-accent-primary)' }} />
              Goal &amp; Task Real Completion
            </h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-gauge">
              <div className="admin-gauge__label">Goal Completion</div>
              <div className="admin-gauge__bar">
                <div className="admin-gauge__fill" style={{ width: `${engagement.goalCompletionRate || 0}%` }} />
              </div>
              <div className="admin-gauge__value">{engagement.goalCompletionRate || 0}%</div>
            </div>

            <div className="admin-gauge">
              <div className="admin-gauge__label">Task Completion</div>
              <div className="admin-gauge__bar">
                <div className="admin-gauge__fill" style={{ width: `${engagement.taskCompletionRate || 0}%` }} />
              </div>
              <div className="admin-gauge__value">{engagement.taskCompletionRate || 0}%</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Goals Completed / Total</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {engagement.completedGoals || 0} / {engagement.totalGoals || 0}
                </div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Tasks Completed / Total</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {engagement.completedTasks || 0} / {engagement.totalTasks || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Wardrobe & Outfits Aggregation */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Shirt size={18} style={{ color: 'var(--color-accent-primary)' }} />
              Wardrobe &amp; Outfit Inventory
            </h2>
          </div>
          <div className="admin-panel__body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {engagement.totalWardrobeItems || 0}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Items ({engagement.avgWardrobePerUser || 0} avg/user)
                </div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {engagement.totalOutfits || 0}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Outfits ({engagement.avgOutfitsPerUser || 0} avg/user)
                </div>
              </div>
            </div>

            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Category Breakdown
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(engagement.wardrobeBreakdown || []).map((w) => (
                <span key={w.category} className="admin-badge admin-badge--gray">
                  {w.category}: <strong>{w.count}</strong>
                </span>
              ))}
              {(!engagement.wardrobeBreakdown || engagement.wardrobeBreakdown.length === 0) && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>No wardrobe items recorded</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Most Saved Styles */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <Palette size={18} style={{ color: 'var(--color-accent-primary)' }} />
              Most Saved Styles
            </h2>
          </div>
          <div className="admin-panel__body">
            {(data.popularStyles || []).length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No styles saved by users yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data.popularStyles.map((s) => (
                  <div
                    key={s.id || s.name}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border-light)' }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{s.name}</span>
                      <span className="admin-badge admin-badge--purple" style={{ marginLeft: 6 }}>{s.category}</span>
                    </div>
                    <span className="admin-badge admin-badge--gold">{s.saves} saves</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Moderation Reports Metrics */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <ShieldAlert size={18} style={{ color: 'var(--color-accent-primary)' }} />
              Moderation Metrics
            </h2>
          </div>
          <div className="admin-panel__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', textAlign: 'center' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-error)' }}>
                  {reports.pending || 0}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Pending</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success)' }}>
                  {reports.resolved || 0}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Resolved</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  {reports.dismissed || 0}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Dismissed</div>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
              {reports.total || 0} total reports filed by community
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
