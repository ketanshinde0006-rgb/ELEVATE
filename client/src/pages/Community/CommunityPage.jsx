import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import './Community.css';

const TOPICS = [
  'All Inspiration',
  'Personal Growth',
  'Habit Routines',
  'Tailoring & Formal',
  'Casual Minimalism',
  'Wardrobe Organization',
  'Outfit Composition',
];

const COMMUNITY_STORIES = [
  {
    id: 1,
    title: 'The Discipline of a Capsule Wardrobe',
    category: 'Wardrobe Organization',
    author: 'Editorial Team',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=600&fit=crop&q=80',
    summary: 'How reducing your closet to 30 intentional pieces eliminates morning decision fatigue and sharpens personal focus.',
    actionLabel: 'Explore Wardrobe',
    actionPath: '/wardrobe',
  },
  {
    id: 2,
    title: 'Morning Routines of High-Output Creators',
    category: 'Habit Routines',
    author: 'Growth Spotlight',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&q=80',
    summary: 'A study of how daily physical discipline, mindful reflection, and purposeful attire create unshakable momentum.',
    actionLabel: 'Track Habits',
    actionPath: '/personal-development?tab=habits',
  },
  {
    id: 3,
    title: 'Architectural Layering for Trans-Seasonal Dressing',
    category: 'Tailoring & Formal',
    author: 'Style Atelier',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=600&fit=crop&q=80',
    summary: 'Combining textures, wool overcoats, and structured knits to transition seamlessly from boardroom to evening.',
    actionLabel: 'View Style Guide',
    actionPath: '/fashion',
  },
  {
    id: 4,
    title: 'Aligning Goals with Daily Self-Expression',
    category: 'Personal Growth',
    author: 'Philosophy Series',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&q=80',
    summary: 'When your inner targets and outward presence operate in synchrony, confidence becomes effortless and authentic.',
    actionLabel: 'Set Goals',
    actionPath: '/personal-development?tab=goals',
  },
];

const INSPIRATION_CARDS = [
  {
    id: 'insp-1',
    quote: 'Simplicity is the keynote of all true elegance.',
    author: 'Coco Chanel',
    tag: 'Style Philosophy',
  },
  {
    id: 'insp-2',
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
    tag: 'Habit Mastery',
  },
  {
    id: 'insp-3',
    quote: 'Clothes mean nothing until someone lives in them.',
    author: 'Marc Jacobs',
    tag: 'Intentional Living',
  },
];

function CommunityPage() {
  const [activeTopic, setActiveTopic] = useState('All Inspiration');

  const filteredStories = activeTopic === 'All Inspiration'
    ? COMMUNITY_STORIES
    : COMMUNITY_STORIES.filter(s => s.category === activeTopic);

  return (
    <div className="community-page">
      <div className="container">
        
        {/* ── Community Hero ── */}
        <section className="community-hero">
          <div className="community-hero__content">
            <span className="community-eyebrow">Community & Inspiration Hub</span>
            <h1 className="community-hero__title">
              Grow Together.<br />
              <span className="community-hero__serif">Elevate</span> Together.
            </h1>
            <p className="community-hero__desc">
              Discover curated narratives, styling methodologies, and personal-growth frameworks designed to inspire daily excellence.
            </p>
            <div className="community-hero__actions">
              <Button variant="primary" to="/personal-development?tab=goals">
                Set a Growth Goal →
              </Button>
              <Button variant="secondary" to="/fashion">
                Explore Styles
              </Button>
            </div>
          </div>
          <div className="community-hero__image-wrap">
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=700&fit=crop&q=80"
              alt="Community Style & Growth"
              className="community-hero__img"
            />
            <div className="community-hero__card-overlay">
              <span className="community-overlay__tag">Lifestyle Philosophy</span>
              <p className="community-overlay__text">
                "Growth is not just what you accomplish in private; it is how you present your purpose to the world."
              </p>
            </div>
          </div>
        </section>

        {/* ── Topic Filter Pills ── */}
        <section className="community-topics-section">
          <div className="community-topics-pills">
            {TOPICS.map(topic => (
              <button
                key={topic}
                className={`community-topic-pill ${activeTopic === topic ? 'community-topic-pill--active' : ''}`}
                onClick={() => setActiveTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {/* ── Editorial Story Grid ── */}
        <section className="community-stories-section">
          <div className="community-stories-grid">
            {filteredStories.map(story => (
              <article key={story.id} className="community-story-card">
                <div className="community-story-card__img-wrap">
                  <img src={story.image} alt={story.title} loading="lazy" />
                  <span className="community-story-card__category">{story.category}</span>
                </div>
                <div className="community-story-card__content">
                  <div className="community-story-card__meta">
                    <span>{story.author}</span>
                    <span>•</span>
                    <span>{story.readTime}</span>
                  </div>
                  <h2 className="community-story-card__title">{story.title}</h2>
                  <p className="community-story-card__summary">{story.summary}</p>
                  <Link to={story.actionPath} className="community-story-card__link">
                    {story.actionLabel} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Philosophy & Motivation Row ── */}
        <section className="community-quotes-section">
          <div className="community-section-header">
            <span className="community-eyebrow">Philosophical Pillars</span>
            <h2 className="community-section-title">Words of Mastery & Aesthetic Intent</h2>
          </div>
          <div className="community-quotes-grid">
            {INSPIRATION_CARDS.map(card => (
              <div key={card.id} className="community-quote-card">
                <span className="community-quote-mark">“</span>
                <p className="community-quote-text">{card.quote}</p>
                <div className="community-quote-footer">
                  <span className="community-quote-author">— {card.author}</span>
                  <span className="community-quote-tag">{card.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Call To Action Banner ── */}
        <section className="community-cta-banner">
          <div className="community-cta-banner__content">
            <h2 className="community-cta-banner__title">Ready to Elevate Your Personal Routine?</h2>
            <p className="community-cta-banner__desc">
              Organize your goals, establish unbreakable habit streaks, and curate a wardrobe that reflects who you are becoming.
            </p>
            <div className="community-cta-banner__actions">
              <Button variant="primary" size="lg" to="/dashboard">Open Workspace</Button>
              <Button variant="secondary" size="lg" to="/wardrobe">Manage Closet</Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default CommunityPage;
