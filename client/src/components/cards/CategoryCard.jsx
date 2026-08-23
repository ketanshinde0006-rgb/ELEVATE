import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './Cards.css';

/**
 * Compact photographic category card
 */
export function CategoryCard({
  category,
  linkTo,
  onClick,
  className = '',
}) {
  const CardContent = (
    <div className={`elevate-card category-card ${className}`}>
      <div className="category-card__media">
        <img src={category.image} alt={category.name} className="category-card__img" loading="lazy" />
        <div className="category-card__overlay" />
        <div className="category-card__content">
          <h3 className="category-card__title">{category.name}</h3>
          {category.description && (
            <p className="category-card__subtitle">{category.description}</p>
          )}
          <span className="category-card__arrow">
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="category-card__link">
        {CardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} style={{ cursor: 'pointer' }}>
        {CardContent}
      </div>
    );
  }

  return CardContent;
}

export default CategoryCard;
