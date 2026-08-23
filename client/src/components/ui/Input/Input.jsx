import { forwardRef, useId } from 'react';
import './Input.css';

/**
 * ELEVATE Input Component
 *
 * Accessible form input with label, hint, error, and icon support.
 */
const Input = forwardRef(({
  label,
  hint,
  error,
  required = false,
  size = 'md',
  icon,
  suffix,
  className = '',
  id: propId,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = propId || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const inputClasses = [
    'input',
    size !== 'md' && `input--${size}`,
    error && 'input--error',
    className,
  ].filter(Boolean).join(' ');

  const input = (
    <input
      ref={ref}
      id={inputId}
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

      {icon || suffix ? (
        <div className="input-wrapper">
          {icon && <span className="input-wrapper__icon">{icon}</span>}
          {input}
          {suffix && <span className="input-wrapper__suffix">{suffix}</span>}
        </div>
      ) : (
        input
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
        {...props}
      />
      {hint && !error && <span className="input-group__hint">{hint}</span>}
      {error && <span className="input-group__error" role="alert">{error}</span>}
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
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <span className="input-group__hint">{hint}</span>}
      {error && <span className="input-group__error" role="alert">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;
