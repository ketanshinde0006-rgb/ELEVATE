import { useState } from 'react';
import { Heart, Layers, ArrowUpRight, Trash2 } from 'lucide-react';
import './Cards.css';

/**
 * Reusable OutfitCard for Saved Outfits & Outfit History
 */
export function OutfitCard({
  outfit,
  onToggleFavorite,
  onOpenDetails,
  onDelete,
  className = '',
}) {
  const items = outfit.items || [];
  const itemCount = items.length;

  return (
    <div className={`elevate-card outfit-card ${className}`}>
      {/* Visual Composite Header */}
      <div className="outfit-card__media" onClick={() => onOpenDetails && onOpenDetails(outfit)}>
        {items.length > 0 ? (
          <div className={`outfit-card__grid-mosaic outfit-card__grid-mosaic--${Math.min(items.length, 4)}`}>
            {items.slice(0, 4).map((itemWrap, idx) => {
              const piece = itemWrap.wardrobeItem || itemWrap;
              return (
                <div key={idx} className="outfit-card__piece-box">
                  {piece.image ? (
                    <img src={piece.image} alt={piece.name || 'Piece'} className="outfit-card__piece-img" />
                  ) : (
                    <div className="outfit-card__piece-placeholder">
                      <span>{piece.name?.[0] || '✦'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="outfit-card__empty-preview">
            <Layers size={24} color="#C5A880" />
            <span>Curated Ensemble</span>
          </div>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            className={`card-fav-btn ${outfit.favorite ? 'card-fav-btn--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(outfit.id);
            }}
            aria-label={outfit.favorite ? 'Unmark favorite' : 'Mark favorite'}
          >
            <Heart
              size={14}
              fill={outfit.favorite ? '#E5484D' : 'none'}
              color={outfit.favorite ? '#E5484D' : '#FFFFFF'}
            />
          </button>
        )}

        <span className="card-badge outfit-card__piece-count">
          {itemCount} {itemCount === 1 ? 'Piece' : 'Pieces'}
        </span>
      </div>

      <div className="outfit-card__body">
        <div className="outfit-card__title-row">
          <h3 className="outfit-card__title" onClick={() => onOpenDetails && onOpenDetails(outfit)}>
            {outfit.name || 'Untitled Outfit'}
          </h3>
        </div>

        {/* Tags */}
        <div className="card-tags">
          {outfit.occasion && <span className="card-tag">{outfit.occasion}</span>}
          {outfit.season && outfit.season !== 'All Season' && <span className="card-tag">{outfit.season}</span>}
          {outfit.style && <span className="card-tag">{outfit.style}</span>}
        </div>

        {outfit.notes && (
          <p className="outfit-card__notes">{outfit.notes}</p>
        )}

        <div className="outfit-card__footer">
          <button
            type="button"
            className="outfit-card__action-btn"
            onClick={() => onOpenDetails && onOpenDetails(outfit)}
          >
            <span>View Outfit</span>
            <ArrowUpRight size={13} />
          </button>
          {onDelete && (
            <button
              type="button"
              className="outfit-card__delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(outfit.id);
              }}
              aria-label="Delete outfit"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OutfitCardSkeleton() {
  return (
    <div className="elevate-card outfit-card outfit-card--skeleton animate-pulse">
      <div className="skeleton-media" />
      <div className="outfit-card__body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>
    </div>
  );
}

export default OutfitCard;
