import { useState } from 'react';
import { Heart, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import './Cards.css';

/**
 * Reusable WardrobeCard for Digital Wardrobe gallery
 */
export function WardrobeCard({
  item,
  onToggleFavorite,
  onOpenDetails,
  onEdit,
  onDelete,
  className = '',
}) {
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fallbackImg = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&h=800&fit=crop&q=80';

  return (
    <div className={`elevate-card wardrobe-card ${className}`}>
      <div className="wardrobe-card__media" onClick={() => onOpenDetails && onOpenDetails(item)}>
        <img
          src={imgError || !item.image ? fallbackImg : item.image}
          alt={item.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="wardrobe-card__img"
        />
        {onToggleFavorite && (
          <button
            type="button"
            className={`card-fav-btn ${item.favorite ? 'card-fav-btn--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            aria-label={item.favorite ? 'Unmark favorite' : 'Mark favorite'}
          >
            <Heart
              size={14}
              fill={item.favorite ? '#E5484D' : 'none'}
              color={item.favorite ? '#E5484D' : '#FFFFFF'}
            />
          </button>
        )}
        <span className="card-badge wardrobe-card__category">
          {item.category}
        </span>
      </div>

      <div className="wardrobe-card__body">
        <div className="wardrobe-card__header">
          <h4 className="wardrobe-card__title" onClick={() => onOpenDetails && onOpenDetails(item)}>
            {item.name}
          </h4>
          <div className="wardrobe-card__menu-wrap">
            <button
              type="button"
              className="wardrobe-card__menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              aria-label="Item actions"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div className="wardrobe-card__dropdown animate-fade-in" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <button
                    type="button"
                    className="wardrobe-card__dropdown-item"
                    onClick={() => { setMenuOpen(false); onEdit(item); }}
                  >
                    <Edit2 size={12} style={{ marginRight: 6 }} /> Edit Item
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="wardrobe-card__dropdown-item wardrobe-card__dropdown-item--danger"
                    onClick={() => { setMenuOpen(false); onDelete(item.id); }}
                  >
                    <Trash2 size={12} style={{ marginRight: 6 }} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compact Metadata */}
        <div className="wardrobe-card__meta-pills">
          {item.brand && <span className="wardrobe-meta-pill">{item.brand}</span>}
          {item.color && <span className="wardrobe-meta-pill">{item.color}</span>}
          {item.season && item.season !== 'All Season' && (
            <span className="wardrobe-meta-pill">{item.season}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function WardrobeCardSkeleton() {
  return (
    <div className="elevate-card wardrobe-card wardrobe-card--skeleton animate-pulse">
      <div className="skeleton-media" />
      <div className="wardrobe-card__body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>
    </div>
  );
}

export default WardrobeCard;
