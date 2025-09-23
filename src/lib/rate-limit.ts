import Redis, { type RedisOptions } from "ioredis";

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
  const windowMs = config.window * 1000;

  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.reset <= now) {
        buckets.delete(key);
      }
    }
  }, windowMs);

  if (typeof interval === "object" && interval !== null && "unref" in interval) {
    (interval as { unref: () => void }).unref();
  }

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

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  if (!Number.isFinite(config.limit) || config.limit <= 0) {
    return createDisabledLimiter(config);
  }

  if (!Number.isFinite(config.window) || config.window <= 0) {
    return createDisabledLimiter(config);
  }

  return createRedisLimiter({
    ...config,
    prefix: buildCombinedPrefix(config.prefix),
  });
}

function buildCombinedPrefix(prefix: string | undefined) {
  const values = [process.env.REDIS_PREFIX, prefix].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  return values.length > 0 ? values.join(":") : undefined;
}

type RedisClient = Redis;

function getRedisOptionsFromEnv(): RedisOptions | string | null {
  const url = process.env.REDIS_URL;
  if (typeof url === "string" && url.length > 0) {
    return url;
  }

  const host = process.env.REDIS_HOST;
  if (!host) {
    return null;
  }

  const port = Number.parseInt(process.env.REDIS_PORT ?? "6379", 10);
  const username = process.env.REDIS_USER;
  const password =
    process.env.REDIS_PASSWORD ?? process.env.REDIS_USER_PASSWORD ?? undefined;

  const options: RedisOptions = {
    host,
    port: Number.isFinite(port) ? port : 6379,
    lazyConnect: false,
  };

  if (username) {
    options.username = username;
  }

  if (password) {
    options.password = password;
  }

  return options;
}

function createRedisClient(): RedisClient | null {
  const config = getRedisOptionsFromEnv();
  if (!config) {
    return null;
  }

  try {
    const client = typeof config === "string" ? new Redis(config) : new Redis(config);

    client.on("error", (error) => {
      console.error("Redis connection error", error);
    });

    return client;
  } catch (error) {
    console.error("Failed to create Redis client", error);
    return null;
  }
}

function createRedisLimiter(config: RateLimiterConfig): RateLimiter {
  const redis = createRedisClient();

  if (!redis) {
    return createMemoryLimiter(config);
  }

  const fallback = createMemoryLimiter(config);

  return {
    enabled: true,
    async check(identifier: string) {
      const key = config.prefix ? `${config.prefix}:${identifier}` : identifier;
      const windowMs = config.window * 1000;
      const now = Date.now();

      try {
        const results = await redis
          .multi()
          .incr(key)
          .pttl(key)
          .exec();

        if (!results) {
          throw new Error("Failed to execute Redis pipeline");
        }

        const [incrError, countRaw] = results[0] ?? [null, 0];
        const [ttlError, ttlRaw] = results[1] ?? [null, -1];

        if (incrError) {
          throw incrError instanceof Error ? incrError : new Error(String(incrError));
        }

        if (ttlError) {
          throw ttlError instanceof Error ? ttlError : new Error(String(ttlError));
        }

        const count = Number(countRaw ?? 0);
        let ttlMs = Number(ttlRaw ?? -1);

        if (!Number.isFinite(ttlMs)) {
          ttlMs = -1;
        }

        if (count <= 1 || ttlMs < 0) {
          await redis.pexpire(key, windowMs);
          ttlMs = windowMs;
        }

        const success = count <= config.limit;
        const remaining = success ? Math.max(0, config.limit - count) : 0;
        const reset = now + (ttlMs > 0 ? ttlMs : windowMs);

        return {
          success,
          limit: config.limit,
          remaining,
          reset,
        };
      } catch (error) {
        console.error("Redis rate limiter failed; falling back to memory", error);
        return fallback.check(identifier);
      }
    },
  };
}
