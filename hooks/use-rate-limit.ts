import { useState, useCallback, useEffect } from "react";
import { toast } from "./use-toast";

export interface RateLimitError {
  error: string;
  message: string;
  retryAfter: number;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number;
  canRetry: boolean;
  error: RateLimitError | null;
}

export function useRateLimit() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfter: 0,
    canRetry: true,
    error: null,
  });

  const handleRateLimitError = useCallback((error: RateLimitError) => {
    setRateLimitState({
      isRateLimited: true,
      retryAfter: error.retryAfter,
      canRetry: false,
      error,
    });

    // Show toast notification
    toast({
      title: "Rate limit exceeded",
      description: `Too many requests. Try again in ${error.retryAfter} seconds.`,
      variant: "destructive",
    });

    // Set up countdown timer
    const countdown = setInterval(() => {
      setRateLimitState((prev) => {
        const newRetryAfter = prev.retryAfter - 1;
        if (newRetryAfter <= 0) {
          clearInterval(countdown);
          return {
            isRateLimited: false,
            retryAfter: 0,
            canRetry: true,
            error: null,
          };
        }
        return {
          ...prev,
          retryAfter: newRetryAfter,
        };
      });
    }, 1000);

    return countdown;
  }, []);

  const checkResponse = useCallback(
    async (response: Response): Promise<boolean> => {
      if (response.status === 429) {
        try {
          const errorData = await response.json();
          if (errorData.retryAfter) {
            handleRateLimitError(errorData);
            return true; // Rate limited
          }
        } catch (e) {
          // Fallback for non-JSON responses
          const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
          handleRateLimitError({
            error: "Rate limit exceeded",
            message: `Too many requests. Try again in ${retryAfter} seconds.`,
            retryAfter,
            limit: parseInt(response.headers.get("X-RateLimit-Limit") || "60"),
            remaining: parseInt(response.headers.get("X-RateLimit-Remaining") || "0"),
            reset: parseInt(response.headers.get("X-RateLimit-Reset") || "0"),
          });
          return true;
        }
      }
      return false; // Not rate limited
    },
    [handleRateLimitError]
  );

  const wrappedFetch = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      if (!rateLimitState.canRetry) {
        throw new Error(`Rate limited. Try again in ${rateLimitState.retryAfter} seconds.`);
      }

      const response = await fetch(url, options);
      await checkResponse(response);
      return response;
    },
    [rateLimitState.canRetry, rateLimitState.retryAfter, checkResponse]
  );

  const reset = useCallback(() => {
    setRateLimitState({
      isRateLimited: false,
      retryAfter: 0,
      canRetry: true,
      error: null,
    });
  }, []);

  return {
    ...rateLimitState,
    handleRateLimitError,
    checkResponse,
    wrappedFetch,
    reset,
  };
}