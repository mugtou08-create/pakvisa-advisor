/**
 * Simple in-memory cache for API responses.
 * Avoids repeated DB hits for the same data within a TTL window.
 */
const cache = new Map<string, { data: unknown; cachedAt: number }>();

const DEFAULT_TTL = 60_000; // 60 seconds

/**
 * Get cached value, or compute & cache it.
 * Returns null if not cached (use fetchAndCache for atomic get-or-set).
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Store a value in cache.
 */
export function setCache(key: string, data: unknown, ttlMs = DEFAULT_TTL): void {
  cache.set(key, { data, cachedAt: Date.now() });
  // Auto-evict after TTL (best-effort)
  setTimeout(() => cache.delete(key), ttlMs);
}

/**
 * Fetch and cache a value, or return cached if fresh.
 * Wraps an async factory — only one concurrent call per key (stale-while-revalidate).
 */
const inflight = new Map<string, Promise<unknown>>();

export async function fetchAndCache<T>(key: string, factory: () => Promise<T>, ttlMs = DEFAULT_TTL): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  // Deduplicate concurrent requests for the same key
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = factory().then((data) => {
    setCache(key, data, ttlMs);
    inflight.delete(key);
    return data;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}

/**
 * Invalidate a specific cache key.
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
