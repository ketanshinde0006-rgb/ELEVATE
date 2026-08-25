import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

/**
 * ELEVATE Input Component
 *
 * Accessible form input with label, hint, error, icons, and integrated password visibility toggle.
 */
const Input = forwardRef(({
  label,
  hint,
  error,
  required = false,
  size = 'md',
  type = 'text',
  icon,
  suffix,
  showPasswordToggle = false,
  className = '',
  id: propId,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = propId || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  // Internal password visibility state (can be used when showPasswordToggle or type="password" is set)
  const isPasswordField = type === 'password' || showPasswordToggle;
  const [passwordVisible, setPasswordVisible] = useState(false);

  const effectiveType = isPasswordField
    ? (passwordVisible ? 'text' : 'password')
    : type;

  const hasSuffix = suffix || isPasswordField;
  const hasIcon = !!icon;

  const inputClasses = [
    'input',
    size !== 'md' && `input--${size}`,
    error && 'input--error',
    hasIcon && 'input--has-icon',
    hasSuffix && 'input--has-suffix',
    className,
  ].filter(Boolean).join(' ');

  const inputElement = (
    <input
      ref={ref}
      id={inputId}
      type={effectiveType}
      className={inputClasses}
      aria-invalid={!!error}
      aria-describedby={[
        error ? errorId : null,
        hint ? hintId : null,
      ].filter(Boolean).join(' ') || undefined}
      required={required}
      {...props}
    />
  );

  return (
    <div className="input-group">
      {label && (
        <label
          htmlFor={inputId}
          className={`input-group__label ${required ? 'input-group__label--required' : ''}`}
        >
          {label}
        </label>
      )}

      {hasIcon || hasSuffix ? (
        <div className="input-wrapper">
          {hasIcon && <span className="input-wrapper__icon">{icon}</span>}
          {inputElement}
          {suffix ? (
            <span className="input-wrapper__suffix">{suffix}</span>
          ) : isPasswordField ? (
            <button
              type="button"
              className="input-password-btn"
              onClick={() => setPasswordVisible(!passwordVisible)}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              title={passwordVisible ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {passwordVisible ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
            </button>
          ) : null}
        </div>
      ) : (
        inputElement
      )}

      {hint && !error && (
        <span id={hintId} className="input-group__hint">{hint}</span>
      )}

      {error && (
        <span id={errorId} className="input-group__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * ELEVATE Textarea Component
 */
export const Textarea = forwardRef(({
  label,
  hint,
  error,
  required = false,
  className = '',
  id: propId,
  rows = 4,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = propId || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="input-group">
      {label && (
        <label
          htmlFor={inputId}
          className={`input-group__label ${required ? 'input-group__label--required' : ''}`}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`input textarea ${error ? 'input--error' : ''} ${className}`}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={[
          error ? errorId : null,
          hint ? hintId : null,
        ].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {hint && !error && <span id={hintId} className="input-group__hint">{hint}</span>}
      {error && <span id={errorId} className="input-group__error" role="alert">{error}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

/**
 * ELEVATE Select Component
 */
export const Select = forwardRef(({
  label,
  hint,
  error,
  required = false,
  options = [],
  placeholder = 'Select...',
  className = '',
  id: propId,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = propId || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="input-group">
      {label && (
        <label
          htmlFor={inputId}
          className={`input-group__label ${required ? 'input-group__label--required' : ''}`}
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={`input select ${error ? 'input--error' : ''} ${className}`}
        required={required}
        aria-invalid={!!error}
        aria-describedby={[
          error ? errorId : null,
          hint ? hintId : null,
        ].filter(Boolean).join(' ') || undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <span id={hintId} className="input-group__hint">{hint}</span>}
      {error && <span id={errorId} className="input-group__error" role="alert">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;
