import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Check } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './HomePage.css';

/* ── Clean SVG Icons (Zero Emojis) ── */
const TargetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const FlameIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.5-1-2.5-2-3.5-1 1-1.5 2-1.5 3.5Z" />
    <path d="M12 2c-.5 2.5-3 5-4.5 7.5A6 6 0 0 0 6 13a6 6 0 0 0 12 0c0-2.5-1.5-5-3.5-7.5C13.5 4.5 12.5 3 12 2Z" />
  </svg>
);

const BrainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

const ShirtIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23Z" />
  </svg>
);

const HangerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4a2 2 0 0 0-2 2c0 .74.4 1.39 1 1.73V9L3.5 14.5a1 1 0 0 0 .5 1.5h16a1 1 0 0 0 .5-1.5L13 9V7.73A2 2 0 0 0 12 4Z" />
  </svg>
);

const JournalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M8 6h8" />
    <path d="M8 10h8" />
    <path d="M8 14h5" />
  </svg>
);

const QuoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2 0 4-2 6-3 8Z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2 0 4-2 6-3 8Z" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#E5484D" : "none"} stroke={filled ? "#E5484D" : "#FAF8F5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const CrownSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#C5A880">
    <path d="M2 19h20v2H2zM3 5l4 6 5-7 5 7 4-6v11H3z" />
  </svg>
);

/* ── 10 Curated Editorial Fashion Categories ── */
const FASHION_CATEGORIES = [
  { name: 'Best for Formal', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop&q=80', path: '/fashion?category=Classic' },
  { name: 'Aesthetic Brands', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&h=300&fit=crop&q=80', path: '/fashion?category=Creative' },
  { name: 'Shirts', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop&q=80', path: '/fashion?category=Everyday' },
  { name: 'T-Shirts', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&h=300&fit=crop&q=80', path: '/fashion?category=Everyday' },
  { name: 'Long Sleeve / Layered', image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=300&h=300&fit=crop&q=80', path: '/fashion?category=Streetwear' },
  { name: 'Sneakers', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop&q=80', path: '/fashion?category=Streetwear' },
  { name: 'Shoes', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop&q=80', path: '/fashion?category=Everyday' },
  { name: 'Formal Shoes', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=300&fit=crop&q=80', path: '/fashion?category=Classic' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&q=80', path: '/wardrobe' },
  { name: 'Bags & More', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop&q=80', path: '/wardrobe' },
];

const BRAND_TABS = ['Formal', 'Aesthetic', 'Shirts', 'T-Shirts', 'Sneakers', 'Shoes'];

const BRANDS_DATA = [
  {
    name: 'Louis Philippe',
    rating: '4.8',
    tag: 'Premium Formal',
    type: 'crown',
  },
  {
    name: 'Van Heusen',
    rating: '4.6',
    tag: 'Smart & Classy',
    type: 'vh',
  },
  {
    name: 'Zudio',
    rating: '4.5',
    tag: 'Budget Friendly',
    type: 'zudio',
  },
  {
    name: 'H&M',
    rating: '4.4',
    tag: 'Trendy & Modern',
    type: 'hm',
  },
  {
    name: 'Uniqlo',
    rating: '4.7',
    tag: 'Minimal & Clean',
    type: 'uniqlo',
  },
];

const STYLE_PICKS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=650&fit=crop&q=80', title: 'Urban Monochrome' },
  { id: 2, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=650&fit=crop&q=80', title: 'Coastal Linen' },
  { id: 3, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=650&fit=crop&q=80', title: 'Contemporary Dark' },
];

const QUICK_ACTIONS = [
  { label: 'Add Goal', icon: <TargetIcon />, path: '/personal-development?tab=goals' },
  { label: 'Track Habit', icon: <FlameIcon />, path: '/personal-development?tab=habits' },
  { label: 'Add Outfit', icon: <ShirtIcon />, path: '/outfits' },
  { label: 'Wardrobe', icon: <HangerIcon />, path: '/wardrobe' },
  { label: 'Style Journal', icon: <JournalIcon />, path: '/personal-development?tab=journal' },
  { label: 'Daily Quote', icon: <QuoteIcon />, path: '/dashboard' },
];

const HABIT_DAYS = [
  { day: 'Mon', state: 'done' },
  { day: 'Tue', state: 'done' },
  { day: 'Wed', state: 'done' },
  { day: 'Thu', state: 'active' },
  { day: 'Fri', state: 'pending' },
  { day: 'Sat', state: 'pending' },
  { day: 'Sun', state: 'pending' },
];

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeBrandTab, setActiveBrandTab] = useState('Formal');
  const [favorites, setFavorites] = useState([1]);

  useEffect(() => {
    if (isAuthenticated) {
      api.dashboard.get()
        .then(res => setDashboardData(res.data))
        .catch(() => {});
    } else {
      setDashboardData(null);
    }
  }, [isAuthenticated]);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // Dynamic calculations for authenticated users (fresh start from 0 for new accounts)
  const hasUserData = isAuthenticated && dashboardData;
  const activeGoalsCount = dashboardData?.stats?.activeGoals ?? 0;
  const bestStreak = dashboardData?.stats?.bestStreak ?? 0;
  const wardrobeCount = dashboardData?.stats?.wardrobeCount ?? 0;
  const outfitCount = dashboardData?.stats?.outfitCount ?? 0;

  const goalsPct = hasUserData
    ? (dashboardData.goals?.length > 0
        ? Math.round(dashboardData.goals.reduce((acc, g) => acc + (g.progress || 0), 0) / dashboardData.goals.length)
        : 0)
    : 75;

  const habitsPct = hasUserData
    ? (dashboardData.habitsToday?.length > 0
        ? Math.round((dashboardData.habitsToday.filter(h => h.done).length / dashboardData.habitsToday.length) * 100)
        : (bestStreak > 0 ? Math.min(bestStreak * 15, 100) : 0))
    : 82;

  const skillsPct = hasUserData
    ? (dashboardData.stats?.skillsCount ? Math.min(dashboardData.stats.skillsCount * 20, 100) : 0)
    : 60;

  const stylePct = hasUserData
    ? (wardrobeCount > 0 || outfitCount > 0 ? Math.min((wardrobeCount * 10) + (outfitCount * 15), 100) : 0)
    : 90;

  const overallPct = hasUserData
    ? Math.round((goalsPct + habitsPct + skillsPct + stylePct) / 4)
    : 76;

  const overallSub = hasUserData
    ? (overallPct === 0 ? 'Start your journey today!' : overallPct < 50 ? 'Building momentum every day!' : "Keep pushing, you're doing great!")
    : "Keep pushing, you're doing great!";

  // Calculate dynamic habit streak week
  const todayDayIndex = (new Date().getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const dynamicHabitDays = hasUserData
    ? dayNames.map((name, idx) => {
        if (idx < todayDayIndex) {
          return { day: name, state: bestStreak > (todayDayIndex - idx) ? 'done' : 'pending' };
        } else if (idx === todayDayIndex) {
          const todayDone = dashboardData.habitsToday?.some(h => h.done);
          return { day: name, state: todayDone ? 'done' : 'active' };
        } else {
          return { day: name, state: 'pending' };
        }
      })
    : HABIT_DAYS;

  return (
    <div className="elevate-homepage">
      <div className="elevate-container">

        {/* ══════════════════════════════════════════════════════════
            1. LARGE HERO BANNER
            ══════════════════════════════════════════════════════════ */}
        <section className="exact-hero">
          {/* Background image & gradient overlay */}
          <div className="exact-hero__bg">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&h=800&fit=crop&q=85"
              alt="ELEVATE Hero Fashion"
              className="exact-hero__img"
            />
            <div className="exact-hero__gradient" />
          </div>

          {/* Hero Left Content */}
          <div className="exact-hero__content">
            <h1 className="exact-hero__headline">
              Build Yourself.<br />
              Define Your <span className="exact-hero__headline-style">Style.</span>
            </h1>

            <p className="exact-hero__subheadline">
              Track your growth, improve your daily habits,<br />
              and discover your perfect style — all in one place.
            </p>

            <div className="exact-hero__actions">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="exact-hero__btn-primary">
                    Go to Dashboard <span className="exact-hero__btn-arrow">→</span>
                  </Link>
                  <Link to="/fashion" className="exact-hero__btn-secondary">
                    Explore More
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="exact-hero__btn-primary">
                    Start Your Journey <span className="exact-hero__btn-arrow">→</span>
                  </Link>
                  <Link to="/fashion" className="exact-hero__btn-secondary">
                    Explore More
                  </Link>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className="exact-hero__social-proof">
              <div className="exact-hero__avatars">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&q=80" alt="User 1" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80" alt="User 2" />
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&q=80" alt="User 3" />
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&q=80" alt="User 4" />
              </div>
              <div className="exact-hero__social-text-wrap">
                <span className="exact-hero__social-text">10,000+ users growing every day</span>
                <svg className="exact-hero__squiggle" viewBox="0 0 100 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5.5C12 2 24 7 36 3.5C48 1 60 6 72 3.5C84 1 93 4 99 2" stroke="#C5A880" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Hero Right Floating Quote Card */}
          <div className="exact-hero__quote-card">
            <span className="exact-hero__quote-mark">“</span>
            <p className="exact-hero__quote-text">
              You don't need<br />
              to be perfect,<br />
              just consistent.
            </p>
            <span className="exact-hero__quote-signature">Keep going.</span>
          </div>

          {/* Hero Carousel Dots */}
          <div className="exact-hero__dots">
            <span className="exact-hero__dot exact-hero__dot--active" />
            <span className="exact-hero__dot" />
            <span className="exact-hero__dot" />
            <span className="exact-hero__dot" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            2. EXPLORE FASHION CATEGORIES STRIP
            ══════════════════════════════════════════════════════════ */}
        <section className="exact-section exact-categories-strip">
          <div className="exact-section__header">
            <h2 className="exact-section__title">Explore Fashion Categories</h2>
            <Link to="/fashion" className="exact-section__link">View All Categories →</Link>
          </div>

          <div className="exact-categories-row">
            {FASHION_CATEGORIES.map(cat => (
              <Link key={cat.name} to={cat.path} className="exact-cat-item">
                <div className="exact-cat-item__img-wrap">
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                </div>
                <span className="exact-cat-item__label">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            3. MAIN LOWER GRID (3 Columns)
            ══════════════════════════════════════════════════════════ */}
        <section className="exact-three-col-grid">

          {/* Column 1: Your Growth Today */}
          <div className="exact-box exact-growth-box">
            <div className="exact-section__header">
              <h3 className="exact-box__title">Your Growth Today</h3>
              <Link to="/personal-development" className="exact-section__link">View All →</Link>
            </div>

            <div className="exact-growth-body">
              {/* Left progress bars */}
              <div className="exact-growth-bars">
                <div className="exact-growth-row">
                  <div className="exact-icon-container">
                    <TargetIcon />
                  </div>
                  <span className="exact-growth-row__label">Goals</span>
                  <div className="exact-growth-row__bar-track">
                    <div className="exact-growth-row__bar-fill exact-growth-row__bar-fill--gold" style={{ width: `${goalsPct}%` }} />
                  </div>
                  <span className="exact-growth-row__pct">{goalsPct}%</span>
                </div>

                <div className="exact-growth-row">
                  <div className="exact-icon-container">
                    <FlameIcon />
                  </div>
                  <span className="exact-growth-row__label">Habits</span>
                  <div className="exact-growth-row__bar-track">
                    <div className="exact-growth-row__bar-fill exact-growth-row__bar-fill--gold" style={{ width: `${habitsPct}%` }} />
                  </div>
                  <span className="exact-growth-row__pct">{habitsPct}%</span>
                </div>

                <div className="exact-growth-row">
                  <div className="exact-icon-container">
                    <BrainIcon />
                  </div>
                  <span className="exact-growth-row__label">Skills</span>
                  <div className="exact-growth-row__bar-track">
                    <div className="exact-growth-row__bar-fill exact-growth-row__bar-fill--lavender" style={{ width: `${skillsPct}%` }} />
                  </div>
                  <span className="exact-growth-row__pct">{skillsPct}%</span>
                </div>

                <div className="exact-growth-row">
                  <div className="exact-icon-container">
                    <ShirtIcon />
                  </div>
                  <span className="exact-growth-row__label">Style</span>
                  <div className="exact-growth-row__bar-track">
                    <div className="exact-growth-row__bar-fill exact-growth-row__bar-fill--lavender" style={{ width: `${stylePct}%` }} />
                  </div>
                  <span className="exact-growth-row__pct">{stylePct}%</span>
                </div>
              </div>

              {/* Right circular progress gauge */}
              <div className="exact-growth-gauge">
                <div className="exact-gauge-circle">
                  <svg className="exact-gauge-svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" className="exact-gauge-bg" />
                    <circle cx="50" cy="50" r="44" className="exact-gauge-fill" strokeDasharray="276" strokeDashoffset={276 - (276 * overallPct) / 100} />
                  </svg>
                  <div className="exact-gauge-content">
                    <span className="exact-gauge-lbl">Overall Progress</span>
                    <span className="exact-gauge-pct">{overallPct}%</span>
                    <span className="exact-gauge-sub">{overallSub}</span>
                  </div>
                </div>
                <Link to="/dashboard" className="exact-gauge-action-btn" aria-label="Go to Dashboard">
                  →
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: Top Brand Recommendations */}
          <div className="exact-box exact-brands-box">
            <div className="exact-section__header">
              <h3 className="exact-box__title">Top Brand Recommendations</h3>
              <Link to="/brands" className="exact-section__link">View All →</Link>
            </div>

            {/* Filter Pills */}
            <div className="exact-brand-pills">
              {BRAND_TABS.map(tab => (
                <button
                  key={tab}
                  className={`exact-brand-pill ${activeBrandTab === tab ? 'exact-brand-pill--active' : ''}`}
                  onClick={() => setActiveBrandTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Brands Cards Row */}
            <div className="exact-brands-row">
              {BRANDS_DATA.map(brand => (
                <Link key={brand.name} to="/brands" className="exact-brand-card">
                  <div className="exact-brand-card__logo-wrap">
                    {brand.type === 'crown' && (
                      <CrownSvg />
                    )}
                    {brand.type === 'vh' && (
                      <span className="exact-brand-logo-text exact-brand-logo-text--vh">V</span>
                    )}
                    {brand.type === 'zudio' && (
                      <span className="exact-brand-logo-text exact-brand-logo-text--zudio">ZUDIO</span>
                    )}
                    {brand.type === 'hm' && (
                      <span className="exact-brand-logo-text exact-brand-logo-text--hm">H&M</span>
                    )}
                    {brand.type === 'uniqlo' && (
                      <div className="exact-brand-logo-text exact-brand-logo-text--uniqlo">
                        <span>UNI</span>
                        <span>QLO</span>
                      </div>
                    )}
                  </div>
                  <span className="exact-brand-card__name">{brand.name}</span>
                  <div className="exact-brand-card__rating">
                    <Star size={10} fill="#C5A880" color="#C5A880" style={{ marginRight: 2 }} />
                    {brand.rating}
                  </div>
                  <span className="exact-brand-card__tag">{brand.tag}</span>
                </Link>
              ))}
            </div>

            {/* Carousel Dots */}
            <div className="exact-carousel-dots">
              <span className="exact-mini-dot exact-mini-dot--active" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
            </div>
          </div>

          {/* Column 3: Your Style Picks */}
          <div className="exact-box exact-picks-box">
            <div className="exact-section__header">
              <h3 className="exact-box__title">Your Style Picks</h3>
              <Link to="/fashion" className="exact-section__link">View All →</Link>
            </div>

            {/* 3 Vertical Look Cards */}
            <div className="exact-picks-grid">
              {STYLE_PICKS.map(item => (
                <div key={item.id} className="exact-pick-card">
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <button
                    className="exact-pick-fav-btn"
                    onClick={() => toggleFavorite(item.id)}
                    aria-label="Favorite style"
                  >
                    <HeartIcon filled={favorites.includes(item.id)} />
                  </button>
                </div>
              ))}
            </div>

            {/* Carousel Dots */}
            <div className="exact-carousel-dots">
              <span className="exact-mini-dot exact-mini-dot--active" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
              <span className="exact-mini-dot" />
            </div>
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════
            4. BOTTOM ROW (Quick Actions | Habit Streak | Editorial Quote)
            ══════════════════════════════════════════════════════════ */}
        <section className="exact-bottom-row">

          {/* Bottom Left: Quick Actions */}
          <div className="exact-box exact-quick-actions-box">
            <div className="exact-section__header">
              <h3 className="exact-box__title">Quick Actions</h3>
              <Link to="/dashboard" className="exact-section__link">Customize →</Link>
            </div>

            <div className="exact-quick-actions-grid">
              {QUICK_ACTIONS.map(action => (
                <Link key={action.label} to={action.path} className="exact-qa-btn">
                  <div className="exact-qa-btn__icon-wrap">
                    {action.icon}
                  </div>
                  <span className="exact-qa-btn__label">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom Center: Habit Streak */}
          <div className="exact-box exact-habit-streak-box">
            <div className="exact-section__header">
              <h3 className="exact-box__title">Habit Streak</h3>
              <Link to="/personal-development?tab=habits" className="exact-section__link">This Week →</Link>
            </div>

            <div className="exact-habit-streak-row">
              {dynamicHabitDays.map(day => (
                <div key={day.day} className="exact-habit-day">
                  <div className={`exact-habit-circle exact-habit-circle--${day.state}`}>
                    {day.state === 'done' && <Check size={14} strokeWidth={2.5} />}
                    {day.state === 'active' && '—'}
                  </div>
                  <span className="exact-habit-day__name">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Right: Editorial Fashion Quote Banner */}
          <div className="exact-quote-banner">
            <div className="exact-quote-banner__text-wrap">
              <p className="exact-quote-banner__quote">
                Fashion is what you buy,<br />
                Style is what you<br />
                do with it.
              </p>
              <svg className="exact-quote-banner__squiggle" viewBox="0 0 60 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4.5C8 1.5 16 5.5 24 2.5C32 0.5 40 4.5 48 2.5C54 0.5 58 3 59 2" stroke="#C5A880" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="exact-quote-banner__img-wrap">
              <img
                src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop&q=80"
                alt="Editorial Wardrobe Rack"
              />
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}

export default HomePage;
