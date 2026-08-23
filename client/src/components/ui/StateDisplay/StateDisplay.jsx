import React from 'react';
import { Inbox, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './StateDisplay.css';
import Button from '../Button';

function renderIcon(Icon, defaultSize = 44) {
  if (!Icon) return null;
  if (typeof Icon === 'string' || typeof Icon === 'number') return Icon;
  if (React.isValidElement(Icon)) return Icon;
  const Component = Icon;
  return <Component size={defaultSize} strokeWidth={1.5} />;
}

/**
 * ELEVATE EmptyState Component
 * Displays when no data is available.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  actionLabel,
  className = '',
}) {
  return (
    <div className={`state-display state-display--empty ${className}`} role="status">
      <span className="state-display__icon">
        {renderIcon(Icon, 44)}
      </span>
      <h3 className="state-display__title">{title}</h3>
      {description && <p className="state-display__description">{description}</p>}
      {action && actionLabel && (
        <Button variant="primary" onClick={action} className="state-display__action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * ELEVATE ErrorState Component
 * Displays when an error occurs.
 */
export function ErrorState({
  icon: Icon = AlertTriangle,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) {
  return (
    <div className={`state-display state-display--error ${className}`} role="alert">
      <span className="state-display__icon">
        {renderIcon(Icon, 44)}
      </span>
      <h3 className="state-display__title">{title}</h3>
      {description && <p className="state-display__description">{description}</p>}
      {onRetry && (
        <Button variant="primary" onClick={onRetry} className="state-display__action">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * ELEVATE SuccessState Component
 * Displays after a successful action.
 */
export function SuccessState({
  icon: Icon = CheckCircle2,
  title = 'Success!',
  description,
  action,
  actionLabel,
  className = '',
}) {
  return (
    <div className={`state-display state-display--success ${className}`} role="status">
      <span className="state-display__icon">
        {renderIcon(Icon, 44)}
      </span>
      <h3 className="state-display__title">{title}</h3>
      {description && <p className="state-display__description">{description}</p>}
      {action && actionLabel && (
        <Button variant="primary" onClick={action} className="state-display__action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
