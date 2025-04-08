// src/components/ThemeToggle.tsx
import React from 'react';
import { useTheme } from '../hooks/useTheme'; // Adjust path as needed

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Avoid rendering mismatch during SSR/hydration - render nothing until theme is determined client-side
  if (!theme) {
    // Optional: Render a placeholder or skeleton if needed, but null is often fine
    // to prevent layout shifts if the button size is small/predictable.
    return null;
  }

  const isDarkMode = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-neutral-800 transition-colors"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDarkMode} // Indicate toggle state
      type="button" // Explicitly set type for buttons
    >
      {isDarkMode ? (
        // Sun Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;