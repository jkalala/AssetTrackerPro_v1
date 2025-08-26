"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { RateLimitBanner } from "../ui/rate-limit-error";
import { useRateLimit, RateLimitError } from "../../hooks/use-rate-limit";

interface RateLimitContextType {
  isRateLimited: boolean;
  retryAfter: number;
  canRetry: boolean;
  error: RateLimitError | null;
  handleRateLimitError: (error: RateLimitError) => void;
  checkResponse: (response: Response) => Promise<boolean>;
  wrappedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  reset: () => void;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export function useRateLimitContext() {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error("useRateLimitContext must be used within a RateLimitProvider");
  }
  return context;
}

interface RateLimitProviderProps {
  children: ReactNode;
  showBanner?: boolean;
}

export function RateLimitProvider({ children, showBanner = true }: RateLimitProviderProps) {
  const rateLimitHook = useRateLimit();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleRetry = useCallback(() => {
    rateLimitHook.reset();
    setBannerDismissed(false);
  }, [rateLimitHook]);

  const handleDismiss = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  return (
    <RateLimitContext.Provider value={rateLimitHook}>
      {showBanner && (
        <RateLimitBanner
          isVisible={rateLimitHook.isRateLimited && !bannerDismissed}
          retryAfter={rateLimitHook.retryAfter}
          onRetry={rateLimitHook.canRetry ? handleRetry : undefined}
          onDismiss={handleDismiss}
        />
      )}
      <div className={rateLimitHook.isRateLimited && showBanner && !bannerDismissed ? "pt-12" : ""}>
        {children}
      </div>
    </RateLimitContext.Provider>
  );
}