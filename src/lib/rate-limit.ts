const rateLimits = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
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

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimits.entries()) {
    if (now - value.lastReset > 60000) {
      rateLimits.delete(key);
    }
  }
}, 300000);
