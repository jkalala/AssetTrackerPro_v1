describe('Rate Limiting Configuration', () => {
  describe('Rate limit configuration', () => {
    it('should have proper default rate limits', () => {
      const defaultRateLimits = {
        // Authentication endpoints - stricter limits
        "/api/auth/login": { limit: 5, window: "1m" },
        "/api/auth/mfa": { limit: 10, window: "1m" },
        "/api/auth/sessions": { limit: 20, window: "1m" },
        
        // API key management - moderate limits
        "/api/auth/api-keys": { limit: 10, window: "1m" },
        "/api/settings/api-keys": { limit: 10, window: "1m" },
        
        // General API endpoints - standard limits
        "/api/assets": { limit: 100, window: "1m" },
        "/api/analytics": { limit: 50, window: "1m" },
        
        // External API endpoints - stricter limits
        "/api/external": { limit: 30, window: "1m" },
        
        // Default fallback
        "/api": { limit: 60, window: "1m" }
      };

      expect(defaultRateLimits['/api/auth/login']).toEqual({ limit: 5, window: '1m' });
      expect(defaultRateLimits['/api/auth/api-keys']).toEqual({ limit: 10, window: '1m' });
      expect(defaultRateLimits['/api/assets']).toEqual({ limit: 100, window: '1m' });
      expect(defaultRateLimits['/api']).toEqual({ limit: 60, window: '1m' });
    });
  });

  describe('Rate limit response format', () => {
    it('should have proper error response structure', () => {
      const expectedResponse = {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Try again in 60 seconds.',
        retryAfter: 60,
        limit: 10,
        remaining: 0,
        reset: expect.any(Number)
      };

      expect(expectedResponse).toHaveProperty('error');
      expect(expectedResponse).toHaveProperty('message');
      expect(expectedResponse).toHaveProperty('retryAfter');
      expect(expectedResponse).toHaveProperty('limit');
      expect(expectedResponse).toHaveProperty('remaining');
      expect(expectedResponse).toHaveProperty('reset');
    });

    it('should have proper HTTP headers', () => {
      const expectedHeaders = {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '1234567890',
        'Retry-After': '60'
      };

      expect(expectedHeaders).toHaveProperty('X-RateLimit-Limit');
      expect(expectedHeaders).toHaveProperty('X-RateLimit-Remaining');
      expect(expectedHeaders).toHaveProperty('X-RateLimit-Reset');
      expect(expectedHeaders).toHaveProperty('Retry-After');
    });
  });
});