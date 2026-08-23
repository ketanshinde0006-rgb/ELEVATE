import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import './Alert.css';

/**
 * ELEVATE Alert Component
 *
 * Inline notification/message component.
 */
function Alert({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) {
  const icons = {
    info: <Info size={16} strokeWidth={1.8} />,
    success: <CheckCircle2 size={16} strokeWidth={1.8} />,
    warning: <AlertTriangle size={16} strokeWidth={1.8} />,
    error: <AlertCircle size={16} strokeWidth={1.8} />,
  };

  return (
    <div className={`alert alert--${type} ${className}`} role="alert">
      <span className="alert__icon">{icons[type]}</span>
      <div className="alert__content">
        {title && <strong className="alert__title">{title}</strong>}
        <div className="alert__message">{children}</div>
      </div>
      {dismissible && (
        <button
          className="alert__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default Alert;
