/**
 * Simple in-memory rate limiter for MVP.
 * Replace with Upstash Redis (@upstash/ratelimit) for production.
 *
 * This is a sliding-window rate limiter that works without external dependencies.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 60000 * 60);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 300000);
}

interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window in seconds */
  window: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.window * 1000;

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= config.limit) {
    const oldestInWindow = entry.timestamps[0];
    return {
      success: false,
      remaining: 0,
      reset: oldestInWindow + windowMs,
    };
  }

  entry.timestamps.push(now);

  return {
    success: true,
    remaining: config.limit - entry.timestamps.length,
    reset: now + windowMs,
  };
}

// Pre-configured rate limiters
export const RATE_LIMITS = {
  /** Registration: 3 per hour per IP */
  register: { limit: 3, window: 3600 },
  /** Login: 10 per 15 min per IP */
  login: { limit: 10, window: 900 },
  /** Likes: 50 per hour per user */
  likes: { limit: 50, window: 3600 },
  /** Messages: 100 per hour per user */
  messages: { limit: 100, window: 3600 },
  /** Quiz submit: 5 per hour per user */
  quizSubmit: { limit: 5, window: 3600 },
} as const;
