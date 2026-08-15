const rateLimits = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();

  // Cleanup expired entries on each call (lazy cleanup)
  for (const [key, value] of rateLimits.entries()) {
    if (now - value.lastReset > windowMs) {
      rateLimits.delete(key);
    }
  }

  const record = rateLimits.get(ip);

  if (!record || now - record.lastReset > windowMs) {
    rateLimits.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
