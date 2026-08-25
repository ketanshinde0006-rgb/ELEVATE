import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  LayoutDashboard, 
  User, 
  Lightbulb, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  UserPlus, 
  X,
  Target,
  ListChecks,
  Flame,
  Brain,
  NotebookPen,
  TrendingUp,
  Sparkles,
  Tag
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './Navbar.css';

const DEVELOP_LINKS = [
  { label: 'Goals', tab: 'goals', desc: 'Define & achieve targets', icon: Target },
  { label: 'Tasks', tab: 'tasks', desc: 'Daily actionable items', icon: ListChecks },
  { label: 'Habits', tab: 'habits', desc: 'Build streaks & routines', icon: Flame },
  { label: 'Skills', tab: 'skills', desc: 'Milestones & mastery', icon: Brain },
  { label: 'Journal', tab: 'journal', desc: 'Reflections & mood log', icon: NotebookPen },
  { label: 'Progress', path: '/dashboard', desc: 'Comprehensive growth overview', icon: TrendingUp },
];

const FASHION_LINKS = [
  { label: 'Style Discovery', path: '/fashion', desc: 'Explore curated fashion aesthetics', icon: Sparkles },
  { label: 'Brand Directory', path: '/brands', desc: 'Global fashion houses & labels', icon: Tag },
  { label: 'Recommendations', path: '/recommendations', desc: 'Personalized style picks', icon: Lightbulb },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [developDropdownOpen, setDevelopDropdownOpen] = useState(false);
  const [fashionDropdownOpen, setFashionDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setDevelopDropdownOpen(false);
        setFashionDropdownOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setDevelopDropdownOpen(false);
    setFashionDropdownOpen(false);
  }, [location.pathname, location.search]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setMobileOpen(false);
      setUserMenuOpen(false);
      setDevelopDropdownOpen(false);
      setFashionDropdownOpen(false);
      setSearchOpen(false);
    }
  }, []);

  useEffect(() => {
    if (mobileOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/fashion?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isDevelopActive = location.pathname.startsWith('/personal-development');
  const isFashionActive = location.pathname === '/fashion' || location.pathname === '/brands' || location.pathname === '/recommendations';

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} ref={navRef} onKeyDown={handleKeyDown}>
      <div className="navbar__container">
        {/* Left: Brand Logo + Tagline */}
        <Link to="/" className="navbar__brand" aria-label="ELEVATE Home">
          <svg className="navbar__brand-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" fill="#C5A880" />
            <circle cx="12" cy="12" r="1.5" fill="#161514" />
          </svg>
          <div className="navbar__brand-text-wrap">
            <span className="navbar__brand-title">E L E V A T E</span>
            <span className="navbar__brand-tagline">GROW. IMPROVE. EXPRESS.</span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="navbar__nav hide-tablet-down" aria-label="Main navigation">
          <ul className="navbar__links">
            <li>
              <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'navbar__link--active' : ''}`}>
                Home
              </Link>
            </li>

            {/* Self Development Dropdown */}
            <li
              className="navbar__dropdown-wrapper"
              onMouseEnter={() => setDevelopDropdownOpen(true)}
              onMouseLeave={() => setDevelopDropdownOpen(false)}
            >
              <Link
                to="/personal-development"
                className={`navbar__link navbar__link--has-dropdown ${isDevelopActive ? 'navbar__link--active' : ''}`}
                aria-expanded={developDropdownOpen}
              >
                Self Development <span className="navbar__chevron">⌵</span>
              </Link>

              {developDropdownOpen && (
                <div className="navbar__megamenu animate-fade-in-down">
                  <div className="navbar__megamenu-grid">
                    {DEVELOP_LINKS.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.path || `/personal-development?tab=${item.tab}`}
                          className="navbar__megamenu-item"
                          onClick={() => setDevelopDropdownOpen(false)}
                        >
                          <span className="navbar__megamenu-label">
                            <Icon size={14} strokeWidth={1.8} style={{ marginRight: 6 }} />
                            {item.label}
                          </span>
                          <span className="navbar__megamenu-desc">{item.desc}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </li>

            {/* Fashion & Style Dropdown */}
            <li
              className="navbar__dropdown-wrapper"
              onMouseEnter={() => setFashionDropdownOpen(true)}
              onMouseLeave={() => setFashionDropdownOpen(false)}
            >
              <Link
                to="/fashion"
                className={`navbar__link navbar__link--has-dropdown ${isFashionActive ? 'navbar__link--active' : ''}`}
                aria-expanded={fashionDropdownOpen}
              >
                Fashion & Style <span className="navbar__chevron">⌵</span>
              </Link>

              {fashionDropdownOpen && (
                <div className="navbar__megamenu animate-fade-in-down">
                  <div className="navbar__megamenu-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {FASHION_LINKS.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.path}
                          className="navbar__megamenu-item"
                          onClick={() => setFashionDropdownOpen(false)}
                        >
                          <span className="navbar__megamenu-label">
                            <Icon size={14} strokeWidth={1.8} style={{ marginRight: 6 }} />
                            {item.label}
                          </span>
                          <span className="navbar__megamenu-desc">{item.desc}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </li>

            <li>
              <Link to="/wardrobe" className={`navbar__link ${location.pathname === '/wardrobe' ? 'navbar__link--active' : ''}`}>
                Wardrobe
              </Link>
            </li>

            <li>
              <Link to="/outfits" className={`navbar__link ${location.pathname === '/outfits' ? 'navbar__link--active' : ''}`}>
                Outfit Planner
              </Link>
            </li>

            <li>
              <Link to="/community" className={`navbar__link ${location.pathname === '/community' ? 'navbar__link--active' : ''}`}>
                Community
              </Link>
            </li>

            <li>
              <Link to="/about" className={`navbar__link ${location.pathname === '/about' ? 'navbar__link--active' : ''}`}>
                About Us
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right: Search, Notification, Profile Avatar */}
        <div className="navbar__actions hide-tablet-down">
          {/* Search Button */}
          <button
            className="navbar__icon-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
            type="button"
          >
            <Search size={18} strokeWidth={2} />
          </button>

          {/* Notification Bell with red dot */}
          <Link to="/dashboard" className="navbar__icon-btn navbar__bell-btn" aria-label="Notifications">
            <Bell size={18} strokeWidth={2} />
            <span className="navbar__bell-dot" />
          </Link>

          {/* User Profile Avatar with dropdown */}
          <div className="navbar__user-menu-wrapper">
            <button
              className="navbar__avatar-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-label="User menu"
              type="button"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.firstName || 'User Avatar'}
                  className="navbar__avatar-img"
                />
              ) : (
                <div className="navbar__avatar-placeholder">
                  {user?.firstName ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}` : <User size={16} strokeWidth={2} />}
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div className="navbar__user-dropdown animate-fade-in-down">
                {isAuthenticated ? (
                  <>
                    <div className="navbar__user-info">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span className="navbar__user-full-name">{user?.firstName} {user?.lastName}</span>
                        {isAdmin && (
                          <span style={{ fontSize: '10px', background: 'rgba(197, 168, 128, 0.2)', color: 'var(--color-accent-primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em' }}>
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="navbar__user-email">{user?.email}</span>
                    </div>
                    <hr className="navbar__dropdown-divider" />

                    {isAdmin ? (
                      /* Admin Specific Navigation */
                      <>
                        <Link to="/admin" className="navbar__dropdown-item navbar__dropdown-item--admin" onClick={() => setUserMenuOpen(false)}>
                          <span className="navbar__dropdown-icon-box">
                            <ShieldCheck size={15} strokeWidth={1.8} />
                          </span>
                          <span className="navbar__dropdown-text">Operations Command</span>
                        </Link>
                        <Link to="/admin/profile" className="navbar__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <span className="navbar__dropdown-icon-box">
                            <User size={15} strokeWidth={1.8} />
                          </span>
                          <span className="navbar__dropdown-text">Admin Account & Security</span>
                        </Link>
                      </>
                    ) : (
                      /* Normal User Lifestyle Navigation */
                      <>
                        <Link to="/dashboard" className="navbar__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <span className="navbar__dropdown-icon-box">
                            <LayoutDashboard size={15} strokeWidth={1.8} />
                          </span>
                          <span className="navbar__dropdown-text">Dashboard</span>
                        </Link>
                        <Link to="/profile" className="navbar__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <span className="navbar__dropdown-icon-box">
                            <User size={15} strokeWidth={1.8} />
                          </span>
                          <span className="navbar__dropdown-text">Profile & Settings</span>
                        </Link>
                        <Link to="/recommendations" className="navbar__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <span className="navbar__dropdown-icon-box">
                            <Lightbulb size={15} strokeWidth={1.8} />
                          </span>
                          <span className="navbar__dropdown-text">Recommendations</span>
                        </Link>
                      </>
                    )}

                    <hr className="navbar__dropdown-divider" />
                    <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={() => { setUserMenuOpen(false); handleLogout(); }}>
                      <span className="navbar__dropdown-icon-box">
                        <LogOut size={15} strokeWidth={1.8} />
                      </span>
                      <span className="navbar__dropdown-text">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="navbar__user-info">
                      <span className="navbar__user-full-name">Welcome to ELEVATE</span>
                      <span className="navbar__user-email">Guest Mode</span>
                    </div>
                    <hr className="navbar__dropdown-divider" />
                    <Link to="/login" className="navbar__dropdown-item">
                      <span className="navbar__dropdown-icon-box">
                        <LogIn size={15} strokeWidth={1.8} />
                      </span>
                      <span className="navbar__dropdown-text">Sign In</span>
                    </Link>
                    <Link to="/register" className="navbar__dropdown-item">
                      <span className="navbar__dropdown-icon-box">
                        <UserPlus size={15} strokeWidth={1.8} />
                      </span>
                      <span className="navbar__dropdown-text">Create Account</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hamburger for mobile */}
        <button
          className={`navbar__hamburger hide-desktop ${mobileOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          type="button"
        >
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
        </button>
      </div>

      {/* Quick Search Overlay Modal */}
      {searchOpen && (
        <div className="navbar__search-overlay animate-fade-in-down" onClick={() => setSearchOpen(false)}>
          <form className="navbar__search-form" onSubmit={handleSearchSubmit} onClick={e => e.stopPropagation()}>
            <input
              type="text"
              className="navbar__search-input"
              placeholder="Search styles, brands, wardrobe pieces..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="navbar__search-submit">Search</button>
            <button type="button" className="navbar__search-close" onClick={() => setSearchOpen(false)}>
              <X size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="navbar__mobile-overlay" onClick={() => setMobileOpen(false)}>
          <nav id="mobile-menu" className="navbar__mobile-menu" aria-label="Mobile navigation" onClick={(e) => e.stopPropagation()}>
            <ul className="navbar__mobile-links">
              <li><Link to="/" className="navbar__mobile-link">Home</Link></li>
              
              <li className="navbar__mobile-group">
                <span className="navbar__mobile-group-title">Self Development</span>
                <div className="navbar__mobile-sublinks">
                  {DEVELOP_LINKS.map(item => (
                    <Link
                      key={item.label}
                      to={item.path || `/personal-development?tab=${item.tab}`}
                      className="navbar__mobile-sublink"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </li>

              <li className="navbar__mobile-group">
                <span className="navbar__mobile-group-title">Fashion & Style</span>
                <div className="navbar__mobile-sublinks">
                  {FASHION_LINKS.map(item => (
                    <Link key={item.label} to={item.path} className="navbar__mobile-sublink">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </li>

              <li><Link to="/wardrobe" className="navbar__mobile-link">Wardrobe</Link></li>
              <li><Link to="/outfits" className="navbar__mobile-link">Outfit Planner</Link></li>
              <li><Link to="/community" className="navbar__mobile-link">Community</Link></li>
              <li><Link to="/about" className="navbar__mobile-link">About Us</Link></li>
              <li><Link to="/dashboard" className="navbar__mobile-link">Dashboard</Link></li>

              {isAuthenticated && (
                <>
                  <li className="navbar__mobile-divider" />
                  <li><Link to="/recommendations" className="navbar__mobile-link">Recommendations</Link></li>
                  <li><Link to="/profile" className="navbar__mobile-link">Profile Settings</Link></li>
                  {isAdmin && <li><Link to="/admin" className="navbar__mobile-link navbar__mobile-link--admin">Admin Console</Link></li>}
                </>
              )}
            </ul>

            <div className="navbar__mobile-auth">
              {isAuthenticated ? (
                <button className="btn btn--secondary btn--full" onClick={handleLogout}>Sign Out ({user?.firstName})</button>
              ) : (
                <>
                  <Link to="/login" className="btn btn--secondary btn--full">Sign In</Link>
                  <Link to="/register" className="btn btn--primary btn--full">Get Started</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
