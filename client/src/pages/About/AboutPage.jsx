import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import './About.css';

const PILLARS = [
  {
    num: '01',
    title: 'Personal Mastery & Goals',
    desc: 'Structure your long-term vision into tangible milestones with deadline grouping, progress meters, and priority management.',
    action: '/personal-development?tab=goals',
  },
  {
    num: '02',
    title: 'Atomic Habit Discipline',
    desc: 'Build unbreakable daily consistency with multi-week streak tracking and automated routine reminders.',
    action: '/personal-development?tab=habits',
  },
  {
    num: '03',
    title: 'Digital Wardrobe & Outfit Studio',
    desc: 'Digitize your closet, catalog by season and occasion, and assemble 5-piece head-to-toe looks with zero morning friction.',
    action: '/wardrobe',
  },
  {
    num: '04',
    title: 'Curated Fashion & Heritage Brands',
    desc: 'Explore timeless aesthetics, menswear tailoring, street silhouettes, and compare global fashion houses side-by-side.',
    action: '/fashion',
  },
];

const VALUES = [
  {
    title: 'Intentional Living',
    desc: 'Every goal set and every garment selected should serve your broader aspirations and reflect authentic purpose.',
  },
  {
    title: 'Aesthetic Harmony',
    desc: 'We believe external presentation and internal growth are deeply intertwined facets of self-respect.',
  },
  {
    title: 'Clarity over Clutter',
    desc: 'Minimalist, thoughtful design that reduces decision fatigue and leaves room for focused execution.',
  },
  {
    title: 'Continuous Elevation',
    desc: 'Progress is not about sudden perfection, but the compounded return on small, consistent daily actions.',
  },
];

function AboutPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="about-page">
      <div className="container">

        {/* ── Hero ── */}
        <section className="about-hero">
          <div className="about-hero__content">
            <span className="about-eyebrow">Our Mission & Purpose</span>
            <h1 className="about-hero__title">
              Elevate Every Part<br />
              of <span className="about-hero__serif">Who You Are.</span>
            </h1>
            <p className="about-hero__desc">
              ELEVATE was created on a single core conviction: that personal development and personal style are not separate pursuits, but complementary disciplines of an intentional life.
            </p>
            <div className="about-hero__actions">
              {isAuthenticated ? (
                <>
                  <Button variant="primary" to="/dashboard">Go to Dashboard →</Button>
                  <Button variant="secondary" to="/personal-development">Self Development</Button>
                </>
              ) : (
                <>
                  <Button variant="primary" to="/register">Start Your Journey →</Button>
                  <Button variant="secondary" to="/fashion">Explore Catalog</Button>
                </>
              )}
            </div>
          </div>
          <div className="about-hero__image-wrap">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=700&fit=crop&q=80"
              alt="ELEVATE Philosophy"
              className="about-hero__img"
            />
          </div>
        </section>

        {/* ── Purpose Split Section ── */}
        <section className="about-split-section">
          <div className="about-split__img-box">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop&q=80"
              alt="Design Philosophy"
            />
            <div className="about-split__quote-badge">
              "How you dress is how you greet the world; how you build yourself is how you conquer it."
            </div>
          </div>
          <div className="about-split__text-box">
            <span className="about-eyebrow">The Intersection</span>
            <h2 className="about-section-title">Growth Meets Sartorial Clarity</h2>
            <p className="about-body">
              Traditional productivity tools treat you like a machine; traditional fashion apps treat you like a consumer. ELEVATE unites both into a unified lifestyle operating system.
            </p>
            <p className="about-body">
              By managing your habits, goals, skills, and daily reflections alongside your digital wardrobe and outfit planner, ELEVATE provides the clarity to step into every day prepared, confident, and aligned.
            </p>
            <div className="about-split__flow">
              <span className="about-flow-step">1. Develop</span>
              <span className="about-flow-arrow">→</span>
              <span className="about-flow-step">2. Discover</span>
              <span className="about-flow-arrow">→</span>
              <span className="about-flow-step">3. Organize</span>
              <span className="about-flow-arrow">→</span>
              <span className="about-flow-step">4. Style</span>
              <span className="about-flow-arrow">→</span>
              <span className="about-flow-step">5. Progress</span>
            </div>
          </div>
        </section>

        {/* ── What ELEVATE Brings Together ── */}
        <section className="about-pillars-section">
          <div className="about-section-header">
            <span className="about-eyebrow">Core Ecosystem</span>
            <h2 className="about-section-title">What ELEVATE Brings Together</h2>
          </div>

          <div className="about-pillars-grid">
            {PILLARS.map(p => (
              <div key={p.num} className="about-pillar-card">
                <span className="about-pillar-num">{p.num}</span>
                <h3 className="about-pillar-title">{p.title}</h3>
                <p className="about-pillar-desc">{p.desc}</p>
                <Link to={p.action} className="about-pillar-link">Open Module →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Values Grid ── */}
        <section className="about-values-section">
          <div className="about-section-header">
            <span className="about-eyebrow">Guiding Principles</span>
            <h2 className="about-section-title">Our Values</h2>
          </div>

          <div className="about-values-grid">
            {VALUES.map(v => (
              <div key={v.title} className="about-value-card">
                <h3 className="about-value-title">{v.title}</h3>
                <p className="about-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="about-cta-banner">
          <h2 className="about-cta-banner__title">Experience the ELEVATE Way</h2>
          <p className="about-cta-banner__desc">
            Join thousands who are elevating their habits, goals, and personal style every day.
          </p>
          <div className="about-cta-banner__actions">
            {isAuthenticated ? (
              <>
                <Button variant="primary" size="lg" to="/dashboard">Open Your Dashboard</Button>
                <Button variant="secondary" size="lg" to="/wardrobe">Manage Wardrobe</Button>
              </>
            ) : (
              <>
                <Button variant="primary" size="lg" to="/register">Create Your Account</Button>
                <Button variant="secondary" size="lg" to="/login">Sign In</Button>
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

export default AboutPage;
