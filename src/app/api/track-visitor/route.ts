import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// IP geolocation cache (5 minutes TTL)
const geoCache = new Map<string, { country: string; city: string; cachedAt: number }>();
const GEO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limit: 1 request per 15 seconds per IP
const visitorRateLimits = new Map<string, number>();
const VISITOR_RATE_WINDOW = 15000; // 15 seconds

async function getGeoLocation(ip: string): Promise<{ country: string; city: string }> {
  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.cachedAt < GEO_CACHE_TTL) {
    return { country: cached.country, city: cached.city };
  }

  // Skip localhost / private IPs
  if (
    ip === 'unknown' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('192.168.')
  ) {
    return { country: 'Local', city: 'Local' };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const result = { country: data.country || '', city: data.city || '' };
      geoCache.set(ip, { ...result, cachedAt: Date.now() });
      return result;
    }
  } catch {
    // Geo lookup failed, return empty
  }

  return { country: '', city: '' };
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

// Cleanup stale sessions older than 5 minutes
async function cleanupStaleSessions() {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);
  try {
    await db.visitorSession.deleteMany({
      where: { lastSeen: { lt: cutoff } },
    });
  } catch {
    // Ignore cleanup errors
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Rate limit: 1 per 15 seconds per IP
  const now = Date.now();
  const lastRequest = visitorRateLimits.get(ip);
  if (lastRequest && now - lastRequest < VISITOR_RATE_WINDOW) {
    return NextResponse.json({ ok: true, rateLimited: true });
  }
  visitorRateLimits.set(ip, now);

  // Lazy cleanup of rate limit entries
  for (const [key, ts] of visitorRateLimits.entries()) {
    if (now - ts > 60000) visitorRateLimits.delete(key);
  }

  // Lazy cleanup of geo cache
  for (const [key, val] of geoCache.entries()) {
    if (now - val.cachedAt > GEO_CACHE_TTL) geoCache.delete(key);
  }

  try {
    const body = await request.json();
    const { sessionId, page, referrer } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || '';

    // Get geolocation
    const geo = await getGeoLocation(ip);

    // Cleanup stale sessions (run in background)
    cleanupStaleSessions();

    // Upsert: find existing session by sessionId + ip, update lastSeen/page. Otherwise create.
    const existing = await db.visitorSession.findFirst({
      where: { sessionId, ip },
    });

    if (existing) {
      await db.visitorSession.update({
        where: { id: existing.id },
        data: {
          page: page || existing.page,
          referrer: referrer || existing.referrer,
          lastSeen: new Date(),
          country: geo.country || existing.country,
          city: geo.city || existing.city,
        },
      });
    } else {
      await db.visitorSession.create({
        data: {
          sessionId,
          ip,
          country: geo.country,
          city: geo.city,
          page: page || '',
          referrer: referrer || '',
          userAgent,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track visitor error:', error);
    return NextResponse.json({ ok: true }); // Silent fail so it doesn't break the site
  }
}
