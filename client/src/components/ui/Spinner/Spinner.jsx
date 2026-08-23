import './Spinner.css';

/**
 * ELEVATE Spinner / Loading Component
 */
function Spinner({ size = 'md', label = 'Loading...', fullPage = false, className = '' }) {
  if (fullPage) {
    return (
      <div className="spinner-fullpage" role="status" aria-label={label}>
        <div className={`spinner spinner--${size} ${className}`} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div className={`spinner-container ${className}`} role="status" aria-label={label}>
      <div className={`spinner spinner--${size}`} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay" role="status" aria-label={message}>
      <div className="loading-overlay__content">
        <div className="spinner spinner--lg" />
        <p className="loading-overlay__message">{message}</p>
      </div>
    </div>
  );
}

export default Spinner;
