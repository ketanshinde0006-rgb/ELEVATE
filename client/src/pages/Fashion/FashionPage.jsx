import { useState, useEffect, useCallback } from 'react';
import { Heart, Search, X, AlertTriangle, Sparkles, Shirt, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/StateDisplay';
import { StyleCard, StyleCardSkeleton } from '../../components/cards';
import './Fashion.css';

const DEFAULT_CATEGORIES = [
  'All',
  'Formal',
  'Casual',
  'Smart Casual',
  'Streetwear',
  'Minimal',
  'Aesthetic',
  'Vintage',
  'Athleisure',
  'Layered',
  'Seasonal',
  'Avant-Garde',
];

const POPULAR_AESTHETICS = [
  'Tailoring',
  'Executive',
  'Denim',
  'Cashmere',
  'Merino Wool',
  'Old Money',
  'Sneakerhead',
  'Scandi',
  'Clean Lines',
  'Corduroy',
  'Heavyweight',
  'Summer',
  'Winter',
  'Transitional',
];

function FashionPage() {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [styles, setStyles] = useState([]);
  const [savedStyles, setSavedStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTag, setActiveTag] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  // Load categories from database
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.fashion.categories();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const names = ['All', ...res.data.map(c => c.name)];
          setCategories(names);
        }
      } catch {
        // Fallback to DEFAULT_CATEGORIES
      }
    }
    loadCategories();
  }, []);

  const fetchStyles = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {};
      const activeSearch = (activeTag && activeTag.trim()) || (search && search.trim());
      if (activeSearch) {
        queryParams.search = activeSearch;
      }
      if (category && category !== 'All') {
        queryParams.category = category.trim();
      }
      if (sortBy) {
        queryParams.sort = sortBy;
      }

      const stylesRes = await api.fashion.styles(queryParams);
      setStyles(stylesRes.data || []);

      if (isAuthenticated) {
        try {
          const savedRes = await api.fashion.savedStyles();
          setSavedStyles((savedRes.data || []).map(s => s.id));
        } catch {}
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load styles');
    } finally {
      setLoading(false);
    }
  }, [search, category, activeTag, sortBy, isAuthenticated]);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  const toggleSave = async (id) => {
    if (!isAuthenticated) {
      setSavedStyles(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
      return;
    }

    try {
      const res = await api.fashion.saveStyle(id);
      if (res.data.saved) {
        setSavedStyles(prev => [...prev, id]);
      } else {
        setSavedStyles(prev => prev.filter(s => s !== id));
      }
    } catch (err) {
      console.error('Failed to toggle save style:', err);
    }
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setActiveTag(null);
    setVisibleCount(12);
  };

  const handleTagClick = (tag) => {
    if (activeTag === tag) {
      setActiveTag(null);
    } else {
      setActiveTag(tag);
      setCategory('All');
    }
    setVisibleCount(12);
  };

  const resetAllFilters = () => {
    setCategory('All');
    setActiveTag(null);
    setSearch('');
    setVisibleCount(12);
  };

  const displayedStyles = styles.slice(0, visibleCount);

  return (
    <div className="page editorial-fashion">
      <div className="container">
        {/* Header */}
        <div className="pd-header">
          <div>
            <span className="editorial-eyebrow">Curated Lookbooks & Aesthetic Encyclopedias</span>
            <h1 className="page__title">Fashion Style & Aesthetic Explorer</h1>
            <p className="page__subtitle">Explore all major fashion movements, silhouettes, sartorial tailoring, and subcultures</p>
          </div>
          <Badge variant="primary" size="lg">{styles.length} curated aesthetics</Badge>
        </div>

        {/* Featured Editorial Banner */}
        <div className="fashion-editorial-banner">
          <div className="fashion-editorial-banner__content">
            <Badge variant="dark" size="sm">Featured Sartorial Spotlight</Badge>
            <h2 className="fashion-editorial-banner__title">Sartorial Tailoring & Structured Outerwear</h2>
            <p className="fashion-editorial-banner__desc">
              From bespoke double-breasted suits to fine merino knitwear and architectural trench coats, explore how classic silhouettes and modern tailoring define personal presence.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Button variant="primary" size="sm" onClick={() => handleCategorySelect('Formal')}>
                <Sparkles size={14} style={{ marginRight: 6 }} /> Explore Formal Tailoring
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleCategorySelect('Smart Casual')}>
                Explore Smart Casual
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleCategorySelect('Streetwear')}>
                Explore Streetwear
              </Button>
            </div>
          </div>
          <div className="fashion-editorial-banner__img">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&q=80"
              alt="Seasonal Lookbook Feature"
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="fashion-filters-bar">
          <div className="fashion-category-chips">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`fashion-chip ${category === cat && !activeTag ? 'fashion-chip--active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="fashion-controls">
            <Input
              placeholder="Search aesthetics, fabrics, tags..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveTag(null); setVisibleCount(12); }}
              size="sm"
              icon={<Search size={15} />}
              suffix={search ? (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setActiveTag(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--color-text-tertiary)' }}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null}
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'name', label: 'Alphabetical' },
                { value: 'category', label: 'By Category' },
              ]}
              placeholder=""
            />
          </div>
        </div>

        {/* Quick Aesthetic Pills */}
        <div className="fashion-quick-tags" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-8)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', alignSelf: 'center', marginRight: '4px' }}>
            Aesthetic Tags:
          </span>
          {POPULAR_AESTHETICS.map(tag => (
            <button
              key={tag}
              type="button"
              className={`fashion-pill-tag ${activeTag === tag ? 'fashion-pill-tag--active' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              #{tag}
            </button>
          ))}
          {(activeTag || category !== 'All' || search) && (
            <button
              type="button"
              className="fashion-pill-tag fashion-pill-tag--clear"
              onClick={resetAllFilters}
            >
              Reset Filters ✕
            </button>
          )}
        </div>

        {/* Discovery Gallery */}
        {loading ? (
          <div className="fashion-gallery-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <StyleCardSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Error loading catalog" description={error} action={fetchStyles} actionLabel="Try Again" />
        ) : styles.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No styles match your criteria"
            description="Try resetting your filters or selecting a different category."
            action={resetAllFilters}
            actionLabel="Reset All Filters"
          />
        ) : (
          <>
            <div className="fashion-gallery-grid">
              {displayedStyles.map(style => {
                const isSaved = savedStyles.includes(style.id);
                return (
                  <StyleCard
                    key={style.id}
                    style={style}
                    isSaved={isSaved}
                    onToggleSave={toggleSave}
                    onOpenDetails={setSelectedStyle}
                  />
                );
              })}
            </div>

            {visibleCount < styles.length && (
              <div className="text-center" style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>
                <Button variant="secondary" size="lg" onClick={() => setVisibleCount(prev => prev + 6)}>
                  Load More Styles ({styles.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Style Details Modal */}
      {selectedStyle && (
        <div className="modal-overlay" onClick={() => setSelectedStyle(null)}>
          <div className="modal modal--lg animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="modal__title">{selectedStyle.name}</h2>
                <Badge variant="primary" size="sm">{selectedStyle.categoryName || selectedStyle.category?.name}</Badge>
              </div>
              <button className="modal__close" onClick={() => setSelectedStyle(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="fashion-detail">
                <div className="fashion-detail__image">
                  <img src={selectedStyle.image} alt={selectedStyle.name} style={{ width: '100%', borderRadius: 'var(--radius-lg)', aspectRatio: '3/4', objectFit: 'cover' }} />
                </div>
                <div className="fashion-detail__info">
                  <span className="editorial-eyebrow">Style DNA & Silhouette</span>
                  <h3 style={{ fontSize: 'var(--font-size-xl)', margin: 'var(--space-2) 0 var(--space-3)' }}>
                    {selectedStyle.name}
                  </h3>
                  <p style={{ lineHeight: 'var(--line-height-relaxed)', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
                    {selectedStyle.description || selectedStyle.desc}
                  </p>
                  
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Key Aesthetic Tags:
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                      {(selectedStyle.tags || []).map(tag => (
                        <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
                    <Button variant="primary" onClick={() => toggleSave(selectedStyle.id)}>
                      <Heart
                        size={15}
                        fill={savedStyles.includes(selectedStyle.id) ? '#FFFFFF' : 'none'}
                        style={{ marginRight: 6 }}
                      />
                      {savedStyles.includes(selectedStyle.id) ? 'Saved to Favorites' : 'Save Aesthetic'}
                    </Button>
                    <Link to="/wardrobe" className="btn btn--secondary btn--md">
                      <Shirt size={15} style={{ marginRight: 6 }} /> Build In Wardrobe
                    </Link>
                    <Link to="/brands" className="btn btn--ghost btn--md">
                      <Compass size={15} style={{ marginRight: 6 }} /> Explore Brands
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FashionPage;
