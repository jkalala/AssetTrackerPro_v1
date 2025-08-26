'use client';

import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast';

interface DatabaseError {
  code?: string;
  message: string;
  detail?: string;
  constraint?: string;
}

interface DatabaseErrorHandlerProps {
  error: DatabaseError | Error | null;
  onRetry?: () => void;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export function DatabaseErrorHandler({ 
  error, 
  onRetry, 
  fallback,
  children 
}: DatabaseErrorHandlerProps) {
  useEffect(() => {
    if (error) {
      handleDatabaseError(error, onRetry);
    }
  }, [error, onRetry]);

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

function handleDatabaseError(error: DatabaseError | Error, onRetry?: () => void) {
  const isDatabaseError = 'code' in error;
  
  if (isDatabaseError) {
    const dbError = error as DatabaseError;
    
    switch (dbError.code) {
      case '23502': // NOT NULL constraint violation
        if (dbError.constraint?.includes('tenant_id')) {
          toast({
            title: 'Tenant Context Error',
            description: 'Unable to determine tenant context. Please refresh and try again.',
            variant: 'destructive',
            action: onRetry ? (
              <ToastAction altText="Retry" onClick={onRetry}>
                Retry
              </ToastAction>
            ) : undefined
          });
        } else {
          toast({
            title: 'Required Field Missing',
            description: 'A required field is missing. Please check your input and try again.',
            variant: 'destructive'
          });
        }
        break;
        
      case '23503': // Foreign key constraint violation
        toast({
          title: 'Reference Error',
          description: 'Referenced data not found. Please refresh and try again.',
          variant: 'destructive',
          action: onRetry ? (
            <ToastAction altText="Retry" onClick={onRetry}>
              Retry
            </ToastAction>
          ) : undefined
        });
        break;
        
      case '23505': // Unique constraint violation
        toast({
          title: 'Duplicate Entry',
          description: 'This entry already exists. Please use a different value.',
          variant: 'destructive'
        });
        break;
        
      case '42P01': // Table does not exist
        toast({
          title: 'System Error',
          description: 'Database table not found. Please contact support.',
          variant: 'destructive'
        });
        break;
        
      case '42703': // Column does not exist
        toast({
          title: 'System Error',
          description: 'Database column not found. Please contact support.',
          variant: 'destructive'
        });
        break;
        
      case '08006': // Connection failure
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to database. Please check your connection.',
          variant: 'destructive',
          action: onRetry ? (
            <ToastAction altText="Retry" onClick={onRetry}>
              Retry
            </ToastAction>
          ) : undefined
        });
        break;
        
      default:
        toast({
          title: 'Database Error',
          description: dbError.message || 'An unexpected database error occurred.',
          variant: 'destructive',
          action: onRetry ? (
            <ToastAction altText="Retry" onClick={onRetry}>
              Retry
            </ToastAction>
          ) : undefined
        });
    }
  } else {
    // Generic error handling
    toast({
      title: 'Error',
      description: error.message || 'An unexpected error occurred.',
      variant: 'destructive',
      action: onRetry ? (
        <ToastAction altText="Retry" onClick={onRetry}>
          Retry
        </ToastAction>
      ) : undefined
    });
  }
}

// Hook for handling database errors in components
export function useDatabaseErrorHandler() {
  return {
    handleError: (error: DatabaseError | Error, onRetry?: () => void) => {
      handleDatabaseError(error, onRetry);
    }
  };
}

// Utility function to check if an error is a specific database constraint error
export function isDatabaseConstraintError(error: any, constraintType?: string): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const isConstraintError = error.code?.startsWith('23');
  
  if (!constraintType) return isConstraintError;
  
  switch (constraintType) {
    case 'not_null':
      return error.code === '23502';
    case 'foreign_key':
      return error.code === '23503';
    case 'unique':
      return error.code === '23505';
    case 'check':
      return error.code === '23514';
    default:
      return isConstraintError;
  }
}

// Utility function to extract constraint name from error
export function getConstraintName(error: any): string | null {
  if (!error || typeof error !== 'object') return null;
  
  return error.constraint || null;
}

// Utility function to check if error is tenant-related
export function isTenantContextError(error: any): boolean {
  if (!error) return false;
  
  return (
    isDatabaseConstraintError(error, 'not_null') &&
    (getConstraintName(error)?.includes('tenant_id') || 
     error.message?.includes('tenant_id') ||
     error.detail?.includes('tenant_id'))
  );
}