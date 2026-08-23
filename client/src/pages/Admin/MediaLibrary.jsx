import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Copy,
  Check,
  Search,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.media();
      setMedia(res.data || []);
    } catch (err) {
      console.error('Failed to load media files:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.admin.uploadMedia(formData);
      fetchMedia();
    } catch (err) {
      alert(err.message || 'Failed to upload media file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.admin.deleteMedia(deleteConfirm.filename);
      setDeleteConfirm(null);
      fetchMedia();
    } catch (err) {
      alert(err.message || 'Failed to delete media file');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = media.filter((m) =>
    !search || m.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="admin-module__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="admin-module__title">Media Library</h1>
          <p className="admin-module__subtitle">Manage real uploaded assets, fashion styles, and brand logos</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="admin-btn admin-btn--secondary" onClick={fetchMedia}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadCloud size={16} /> {uploading ? 'Uploading...' : 'Upload Asset'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
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
              placeholder="Search uploaded files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
        <div className="admin-toolbar__actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {media.length} asset{media.length !== 1 ? 's' : ''} stored
          </span>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-panel__body">
            <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
              <ImageIcon size={48} strokeWidth={1.2} style={{ color: 'var(--color-text-tertiary)', opacity: 0.4, marginBottom: 'var(--space-4)' }} />
              <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
                {search ? 'No files match your search' : 'No media assets uploaded yet'}
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                Upload JPEG, PNG, WebP, or GIF files to store them on the server.
              </p>
              <button
                className="admin-btn admin-btn--primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <UploadCloud size={16} /> Choose File to Upload
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-media-grid">
          {filtered.map((item) => (
            <div key={item.id} className="admin-media-card">
              <div className="admin-media-card__preview">
                <img
                  src={item.url}
                  alt={item.filename}
                  className="admin-media-card__img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="admin-media-card__info">
                <div className="admin-media-card__name" title={item.filename}>{item.filename}</div>
                <div className="admin-media-card__meta">
                  {item.sizeFormatted} · {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="admin-media-card__actions">
                <button
                  className="admin-action-btn"
                  onClick={() => handleCopyUrl(item.url, item.id)}
                  title="Copy relative URL"
                >
                  {copiedId === item.id ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-action-btn"
                  title="Open image in new tab"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  className="admin-action-btn admin-action-btn--danger"
                  onClick={() => setDeleteConfirm(item)}
                  title="Delete asset"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Delete Asset</h3>
              <button className="admin-modal__close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to permanently delete <strong style={{ color: 'var(--color-text-primary)' }}>{deleteConfirm.filename}</strong>? Any styles or profiles referencing this URL will no longer be able to load it.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="admin-btn admin-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaLibrary;
