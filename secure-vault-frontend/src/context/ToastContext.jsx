// src/context/ToastContext.jsx
import React, { createContext, useCallback, useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContext = createContext();

/**
 * Toast Provider component
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value = {
    addToast,
    removeToast,
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container component
 */
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * Individual Toast component
 */
function Toast({ toast, onRemove }) {
  const getIcon = () => {
    const iconProps = { className: 'w-5 h-5' };
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'toast p-4 flex items-start gap-3';
    const typeStyles = {
      success: 'bg-green-50 border border-green-200',
      error: 'bg-red-50 border border-red-200',
      warning: 'bg-amber-50 border border-amber-200',
      info: 'bg-blue-50 border border-blue-200',
    };
    return `${baseStyles} ${typeStyles[toast.type] || typeStyles.info}`;
  };

  const getIconColor = () => {
    const colors = {
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-amber-600',
      info: 'text-blue-600',
    };
    return colors[toast.type] || colors.info;
  };

  const getTextColor = () => {
    const colors = {
      success: 'text-green-900',
      error: 'text-red-900',
      warning: 'text-amber-900',
      info: 'text-blue-900',
    };
    return colors[toast.type] || colors.info;
  };

  return (
    <div className={getStyles()} role="alert">
      <div className={`flex-shrink-0 ${getIconColor()} mt-0.5`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${getTextColor()}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={onRemove}
        className={`flex-shrink-0 ${getIconColor()} hover:opacity-75`}
        aria-label="Dismiss notification"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * Hook to use toast context
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
