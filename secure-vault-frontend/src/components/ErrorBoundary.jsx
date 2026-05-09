// src/components/ErrorBoundary.jsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Error Boundary component for catching React errors
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" role="alert" aria-live="assertive">
          <div className="max-w-md w-full">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-bold text-gray-900 mb-2" id="error-title">Something went wrong</h2>
              <p className="text-gray-600 text-sm mb-4" id="error-description">
                An unexpected error occurred. Please try again or contact support if the problem persists.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left text-xs bg-gray-100 p-2 rounded mb-4 max-h-40 overflow-y-auto">
                  <summary className="cursor-pointer font-bold mb-2">Error details (dev only)</summary>
                  <pre className="text-red-600">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                </details>
              )}
              <button
                onClick={this.handleReset}
                className="btn btn-primary w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-describedby="error-description"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error message component
 */
export function ErrorMessage({ error, onDismiss }) {
  if (!error) return null;

  const getMessage = () => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.detail) return error.detail;
    return 'An error occurred';
  };

  return (
    <div 
      className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-900">{getMessage()}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded p-1"
          aria-label="Dismiss error"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/**
 * Field-level error component (for forms)
 */
export function FieldError({ error, className = '', id }) {
  if (!error) return null;

  return (
    <p 
      id={id}
      className={`text-sm text-red-600 mt-1 ${className}`}
      role="alert"
    >
      {typeof error === 'string' ? error : error[0] || 'This field is required'}
    </p>
  );
}

/**
 * API error handler - returns human-friendly error message
 */
export function parseApiError(error) {
  if (!error) return 'An unknown error occurred';

  // Network error
  if (error.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Response error with data
  if (error.response?.data) {
    const data = error.response.data;
    
    if (typeof data === 'string') return data;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    
    // Field errors
    if (typeof data === 'object') {
      const firstError = Object.entries(data)[0];
      if (firstError) {
        const [field, messages] = firstError;
        if (Array.isArray(messages)) return messages[0];
        return messages;
      }
    }
  }

  // Response error status
  if (error.response?.status) {
    const status = error.response.status;
    const messages = {
      400: 'Invalid request. Please check your input.',
      401: 'Please log in to continue.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      503: 'Service unavailable. Please try again later.',
    };
    return messages[status] || `Error: ${status}`;
  }

  return error.message || 'An error occurred';
}
