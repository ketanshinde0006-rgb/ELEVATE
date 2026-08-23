import { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, List, Plus, Shirt, Heart, X, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/StateDisplay';
import { WardrobeCard, WardrobeCardSkeleton } from '../../components/cards';
import './Wardrobe.css';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
const SEASONS = ['All Season', 'Spring/Summer', 'Fall/Winter'];

function WardrobePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSeason, setFilterSeason] = useState('All Season');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.wardrobe.list({
        search: search || undefined,
        category: filterCategory !== 'All' ? filterCategory : undefined,
        season: filterSeason !== 'All Season' ? filterSeason : undefined,
        sort: sortBy,
      });
      setItems(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch wardrobe items');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterSeason, sortBy]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleFavorite = async (id) => {
    try {
      const res = await api.wardrobe.toggleFavorite(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, favorite: res.data.favorite } : i));
      if (viewItem && viewItem.id === id) {
        setViewItem(prev => ({ ...prev, favorite: res.data.favorite }));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.wardrobe.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      if (viewItem && viewItem.id === id) {
        setViewItem(null);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleSaveItem = async (formData) => {
    try {
      if (editItem) {
        const res = await api.wardrobe.update(editItem.id, formData);
        setItems(prev => prev.map(i => i.id === editItem.id ? res.data : i));
        setEditItem(null);
      } else {
        const res = await api.wardrobe.createJson(formData);
        setItems(prev => [res.data, ...prev]);
        setShowAdd(false);
      }
    } catch (err) {
      console.error('Failed to save wardrobe item:', err);
    }
  };

  return (
    <div className="page editorial-wardrobe">
      <div className="container">
        {/* Header */}
        <div className="pd-header">
          <div>
            <span className="editorial-eyebrow">Digital Closet & Archive</span>
            <h1 className="page__title">Your Wardrobe Collection</h1>
            <p className="page__subtitle">{items.length} curated pieces in rotation</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div className="wardrobe-view-toggle">
              <button
                className={`wardrobe-toggle-btn ${viewMode === 'grid' ? 'wardrobe-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                className={`wardrobe-toggle-btn ${viewMode === 'list' ? 'wardrobe-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List View"
              >
                <List size={15} />
              </button>
            </div>
            <Button variant="primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Piece
            </Button>
          </div>
        </div>

        {/* Category Ticker Pills */}
        <div className="wardrobe-category-strip">
          {CATEGORIES.map(cat => {
            const count = cat === 'All' ? items.length : items.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                className={`wardrobe-category-pill ${filterCategory === cat ? 'wardrobe-category-pill--active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                <span>{cat}</span>
                <span className="wardrobe-category-pill__count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Filters Toolbar */}
        <div className="wardrobe-toolbar">
          <Input
            placeholder="Search by name, brand, color..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="sm"
          />
          <Select
            value={filterSeason}
            onChange={e => setFilterSeason(e.target.value)}
            options={SEASONS.map(s => ({ value: s, label: s }))}
            placeholder=""
          />
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            options={[
              { value: 'name', label: 'Alphabetical' },
              { value: 'brand', label: 'Brand Name' },
              { value: 'category', label: 'Category' },
              { value: 'favorites', label: 'Favorites First' }
            ]}
            placeholder=""
          />
        </div>

        {/* Gallery Content */}
        {loading ? (
          <div className="wardrobe-editorial-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <WardrobeCardSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Error loading wardrobe" description={error} action={fetchItems} actionLabel="Try Again" />
        ) : items.length === 0 ? (
          <EmptyState icon={Shirt} title="No wardrobe pieces found" description="Add your clothing items to start building combinations" action={() => setShowAdd(true)} actionLabel="Add First Piece" />
        ) : viewMode === 'grid' ? (
          <div className="wardrobe-editorial-grid">
            {items.map(item => (
              <WardrobeCard
                key={item.id}
                item={item}
                onToggleFavorite={toggleFavorite}
                onOpenDetails={setViewItem}
                onEdit={setEditItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        ) : (
          /* List Mode */
          <div className="wardrobe-list-table-container">
            <table className="wardrobe-list-table">
              <thead>
                <tr>
                  <th>Piece</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Color / Size</th>
                  <th>Season</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setViewItem(item)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={item.image} alt={item.name} style={{ width: 36, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                    </td>
                    <td><Badge variant="secondary" size="sm">{item.category}</Badge></td>
                    <td>{item.brand || '—'}</td>
                    <td>{item.color ? `${item.color} ${item.size ? `(${item.size})` : ''}` : '—'}</td>
                    <td>{item.season}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                        style={{ padding: '4px 8px', marginRight: 4 }}
                      >
                        <Heart size={13} fill={item.favorite ? '#E5484D' : 'none'} color={item.favorite ? '#E5484D' : '#8E8C8A'} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                        style={{ padding: '4px 8px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal modal--md animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{viewItem.name}</h2>
              <button className="modal__close" onClick={() => setViewItem(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                <img
                  src={viewItem.image}
                  alt={viewItem.name}
                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />
                <div>
                  <Badge variant="primary" size="sm">{viewItem.category}</Badge>
                  <p style={{ margin: 'var(--space-3) 0', color: 'var(--color-text-secondary)' }}>
                    Brand: <strong>{viewItem.brand || 'Unspecified'}</strong>
                  </p>
                  <p style={{ margin: 'var(--space-2) 0', color: 'var(--color-text-secondary)' }}>
                    Color: <strong>{viewItem.color || 'Standard'}</strong>
                  </p>
                  <p style={{ margin: 'var(--space-2) 0', color: 'var(--color-text-secondary)' }}>
                    Season: <strong>{viewItem.season || 'All Season'}</strong>
                  </p>
                  {viewItem.notes && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-4)' }}>
                      Notes: {viewItem.notes}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
                    <Button variant="secondary" size="sm" onClick={() => { setEditItem(viewItem); setViewItem(null); }}>
                      Edit Piece
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => deleteItem(viewItem.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAdd || editItem) && (
        <WardrobeFormModal
          item={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
}

function WardrobeFormModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || 'Tops',
    brand: item?.brand || '',
    color: item?.color || '',
    size: item?.size || '',
    season: item?.season || 'All Season',
    occasion: item?.occasion || 'Casual',
    image: item?.image || '',
    notes: item?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{item ? 'Edit Wardrobe Piece' : 'Add Wardrobe Piece'}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <Input
              label="Piece Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Navy Merino Crewneck"
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Select
                label="Category"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                options={CATEGORIES.filter(c => c !== 'All').map(c => ({ value: c, label: c }))}
              />
              <Select
                label="Season"
                value={form.season}
                onChange={e => setForm({ ...form, season: e.target.value })}
                options={SEASONS.map(s => ({ value: s, label: s }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input
                label="Brand"
                value={form.brand}
                onChange={e => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Loro Piana"
              />
              <Input
                label="Color"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                placeholder="e.g. Midnight Navy"
              />
            </div>
            <Input
              label="Image URL"
              value={form.image}
              onChange={e => setForm({ ...form, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Fabric composition, care instructions, fit notes..."
              rows={2}
            />
          </div>
          <div className="modal__footer">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">{item ? 'Save Changes' : 'Add to Closet'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WardrobePage;
