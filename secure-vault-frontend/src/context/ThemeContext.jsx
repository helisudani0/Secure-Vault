import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme context for managing dark/light mode
 */
const ThemeContext = createContext();

/**
 * Theme provider component
 * Manages theme state and persists to localStorage
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const setThemeExplicit = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'auto') {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeExplicit,
    isDark: theme === 'dark',
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
  const html = document.documentElement;
  
  // Remove existing theme classes
  html.classList.remove('light', 'dark');
  
  // Add new theme class
  html.classList.add(theme);
  
  // Set data attribute for CSS selectors
  html.setAttribute('data-theme', theme);
  
  // Set color-scheme for native elements
  document.documentElement.style.colorScheme = theme;
}
