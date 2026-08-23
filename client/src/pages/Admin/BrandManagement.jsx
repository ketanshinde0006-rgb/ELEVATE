import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Globe,
  Star,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const PRICE_SEGMENTS = [
  { value: 'ALL', label: 'All Price Tiers' },
  { value: 'Budget', label: 'Budget' },
  { value: 'Mid-Range', label: 'Mid-Range' },
  { value: 'Premium', label: 'Premium' },
  { value: 'Luxury', label: 'Luxury' },
];

const BRAND_CATEGORIES = [
  'Fashion House',
  'Streetwear',
  'Sportswear',
  'Contemporary',
  'Minimalist',
  'Designer',
  'Footwear',
  'Accessories',
  'Sustainable',
  'High Street',
];

function BrandManagement() {
  const [brands, setBrands] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', data }
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.brands({
        page,
        limit,
        search: search || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        priceSegment: priceFilter !== 'ALL' ? priceFilter : undefined,
      });
      setBrands(res.data?.brands || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load brands:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, priceFilter]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openCreate = () => {
    setFormData({
      name: '',
      logo: '',
      description: '',
      category: 'Fashion House',
      priceSegment: 'Premium',
      styles: '',
      website: '',
      featured: false,
    });
    setModal({ mode: 'create' });
  };

  const openEdit = (brand) => {
    setFormData({
      name: brand.name,
      logo: brand.logo || '',
      description: brand.description || '',
      category: brand.category || 'Fashion House',
      priceSegment: brand.priceSegment || 'Premium',
      styles: Array.isArray(brand.styles) ? brand.styles.join(', ') : '',
      website: brand.website || '',
      featured: Boolean(brand.featured),
    });
    setModal({ mode: 'edit', data: brand });
  };

  const handleSaveBrand = async () => {
    if (!formData.name || formData.name.trim() === '') {
      alert('Brand name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        styles: formData.styles
          ? formData.styles.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (modal.mode === 'create') {
        await api.admin.createBrand(payload);
      } else {
        await api.admin.updateBrand(modal.data.id, payload);
      }
      setModal(null);
      fetchBrands();
    } catch (err) {
      alert(err.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.admin.deleteBrand(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchBrands();
    } catch (err) {
      alert(err.message || 'Failed to delete brand');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Brand Directory</h1>
          <p className="admin-module__subtitle">Manage global luxury houses, streetwear labels, pricing segments, and brand relationships</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="admin-btn admin-btn--secondary" onClick={fetchBrands}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="admin-btn admin-btn--primary" onClick={openCreate}>
            <Plus size={16} /> Add Brand
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <form className="admin-toolbar__search" onSubmit={handleSearch}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              className="admin-form-input"
              placeholder="Search brands by name or style..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </form>

        <select
          className="admin-form-select"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="ALL">All Categories</option>
          {BRAND_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="admin-form-select"
          value={priceFilter}
          onChange={(e) => {
            setPriceFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 'auto', minWidth: 150 }}
        >
          {PRICE_SEGMENTS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <div className="admin-toolbar__actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {total} brand{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Brands Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <Spinner size="lg" />
        </div>
      ) : brands.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-panel__body">
            <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
              <Tag size={48} strokeWidth={1.2} style={{ color: 'var(--color-text-tertiary)', opacity: 0.4, marginBottom: 'var(--space-4)' }} />
              <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
                No brands found
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Try adjusting your search criteria or add a new brand.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Category</th>
                <th>Price Segment</th>
                <th>Associated Styles</th>
                <th>Website</th>
                <th>Community Saves</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                          border: '1px solid var(--color-border-light)',
                        }}
                      >
                        {brand.logo ? (
                          <img src={brand.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Tag size={15} style={{ color: 'var(--color-text-tertiary)' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {brand.name}
                          {brand.featured && (
                            <span className="admin-badge admin-badge--gold" title="Featured Brand">
                              <Star size={10} fill="currentColor" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {brand.category ? (
                      <span className="admin-badge admin-badge--purple">{brand.category}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {brand.priceSegment ? (
                      <span className="admin-badge admin-badge--gold">{brand.priceSegment}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(Array.isArray(brand.styles) ? brand.styles.slice(0, 2) : []).map((s) => (
                        <span key={s} className="admin-badge admin-badge--gray">{s}</span>
                      ))}
                      {Array.isArray(brand.styles) && brand.styles.length > 2 && (
                        <span className="admin-badge admin-badge--gray">+{brand.styles.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {brand.website ? (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-action-btn"
                        style={{ color: 'var(--color-info)', gap: 4 }}
                      >
                        <Globe size={13} /> {brand.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 18)}...
                      </a>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--green">
                      {brand.savedCount || 0} saves
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="admin-action-btn" onClick={() => openEdit(brand)} title="Edit brand">
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn--danger"
                        onClick={() => setDeleteConfirm({ id: brand.id, name: brand.name })}
                        title="Delete brand"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span>Page {page} of {totalPages}</span>
              <div className="admin-pagination__buttons">
                <button
                  className="admin-pagination__btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <button
                  className="admin-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">{modal.mode === 'create' ? 'Add Brand' : 'Edit Brand'}</h3>
              <button className="admin-modal__close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label className="admin-form-label">Brand Name</label>
                <input
                  className="admin-form-input"
                  placeholder="e.g. Brunello Cucinelli, Acne Studios..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Category</label>
                  <select
                    className="admin-form-select"
                    value={formData.category || 'Fashion House'}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  >
                    {BRAND_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Price Segment</label>
                  <select
                    className="admin-form-select"
                    value={formData.priceSegment || 'Premium'}
                    onChange={(e) => setFormData((p) => ({ ...p, priceSegment: e.target.value }))}
                  >
                    {PRICE_SEGMENTS.filter((p) => p.value !== 'ALL').map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="Brand history, aesthetic, and heritage..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Logo URL</label>
                <input
                  className="admin-form-input"
                  placeholder="https://... or /uploads/..."
                  value={formData.logo || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, logo: e.target.value }))}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Official Website</label>
                <input
                  className="admin-form-input"
                  placeholder="https://..."
                  value={formData.website || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Associated Styles (Comma-separated)</label>
                <input
                  className="admin-form-input"
                  placeholder="Quiet Luxury, Minimalist, Tailored..."
                  value={formData.styles || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, styles: e.target.value }))}
                />
              </div>

              <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={Boolean(formData.featured)}
                  onChange={(e) => setFormData((p) => ({ ...p, featured: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="featured-checkbox" style={{ fontSize: 'var(--font-size-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  Feature this brand prominently in public catalogs
                </label>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="admin-btn admin-btn--primary"
                onClick={handleSaveBrand}
                disabled={saving || !formData.name}
              >
                {saving ? 'Saving...' : (modal.mode === 'create' ? 'Create Brand' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Delete Brand</h3>
              <button className="admin-modal__close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>{deleteConfirm.name}</strong>? Any user bookmarks for this brand will also be removed.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="admin-btn admin-btn--danger" onClick={handleDeleteBrand} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Brand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandManagement;
