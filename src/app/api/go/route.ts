import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** Build iVisa URL: https://www.ivisa.com/{country-slug}-visa?promotion=SHARE20 */
function ivisaUrl(country?: string): string {
  if (!country) return 'https://www.ivisa.com/?promotion=SHARE20';
  const slug = country.toLowerCase().replace(/\s+/g, '-');
  return `https://www.ivisa.com/${slug}-visa?promotion=SHARE20`;
}

/** Build Booking.com URL with search */
function bookingUrl(country?: string): string {
  const base = 'https://www.booking.com/searchresults.html';
  const params = new URLSearchParams({ aid: '304142', label: 'pakvisa' });
  if (country) params.set('ss', country);
  return `${base}?${params.toString()}`;
}

/** Build Skyscanner URL — search flights from Pakistan to destination */
function skyscannerUrl(country?: string): string {
  if (!country) return 'https://www.skyscanner.net/';
  // Use 'ISL' (Islamabad) as default origin for Pakistani travelers
  const dest = country.toLowerCase().replace(/\s+/g, '-');
  return `https://www.skyscanner.net/transport/flights/isl/${dest}/`;
}

/** SafetyWing — your live affiliate link */
const SAFETYWING_URL = 'https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador';

const AFFILIATE_URLS: Record<string, (country?: string) => string> = {
  ivisa: ivisaUrl,
  booking: bookingUrl,
  skyscanner: skyscannerUrl,
  safetywing: () => SAFETYWING_URL,
  hotel: bookingUrl,
  flight: skyscannerUrl,
  insurance: () => SAFETYWING_URL,
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const partner = url.searchParams.get('p') || '';
  const country = url.searchParams.get('c') || '';
  const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
  const sessionId = url.searchParams.get('sid') || '';
  const page = url.searchParams.get('page') || '';

  // Log the click
  try {
    await db.affiliateClick.create({ data: { partner, country, ip, sessionId, page } });
  } catch { /* silent */ }

  // Redirect to affiliate URL
  const urlBuilder = AFFILIATE_URLS[partner];
  if (!urlBuilder) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const target = urlBuilder(country);
  return NextResponse.redirect(target, 302);
}
