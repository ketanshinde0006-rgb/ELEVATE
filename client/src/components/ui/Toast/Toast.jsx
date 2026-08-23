import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

/**
 * ELEVATE Toast Provider
 * Provides toast notification functionality throughout the app.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = Date.now() + Math.random();
    const toast = { id, type, title, message };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = {
    addToast,
    removeToast,
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_ICONS = {
  success: <CheckCircle2 size={16} strokeWidth={1.8} />,
  error: <AlertCircle size={16} strokeWidth={1.8} />,
  warning: <AlertTriangle size={16} strokeWidth={1.8} />,
  info: <Info size={16} strokeWidth={1.8} />,
};

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          role="alert"
        >
          <span className="toast__icon">{TOAST_ICONS[toast.type]}</span>
          <div className="toast__content">
            {toast.title && <strong className="toast__title">{toast.title}</strong>}
            <p className="toast__message">{toast.message}</p>
          </div>
          <button
            className="toast__close"
            onClick={() => onRemove(toast.id)}
            aria-label="Dismiss notification"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
