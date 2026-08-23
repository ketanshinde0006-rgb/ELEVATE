import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

/**
 * ELEVATE Button Component
 * 
 * Reusable button with multiple variants, sizes, and states.
 * Can render as <button>, <a>, or <Link> based on props.
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'dark'|'ghost'|'accent'|'danger'|'success'|'link'} props.variant
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} props.size
 * @param {boolean} props.loading
 * @param {boolean} props.disabled
 * @param {boolean} props.fullWidth
 * @param {boolean} props.iconOnly
 * @param {string} props.to - React Router link
 * @param {string} props.href - External link
 * @param {React.ReactNode} props.children
 */
const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconOnly = false,
  to,
  href,
  className = '',
  children,
  type = 'button',
  ...props
}, ref) => {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    loading && 'btn--loading',
    disabled && 'btn--disabled',
    fullWidth && 'btn--full',
    iconOnly && 'btn--icon',
    className,
  ].filter(Boolean).join(' ');

  // Render as React Router Link
  if (to && !disabled) {
    return (
      <Link to={to} className={classes} ref={ref} {...props}>
        {children}
      </Link>
    );
  }

  // Render as external anchor
  if (href && !disabled) {
    return (
      <a
        href={href}
        className={classes}
        ref={ref}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      ref={ref}
      aria-busy={loading}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
