// src/hooks/useTheme.ts
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
  // IMPORTANT: Avoid accessing window/localStorage during SSR/build time
  if (typeof window === 'undefined') {
    return 'light'; // Default theme for server/build
  }

  try {
    const persistedColorPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (persistedColorPreference === 'light' || persistedColorPreference === 'dark') {
      return persistedColorPreference;
    }

    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
    if (systemPreference.matches) {
      return 'dark';
    }
  } catch (error) {
    console.warn('Could not access localStorage for theme:', error);
    // Fallback or default if localStorage access fails
  }

  return 'light'; // Default theme
}

export function useTheme() {
  // Initialize state *after* mount to ensure window/localStorage are available
  const [theme, setTheme] = useState<Theme | null>(null); // Start as null to avoid hydration mismatch

  // Effect to determine and set initial theme on the client side
  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);


  // Effect to update document class and localStorage when theme changes
  useEffect(() => {
    if (!theme) return; // Don't run if theme is not yet determined

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Could not save theme preference to localStorage:', error);
    }
  }, [theme]);

  // Effect to listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
        // Only update if NO explicit preference is stored
        const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (!storedPreference) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    };

    // Add listener safely
    try {
        // Use addEventListener if available (modern browsers)
        mediaQuery.addEventListener?.('change', handleChange);
    } catch (e1) {
        try {
            // Fallback for older browsers
            mediaQuery.addListener?.(handleChange);
        } catch (e2) {
            console.error("Could not add media query listener", e2);
        }
    }


    // Cleanup function
    return () => {
      try {
          mediaQuery.removeEventListener?.('change', handleChange);
      } catch (e1) {
          try {
              mediaQuery.removeListener?.(handleChange);
          } catch (e2) {
              console.error("Could not remove media query listener", e2);
          }
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
}