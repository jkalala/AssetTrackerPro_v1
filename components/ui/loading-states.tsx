'use client';

import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
      data-testid="loading-spinner"
    />
  );
}

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  success?: string | null;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingState({ 
  loading, 
  error, 
  success, 
  children, 
  loadingText = 'Loading...',
  className 
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <div className="flex items-center space-x-2">
          <LoadingSpinner />
          <span className="text-sm text-muted-foreground">{loadingText}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm">{success}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function AsyncButton({ 
  loading = false, 
  loadingText, 
  children, 
  disabled,
  className,
  ...props 
}: AsyncButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center space-x-2',
        'px-4 py-2 text-sm font-medium rounded-md',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}

interface FormLoadingStateProps {
  loading: boolean;
  error?: string | null;
  success?: string | null;
  children: React.ReactNode;
}

export function FormLoadingState({ loading, error, success, children }: FormLoadingStateProps) {
  return (
    <div className="space-y-4">
      {children}
      
      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">{success}</span>
        </div>
      )}
    </div>
  );
}

interface TableLoadingStateProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  columns?: number;
}

export function TableLoadingState({ 
  loading, 
  error, 
  empty = false,
  emptyMessage = 'No data available',
  children, 
  columns = 3 
}: TableLoadingStateProps) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex space-x-4 py-3 border-b">
              {Array.from({ length: columns }).map((_, j) => (
                <div key={j} className="flex-1 h-4 bg-muted rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-sm text-muted-foreground">{emptyMessage}</span>
      </div>
    );
  }

  return <>{children}</>;
}