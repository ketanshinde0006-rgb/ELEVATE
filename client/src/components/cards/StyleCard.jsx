import { useState } from 'react';
import { Heart, ArrowUpRight } from 'lucide-react';
import './Cards.css';

/**
 * Reusable Premium StyleCard for Fashion Explorer & Saved Styles
 */
export function StyleCard({
  style,
  isSaved = false,
  onToggleSave,
  onOpenDetails,
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  const fallbackImg = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&q=80';

  return (
    <div className={`elevate-card style-card ${className}`}>
      <div className="style-card__media">
        <img
          src={imgError || !style.image ? fallbackImg : style.image}
          alt={style.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="style-card__img"
        />
        {onToggleSave && (
          <button
            type="button"
            className={`card-fav-btn ${isSaved ? 'card-fav-btn--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(style.id);
            }}
            aria-label={isSaved ? 'Remove from saved' : 'Save style'}
          >
            <Heart
              size={15}
              fill={isSaved ? '#E5484D' : 'none'}
              color={isSaved ? '#E5484D' : '#FFFFFF'}
            />
          </button>
        )}
        <span className="card-badge style-card__category">
          {style.categoryName || style.category?.name || 'Style'}
        </span>
      </div>

      <div className="style-card__body">
        <h3 className="style-card__title">{style.name}</h3>
        <p className="style-card__desc">{style.description || style.desc || 'Curated silhouette and sartorial styling.'}</p>

        {style.tags && Array.isArray(style.tags) && style.tags.length > 0 && (
          <div className="card-tags">
            {style.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="style-card__footer">
          <button
            type="button"
            className="style-card__action-btn"
            onClick={() => onOpenDetails && onOpenDetails(style)}
          >
            <span>Style Guide</span>
            <ArrowUpRight size={14} className="style-card__action-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StyleCardSkeleton() {
  return (
    <div className="elevate-card style-card style-card--skeleton animate-pulse">
      <div className="skeleton-media" />
      <div className="style-card__body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line skeleton-line--desc" />
        <div className="skeleton-line skeleton-line--desc short" />
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>
    </div>
  );
}

export default StyleCard;
