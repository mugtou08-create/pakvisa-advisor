import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseUserAgent, categorizeReferrer } from '@/lib/parse-ua';

const geoCache = new Map<string, { country: string; city: string; cachedAt: number }>();
const GEO_CACHE_TTL = 5 * 60 * 1000;
const visitorRateLimits = new Map<string, number>();
const VISITOR_RATE_WINDOW = 15000;

async function getGeoLocation(ip: string): Promise<{ country: string; city: string }> {
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.cachedAt < GEO_CACHE_TTL) return cached;
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('172.16.') || ip.startsWith('192.168.')) {
    return { country: 'Local', city: 'Local' };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      const result = { country: data.country || '', city: data.city || '' };
      geoCache.set(ip, { ...result, cachedAt: Date.now() });
      return result;
    }
  } catch { /* geo failed */ }
  return { country: '', city: '' };
}

function getClientIp(req: NextRequest): string {
  const f = req.headers.get('x-forwarded-for');
  if (f) { const first = f.split(',')[0].trim(); if (first) return first; }
  const r = req.headers.get('x-real-ip');
  return r?.trim() || 'unknown';
}

// Cleanup old sessions (7+ days) to manage DB size.
// The 'live' view already filters by lastSeen >= 5min at query time,
// so we do NOT delete recent records — we need them for today/week/month stats.
let lastCleanup = 0;
async function cleanupOldSessions() {
  const now = Date.now();
  // Only run cleanup at most once per 10 minutes (avoids repeated DELETEs on every heartbeat)
  if (now - lastCleanup < 10 * 60 * 1000) return;
  lastCleanup = now;
  try { await db.visitorSession.deleteMany({ where: { lastSeen: { lt: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }); } catch { /* ignore */ }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();
  const lastReq = visitorRateLimits.get(ip);
  if (lastReq && now - lastReq < VISITOR_RATE_WINDOW) return NextResponse.json({ ok: true, rateLimited: true });
  visitorRateLimits.set(ip, now);
  for (const [k, ts] of visitorRateLimits.entries()) { if (now - ts > 60000) visitorRateLimits.delete(k); }
  for (const [k, v] of geoCache.entries()) { if (now - v.cachedAt > GEO_CACHE_TTL) geoCache.delete(k); }

  try {
    const body = await request.json();
    const { sessionId, page, referrer } = body;
    if (!sessionId || typeof sessionId !== 'string') return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    const userAgent = request.headers.get('user-agent') || '';
    const { device, browser, os } = parseUserAgent(userAgent);
    const referrerCategory = categorizeReferrer(referrer || '');
    const geo = await getGeoLocation(ip);
    cleanupOldSessions();

    // Look up by sessionId only (not sessionId+ip) so that IP changes
    // (mobile switching WiFi/cellular) update the same record instead of creating duplicates
    const existing = await db.visitorSession.findFirst({ where: { sessionId } });
    if (existing) {
      await db.visitorSession.update({
        where: { id: existing.id },
        data: { ip, page: page || existing.page, referrer: referrer || existing.referrer, referrerCategory, lastSeen: new Date(), country: geo.country || existing.country, city: geo.city || existing.city, device, browser, os },
      });
    } else {
      await db.visitorSession.create({ data: { sessionId, ip, country: geo.country, city: geo.city, page: page || '', referrer: referrer || '', referrerCategory, userAgent, device, browser, os } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track visitor error:', error);
    return NextResponse.json({ ok: true });
  }
}
