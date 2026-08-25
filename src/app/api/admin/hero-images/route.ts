import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { existsSync } from 'fs';
import path from 'path';

// 15 countries that have hero images — slug-code pairs
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

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const auth = authenticate(request);
    if (!auth.authenticated) return auth.response!;

    // Check global enabled setting
    const globalSetting = await db.siteSettings.findUnique({ where: { key: 'hero_images_global_enabled' } });
    const globalEnabled = globalSetting ? globalSetting.value !== 'false' : true;

    // Fetch countries that have hero images
    const codes = HERO_COUNTRIES.map(c => c.code);
    const countries = await db.country.findMany({
      where: { code: { in: codes } },
      select: { code: true, name: true, heroImageEnabled: true },
    });

    const countryMap = Object.fromEntries(countries.map(c => [c.code, c]));
    const publicDir = path.join(process.cwd(), 'public');

    const data = HERO_COUNTRIES.map(hc => {
      const dbCountry = countryMap[hc.code];
      const imagePath = path.join(publicDir, 'country-heroes', `${hc.slug}.png`);
      return {
        code: hc.code,
        name: dbCountry?.name || hc.name,
        slug: hc.slug,
        heroImageEnabled: dbCountry?.heroImageEnabled ?? false,
        hasImageFile: existsSync(imagePath),
      };
    });

    return NextResponse.json({ success: true, data: { globalEnabled, countries: data } });
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
    const { code, enabled } = body;

    if (!code || typeof enabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Missing code or enabled' }, { status: 400 });
    }

    await db.country.updateMany({
      where: { code },
      data: { heroImageEnabled: enabled },
    });

    return NextResponse.json({ success: true, data: { code, enabled } });
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

    // Global kill switch: disable all hero images
    await db.country.updateMany({
      data: { heroImageEnabled: false },
    });

    return NextResponse.json({ success: true, data: { message: 'All hero images disabled' } });
  } catch (error) {
    console.error('Hero images DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
