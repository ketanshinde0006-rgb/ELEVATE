import './Badge.css';

/**
 * ELEVATE Badge Component
 *
 * Small label for status, categories, tags, etc.
 */
function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className = '',
  children,
}) {
  const classes = [
    'badge',
    `badge--${variant}`,
    size !== 'md' && `badge--${size}`,
    dot && 'badge--dot',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className="badge__dot" />}
      {children}
      {removable && (
        <button
          className="badge__remove"
          onClick={onRemove}
          aria-label="Remove"
          type="button"
        >
          ×
        </button>
      )}
    </span>
  );
}

export default Badge;
