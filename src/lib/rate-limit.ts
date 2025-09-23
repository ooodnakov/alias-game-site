import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimiterConfig {
  /** Maximum number of requests allowed during the window. */
  limit: number;
  /** Window size in seconds. */
  window: number;
  /** Optional prefix when storing keys, useful to avoid collisions. */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  check(identifier: string): Promise<RateLimitResult>;
  readonly enabled: boolean;
}

function createDisabledLimiter(config: RateLimiterConfig): RateLimiter {
  return {
    enabled: false,
    async check(_identifier: string) {
      void _identifier;
      const now = Date.now();
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit,
        reset: now + config.window * 1000,
      };
    },
  };
}

function createMemoryLimiter(config: RateLimiterConfig): RateLimiter {
  const buckets = new Map<string, { count: number; reset: number }>();
  const windowMs = Math.max(1, config.window * 1000);
  const cleanupIntervalMs = Math.max(1000, Math.min(windowMs, 60_000));

  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.reset <= now) {
        buckets.delete(key);
      }
    }
  }, cleanupIntervalMs);

  return {
    enabled: true,
    async check(identifier: string) {
      const key = config.prefix ? `${config.prefix}:${identifier}` : identifier;
      const now = Date.now();
      const bucket = buckets.get(key);

      if (!bucket || bucket.reset <= now) {
        buckets.set(key, { count: 1, reset: now + windowMs });
        return {
          success: true,
          limit: config.limit,
          remaining: Math.max(0, config.limit - 1),
          reset: now + windowMs,
        };
      }

      if (bucket.count < config.limit) {
        bucket.count += 1;
        return {
          success: true,
          limit: config.limit,
          remaining: Math.max(0, config.limit - bucket.count),
          reset: bucket.reset,
        };
      }

      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset: bucket.reset,
      };
    },
  };
}

function createUpstashLimiter(config: RateLimiterConfig): RateLimiter {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return createMemoryLimiter(config);
  }

  const redis = Redis.fromEnv();
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.window} s`),
    prefix: config.prefix,
  });

  return {
    enabled: true,
    async check(identifier: string) {
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    },
  };
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  if (!Number.isFinite(config.limit) || config.limit <= 0) {
    return createDisabledLimiter(config);
  }

  if (!Number.isFinite(config.window) || config.window <= 0) {
    return createDisabledLimiter(config);
  }

  return createUpstashLimiter(config);
}
