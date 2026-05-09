import React, { useEffect, useRef } from 'react';

/**
 * Hook for keyboard navigation in lists
 * Handles Arrow Up/Down, Home, End, Enter keys
 */
export function useKeyboardNavigation({
  items = [],
  onSelect = null,
  loop = true,
}) {
  const [focused, setFocused] = React.useState(0);
  const containerRef = useRef(null);

  const handleKeyDown = (e) => {
    let newIndex = focused;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = loop
          ? (focused - 1 + items.length) % items.length
          : Math.max(0, focused - 1);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = loop
          ? (focused + 1) % items.length
          : Math.min(items.length - 1, focused + 1);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onSelect) onSelect(items[focused], focused);
        return;
      default:
        return;
    }

    setFocused(newIndex);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [focused, items, onSelect]);

  return { focused, setFocused, containerRef };
}

/**
 * Hook for managing focus trap in modals/dialogs
 * Keeps focus within element, circular Tab navigation
 */
export function useFocusTrap(isActive = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = ref.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        if (activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    ref.current.addEventListener('keydown', handleKeyDown);
    return () => ref.current?.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return ref;
}

/**
 * Hook to manage focus on element mount
 */
export function useAutoFocus(shouldFocus = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
    }
  }, [shouldFocus]);

  return ref;
}

/**
 * Hook for escape key handling (for modals, dialogs)
 */
export function useEscapeKey(onEscape, isActive = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
}
