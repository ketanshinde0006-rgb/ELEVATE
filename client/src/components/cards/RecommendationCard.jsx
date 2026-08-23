import { Sparkles, ArrowRight, Check } from 'lucide-react';
import './Cards.css';

/**
 * Reusable RecommendationCard for smart wardrobe suggestions
 */
export function RecommendationCard({
  recommendation,
  onWear,
  onOpenDetails,
  className = '',
}) {
  return (
    <div className={`elevate-card rec-card ${className}`}>
      {recommendation.image && (
        <div className="rec-card__media">
          <img src={recommendation.image} alt={recommendation.title} className="rec-card__img" />
          <span className="card-badge rec-card__badge">
            <Sparkles size={11} style={{ marginRight: 4 }} /> Recommendation
          </span>
        </div>
      )}

      <div className="rec-card__body">
        <div className="rec-card__header">
          <h3 className="rec-card__title">{recommendation.title || 'Curated Styling'}</h3>
          {recommendation.occasion && (
            <span className="card-badge">{recommendation.occasion}</span>
          )}
        </div>

        <p className="rec-card__desc">
          {recommendation.description || recommendation.explanation || 'Crafted around your preferred palette and current climate.'}
        </p>

        {recommendation.rationale && (
          <div className="rec-card__rationale">
            <span className="rec-card__rationale-label">Why it works:</span>
            <p className="rec-card__rationale-text">{recommendation.rationale}</p>
          </div>
        )}

        {recommendation.items && recommendation.items.length > 0 && (
          <div className="rec-card__pieces-row">
            {recommendation.items.map((piece, idx) => (
              <span key={idx} className="card-tag card-tag--gold">
                {piece.name || piece}
              </span>
            ))}
          </div>
        )}

        <div className="rec-card__footer">
          {onWear && (
            <button
              type="button"
              className="rec-card__btn rec-card__btn--primary"
              onClick={() => onWear(recommendation)}
            >
              <Check size={13} style={{ marginRight: 5 }} /> Log as Worn
            </button>
          )}
          {onOpenDetails && (
            <button
              type="button"
              className="rec-card__btn rec-card__btn--ghost"
              onClick={() => onOpenDetails(recommendation)}
            >
              <span>Explore Look</span>
              <ArrowRight size={13} style={{ marginLeft: 4 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;
