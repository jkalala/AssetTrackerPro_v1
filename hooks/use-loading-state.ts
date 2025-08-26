'use client';

import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  autoResetSuccess?: number; // Auto-reset success message after N milliseconds
  autoResetError?: number; // Auto-reset error message after N milliseconds
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { 
    initialLoading = false, 
    autoResetSuccess = 3000, 
    autoResetError = 5000 
  } = options;

  const [state, setState] = useState<LoadingState>({
    loading: initialLoading,
    error: null,
    success: null
  });

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    // Clear existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    setState(prev => ({ ...prev, error, success: null }));

    // Auto-reset error after specified time
    if (error && autoResetError > 0) {
      errorTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, autoResetError);
    }
  }, [autoResetError]);

  const setSuccess = useCallback((success: string | null) => {
    // Clear existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    setState(prev => ({ ...prev, success, error: null }));

    // Auto-reset success after specified time
    if (success && autoResetSuccess > 0) {
      successTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, autoResetSuccess);
    }
  }, [autoResetSuccess]);

  const reset = useCallback(() => {
    // Clear timeouts
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    setState({
      loading: false,
      error: null,
      success: null
    });
  }, []);

  const startLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: null
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Wrapper for async operations
  const withLoading = useCallback(
    <T>(asyncFn: () => Promise<T>) => {
      return async (): Promise<T | null> => {
        try {
          startLoading();
          const result = await asyncFn();
          stopLoading();
          return result;
        } catch (error) {
          stopLoading();
          throw error;
        }
      };
    },
    [startLoading, stopLoading]
  );

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    reset,
    startLoading,
    stopLoading,
    withLoading
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates<T extends string>(keys: T[]) {
  const [loadingStates, setLoadingStates] = useState<Record<T, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<T, boolean>)
  );

  const setLoading = useCallback((key: T, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const withLoading = useCallback(
    <R>(key: T, asyncFn: () => Promise<R>) => {
      return async (): Promise<R | null> => {
        try {
          setLoading(key, true);
          const result = await asyncFn();
          setLoading(key, false);
          return result;
        } catch (error) {
          setLoading(key, false);
          throw error;
        }
      };
    },
    [setLoading]
  );

  return {
    loadingStates,
    isAnyLoading,
    setLoading,
    withLoading,
    isLoading: (key: T) => loadingStates[key]
  };
}

// Hook for pagination with loading states
export function usePaginatedLoading() {
  const [state, setState] = useState({
    loading: false,
    loadingMore: false,
    refreshing: false,
    error: null as string | null,
    hasMore: true
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setLoadingMore = useCallback((loadingMore: boolean) => {
    setState(prev => ({ ...prev, loadingMore }));
  }, []);

  const setRefreshing = useCallback((refreshing: boolean) => {
    setState(prev => ({ ...prev, refreshing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setHasMore = useCallback((hasMore: boolean) => {
    setState(prev => ({ ...prev, hasMore }));
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      loadingMore: false,
      refreshing: false,
      error: null,
      hasMore: true
    });
  }, []);

  return {
    ...state,
    setLoading,
    setLoadingMore,
    setRefreshing,
    setError,
    setHasMore,
    reset
  };
}

// Hook for form submission with loading and validation states
export function useFormSubmission<T = any>() {
  const [state, setState] = useState({
    submitting: false,
    validating: false,
    error: null as string | null,
    success: null as string | null,
    fieldErrors: {} as Record<string, string>
  });

  const setSubmitting = useCallback((submitting: boolean) => {
    setState(prev => ({ ...prev, submitting }));
  }, []);

  const setValidating = useCallback((validating: boolean) => {
    setState(prev => ({ ...prev, validating }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, success: null }));
  }, []);

  const setSuccess = useCallback((success: string | null) => {
    setState(prev => ({ ...prev, success, error: null }));
  }, []);

  const setFieldErrors = useCallback((fieldErrors: Record<string, string>) => {
    setState(prev => ({ ...prev, fieldErrors }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setState(prev => ({
      ...prev,
      fieldErrors: { ...prev.fieldErrors, [fieldName]: '' }
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      submitting: false,
      validating: false,
      error: null,
      success: null,
      fieldErrors: {}
    });
  }, []);

  const submitForm = useCallback(async (
    submitFn: () => Promise<T>,
    options?: {
      successMessage?: string;
      resetOnSuccess?: boolean;
    }
  ) => {
    try {
      setSubmitting(true);
      setState(prev => ({ ...prev, error: null, fieldErrors: {} }));
      
      const result = await submitFn();
      
      if (options?.successMessage) {
        setSuccess(options.successMessage);
      }
      
      if (options?.resetOnSuccess) {
        setTimeout(reset, 2000);
      }
      
      return result;
    } catch (error) {
      if (error && typeof error === 'object' && 'fieldErrors' in error) {
        setFieldErrors(error.fieldErrors as Record<string, string>);
      } else {
        setError(error instanceof Error ? error.message : 'Submission failed');
      }
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [setSubmitting, setSuccess, setError, setFieldErrors, reset]);

  return {
    ...state,
    setSubmitting,
    setValidating,
    setError,
    setSuccess,
    setFieldErrors,
    clearFieldError,
    reset,
    submitForm
  };
}