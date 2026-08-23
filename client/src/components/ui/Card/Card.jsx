import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import './Card.css';

/**
 * ELEVATE Card Component
 *
 * Versatile card component for displaying content with images,
 * overlays, and various visual styles.
 *
 * @param {Object} props
 * @param {'default'|'flat'|'outlined'|'elevated'|'glass'|'dark'} props.variant
 * @param {boolean} props.clickable
 * @param {string} props.to - Optional React Router link
 * @param {string} props.href - Optional external link
 */
const Card = forwardRef(({
  variant = 'default',
  clickable = false,
  to,
  href,
  className = '',
  children,
  ...props
}, ref) => {
  const classes = [
    'card',
    variant !== 'default' && `card--${variant}`,
    (clickable || to || href) && 'card--clickable',
    className,
  ].filter(Boolean).join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} ref={ref} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} ref={ref} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  const Tag = clickable ? 'button' : 'div';
  return (
    <Tag className={classes} ref={ref} {...props}>
      {children}
    </Tag>
  );
});

Card.displayName = 'Card';

/* Sub-components */
function CardImage({ src, alt, aspectRatio = '16/10', overlay, children, className = '' }) {
  return (
    <div
      className={`card__image-wrapper ${className}`}
      style={{ aspectRatio }}
    >
      {src ? (
        <img src={src} alt={alt || ''} className="card__image" loading="lazy" />
      ) : (
        <div className="card__image animate-shimmer" style={{ width: '100%', height: '100%' }} />
      )}
      {overlay && <div className="card__image-overlay">{children}</div>}
      {!overlay && children}
    </div>
  );
}

function CardBody({ compact, spacious, className = '', children }) {
  const classes = [
    'card__body',
    compact && 'card__body--compact',
    spacious && 'card__body--spacious',
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
}

function CardHeader({ className = '', children }) {
  return <div className={`card__header ${className}`}>{children}</div>;
}

function CardTitle({ as: Tag = 'h3', className = '', children }) {
  return <Tag className={`card__title ${className}`}>{children}</Tag>;
}

function CardSubtitle({ className = '', children }) {
  return <p className={`card__subtitle ${className}`}>{children}</p>;
}

function CardContent({ className = '', children }) {
  return <div className={`card__content ${className}`}>{children}</div>;
}

function CardFooter({ className = '', children }) {
  return <div className={`card__footer ${className}`}>{children}</div>;
}

function CardBadge({ className = '', children }) {
  return <div className={`card__badge ${className}`}>{children}</div>;
}

function CardActions({ className = '', children }) {
  return <div className={`card__actions ${className}`}>{children}</div>;
}

Card.Image = CardImage;
Card.Body = CardBody;
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Badge = CardBadge;
Card.Actions = CardActions;

export default Card;
