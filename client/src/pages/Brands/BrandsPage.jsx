import { useState, useEffect, useCallback } from 'react';
import { Tag, Heart, Search, AlertTriangle, X, ExternalLink, SlidersHorizontal, ArrowUpRight, Scale } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/StateDisplay';
import { BrandCard, BrandCardSkeleton } from '../../components/cards';
import './Brands.css';

const CATEGORIES = ['All', 'Sportswear', 'Fast Fashion', 'Luxury', 'Essentials', 'High Fashion', 'Denim', 'Outdoor', 'Contemporary', 'Streetwear'];
const PRICE_SEGMENTS = ['All', 'Budget', 'Affordable', 'Mid-range', 'Premium', 'Luxury'];

function BrandsPage() {
  const { isAuthenticated } = useAuth();
  const [brands, setBrands] = useState([]);
  const [savedBrands, setSavedBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [price, setPrice] = useState('All');
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.brands.list({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        priceSegment: price !== 'All' ? price : undefined,
      });
      setBrands(res.data || []);

      if (isAuthenticated) {
        try {
          const savedRes = await api.brands.saved();
          setSavedBrands((savedRes.data || []).map(b => b.id));
        } catch {}
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, [search, category, price, isAuthenticated]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const toggleSave = async (id) => {
    if (!isAuthenticated) {
      setSavedBrands(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
      return;
    }

    try {
      const res = await api.brands.save(id);
      if (res.data.saved) {
        setSavedBrands(prev => [...prev, id]);
      } else {
        setSavedBrands(prev => prev.filter(s => s !== id));
      }
    } catch (err) {
      console.error('Failed to toggle save brand:', err);
    }
  };

  const toggleCompare = (id) => {
    setCompareList(prev => prev.includes(id) ? prev.filter(b => b !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const comparedBrands = brands.filter(b => compareList.includes(b.id));

  return (
    <div className="page editorial-brands">
      <div className="container">
        {/* Header */}
        <div className="pd-header">
          <div>
            <span className="editorial-eyebrow">Brand Index & Heritage Directory</span>
            <h1 className="page__title">Curated Fashion Houses & Labels</h1>
            <p className="page__subtitle">Explore leading global labels, tailoring houses, and contemporary sportswear</p>
          </div>
          {compareList.length >= 2 && (
            <Button variant="primary" onClick={() => setShowCompare(true)}>
              <Scale size={15} style={{ marginRight: 6 }} /> Compare ({compareList.length} Selected)
            </Button>
          )}
        </div>

        {/* Featured Brand Spotlight Banner */}
        <div className="brand-spotlight-banner">
          <div className="brand-spotlight__info">
            <Badge variant="primary" size="sm">Brand Spotlight</Badge>
            <h2 className="brand-spotlight__title">Ralph Lauren & Timeless American Craft</h2>
            <p className="brand-spotlight__desc">
              Defining classic collegiate, black-tie, and luxury tailoring for over half a century with an unmistakable sartorial vocabulary.
            </p>
            <div className="brand-spotlight__tags">
              <span className="brand-pill">Luxury</span>
              <span className="brand-pill">Formal</span>
              <span className="brand-pill">Preppy</span>
            </div>
          </div>
          <div className="brand-spotlight__logo-badge">
            <Tag size={28} strokeWidth={1.8} className="brand-spotlight__icon-svg" />
            <span className="brand-spotlight__house">RALPH LAUREN</span>
          </div>
        </div>

        {/* Quick Brand Quick-Select Logos Strip */}
        <div className="brand-quick-strip" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: 'var(--space-8)' }}>
          {brands.slice(0, 10).map(b => (
            <button
              key={b.id}
              type="button"
              className={`brand-strip-pill ${search === b.name ? 'brand-strip-pill--active' : ''}`}
              onClick={() => setSearch(search === b.name ? '' : b.name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
                background: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Tag size={12} style={{ color: 'var(--color-accent-primary)' }} />
              <span>{b.name}</span>
            </button>
          ))}
        </div>

        {/* Brand Filters Bar */}
        <div className="brand-filters-bar">
          <div className="brand-filters-inputs">
            <Input
              placeholder="Search brands or styles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="sm"
              icon={<Search size={15} />}
              suffix={search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--color-text-tertiary)' }}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null}
            />
            <Select
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={CATEGORIES.map(c => ({ value: c, label: c === 'All' ? 'All Categories' : c }))}
              placeholder=""
            />
            <Select
              value={price}
              onChange={e => setPrice(e.target.value)}
              options={PRICE_SEGMENTS.map(p => ({ value: p, label: p === 'All' ? 'All Price Segments' : p }))}
              placeholder=""
            />
          </div>
          {(category !== 'All' || price !== 'All' || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setCategory('All'); setPrice('All'); setSearch(''); }}>
              Reset Filters
            </Button>
          )}
        </div>

        {/* Brand Directory Grid */}
        {loading ? (
          <div className="brand-directory-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <BrandCardSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Error loading brand directory" description={error} action={fetchBrands} actionLabel="Try Again" />
        ) : brands.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No brands match search"
            description="Try selecting different filter parameters."
            action={() => { setCategory('All'); setPrice('All'); setSearch(''); }}
            actionLabel="View All Brands"
          />
        ) : (
          <div className="brand-directory-grid">
            {brands.map(brand => {
              const isSaved = savedBrands.includes(brand.id);
              const isComparing = compareList.includes(brand.id);
              return (
                <div key={brand.id} className="brand-card-wrapper" style={{ position: 'relative' }}>
                  <BrandCard
                    brand={brand}
                    isSaved={isSaved}
                    onToggleSave={toggleSave}
                    onOpenDetails={setSelectedBrand}
                  />
                  <div style={{ position: 'absolute', bottom: '16px', right: '85px', zIndex: 2 }}>
                    <label className="checkbox-group" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={isComparing}
                        onChange={() => toggleCompare(brand.id)}
                      />
                      <span className="checkbox-group__label" style={{ fontSize: '11px' }}>Compare</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Brand Detail Modal */}
      {selectedBrand && (
        <div className="modal-overlay" onClick={() => setSelectedBrand(null)}>
          <div className="modal modal--md animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>{selectedBrand.logo || '🏷️'}</span>
                <div>
                  <h2 className="modal__title" style={{ margin: 0 }}>{selectedBrand.name}</h2>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{selectedBrand.category}</span>
                </div>
              </div>
              <button className="modal__close" onClick={() => setSelectedBrand(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <p style={{ fontSize: 'var(--font-size-md)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                {selectedBrand.description || selectedBrand.desc}
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                {selectedBrand.priceSegment && (
                  <Badge variant="primary" size="sm">{selectedBrand.priceSegment}</Badge>
                )}
                {selectedBrand.category && (
                  <Badge variant="secondary" size="sm">{selectedBrand.category}</Badge>
                )}
              </div>

              {selectedBrand.website && (
                <a
                  href={selectedBrand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary btn--md"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Visit Official Store
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && (
        <div className="modal-overlay" onClick={() => setShowCompare(false)}>
          <div className="modal modal--lg animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Brand Comparison</h2>
              <button className="modal__close" onClick={() => setShowCompare(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparedBrands.length}, 1fr)`, gap: 'var(--space-4)' }}>
                {comparedBrands.map(b => (
                  <div key={b.id} style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '1.8rem' }}>{b.logo || '🏷️'}</span>
                    <h3 style={{ margin: 'var(--space-2) 0' }}>{b.name}</h3>
                    <Badge variant="primary" size="sm">{b.priceSegment}</Badge>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                      {b.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandsPage;
