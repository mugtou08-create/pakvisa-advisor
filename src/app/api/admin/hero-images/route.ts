import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const HERO_COUNTRIES: { slug: string; code: string; name: string }[] = [
  { slug: 'afghanistan', code: 'Afghanistan', name: 'Afghanistan' },
  { slug: 'algeria', code: 'Algeria', name: 'Algeria' },
  { slug: 'armenia', code: 'Armenia', name: 'Armenia' },
  { slug: 'australia', code: 'Australia', name: 'Australia' },
  { slug: 'austria', code: 'Austria', name: 'Austria' },
  { slug: 'azerbaijan', code: 'Azerbaijan', name: 'Azerbaijan' },
  { slug: 'bahrain', code: 'Bahrain', name: 'Bahrain' },
  { slug: 'bangladesh', code: 'Bangladesh', name: 'Bangladesh' },
  { slug: 'belgium', code: 'Belgium', name: 'Belgium' },
  { slug: 'brazil', code: 'Brazil', name: 'Brazil' },
  { slug: 'cambodia', code: 'Cambodia', name: 'Cambodia' },
  { slug: 'canada', code: 'Canada', name: 'Canada' },
  { slug: 'china', code: 'China', name: 'China' },
  { slug: 'czechia', code: 'Czechia', name: 'Czech Republic' },
  { slug: 'denmark', code: 'Denmark', name: 'Denmark' },
  { slug: 'egypt', code: 'Egypt', name: 'Egypt' },
  { slug: 'ethiopia', code: 'Ethiopia', name: 'Ethiopia' },
  { slug: 'france', code: 'France', name: 'France' },
  { slug: 'georgia', code: 'Georgia', name: 'Georgia' },
  { slug: 'germany', code: 'Germany', name: 'Germany' },
  { slug: 'greece', code: 'Greece', name: 'Greece' },
  { slug: 'hong-kong', code: 'HongKong', name: 'Hong Kong' },
  { slug: 'hungary', code: 'Hungary', name: 'Hungary' },
  { slug: 'iceland', code: 'Iceland', name: 'Iceland' },
  { slug: 'india', code: 'India', name: 'India' },
  { slug: 'indonesia', code: 'Indonesia', name: 'Indonesia' },
  { slug: 'iran', code: 'Iran', name: 'Iran' },
  { slug: 'iraq', code: 'Iraq', name: 'Iraq' },
  { slug: 'ireland', code: 'Ireland', name: 'Ireland' },
  { slug: 'italy', code: 'Italy', name: 'Italy' },
  { slug: 'japan', code: 'Japan', name: 'Japan' },
  { slug: 'jordan', code: 'Jordan', name: 'Jordan' },
  { slug: 'kenya', code: 'Kenya', name: 'Kenya' },
  { slug: 'kuwait', code: 'Kuwait', name: 'Kuwait' },
  { slug: 'lebanon', code: 'Lebanon', name: 'Lebanon' },
  { slug: 'luxembourg', code: 'Luxembourg', name: 'Luxembourg' },
  { slug: 'malaysia', code: 'Malaysia', name: 'Malaysia' },
  { slug: 'maldives', code: 'Maldives', name: 'Maldives' },
  { slug: 'mexico', code: 'Mexico', name: 'Mexico' },
  { slug: 'mongolia', code: 'Mongolia', name: 'Mongolia' },
  { slug: 'morocco', code: 'Morocco', name: 'Morocco' },
  { slug: 'nepal', code: 'Nepal', name: 'Nepal' },
  { slug: 'netherlands', code: 'Netherlands', name: 'Netherlands' },
  { slug: 'new-zealand', code: 'NewZealand', name: 'New Zealand' },
  { slug: 'nigeria', code: 'Nigeria', name: 'Nigeria' },
  { slug: 'norway', code: 'Norway', name: 'Norway' },
  { slug: 'oman', code: 'Oman', name: 'Oman' },
  { slug: 'philippines', code: 'Philippines', name: 'Philippines' },
  { slug: 'poland', code: 'Poland', name: 'Poland' },
  { slug: 'portugal', code: 'Portugal', name: 'Portugal' },
  { slug: 'qatar', code: 'Qatar', name: 'Qatar' },
  { slug: 'romania', code: 'Romania', name: 'Romania' },
  { slug: 'russia', code: 'Russia', name: 'Russia' },
  { slug: 'saudi-arabia', code: 'SaudiArabia', name: 'Saudi Arabia' },
  { slug: 'singapore', code: 'Singapore', name: 'Singapore' },
  { slug: 'south-africa', code: 'SouthAfrica', name: 'South Africa' },
  { slug: 'south-korea', code: 'SouthKorea', name: 'South Korea' },
  { slug: 'spain', code: 'Spain', name: 'Spain' },
  { slug: 'sri-lanka', code: 'SriLanka', name: 'Sri Lanka' },
  { slug: 'sweden', code: 'Sweden', name: 'Sweden' },
  { slug: 'switzerland', code: 'Switzerland', name: 'Switzerland' },
  { slug: 'tanzania', code: 'Tanzania', name: 'Tanzania' },
  { slug: 'thailand', code: 'Thailand', name: 'Thailand' },
  { slug: 'tunisia', code: 'Tunisia', name: 'Tunisia' },
  { slug: 'turkmenistan', code: 'Turkmenistan', name: 'Turkmenistan' },
  { slug: 'turkey', code: 'Turkey', name: 'Turkiye' },
  { slug: 'uae', code: 'UAE', name: 'UAE' },
  { slug: 'uk', code: 'UK', name: 'United Kingdom' },
  { slug: 'usa', code: 'USA', name: 'United States' },
  { slug: 'vietnam', code: 'Vietnam', name: 'Vietnam' },
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
