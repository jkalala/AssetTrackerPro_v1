'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ErrorState {
  error: string | null;
  isError: boolean;
  fieldErrors: Record<string, string>;
}

interface UseErrorHandlerOptions {
  showToast?: boolean;
  toastDuration?: number;
  logErrors?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, toastDuration = 5000, logErrors = true } = options;
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    fieldErrors: {}
  });

  const handleError = useCallback((error: unknown, context?: string) => {
    let errorMessage = 'An unexpected error occurred';
    let fieldErrors: Record<string, string> = {};

    // Handle different error types
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Handle validation errors
      if ('fieldErrors' in error && typeof error.fieldErrors === 'object') {
        fieldErrors = error.fieldErrors as Record<string, string>;
        errorMessage = 'Please check the form for errors';
      } else if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
    }

    // Log error if enabled
    if (logErrors) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    }

    // Update error state
    setErrorState({
      error: errorMessage,
      isError: true,
      fieldErrors
    });

    // Show toast if enabled
    if (showToast) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: toastDuration
      });
    }

    return errorMessage;
  }, [showToast, toastDuration, logErrors]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      fieldErrors: {}
    });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrorState(prev => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [fieldName]: ''
      }
    }));
  }, []);

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrorState(prev => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [fieldName]: error
      }
    }));
  }, []);

  // Handle API errors with specific status codes
  const handleApiError = useCallback(async (response: Response, context?: string) => {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let data: any = null;
    
    try {
      data = await response.json();
      if (data.error) {
        errorMessage = data.error;
      } else if (data.message) {
        errorMessage = data.message;
      }
    } catch {
      // If response is not JSON, use status text
    }

    // Handle specific status codes
    switch (response.status) {
      case 400:
        errorMessage = data?.error || 'Invalid request. Please check your input.';
        break;
      case 401:
        errorMessage = 'You are not authorized. Please sign in again.';
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 409:
        errorMessage = data?.error || 'A conflict occurred. The resource may already exist.';
        break;
      case 422:
        errorMessage = data?.error || 'Validation failed. Please check your input.';
        break;
      case 429:
        errorMessage = 'Rate limit exceeded. Please try again later.';
        break;
      case 500:
        errorMessage = 'Internal server error. Please try again later.';
        break;
      case 502:
      case 503:
      case 504:
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        break;
    }

    return handleError(errorMessage, context);
  }, [handleError]);

  // Handle network errors
  const handleNetworkError = useCallback((error: unknown, context?: string) => {
    let errorMessage = 'Network error occurred. Please check your connection.';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    }
    
    return handleError(errorMessage, context);
  }, [handleError]);

  // Wrapper for async operations with error handling
  const withErrorHandling = useCallback(
    <T>(
      asyncFn: () => Promise<T>,
      context?: string,
      options?: {
        showSuccessToast?: boolean;
        successMessage?: string;
      }
    ) => {
      return async (): Promise<T | null> => {
        try {
          clearError();
          const result = await asyncFn();
          
          if (options?.showSuccessToast && options?.successMessage) {
            toast({
              title: 'Success',
              description: options.successMessage,
              variant: 'default'
            });
          }
          
          return result;
        } catch (error) {
          if (error instanceof Response) {
            await handleApiError(error, context);
          } else if (error instanceof TypeError && error.message.includes('fetch')) {
            handleNetworkError(error, context);
          } else {
            handleError(error, context);
          }
          return null;
        }
      };
    },
    [clearError, handleError, handleApiError, handleNetworkError]
  );

  return {
    ...errorState,
    handleError,
    handleApiError,
    handleNetworkError,
    clearError,
    clearFieldError,
    setFieldError,
    withErrorHandling
  };
}

// Hook specifically for form error handling
export function useFormErrorHandler() {
  const errorHandler = useErrorHandler({ showToast: false });
  
  const validateAndSetErrors = useCallback((
    validationResult: { success: boolean; fieldErrors?: Record<string, string> }
  ) => {
    if (!validationResult.success && validationResult.fieldErrors) {
      Object.entries(validationResult.fieldErrors).forEach(([field, error]) => {
        errorHandler.setFieldError(field, error);
      });
      return false;
    }
    return true;
  }, [errorHandler]);

  return {
    ...errorHandler,
    validateAndSetErrors
  };
}

// Hook for API operations with loading states
export function useAsyncOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const errorHandler = useErrorHandler();

  const execute = useCallback(async (
    asyncFn: () => Promise<T>,
    options?: {
      context?: string;
      showSuccessToast?: boolean;
      successMessage?: string;
    }
  ) => {
    setLoading(true);
    errorHandler.clearError();
    
    try {
      const result = await asyncFn();
      setData(result);
      
      if (options?.showSuccessToast && options?.successMessage) {
        toast({
          title: 'Success',
          description: options.successMessage,
          variant: 'default'
        });
      }
      
      return result;
    } catch (error) {
      if (error instanceof Response) {
        await errorHandler.handleApiError(error, options?.context);
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorHandler.handleNetworkError(error, options?.context);
      } else {
        errorHandler.handleError(error, options?.context);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [errorHandler]);

  const reset = useCallback(() => {
    setLoading(false);
    setData(null);
    errorHandler.clearError();
  }, [errorHandler]);

  return {
    loading,
    data,
    execute,
    reset,
    ...errorHandler
  };
}