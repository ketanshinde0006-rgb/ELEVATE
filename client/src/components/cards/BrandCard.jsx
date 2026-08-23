import { useState } from 'react';
import { Heart, ExternalLink, ArrowUpRight } from 'lucide-react';
import './Cards.css';

/**
 * Reusable BrandCard for Brand Explorer & Directory
 */
export function BrandCard({
  brand,
  isSaved = false,
  onToggleSave,
  onOpenDetails,
  compact = false,
  className = '',
}) {
  const getPriceBadgeClass = (price) => {
    switch (price) {
      case 'Luxury': return 'badge--luxury';
      case 'Premium': return 'badge--premium';
      case 'Mid-range': return 'badge--mid';
      default: return 'badge--neutral';
    }
  };

  const parsedStyles = typeof brand.styles === 'string'
    ? JSON.parse(brand.styles || '[]')
    : (brand.styles || []);

  if (compact) {
    return (
      <div className={`elevate-card brand-card brand-card--compact ${className}`}>
        <div className="brand-card__logo-wrap">
          <span className="brand-card__logo-text">{brand.logo || '✨'}</span>
        </div>
        <div className="brand-card__content">
          <div className="brand-card__header-row">
            <h4 className="brand-card__title">{brand.name}</h4>
            {brand.priceSegment && (
              <span className={`card-badge ${getPriceBadgeClass(brand.priceSegment)}`}>
                {brand.priceSegment}
              </span>
            )}
          </div>
          <span className="brand-card__category">{brand.category || 'Apparel'}</span>
        </div>
        {onToggleSave && (
          <button
            type="button"
            className={`card-fav-btn card-fav-btn--inline ${isSaved ? 'card-fav-btn--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(brand.id);
            }}
            aria-label={isSaved ? 'Remove from saved' : 'Save brand'}
          >
            <Heart
              size={14}
              fill={isSaved ? '#E5484D' : 'none'}
              color={isSaved ? '#E5484D' : '#8E8C8A'}
            />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`elevate-card brand-card ${className}`}>
      <div className="brand-card__top">
        <div className="brand-card__logo-box">
          <span className="brand-card__logo-icon">{brand.logo || '🏷️'}</span>
        </div>
        <div className="brand-card__top-actions">
          {brand.priceSegment && (
            <span className={`card-badge ${getPriceBadgeClass(brand.priceSegment)}`}>
              {brand.priceSegment}
            </span>
          )}
          {onToggleSave && (
            <button
              type="button"
              className={`card-fav-btn ${isSaved ? 'card-fav-btn--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(brand.id);
              }}
              aria-label={isSaved ? 'Remove from saved' : 'Save brand'}
            >
              <Heart
                size={14}
                fill={isSaved ? '#E5484D' : 'none'}
                color={isSaved ? '#E5484D' : '#8E8C8A'}
              />
            </button>
          )}
        </div>
      </div>

      <div className="brand-card__body">
        <div className="brand-card__meta">
          <span className="brand-card__category">{brand.category || 'Fashion & Lifestyle'}</span>
          <h3 className="brand-card__title">{brand.name}</h3>
        </div>
        <p className="brand-card__desc">{brand.description || 'Global heritage label.'}</p>

        {parsedStyles.length > 0 && (
          <div className="card-tags">
            {parsedStyles.slice(0, 3).map((st) => (
              <span key={st} className="card-tag">
                {st}
              </span>
            ))}
          </div>
        )}

        <div className="brand-card__footer">
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-card__web-link"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} style={{ marginRight: 4 }} />
              Visit Store
            </a>
          )}
          <button
            type="button"
            className="brand-card__action-btn"
            onClick={() => onOpenDetails && onOpenDetails(brand)}
          >
            <span>Details</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function BrandCardSkeleton() {
  return (
    <div className="elevate-card brand-card brand-card--skeleton animate-pulse">
      <div className="skeleton-logo-box" />
      <div className="skeleton-line skeleton-line--title" />
      <div className="skeleton-line skeleton-line--desc" />
      <div className="skeleton-tags">
        <div className="skeleton-tag" />
        <div className="skeleton-tag" />
      </div>
    </div>
  );
}

export default BrandCard;
