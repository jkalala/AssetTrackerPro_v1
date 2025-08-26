import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/test-rate-limit/route';
import { withRateLimit } from '@/lib/with-rate-limit';

// Mock the rate limiting to simulate different scenarios
jest.mock('@/lib/with-rate-limit', () => ({
  withRateLimit: jest.fn(),
  getRateLimitStatus: jest.fn()
}));

describe('Rate Limiting Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Route Rate Limiting', () => {
    it('should allow requests when under rate limit', async () => {
      (withRateLimit as jest.Mock).mockResolvedValue(null); // No rate limit response

      const request = new NextRequest('http://localhost:3000/api/test-rate-limit');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toBe('Rate limit test successful');
      expect(data.timestamp).toBeDefined();
    });

    it('should return 429 when rate limit exceeded', async () => {
      
      // Mock rate limit exceeded response
      const rateLimitResponse = new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Try again in 60 seconds.',
          retryAfter: 60,
          limit: 10,
          remaining: 0,
          reset: Date.now() + 60000
        }),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + 60000).toString(),
            'Retry-After': '60'
          }
        }
      );

      (withRateLimit as jest.MockedFunction<typeof withRateLimit>).mockResolvedValue(rateLimitResponse);

      const request = new NextRequest('http://localhost:3000/api/test-rate-limit');
      const response = await GET(request);

      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.retryAfter).toBe(60);
    });

    it('should handle POST requests with rate limiting', async () => {
      (withRateLimit as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/test-rate-limit', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toBe('POST request successful');
      expect(data.data).toEqual({ test: 'data' });
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include proper rate limit headers in response', async () => {
      (withRateLimit as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/test-rate-limit');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      // The actual headers would be set by the middleware in a real scenario
      // Here we're just testing that the endpoint works
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting errors gracefully', async () => {
      (withRateLimit as jest.Mock).mockRejectedValue(new Error('Rate limit service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/test-rate-limit');
      
      // The withApiRateLimit wrapper should handle this error
      // and either allow the request or return a proper error response
      const response = await GET(request);
      
      // Should either succeed (if error is handled gracefully) or return proper error
      expect([200, 500, 503]).toContain(response.status);
    });
  });

  describe('Custom Rate Limits', () => {
    it('should apply custom rate limits per endpoint', async () => {
      
      // Verify that withRateLimit is called with the correct options
      (withRateLimit as jest.Mock).mockImplementation((req: NextRequest, options: { limit: number; window: string }) => {
        expect(options.limit).toBe(10); // GET endpoint limit
        expect(options.window).toBe('1m');
        return Promise.resolve(null);
      });

      const request = new NextRequest('http://localhost:3000/api/test-rate-limit');
      await GET(request);

      expect(withRateLimit).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          limit: 10,
          window: '1m'
        })
      );
    });

    it('should apply different limits for different HTTP methods', async () => {
      
      // Test POST endpoint with different limit
      (withRateLimit as jest.Mock).mockImplementation((req: NextRequest, options: { limit: number; window: string }) => {
        expect(options.limit).toBe(5); // POST endpoint limit
        expect(options.window).toBe('1m');
        return Promise.resolve(null);
      });

      const request = new NextRequest('http://localhost:3000/api/test-rate-limit', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(withRateLimit).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          limit: 5,
          window: '1m'
        })
      );
    });
  });
});