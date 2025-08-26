import { renderHook, act, waitFor } from '@testing-library/react';
import { useRateLimit } from '@/hooks/use-rate-limit';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('useRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRateLimit());
    
    expect(result.current.isRateLimited).toBe(false);
    expect(result.current.retryAfter).toBe(0);
    expect(result.current.canRetry).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle rate limit error correctly', async () => {
    const { result } = renderHook(() => useRateLimit());
    
    const rateLimitError = {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Try again in 60 seconds.',
      retryAfter: 60,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000
    };

    act(() => {
      result.current.handleRateLimitError(rateLimitError);
    });

    expect(result.current.isRateLimited).toBe(true);
    expect(result.current.retryAfter).toBe(60);
    expect(result.current.canRetry).toBe(false);
    expect(result.current.error).toEqual(rateLimitError);
  });

  it('should countdown retry timer', async () => {
    const { result } = renderHook(() => useRateLimit());
    
    const rateLimitError = {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Try again in 3 seconds.',
      retryAfter: 3,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 3000
    };

    act(() => {
      result.current.handleRateLimitError(rateLimitError);
    });

    expect(result.current.retryAfter).toBe(3);

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.retryAfter).toBe(2);
    });

    // Advance timer by 2 more seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.canRetry).toBe(true);
      expect(result.current.retryAfter).toBe(0);
    });
  });

  it('should check response for rate limiting', async () => {
    const { result } = renderHook(() => useRateLimit());
    
    const mockResponse = {
      status: 429,
      json: jest.fn().mockResolvedValue({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Try again in 30 seconds.',
        retryAfter: 30,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 30000
      })
    } as unknown as Response;

    let isRateLimited: boolean;
    await act(async () => {
      isRateLimited = await result.current.checkResponse(mockResponse);
    });
    
    expect(isRateLimited!).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.retryAfter).toBe(30);
    });
  });

  it('should handle non-JSON rate limit responses', async () => {
    const { result } = renderHook(() => useRateLimit());
    
    const mockResponse = {
      status: 429,
      json: jest.fn().mockRejectedValue(new Error('Not JSON')),
      headers: {
        get: jest.fn((header: string) => {
          switch (header) {
            case 'Retry-After': return '45';
            case 'X-RateLimit-Limit': return '20';
            case 'X-RateLimit-Remaining': return '0';
            case 'X-RateLimit-Reset': return (Date.now() + 45000).toString();
            default: return null;
          }
        })
      }
    } as unknown as Response;

    let isRateLimited: boolean;
    await act(async () => {
      isRateLimited = await result.current.checkResponse(mockResponse);
    });
    
    expect(isRateLimited!).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.retryAfter).toBe(45);
    });
  });

  it('should not be rate limited for non-429 responses', async () => {
    const { result } = renderHook(() => useRateLimit());
    
    const mockResponse = {
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true })
    } as unknown as Response;

    const isRateLimited = await result.current.checkResponse(mockResponse);
    
    expect(isRateLimited).toBe(false);
    expect(result.current.isRateLimited).toBe(false);
  });

  it('should wrap fetch with rate limiting', async () => {
    const { result } = renderHook(() => useRateLimit());
    
    const mockResponse = {
      status: 200,
      json: jest.fn().mockResolvedValue({ data: 'test' })
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const response = await result.current.wrappedFetch('/api/test');
    
    expect(global.fetch).toHaveBeenCalledWith('/api/test', undefined);
    expect(response).toBe(mockResponse);
  });

  it('should prevent fetch when rate limited', async () => {
    const { result } = renderHook(() => useRateLimit());
    
    // First, set rate limited state
    const rateLimitError = {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Try again in 30 seconds.',
      retryAfter: 30,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30000
    };

    act(() => {
      result.current.handleRateLimitError(rateLimitError);
    });

    // Now try to make a request
    await expect(result.current.wrappedFetch('/api/test')).rejects.toThrow(
      'Rate limited. Try again in 30 seconds.'
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should reset rate limit state', () => {
    const { result } = renderHook(() => useRateLimit());
    
    // First, set rate limited state
    const rateLimitError = {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Try again in 30 seconds.',
      retryAfter: 30,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30000
    };

    act(() => {
      result.current.handleRateLimitError(rateLimitError);
    });

    expect(result.current.isRateLimited).toBe(true);

    // Reset the state
    act(() => {
      result.current.reset();
    });

    expect(result.current.isRateLimited).toBe(false);
    expect(result.current.retryAfter).toBe(0);
    expect(result.current.canRetry).toBe(true);
    expect(result.current.error).toBeNull();
  });
});