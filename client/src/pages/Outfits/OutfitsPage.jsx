import { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Shirt, 
  Sparkles, 
  Heart, 
  X, 
  FileText, 
  Trash2, 
  Plus, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/StateDisplay';
import { OutfitCard, OutfitCardSkeleton } from '../../components/cards';
import './Outfits.css';

const SLOTS = [
  { key: 'outerwear', label: 'Outerwear', category: 'Outerwear' },
  { key: 'top', label: 'Top', category: 'Tops' },
  { key: 'bottom', label: 'Bottom', category: 'Bottoms' },
  { key: 'shoes', label: 'Shoes', category: 'Shoes' },
  { key: 'accessory', label: 'Accessory', category: 'Accessories' },
];

function OutfitsPage() {
  const [outfits, setOutfits] = useState([]);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeSlotCategory, setActiveSlotCategory] = useState('Tops');
  
  // Workspace composition state
  const [selectedItems, setSelectedItems] = useState({
    top: null,
    bottom: null,
    shoes: null,
    outerwear: null,
    accessory: null,
  });

  const [outfitForm, setOutfitForm] = useState({
    name: '',
    occasion: 'Casual',
    season: 'All Season',
    style: '',
    notes: '',
  });

  const [savingOutfit, setSavingOutfit] = useState(false);
  const [viewOutfit, setViewOutfit] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [outfitsRes, wardrobeRes] = await Promise.all([
        api.outfits.list({ search: search || undefined }),
        api.wardrobe.list({ limit: 150 })
      ]);
      setOutfits(outfitsRes.data || []);
      setWardrobeItems(wardrobeRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch outfits');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFavorite = async (id) => {
    try {
      const res = await api.outfits.toggleFavorite(id);
      setOutfits(prev => prev.map(o => o.id === id ? { ...o, favorite: res.data.favorite } : o));
      if (viewOutfit && viewOutfit.id === id) {
        setViewOutfit(prev => ({ ...prev, favorite: res.data.favorite }));
      }
    } catch (err) {
      console.error('Failed to toggle outfit favorite:', err);
    }
  };

  const deleteOutfit = async (id) => {
    try {
      await api.outfits.delete(id);
      setOutfits(prev => prev.filter(o => o.id !== id));
      if (viewOutfit && viewOutfit.id === id) {
        setViewOutfit(null);
      }
    } catch (err) {
      console.error('Failed to delete outfit:', err);
    }
  };

  const handleSelectItemForSlot = (slotKey, item) => {
    setSelectedItems(prev => ({
      ...prev,
      [slotKey]: prev[slotKey]?.id === item.id ? null : item
    }));
  };

  const handleClearCanvas = () => {
    setSelectedItems({ top: null, bottom: null, shoes: null, outerwear: null, accessory: null });
  };

  const handleSaveOutfit = async (e) => {
    e.preventDefault();
    if (!outfitForm.name.trim()) return;

    // Convert selected items into slot payload
    const items = [];
    Object.entries(selectedItems).forEach(([slot, item]) => {
      if (item) {
        items.push({ slot, wardrobeItemId: item.id });
      }
    });

    if (items.length === 0) {
      alert('Please select at least one piece for your outfit.');
      return;
    }

    setSavingOutfit(true);
    try {
      const res = await api.outfits.create({
        ...outfitForm,
        items,
      });
      setOutfits(prev => [res.data, ...prev]);
      handleClearCanvas();
      setOutfitForm({
        name: '',
        occasion: 'Casual',
        season: 'All Season',
        style: '',
        notes: '',
      });
    } catch (err) {
      console.error('Failed to save outfit:', err);
    } finally {
      setSavingOutfit(false);
    }
  };

  const currentCategoryItems = wardrobeItems.filter(
    i => i.category.toLowerCase() === activeSlotCategory.toLowerCase()
  );

  return (
    <div className="page editorial-outfits">
      <div className="container">
        {/* Header */}
        <div className="pd-header">
          <div>
            <span className="editorial-eyebrow">Interactive Styling Suite</span>
            <h1 className="page__title">Outfit Composition Workspace</h1>
            <p className="page__subtitle">Assemble pieces from your wardrobe into harmonized looks</p>
          </div>
          <div className="outfit-header-stats">
            <span className="outfit-count-pill">
              <Layers size={13} style={{ marginRight: 5 }} /> {outfits.length} Saved Outfits
            </span>
          </div>
        </div>

        {/* ── 3-Panel Interactive Studio (Workspace Pattern) ── */}
        <div className="outfit-studio">
          {/* Panel 1: Wardrobe Rack / Selector */}
          <div className="outfit-studio__rack">
            <div className="outfit-rack__header">
              <span className="outfit-rack__title">1. Wardrobe Rack</span>
              <div className="outfit-rack__cats">
                {['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`outfit-rack-cat-btn ${activeSlotCategory === cat ? 'outfit-rack-cat-btn--active' : ''}`}
                    onClick={() => setActiveSlotCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="outfit-rack__grid">
              {currentCategoryItems.length === 0 ? (
                <div className="outfit-rack__empty">
                  <p>No {activeSlotCategory} found in wardrobe.</p>
                  <Button variant="secondary" size="sm" to="/wardrobe">
                    <Plus size={13} /> Add in Wardrobe
                  </Button>
                </div>
              ) : (
                currentCategoryItems.map(item => {
                  const targetSlot = SLOTS.find(s => s.category.toLowerCase() === item.category.toLowerCase())?.key || 'top';
                  const isSelected = selectedItems[targetSlot]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`outfit-rack-item-card ${isSelected ? 'outfit-rack-item-card--selected' : ''}`}
                      onClick={() => handleSelectItemForSlot(targetSlot, item)}
                    >
                      <img src={item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop&q=80'} alt={item.name} />
                      <div className="outfit-rack-item-card__overlay">
                        <span className="outfit-rack-item-card__name">{item.name}</span>
                        <span className="outfit-rack-item-card__btn">
                          {isSelected ? (
                            <>
                              <Check size={11} strokeWidth={2.5} style={{ marginRight: 3 }} /> Selected
                            </>
                          ) : (
                            '+ Add to Outfit'
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel 2: Composition Area (The Canvas) */}
          <div className="outfit-studio__canvas">
            <div className="outfit-canvas__header">
              <span className="outfit-canvas__title">2. Canvas Assembly</span>
              <button type="button" className="outfit-clear-btn" onClick={handleClearCanvas}>Reset Canvas</button>
            </div>

            <div className="outfit-canvas__slots">
              {SLOTS.map(slot => {
                const item = selectedItems[slot.key];
                return (
                  <div
                    key={slot.key}
                    className={`outfit-canvas-slot ${item ? 'outfit-canvas-slot--filled' : ''}`}
                    onClick={() => setActiveSlotCategory(slot.category)}
                  >
                    <div className="outfit-canvas-slot__header">
                      <span className="outfit-canvas-slot__label">{slot.label}</span>
                      {item && (
                        <button
                          type="button"
                          className="outfit-canvas-slot__remove"
                          onClick={(e) => { e.stopPropagation(); handleSelectItemForSlot(slot.key, item); }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    {item ? (
                      <div className="outfit-canvas-slot__preview">
                        <img src={item.image} alt={item.name} />
                        <div className="outfit-canvas-slot__info">
                          <span className="outfit-canvas-slot__item-name">{item.name}</span>
                          <span className="outfit-canvas-slot__item-brand">{item.brand || 'Unbranded'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="outfit-canvas-slot__placeholder">
                        <span>Click to pick {slot.label.toLowerCase()}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel 3: Outfit Settings & Save */}
          <div className="outfit-studio__settings">
            <span className="outfit-settings__title">3. Outfit Details</span>
            <form onSubmit={handleSaveOutfit} className="outfit-settings__form">
              <Input
                label="Outfit Title"
                placeholder="e.g. Saturday Gallery Look"
                value={outfitForm.name}
                onChange={e => setOutfitForm({ ...outfitForm, name: e.target.value })}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Select
                  label="Occasion"
                  value={outfitForm.occasion}
                  onChange={e => setOutfitForm({ ...outfitForm, occasion: e.target.value })}
                  options={[
                    { value: 'Casual', label: 'Casual' },
                    { value: 'Smart Casual', label: 'Smart Casual' },
                    { value: 'Formal', label: 'Formal' },
                    { value: 'Business', label: 'Business' },
                    { value: 'Evening', label: 'Evening' },
                    { value: 'Resort', label: 'Resort' },
                  ]}
                />
                <Select
                  label="Season"
                  value={outfitForm.season}
                  onChange={e => setOutfitForm({ ...outfitForm, season: e.target.value })}
                  options={[
                    { value: 'All Season', label: 'All Season' },
                    { value: 'Spring/Summer', label: 'Spring/Summer' },
                    { value: 'Fall/Winter', label: 'Fall/Winter' },
                  ]}
                />
              </div>
              <Input
                label="Style DNA"
                placeholder="e.g. Minimalist, Quiet Luxury"
                value={outfitForm.style}
                onChange={e => setOutfitForm({ ...outfitForm, style: e.target.value })}
              />
              <Textarea
                label="Styling Notes"
                placeholder="Notes on accessories, fit, or color harmony..."
                value={outfitForm.notes}
                onChange={e => setOutfitForm({ ...outfitForm, notes: e.target.value })}
                rows={2}
              />
              <Button type="submit" variant="primary" fullWidth loading={savingOutfit}>
                Save Outfit Look
              </Button>
            </form>
          </div>
        </div>

        {/* ── Saved Outfits Section (Card Grid Pattern) ── */}
        <div className="outfit-archive-section">
          <div className="pd-header" style={{ marginBottom: 'var(--space-6)' }}>
            <div>
              <span className="editorial-eyebrow">Saved Ensembles & Archives</span>
              <h2 className="section__title">Saved Looks & History</h2>
              <p className="page__subtitle">Browse and manage your assembled looks</p>
            </div>
            <Input
              placeholder="Search saved looks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="sm"
            />
          </div>

          {loading ? (
            <div className="outfit-catalog-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <OutfitCardSkeleton key={idx} />
              ))}
            </div>
          ) : outfits.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No outfits saved yet"
              description="Assemble pieces using the workspace above to save your first look."
            />
          ) : (
            <div className="outfit-catalog-grid">
              {outfits.map(outfit => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  onToggleFavorite={toggleFavorite}
                  onOpenDetails={setViewOutfit}
                  onDelete={deleteOutfit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Outfit Modal Viewer */}
      {viewOutfit && (
        <div className="modal-overlay" onClick={() => setViewOutfit(null)}>
          <div className="modal modal--lg animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{viewOutfit.name}</h2>
              <button className="modal__close" onClick={() => setViewOutfit(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="outfit-modal-slots-grid">
                {SLOTS.map(slot => {
                  const item = viewOutfit.items?.find(i => i.slot === slot.key)?.wardrobeItem || viewOutfit.items?.[slot.key];
                  return (
                    <div key={slot.key} className="outfit-modal-slot-card">
                      <span className="outfit-modal-slot-lbl">{slot.label}</span>
                      {item ? (
                        <div className="outfit-modal-item">
                          <img src={item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop&q=80'} alt={item.name} />
                          <span className="outfit-modal-item-name">{item.name}</span>
                        </div>
                      ) : (
                        <span className="outfit-modal-none">None</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                {viewOutfit.occasion && <Badge variant="primary">{viewOutfit.occasion}</Badge>}
                {viewOutfit.season && <Badge variant="secondary">{viewOutfit.season}</Badge>}
                {viewOutfit.style && <Badge variant="default">{viewOutfit.style}</Badge>}
              </div>

              {viewOutfit.notes && (
                <p style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <FileText size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{viewOutfit.notes}</span>
                </p>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <Button variant="primary" onClick={() => toggleFavorite(viewOutfit.id)}>
                  <Heart
                    size={14}
                    fill={viewOutfit.favorite ? '#FFFFFF' : 'none'}
                    style={{ marginRight: 6 }}
                  />
                  {viewOutfit.favorite ? 'Favorited' : 'Favorite Outfit'}
                </Button>
                <Button variant="danger" onClick={() => deleteOutfit(viewOutfit.id)}>Delete Outfit</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OutfitsPage;
