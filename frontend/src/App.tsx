import React, { useEffect, useState, Suspense } from 'react';
import { Toaster } from './components/ui/toaster';
import './styles/globals.css';

// Lazy load components for better performance
const Chat = React.lazy(() => import('./components/Chat'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-lg text-muted-foreground">Loading chat interface...</p>
    </div>
  </div>
);

// Custom error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-md w-full p-6 rounded-lg border bg-card text-card-foreground shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-destructive">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <div className="cosmic-bg min-h-screen w-full">
      <div className="glow-text">YOUR ONLY LIMIT IS YOU</div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Chat />
        </Suspense>
      </ErrorBoundary>
      <Toaster />
    </div>
  );
}

export default App;