import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FolderTree,
  Palette,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const SEASONS = ['All Season', 'Spring', 'Summer', 'Fall', 'Winter', 'Transitional'];
const OCCASIONS = ['Casual', 'Smart Casual', 'Business Formal', 'Evening / Gala', 'Streetwear', 'Athleisure', 'Cocktail', 'Resort'];

function FashionManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'styles' ? 'styles' : 'categories';

  const [categories, setCategories] = useState([]);
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [modal, setModal] = useState(null); // { type: 'category'|'style', mode: 'create'|'edit', data }
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, styleRes] = await Promise.all([
        api.admin.categories(),
        api.admin.styles({ limit: 100 }),
      ]);
      setCategories(catRes.data || []);
      setStyles(styleRes.data?.styles || styleRes.data || []);
    } catch (err) {
      console.error('Failed to load fashion data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const switchTab = (tab) => {
    setSearchParams({ tab });
  };

  // ── Category Handlers ──
  const openCategoryCreate = () => {
    setFormData({ name: '', description: '', image: '' });
    setModal({ type: 'category', mode: 'create' });
  };

  const openCategoryEdit = (cat) => {
    setFormData({ name: cat.name, description: cat.description || '', image: cat.image || '' });
    setModal({ type: 'category', mode: 'edit', data: cat });
  };

  const handleSaveCategory = async () => {
    if (!formData.name || formData.name.trim() === '') {
      alert('Category name is required.');
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await api.admin.createCategory(formData);
      } else {
        await api.admin.updateCategory(modal.data.id, formData);
      }
      setModal(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.admin.deleteCategory(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  // ── Style Handlers ──
  const openStyleCreate = () => {
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      description: '',
      image: '',
      tags: '',
      season: 'All Season',
      occasion: 'Casual',
    });
    setModal({ type: 'style', mode: 'create' });
  };

  const openStyleEdit = (style) => {
    const tagStr = Array.isArray(style.tags) ? style.tags.join(', ') : (style.tags || '');
    setFormData({
      name: style.name,
      categoryId: style.categoryId || style.category?.id || '',
      description: style.description || '',
      image: style.image || '',
      tags: tagStr,
      season: style.season || 'All Season',
      occasion: style.occasion || 'Casual',
    });
    setModal({ type: 'style', mode: 'edit', data: style });
  };

  const handleSaveStyle = async () => {
    if (!formData.name || formData.name.trim() === '') {
      alert('Style name is required.');
      return;
    }
    if (!formData.categoryId) {
      alert('Category selection is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (modal.mode === 'create') {
        await api.admin.createStyle(payload);
      } else {
        await api.admin.updateStyle(modal.data.id, payload);
      }
      setModal(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to save style');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStyle = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.admin.deleteStyle(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete style');
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtered Data ──
  const filteredCategories = categories.filter(
    (c) => !searchInput || c.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  const filteredStyles = styles.filter((s) => {
    const matchSearch =
      !searchInput ||
      s.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      (s.category?.name || s.categoryName || '').toLowerCase().includes(searchInput.toLowerCase()) ||
      (Array.isArray(s.tags) && s.tags.some((t) => t.toLowerCase().includes(searchInput.toLowerCase())));

    const matchCategory =
      categoryFilter === 'ALL' ||
      s.categoryId === categoryFilter ||
      s.category?.id === categoryFilter;

    return matchSearch && matchCategory;
  });

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Fashion &amp; Styles</h1>
          <p className="admin-module__subtitle">Catalog management for fashion taxonomy, style definitions, and seasonal attributes</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="admin-btn admin-btn--secondary" onClick={fetchData}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={activeTab === 'categories' ? openCategoryCreate : openStyleCreate}
          >
            <Plus size={16} /> {activeTab === 'categories' ? 'Add Category' : 'Add Style'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-panel" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-light)', padding: '0 var(--space-4)', background: '#FAF8F5' }}>
          <button
            className={`admin-nav__link ${activeTab === 'categories' ? 'admin-nav__link--active' : ''}`}
            onClick={() => switchTab('categories')}
            style={{ width: 'auto', borderRadius: '0', borderBottom: activeTab === 'categories' ? '2px solid var(--color-accent-primary)' : 'none', padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}
          >
            <FolderTree size={16} /> Categories ({categories.length})
          </button>
          <button
            className={`admin-nav__link ${activeTab === 'styles' ? 'admin-nav__link--active' : ''}`}
            onClick={() => switchTab('styles')}
            style={{ width: 'auto', borderRadius: '0', borderBottom: activeTab === 'styles' ? '2px solid var(--color-accent-primary)' : 'none', padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}
          >
            <Palette size={16} /> Styles Catalog ({styles.length})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              className="admin-form-input"
              placeholder={activeTab === 'categories' ? 'Search categories...' : 'Search styles by name or tags...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: 36, paddingRight: searchInput ? 36 : 14 }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-tertiary)',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {activeTab === 'styles' && (
          <select
            className="admin-form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <div className="admin-toolbar__actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {activeTab === 'categories' ? filteredCategories.length : filteredStyles.length} items
          </span>
        </div>
      </div>

      {/* Categories Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <Spinner size="lg" />
        </div>
      ) : activeTab === 'categories' ? (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Styles Count</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                    No fashion categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <strong>{cat.name}</strong>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge--gray">{cat.slug}</span>
                    </td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)' }}>
                      {cat.description || '—'}
                    </td>
                    <td>
                      <span className="admin-badge admin-badge--gold">
                        {cat._count?.styles || 0} styles
                      </span>
                    </td>
                    <td>
                      {cat.image ? (
                        <ImageIcon size={16} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="admin-action-btn" onClick={() => openCategoryEdit(cat)} title="Edit category">
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--danger"
                          onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })}
                          title="Delete category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Styles Table */
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Style Name</th>
                <th>Category</th>
                <th>Season</th>
                <th>Occasion</th>
                <th>Tags</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStyles.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                    No styles match your criteria
                  </td>
                </tr>
              ) : (
                filteredStyles.map((style) => (
                  <tr key={style.id}>
                    <td>
                      <strong>{style.name}</strong>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge--purple">
                        {style.category?.name || style.categoryName || 'General'}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)' }}>
                      {style.season || 'All Season'}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)' }}>
                      {style.occasion || 'Casual'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(Array.isArray(style.tags) ? style.tags.slice(0, 3) : []).map((t) => (
                          <span key={t} className="admin-badge admin-badge--gray">{t}</span>
                        ))}
                        {Array.isArray(style.tags) && style.tags.length > 3 && (
                          <span className="admin-badge admin-badge--gray">+{style.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {style.image ? (
                        <ImageIcon size={16} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="admin-action-btn" onClick={() => openStyleEdit(style)} title="Edit style">
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--danger"
                          onClick={() => setDeleteConfirm({ type: 'style', id: style.id, name: style.name })}
                          title="Delete style"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Category / Style Create & Edit Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                {modal.mode === 'create' ? 'Create' : 'Edit'} {modal.type === 'category' ? 'Fashion Category' : 'Style'}
              </h3>
              <button className="admin-modal__close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label className="admin-form-label">Name</label>
                <input
                  className="admin-form-input"
                  placeholder="Enter name..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              {modal.type === 'style' && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Fashion Category</label>
                    <select
                      className="admin-form-select"
                      value={formData.categoryId || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Season Focus</label>
                      <select
                        className="admin-form-select"
                        value={formData.season || 'All Season'}
                        onChange={(e) => setFormData((p) => ({ ...p, season: e.target.value }))}
                      >
                        {SEASONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Primary Occasion</label>
                      <select
                        className="admin-form-select"
                        value={formData.occasion || 'Casual'}
                        onChange={(e) => setFormData((p) => ({ ...p, occasion: e.target.value }))}
                      >
                        {OCCASIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="Describe this item..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Image URL or Asset Path</label>
                <input
                  className="admin-form-input"
                  placeholder="https://... or /uploads/..."
                  value={formData.image || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
                />
                <div className="admin-form-hint">Tip: You can copy URLs from the Media Library.</div>
              </div>

              {modal.type === 'style' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Style Tags (Comma-separated)</label>
                  <input
                    className="admin-form-input"
                    placeholder="minimalist, tailored, neutral, quiet luxury..."
                    value={formData.tags || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="admin-btn admin-btn--primary"
                onClick={modal.type === 'category' ? handleSaveCategory : handleSaveStyle}
                disabled={saving || !formData.name}
              >
                {saving ? 'Saving...' : (modal.mode === 'create' ? 'Create' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Confirm Deletion</h3>
              <button className="admin-modal__close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>{deleteConfirm.name}</strong>?
                {deleteConfirm.type === 'category' && ' Categories containing active styles cannot be deleted.'}
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={deleteConfirm.type === 'category' ? handleDeleteCategory : handleDeleteStyle}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FashionManagement;
