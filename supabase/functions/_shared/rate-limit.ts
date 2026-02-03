// Simple in-memory rate limiting for edge functions
// Note: This is per-isolate, so limits reset on cold starts. For production,
// consider using Upstash Redis for distributed rate limiting.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., userId)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  // No existing entry or window has expired
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitMap.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }
  
  // Within window, check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }
  
  // Increment counter
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create a rate limit response for rejected requests
 */
export function createRateLimitResponse(
  corsHeaders: Record<string, string>,
  resetAt: number
): Response {
  const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({ 
      error: 'יותר מדי בקשות. נסה שוב מאוחר יותר',
      retryAfter: retryAfterSeconds
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds)
      } 
    }
  );
}

// Default rate limit configurations for different function types
export const RATE_LIMITS = {
  // Expensive AI calls - 5 requests per hour
  AI_EXPENSIVE: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  // Moderate AI calls - 20 requests per hour
  AI_MODERATE: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  // Image API calls - 50 requests per hour
  IMAGE_API: { maxRequests: 50, windowMs: 60 * 60 * 1000 },
} as const;
