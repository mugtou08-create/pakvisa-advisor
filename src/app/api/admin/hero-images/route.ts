import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const HERO_COUNTRIES: { slug: string; code: string; name: string }[] = [
  { slug: 'uae', code: 'UAE', name: 'UAE' },
  { slug: 'saudi-arabia', code: 'SaudiArabia', name: 'Saudi Arabia' },
  { slug: 'malaysia', code: 'Malaysia', name: 'Malaysia' },
  { slug: 'turkey', code: 'Turkey', name: 'Türkiye' },
  { slug: 'uk', code: 'UK', name: 'United Kingdom' },
  { slug: 'usa', code: 'USA', name: 'United States' },
  { slug: 'thailand', code: 'Thailand', name: 'Thailand' },
  { slug: 'china', code: 'China', name: 'China' },
  { slug: 'oman', code: 'Oman', name: 'Oman' },
  { slug: 'qatar', code: 'Qatar', name: 'Qatar' },
  { slug: 'bahrain', code: 'Bahrain', name: 'Bahrain' },
  { slug: 'egypt', code: 'Egypt', name: 'Egypt' },
  { slug: 'indonesia', code: 'Indonesia', name: 'Indonesia' },
  { slug: 'jordan', code: 'Jordan', name: 'Jordan' },
  { slug: 'singapore', code: 'Singapore', name: 'Singapore' },
];

function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (!parts[0] || !parts[1]) return { valid: false };
    const timestamp = parseInt(parts[3] || parts[parts.length - 1]);
    if (!timestamp || Date.now() - timestamp > 604800000) return { valid: false };
    return { valid: true, username: parts[1] };
  } catch {
    return { valid: false };
  }
}

function authenticate(request: NextRequest): { authenticated: boolean; response?: NextResponse } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  const token = authHeader.replace('Bearer ', '');
  const validation = validateToken(token);
  if (!validation.valid) {
    return { authenticated: false, response: NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 }) };
  }
  return { authenticated: true };
}

async function getDisabledSlugs(): Promise<Set<string>> {
  try {
    const setting = await db.siteSettings.findUnique({ where: { key: 'hero_images_disabled' } });
    if (!setting || setting.value !== 'true') return new Set();
    const list = setting.value;
    return new Set();
  } catch {
    return new Set();
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const auth = authenticate(request);
    if (!auth.authenticated) return auth.response!;

    // Check global disabled setting
    let globalDisabled = false;
    try {
      const setting = await db.siteSettings.findUnique({ where: { key: 'hero_images_global_disabled' } });
      globalDisabled = setting?.value === 'true';
    } catch { /* ok */ }

    const data = HERO_COUNTRIES.map(hc => ({
      code: hc.code,
      name: hc.name,
      slug: hc.slug,
      enabled: !globalDisabled,
      hasImageFile: true, // files are in /public/country-heroes/
    }));

    return NextResponse.json({ success: true, data: { globalEnabled: !globalDisabled, countries: data } });
  } catch (error) {
    console.error('Hero images GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 20, 60000)) {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const auth = authenticate(request);
    if (!auth.authenticated) return auth.response!;

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Missing enabled' }, { status: 400 });
    }

    // Store global state in SiteSettings
    await db.siteSettings.upsert({
      where: { key: 'hero_images_global_disabled' },
      update: { value: String(!enabled) },
      create: { key: 'hero_images_global_disabled', value: String(!enabled) },
    });

    return NextResponse.json({ success: true, data: { enabled } });
  } catch (error) {
    console.error('Hero images PUT error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const auth = authenticate(request);
    if (!auth.authenticated) return auth.response!;

    // Global kill switch
    await db.siteSettings.upsert({
      where: { key: 'hero_images_global_disabled' },
      update: { value: 'true' },
      create: { key: 'hero_images_global_disabled', value: 'true' },
    });

    return NextResponse.json({ success: true, data: { message: 'All hero images disabled' } });
  } catch (error) {
    console.error('Hero images DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
