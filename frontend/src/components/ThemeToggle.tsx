import React, { useEffect, useState } from 'react';

// Custom hook for theme management
const useTheme = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check if user has a preference stored
    const savedTheme = localStorage.getItem('theme');
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return savedTheme === 'dark' || (!savedTheme && prefersDark);
  });

  useEffect(() => {
    // Update the document class when darkMode changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches);
      }
    };
    
    // Add event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener?.(handleChange);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener?.(handleChange);
      }
    };
  }, []);

  return { darkMode, setDarkMode };
};

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '',
  size = 'md'
}) => {
  const { darkMode, setDarkMode } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Size variants for the button and icons
  const sizeClasses = {
    sm: {
      button: 'p-1',
      icon: 'h-4 w-4'
    },
    md: {
      button: 'p-2',
      icon: 'h-5 w-5'
    },
    lg: {
      button: 'p-3',
      icon: 'h-6 w-6'
    }
  };

  const toggleTheme = () => {
    setIsTransitioning(true);
    setDarkMode(!darkMode);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Match this with the duration of your CSS transition
  };

  return (
    <button
      onClick={toggleTheme}
      className={`${sizeClasses[size].button} rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all ${className}`}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      disabled={isTransitioning}
    >
      <div className={`relative ${isTransitioning ? 'animate-spin' : ''}`}>
        {/* Sun icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses[size].icon} absolute transition-opacity duration-300 ${darkMode ? 'opacity-100' : 'opacity-0'} text-yellow-300`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
        
        {/* Moon icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses[size].icon} transition-opacity duration-300 ${darkMode ? 'opacity-0' : 'opacity-100'} text-gray-700 dark:text-gray-200`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>
    </button>
  );
};

export default ThemeToggle;