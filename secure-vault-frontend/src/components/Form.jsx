// src/components/Form.jsx
import React, { useState, useCallback } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { FieldError } from './ErrorBoundary';
import { calculatePasswordStrength } from '../utils/validation';

/**
 * Form input component with validation
 */
export function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = '',
  helpText,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${name}-error` : undefined;
  const helpId = helpText ? `${name}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ');

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-600" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={`
            input-field
            ${error ? 'error' : ''}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex="0"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {helpText && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      {error && <FieldError error={error} id={errorId} />}
    </div>
  );
}

/**
 * Form textarea component
 */
export function FormTextarea({
  label,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  helpText,
  ...props
}) {
  const errorId = error ? `${name}-error` : undefined;
  const helpId = helpText ? `${name}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ');

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-600" aria-label="required">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        className={`
          input-field
          ${error ? 'error' : ''}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
        {...props}
      />
      {helpText && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      {error && <FieldError error={error} id={errorId} />}
    </div>
  );
}

/**
 * Form select component
 */
export function FormSelect({
  label,
  name,
  options,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  helpText,
  ...props
}) {
  const errorId = error ? `${name}-error` : undefined;
  const helpId = helpText ? `${name}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ');

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-600" aria-label="required">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        className={`
          input-field
          ${error ? 'error' : ''}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      {error && <FieldError error={error} id={errorId} />}
    </div>
  );
}

/**
 * Password strength indicator
 */
export function PasswordStrengthIndicator({ password, showLabel = true }) {
  const { strength, level, color } = calculatePasswordStrength(password);

  const colorClass = {
    red: 'bg-red-600',
    amber: 'bg-amber-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
  }[color];

  const levelClass = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
  }[color];

  if (!password) return null;

  const strengthPercentage = (strength / 8) * 100;
  const levelText = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <div className="mt-2" role="status" aria-live="polite">
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${strengthPercentage}%` }}
          role="progressbar"
          aria-valuenow={strength}
          aria-valuemin="0"
          aria-valuemax="8"
          aria-label={`Password strength: ${levelText}`}
        />
      </div>
      {showLabel && (
        <p className={`text-sm font-medium mt-1 ${levelClass}`}>
          Strength: {levelText}
        </p>
      )}
    </div>
  );
}

/**
 * Form group component
 */
export function FormGroup({ children, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Form actions component (buttons)
 */
export function FormActions({
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  isValid = true,
  className = '',
}) {
  return (
    <div className={`flex gap-2 justify-end ${className}`} role="group" aria-label="Form actions">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label={cancelLabel}
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting || !isValid}
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-label={isSubmitting ? `${submitLabel} - processing` : submitLabel}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Processing...' : submitLabel}
      </button>
    </div>
  );
}

/**
 * Checkbox component
 */
export function FormCheckbox({
  label,
  name,
  checked,
  onChange,
  error,
  disabled = false,
  className = '',
  ...props
}) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className={className}>
      <label className="flex items-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 rounded px-1">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-describedby={errorId || undefined}
          aria-invalid={!!error}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
          {...props}
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
      {error && <FieldError error={error} id={errorId} className="ml-6" />}
    </div>
  );
}

/**
 * Radio group component
 */
export function FormRadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
}) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </legend>
      )}
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              disabled={disabled}
              className="w-4 h-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <FieldError error={error} />}
    </fieldset>
  );
}
