import React, { useEffect, useState, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import './index.css';

// Lazy load components for better performance
const Chat = React.lazy(() => import('./components/Chat'));

// Custom error boundary component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CustomErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error:', error);
    console.error('Error details:', errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h2>
            <div className="text-gray-700 dark:text-gray-300 mb-4 p-3 bg-red-50 dark:bg-gray-700 rounded border border-red-100 dark:border-gray-600">
              <p className="mb-2 font-medium">Error details:</p>
              <pre className="text-sm overflow-auto">{this.state.error?.message}</pre>
            </div>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Please try refreshing the page or check if Ollama is running properly.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
      <p className="text-gray-700 dark:text-gray-300">Loading application...</p>
    </div>
  </div>
);

function App() {
  const [theme, setTheme] = useState('');

  // Initialize and manage theme
  useEffect(() => {
    // Function to set the theme
    const applyTheme = (newTheme: string) => {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', newTheme);
      setTheme(newTheme);
    };

    // Initialize theme on component mount
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Add event listener for theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener?.(handleThemeChange);
    }

    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleThemeChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener?.(handleThemeChange);
      }
    };
  }, []);

  return (
    <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <CustomErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Chat />
        </Suspense>
      </CustomErrorBoundary>
    </div>
  );
}

export default App;