'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>

        {isDevelopment && (
          <div className="text-left bg-muted p-3 rounded-md text-xs font-mono">
            <div className="font-semibold text-destructive mb-1">Error Details:</div>
            <div className="whitespace-pre-wrap break-all">
              {error.message}
            </div>
            {error.stack && (
              <div className="mt-2 text-muted-foreground">
                {error.stack}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="default" 
            size="sm"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// Specialized error boundary for authentication errors
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={AuthErrorFallback}
      onError={(error) => {
        // Log authentication-specific errors
        console.error('Authentication error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function AuthErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isAuthError = error.message.includes('auth') || 
                     error.message.includes('unauthorized') ||
                     error.message.includes('forbidden');

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {isAuthError ? 'Authentication Error' : 'Something went wrong'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAuthError 
              ? 'There was a problem with your authentication. Please sign in again.'
              : 'An unexpected error occurred. Please try again.'
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          {isAuthError ? (
            <Button 
              onClick={() => window.location.href = '/login'} 
              variant="default" 
              size="sm"
            >
              Sign In
            </Button>
          ) : (
            <Button 
              onClick={() => window.location.href = '/dashboard'} 
              variant="default" 
              size="sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  return {
    handleError: (error: Error) => {
      // This will trigger the nearest error boundary
      throw error;
    }
  };
}