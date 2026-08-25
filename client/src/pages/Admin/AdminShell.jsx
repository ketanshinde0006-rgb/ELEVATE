import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Tag,
  FolderTree,
  Palette,
  Image as ImageIcon,
  ShieldAlert,
  BarChart3,
  ScrollText,
  Server,
  Menu,
  X,
  Shield,
  ExternalLink,
  LogOut,
  UserCheck,
} from 'lucide-react';
import './AdminShell.css';

const NAV_SECTIONS = [
  {
    title: 'COMMAND',
    items: [
      { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/brands', label: 'Brands', icon: Tag },
      { to: '/admin/fashion?tab=categories', label: 'Fashion Categories', icon: FolderTree },
      { to: '/admin/fashion?tab=styles', label: 'Styles', icon: Palette },
      { to: '/admin/media', label: 'Media', icon: ImageIcon },
    ],
  },
  {
    title: 'MODERATION',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: ShieldAlert },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
      { to: '/admin/system', label: 'System Health', icon: Server },
      { to: '/admin/profile', label: 'Admin Account', icon: UserCheck },
    ],
  },
];

function getBreadcrumb(pathname, search) {
  if (pathname === '/admin') return { section: 'Command', current: 'Overview' };
  if (pathname === '/admin/users') return { section: 'Management', current: 'Users' };
  if (pathname === '/admin/brands') return { section: 'Management', current: 'Brands' };
  if (pathname === '/admin/fashion') {
    const isStyles = search.includes('tab=styles');
    return { section: 'Management', current: isStyles ? 'Styles' : 'Fashion Categories' };
  }
  if (pathname === '/admin/media') return { section: 'Management', current: 'Media Library' };
  if (pathname === '/admin/reports') return { section: 'Moderation', current: 'Reports & Queue' };
  if (pathname === '/admin/analytics') return { section: 'Insights', current: 'Analytics' };
  if (pathname === '/admin/audit') return { section: 'System', current: 'Audit Logs' };
  if (pathname === '/admin/system') return { section: 'System', current: 'System Health' };
  if (pathname === '/admin/profile') return { section: 'System', current: 'Admin Account & Security' };
  return { section: 'Admin', current: 'Console' };
}

function AdminShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breadcrumb = getBreadcrumb(location.pathname, location.search);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      {/* ── Dedicated Admin Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__brand">
            <div className="admin-sidebar__logo">
              <Shield size={20} strokeWidth={2} />
            </div>
            <div className="admin-sidebar__brand-text">
              <div className="admin-sidebar__title">ELEVATE</div>
              <div className="admin-sidebar__subtitle">OPERATIONS</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="admin-nav" aria-label="Admin Navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="admin-nav__section">
              <div className="admin-nav__section-label">{section.title}</div>
              {section.items.map((item) => {
                const isFashionCategories = item.to.includes('tab=categories');
                const isFashionStyles = item.to.includes('tab=styles');
                const isCurrentFashion = location.pathname === '/admin/fashion';

                let isActive = false;
                if (item.end) {
                  isActive = location.pathname === item.to;
                } else if (isFashionCategories) {
                  isActive = isCurrentFashion && (!location.search || location.search.includes('tab=categories'));
                } else if (isFashionStyles) {
                  isActive = isCurrentFashion && location.search.includes('tab=styles');
                } else {
                  isActive = location.pathname.startsWith(item.to);
                }

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    className={`admin-nav__link ${isActive ? 'admin-nav__link--active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="admin-nav__link-icon">
                      <item.icon size={17} strokeWidth={1.8} />
                    </span>
                    <span className="admin-nav__link-text">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Admin User Footer — Click through to Admin Account */}
        <div className="admin-sidebar__footer">
          <div
            className="admin-sidebar__user"
            onClick={() => { setSidebarOpen(false); navigate('/admin/profile'); }}
            style={{ cursor: 'pointer' }}
            title="Open Admin Account & Security"
          >
            <div className="admin-sidebar__avatar">
              {user?.firstName?.charAt(0) || 'A'}
            </div>
            <div className="admin-sidebar__user-info">
              <div className="admin-sidebar__user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="admin-sidebar__user-role">Administrator</div>
            </div>
            <button
              className="admin-sidebar__logout-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Dedicated Admin Content Area ── */}
      <div className="admin-content-wrap">
        {/* Admin Header Bar */}
        <header className="admin-header">
          <div className="admin-header__left">
            <button
              className="admin-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle admin sidebar"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <nav className="admin-breadcrumb" aria-label="Breadcrumb">
              <span className="admin-breadcrumb__root">Operations</span>
              <span className="admin-breadcrumb__sep">/</span>
              <span className="admin-breadcrumb__section">{breadcrumb.section}</span>
              <span className="admin-breadcrumb__sep">/</span>
              <span className="admin-breadcrumb__current">{breadcrumb.current}</span>
            </nav>
          </div>

          <div className="admin-header__right">
            <div className="admin-header__status">
              <span className="admin-status-dot admin-status-dot--online" />
              <span className="admin-header__status-text">System Online</span>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-header__link-btn"
              title="Open Public Application"
            >
              <ExternalLink size={14} />
              <span>View Public App</span>
            </a>
          </div>
        </header>

        {/* Main Admin Workspace */}
        <main className="admin-workspace">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
