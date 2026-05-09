import React, { useState } from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  type = 'text',
  icon,
  className = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-200 mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full px-4 py-2.5 bg-white/5 border transition-all duration-200 rounded-lg
            text-white placeholder-slate-500
            focus:outline-none focus:bg-white/10
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'}
            ${focused && !error ? 'border-blue-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18.101 12.93l-.9-1.465A5.5 5.5 0 1111.5 2a5.491 5.491 0 015.535 4.975l.9-1.465A7 7 0 104.5 19a7 7 0 0013.601-6.07z" clipRule="evenodd"></path>
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = React.forwardRef(({
  label,
  error,
  helperText,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-200 mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full px-4 py-2.5 bg-white/5 border transition-all duration-200 rounded-lg
          text-white placeholder-slate-500 resize-none
          focus:outline-none focus:bg-white/10
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'}
          ${focused && !error ? 'border-blue-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({
  label,
  error,
  options = [],
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-200 mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-4 py-2.5 bg-white/5 border border-white/10 transition-all duration-200 rounded-lg
          text-white focus:outline-none focus:border-blue-500 focus:bg-white/10
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500/50 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export const Checkbox = React.forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex items-start">
      <input
        ref={ref}
        type="checkbox"
        className={`
          w-4 h-4 mt-1 rounded border border-white/20 bg-white/5
          text-blue-500 focus:ring-blue-500 focus:ring-2 focus:outline-none
          cursor-pointer transition-all
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm text-slate-300 cursor-pointer">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Input;
