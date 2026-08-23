import { MessageSquare, Copy, Check, X } from 'lucide-react';
import { useState } from 'react';
import './SmsNotificationToast.css';

export function SmsNotificationToast({ code, phone, onClose, onAutofill }) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    if (onAutofill) onAutofill(code);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sms-toast animate-slide-down">
      <div className="sms-toast-icon">
        <MessageSquare size={16} />
      </div>
      <div className="sms-toast-content">
        <div className="sms-toast-meta">
          <span className="sms-toast-app">Messages</span>
          <span className="sms-toast-time">Now</span>
        </div>
        <p className="sms-toast-body">
          <strong>ELEVATE Code:</strong> Your verification code is <span className="sms-toast-code">{code}</span>. Valid for 5 minutes.
        </p>
      </div>
      <div className="sms-toast-actions">
        <button type="button" className="sms-toast-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Filled!' : 'Use Code'}</span>
        </button>
        <button type="button" className="sms-toast-close" onClick={onClose} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default SmsNotificationToast;
