// src/utils/validation.js
/**
 * Comprehensive form validation utilities
 */

export const ValidationRules = {
  // Required field
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required';
    }
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  // Username validation (3-30 chars, alphanumeric + underscore)
  username: (value) => {
    if (!value) return null;
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 30) {
      return 'Username must not exceed 30 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  },

  // Password validation (8+ chars with complexity)
  password: (value) => {
    if (!value) return null;
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(value)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return null;
  },

  // Strong password (for master password)
  strongPassword: (value) => {
    if (!value) return null;
    if (value.length < 12) {
      return 'Master password must be at least 12 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Must contain uppercase letters';
    }
    if (!/[a-z]/.test(value)) {
      return 'Must contain lowercase letters';
    }
    if (!/[0-9]/.test(value)) {
      return 'Must contain numbers';
    }
    if (!/[!@#$%^&*?]/.test(value)) {
      return 'Must contain special characters (!@#$%^&*?)';
    }
    return null;
  },

  // Password confirmation
  passwordMatch: (password, confirmPassword) => {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  },

  // Min length
  minLength: (minLen) => (value) => {
    if (!value) return null;
    if (value.length < minLen) {
      return `Must be at least ${minLen} characters`;
    }
    return null;
  },

  // Max length
  maxLength: (maxLen) => (value) => {
    if (!value) return null;
    if (value.length > maxLen) {
      return `Must not exceed ${maxLen} characters`;
    }
    return null;
  },

  // Min number
  minValue: (min) => (value) => {
    if (value === null || value === '') return null;
    if (Number(value) < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },

  // Max number
  maxValue: (max) => (value) => {
    if (value === null || value === '') return null;
    if (Number(value) > max) {
      return `Must not exceed ${max}`;
    }
    return null;
  },

  // URL validation
  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  // Number validation
  number: (value) => {
    if (!value) return null;
    if (isNaN(value)) {
      return 'Must be a valid number';
    }
    return null;
  },

  // File size validation (in MB)
  fileSize: (maxSizeMB) => (file) => {
    if (!file) return null;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must not exceed ${maxSizeMB}MB`;
    }
    return null;
  },

  // File type validation
  fileType: (allowedTypes) => (file) => {
    if (!file) return null;
    if (!allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    return null;
  },
};

/**
 * Validator class for managing form validation
 */
export class Validator {
  constructor() {
    this.errors = {};
  }

  /**
   * Validate a single field
   */
  validateField(name, value, rules) {
    const fieldErrors = [];
    
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        fieldErrors.push(error);
      }
    }

    if (fieldErrors.length > 0) {
      this.errors[name] = fieldErrors[0]; // Store first error
      return false;
    } else {
      delete this.errors[name];
      return true;
    }
  }

  /**
   * Validate multiple fields
   */
  validateFields(values, rulesMap) {
    this.errors = {};
    let isValid = true;

    for (const [name, rules] of Object.entries(rulesMap)) {
      if (!this.validateField(name, values[name], rules)) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Get error for field
   */
  getError(name) {
    return this.errors[name] || null;
  }

  /**
   * Check if field has error
   */
  hasError(name) {
    return !!this.errors[name];
  }

  /**
   * Get all errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clear errors
   */
  clear() {
    this.errors = {};
  }

  /**
   * Clear specific field error
   */
  clearField(name) {
    delete this.errors[name];
  }
}

/**
 * Password strength indicator
 */
export function calculatePasswordStrength(password) {
  if (!password) return { strength: 0, level: 'weak', color: 'red' };

  let strength = 0;

  // Length
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;

  // Character variety
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[!@#$%^&*?]/.test(password)) strength += 1;

  const levels = [
    { threshold: 2, level: 'weak', color: 'red' },
    { threshold: 4, level: 'fair', color: 'amber' },
    { threshold: 6, level: 'good', color: 'blue' },
    { threshold: 8, level: 'strong', color: 'green' },
  ];

  const result = levels.find(l => strength <= l.threshold) || levels[levels.length - 1];

  return {
    strength: Math.min(strength, 8),
    level: result.level,
    color: result.color,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors) {
  if (typeof errors === 'string') {
    return [errors];
  }

  if (Array.isArray(errors)) {
    return errors;
  }

  if (typeof errors === 'object') {
    const formatted = [];
    for (const [field, messages] of Object.entries(errors)) {
      if (Array.isArray(messages)) {
        formatted.push(`${field}: ${messages[0]}`);
      } else if (typeof messages === 'string') {
        formatted.push(`${field}: ${messages}`);
      }
    }
    return formatted;
  }

  return ['An error occurred'];
}

/**
 * Debounce validation for real-time checking
 */
export function debounceValidation(callback, delay = 300) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}
