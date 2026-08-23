import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  ListChecks, 
  Flame, 
  Shirt, 
  Layers, 
  Lightbulb, 
  BookOpen, 
  Calendar,
  CheckCircle2,
  Circle,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import './Dashboard.css';

function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.dashboard.get();
        setData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container text-center" style={{ paddingTop: 'var(--space-20)' }}>
          <h2>Unable to Load Dashboard</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 'var(--space-4) 0' }}>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: 'Active Goals', value: data?.stats?.activeGoals || 0, link: '/personal-development?tab=goals' },
    { label: 'Pending Tasks', value: data?.stats?.pendingTasks || 0, link: '/personal-development?tab=tasks' },
    { label: 'Best Habit Streak', value: `${data?.stats?.bestStreak || 0}d`, link: '/personal-development?tab=habits' },
    { label: 'Wardrobe Items', value: data?.stats?.wardrobeCount || 0, link: '/wardrobe' },
    { label: 'Outfits Created', value: data?.stats?.outfitCount || 0, link: '/outfits' },
    { label: 'Saved Styles', value: data?.stats?.savedStylesCount || 0, link: '/fashion' },
  ];

  return (
    <div className="page editorial-dashboard">
      <div className="container">
        {/* Editorial Greeting Header */}
        <div className="dash-header">
          <div>
            <span className="editorial-eyebrow">Personal Growth & Style Overview</span>
            <h1 className="dash-greeting-title">{greeting}, {user?.firstName || 'Friend'}</h1>
          </div>
          <div className="dash-header-right">
            <span className="dash-date-badge">
              <Calendar size={13} strokeWidth={2} style={{ marginRight: 6 }} />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="dash-quick-bar">
          <span className="dash-quick-bar__label">Quick Actions:</span>
          <div className="dash-quick-pills">
            <Link to="/personal-development?tab=goals" className="dash-pill">
              <Plus size={13} style={{ marginRight: 4 }} /> Goal
            </Link>
            <Link to="/personal-development?tab=tasks" className="dash-pill">
              <Plus size={13} style={{ marginRight: 4 }} /> Task
            </Link>
            <Link to="/personal-development?tab=habits" className="dash-pill">
              <Flame size={13} style={{ marginRight: 4 }} /> Habits
            </Link>
            <Link to="/wardrobe" className="dash-pill">
              <Plus size={13} style={{ marginRight: 4 }} /> Wardrobe Item
            </Link>
            <Link to="/outfits" className="dash-pill">
              <Layers size={13} style={{ marginRight: 4 }} /> Plan Outfit
            </Link>
            <Link to="/recommendations" className="dash-pill dash-pill--highlight">
              <Lightbulb size={13} style={{ marginRight: 4 }} /> Recommendations
            </Link>
          </div>
        </div>

        {/* Compact Ticker Metric Bar */}
        <div className="dash-ticker-bar">
          {metrics.map(m => (
            <Link key={m.label} to={m.link} className="dash-ticker-item">
              <span className="dash-ticker-val">{m.value}</span>
              <span className="dash-ticker-lbl">{m.label}</span>
            </Link>
          ))}
        </div>

        {/* Notifications Ribbon if any */}
        {data?.notifications?.length > 0 && (
          <div className="dash-notif-ribbon">
            <span className="dash-notif-badge">Updates ({data.notifications.length})</span>
            <div className="dash-notif-list">
              {data.notifications.slice(0, 2).map(n => (
                <span key={n.id} className="dash-notif-item">
                  <strong>•</strong> {n.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Two-Column Structured Workspace */}
        <div className="dash-workspace-grid">
          {/* Left Column: Goals & Habits */}
          <div className="dash-col">
            {/* Active Goals Section */}
            <section className="dash-section-panel">
              <div className="dash-panel-header">
                <div>
                  <h3 className="dash-panel-title">Active Goals</h3>
                  <p className="dash-panel-subtitle">Target progression & milestones</p>
                </div>
                <Link to="/personal-development?tab=goals" className="dash-panel-link">Manage Goals →</Link>
              </div>

              <div className="dash-goals-list">
                {data?.goals?.length > 0 ? (
                  data.goals.map(g => (
                    <div key={g.id} className="dash-goal-row">
                      <div className="dash-goal-info">
                        <span className="dash-goal-name">{g.title}</span>
                        <span className="dash-goal-pct">{g.progress}%</span>
                      </div>
                      <div className="dash-progress-track">
                        <div className="dash-progress-fill" style={{ width: `${g.progress}%` }} />
                      </div>
                      {g.deadline && (
                        <span className="dash-goal-due">Target: {new Date(g.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="dash-empty-text">No active goals yet. <Link to="/personal-development?tab=goals">Set a goal</Link> to start tracking progress.</p>
                )}
              </div>
            </section>

            {/* Daily Habits Tracker */}
            <section className="dash-section-panel">
              <div className="dash-panel-header">
                <div>
                  <h3 className="dash-panel-title">Daily Habits Routine</h3>
                  <p className="dash-panel-subtitle">Consistency and momentum</p>
                </div>
                <Link to="/personal-development?tab=habits" className="dash-panel-link">Habit Board →</Link>
              </div>

              <div className="dash-habits-list">
                {data?.habitsToday?.length > 0 ? (
                  data.habitsToday.map(h => (
                    <div key={h.id} className="dash-habit-row">
                      <div className="dash-habit-left">
                        {h.done ? (
                          <CheckCircle2 size={18} className="dash-habit-check-icon--done" />
                        ) : (
                          <Circle size={18} className="dash-habit-check-icon--pending" />
                        )}
                        <span className="dash-habit-title">{h.name}</span>
                      </div>
                      <span className="dash-habit-streak-pill">
                        <Flame size={13} strokeWidth={2} /> {h.streak}d streak
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="dash-empty-text">No habits tracked yet. <Link to="/personal-development?tab=habits">Create a habit</Link>.</p>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Upcoming Agenda & Journal Activity */}
          <div className="dash-col">
            {/* Upcoming Tasks Agenda */}
            <section className="dash-section-panel">
              <div className="dash-panel-header">
                <div>
                  <h3 className="dash-panel-title">Upcoming Tasks</h3>
                  <p className="dash-panel-subtitle">Prioritized actionable checklist</p>
                </div>
                <Link to="/personal-development?tab=tasks" className="dash-panel-link">All Tasks →</Link>
              </div>

              <div className="dash-tasks-list">
                {data?.upcomingTasks?.length > 0 ? (
                  data.upcomingTasks.map(t => (
                    <div key={t.id} className="dash-task-row">
                      <span className={`dash-priority-dot dash-priority-dot--${t.priority?.toLowerCase() || 'medium'}`} />
                      <div className="dash-task-main">
                        <span className="dash-task-title">{t.title}</span>
                        {t.dueDate && (
                          <span className="dash-task-date">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      <Badge variant={t.priority === 'HIGH' ? 'error' : t.priority === 'MEDIUM' ? 'warning' : 'info'} size="sm">
                        {t.priority}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="dash-empty-text">All tasks completed! <Link to="/personal-development?tab=tasks">Add new tasks</Link>.</p>
                )}
              </div>
            </section>

            {/* Reflection & Journal Timeline */}
            <section className="dash-section-panel">
              <div className="dash-panel-header">
                <div>
                  <h3 className="dash-panel-title">Reflections & Journal</h3>
                  <p className="dash-panel-subtitle">Recent entries & mindset log</p>
                </div>
                <Link to="/personal-development?tab=journal" className="dash-panel-link">Journal →</Link>
              </div>

              <div className="dash-journal-list">
                {data?.recentJournal?.length > 0 ? (
                  data.recentJournal.map(j => (
                    <div key={j.id} className="dash-journal-row">
                      <span className="dash-journal-mood">
                        <BookOpen size={16} strokeWidth={1.8} />
                      </span>
                      <div className="dash-journal-content">
                        <span className="dash-journal-title">{j.title}</span>
                        <p className="dash-journal-snippet">{j.content}</p>
                        <span className="dash-journal-date">{new Date(j.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="dash-empty-text">No reflections recorded. <Link to="/personal-development?tab=journal">Write an entry</Link>.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
