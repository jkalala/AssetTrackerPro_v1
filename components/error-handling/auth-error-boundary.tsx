'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, LogIn, Home, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorType?: 'auth' | 'network' | 'validation' | 'permission' | 'generic';
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<AuthErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showRetry?: boolean;
  showGoHome?: boolean;
}

interface AuthErrorFallbackProps {
  error: Error;
  errorType: 'auth' | 'network' | 'validation' | 'permission' | 'generic';
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
  showRetry?: boolean;
  showGoHome?: boolean;
}

export class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Determine error type based on error message or properties
    let errorType: AuthErrorBoundaryState['errorType'] = 'generic';
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('auth') || 
        errorMessage.includes('unauthorized') || 
        errorMessage.includes('forbidden') ||
        errorMessage.includes('token') ||
        errorMessage.includes('session')) {
      errorType = 'auth';
    } else if (errorMessage.includes('network') || 
               errorMessage.includes('fetch') ||
               errorMessage.includes('connection')) {
      errorType = 'network';
    } else if (errorMessage.includes('validation') || 
               errorMessage.includes('invalid') ||
               errorMessage.includes('required')) {
      errorType = 'validation';
    } else if (errorMessage.includes('permission') || 
               errorMessage.includes('access denied')) {
      errorType = 'permission';
    }

    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorType: undefined
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || AuthErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorType={this.state.errorType || 'generic'}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
          showRetry={this.props.showRetry}
          showGoHome={this.props.showGoHome}
        />
      );
    }

    return this.props.children;
  }
}

function AuthErrorFallback({ 
  error, 
  errorType, 
  resetError, 
  errorInfo,
  showRetry = true,
  showGoHome = true
}: AuthErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const getErrorConfig = () => {
    switch (errorType) {
      case 'auth':
        return {
          icon: <LogIn className="h-12 w-12 text-destructive" />,
          title: 'Authentication Error',
          description: 'There was a problem with your authentication. Please sign in again.',
          primaryAction: {
            label: 'Sign In',
            onClick: () => window.location.href = '/login'
          },
          secondaryAction: showRetry ? {
            label: 'Try Again',
            onClick: resetError
          } : undefined
        };
      
      case 'network':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection.',
          primaryAction: showRetry ? {
            label: 'Retry',
            onClick: resetError
          } : undefined,
          secondaryAction: showGoHome ? {
            label: 'Go Home',
            onClick: () => window.location.href = '/dashboard'
          } : undefined
        };
      
      case 'validation':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          title: 'Validation Error',
          description: 'There was a problem with the data you entered. Please check and try again.',
          primaryAction: showRetry ? {
            label: 'Try Again',
            onClick: resetError
          } : undefined,
          secondaryAction: showGoHome ? {
            label: 'Go Home',
            onClick: () => window.location.href = '/dashboard'
          } : undefined
        };
      
      case 'permission':
        return {
          icon: <Shield className="h-12 w-12 text-red-500" />,
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.',
          primaryAction: showGoHome ? {
            label: 'Go to Dashboard',
            onClick: () => window.location.href = '/dashboard'
          } : undefined,
          secondaryAction: {
            label: 'Contact Support',
            onClick: () => window.location.href = '/support'
          }
        };
      
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
          title: 'Something went wrong',
          description: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
          primaryAction: showRetry ? {
            label: 'Try Again',
            onClick: resetError
          } : undefined,
          secondaryAction: showGoHome ? {
            label: 'Go Home',
            onClick: () => window.location.href = '/dashboard'
          } : undefined
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <CardTitle className="text-lg">{config.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {config.description}
          </p>

          {isDevelopment && (
            <details className="text-left bg-muted p-3 rounded-md text-xs font-mono">
              <summary className="font-semibold text-destructive mb-1 cursor-pointer">
                Error Details (Development)
              </summary>
              <div className="mt-2 whitespace-pre-wrap break-all">
                {error.message}
              </div>
              {error.stack && (
                <div className="mt-2 text-muted-foreground">
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 text-xs overflow-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo && (
                <div className="mt-2 text-muted-foreground">
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 text-xs overflow-auto">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {config.primaryAction && (
              <Button 
                onClick={config.primaryAction.onClick} 
                variant="default" 
                size="sm"
                className="flex items-center gap-2"
              >
                {errorType === 'network' && <RefreshCw className="h-4 w-4" />}
                {errorType === 'auth' && <LogIn className="h-4 w-4" />}
                {(errorType === 'generic' || errorType === 'validation') && <RefreshCw className="h-4 w-4" />}
                {errorType === 'permission' && <Home className="h-4 w-4" />}
                {config.primaryAction.label}
              </Button>
            )}
            
            {config.secondaryAction && (
              <Button 
                onClick={config.secondaryAction.onClick} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                {config.secondaryAction.label === 'Go Home' && <Home className="h-4 w-4" />}
                {config.secondaryAction.label === 'Try Again' && <RefreshCw className="h-4 w-4" />}
                {config.secondaryAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized error boundary for MFA operations
export function MFAErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary
      fallback={MFAErrorFallback}
      onError={(error) => {
        console.error('MFA error:', error);
      }}
    >
      {children}
    </AuthErrorBoundary>
  );
}

function MFAErrorFallback({ error, resetError }: AuthErrorFallbackProps) {
  return (
    <div className="p-4 text-center">
      <div className="flex justify-center mb-4">
        <Shield className="h-8 w-8 text-destructive" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">MFA Setup Error</h3>
      <p className="text-sm text-muted-foreground mb-4">
        There was a problem setting up multi-factor authentication. Please try again.
      </p>
      
      <div className="flex gap-2 justify-center">
        <Button onClick={resetError} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button 
          onClick={() => window.location.href = '/settings/security'} 
          variant="default" 
          size="sm"
        >
          Back to Security Settings
        </Button>
      </div>
    </div>
  );
}

// Specialized error boundary for API key operations
export function ApiKeyErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary
      fallback={ApiKeyErrorFallback}
      onError={(error) => {
        console.error('API Key error:', error);
      }}
    >
      {children}
    </AuthErrorBoundary>
  );
}

function ApiKeyErrorFallback({ error, resetError }: AuthErrorFallbackProps) {
  return (
    <div className="p-4 text-center">
      <div className="flex justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">API Key Error</h3>
      <p className="text-sm text-muted-foreground mb-4">
        There was a problem managing your API keys. Please try again.
      </p>
      
      <div className="flex gap-2 justify-center">
        <Button onClick={resetError} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button 
          onClick={() => window.location.reload()} 
          variant="default" 
          size="sm"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  );
}

// Specialized error boundary for session management
export function SessionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary
      fallback={SessionErrorFallback}
      onError={(error) => {
        console.error('Session management error:', error);
      }}
    >
      {children}
    </AuthErrorBoundary>
  );
}

function SessionErrorFallback({ error, resetError }: AuthErrorFallbackProps) {
  return (
    <div className="p-4 text-center">
      <div className="flex justify-center mb-4">
        <Shield className="h-8 w-8 text-destructive" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Session Management Error</h3>
      <p className="text-sm text-muted-foreground mb-4">
        There was a problem managing your sessions. Please try again.
      </p>
      
      <div className="flex gap-2 justify-center">
        <Button onClick={resetError} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button 
          onClick={() => window.location.href = '/settings'} 
          variant="default" 
          size="sm"
        >
          Back to Settings
        </Button>
      </div>
    </div>
  );
}