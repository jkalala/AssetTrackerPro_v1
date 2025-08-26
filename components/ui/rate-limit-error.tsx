"use client";

import { AlertCircle, Clock, RefreshCw, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/error-handling/error-boundary";

interface RateLimitErrorProps {
  retryAfter: number;
  onRetry?: () => Promise<void> | void;
  className?: string;
  showDetails?: boolean;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export function RateLimitError({ 
  retryAfter: initialRetryAfter, 
  onRetry, 
  className, 
  showDetails = false,
  rateLimitInfo 
}: RateLimitErrorProps) {
  const [retryAfter, setRetryAfter] = useState(initialRetryAfter);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (retryAfter <= 0) return;

    const interval = setInterval(() => {
      setRetryAfter((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(interval);
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "now";
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      const result = onRetry();
      if (result !== undefined && typeof result === 'object' && 'then' in result) {
        await result;
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <ErrorBoundary>
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Rate limit exceeded</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" />
            <span>
              {retryAfter > 0 ? (
                <>Try again in <strong>{formatTime(retryAfter)}</strong></>
              ) : (
                "You can try again now"
              )}
            </span>
          </div>
          
          {showDetails && rateLimitInfo && (
            <div className="mb-3 p-2 bg-muted rounded text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-3 w-3" />
                <span className="font-medium">Rate Limit Details</span>
              </div>
              <div className="text-xs space-y-1">
                <div>Limit: {rateLimitInfo.limit} requests</div>
                <div>Remaining: {rateLimitInfo.remaining}</div>
                <div>Reset: {new Date(rateLimitInfo.reset * 1000).toLocaleTimeString()}</div>
              </div>
            </div>
          )}
          
          {retryAfter <= 0 && onRetry && (
            <Button 
              onClick={handleRetry} 
              size="sm" 
              variant="outline"
              disabled={isRetrying}
              className="flex items-center gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Retry now
                </>
              )}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </ErrorBoundary>
  );
}

interface RateLimitBannerProps {
  isVisible: boolean;
  retryAfter: number;
  onDismiss?: () => void;
  onRetry?: () => void;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export function RateLimitBanner({ 
  isVisible, 
  retryAfter, 
  onDismiss, 
  onRetry, 
  rateLimitInfo 
}: RateLimitBannerProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isVisible) return null;

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      const result = onRetry();
      if (result !== undefined && typeof result === 'object' && 'then' in result) {
        await result;
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                Rate limit exceeded. Try again in {retryAfter} seconds.
              </span>
              {rateLimitInfo && (
                <span className="text-xs opacity-90">
                  {rateLimitInfo.remaining} of {rateLimitInfo.limit} requests remaining
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {retryAfter <= 0 && onRetry && (
              <Button 
                onClick={handleRetry} 
                size="sm" 
                variant="secondary"
                disabled={isRetrying}
                className="flex items-center gap-1"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Retry'
                )}
              </Button>
            )}
            {onDismiss && (
              <Button 
                onClick={onDismiss} 
                size="sm" 
                variant="ghost"
                className="text-destructive-foreground hover:bg-destructive-foreground/10"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}