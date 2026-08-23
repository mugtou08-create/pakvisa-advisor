import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const AFFILIATE_URLS: Record<string, (country?: string) => string> = {
  ivisa: (c) => `https://www.ivisa.com/?ref=pakvisa${c ? `&search=${encodeURIComponent(c)}` : ''}`,
  booking: (c) => `https://www.booking.com/?aid=2315706${c ? `&ss=${encodeURIComponent(c)}` : ''}`,
  skyscanner: () => `https://www.skyscanner.net/?ref=pakvisa`,
  safetywing: () => `https://safetywing.com/?ref=pakvisa`,
  hotel: (c) => `https://www.booking.com/?aid=2315706${c ? `&ss=${encodeURIComponent(c)}` : ''}`,
  flight: (c) => `https://www.skyscanner.net/?ref=pakvisa${c ? `&to=${encodeURIComponent(c)}` : ''}`,
  insurance: () => `https://safetywing.com/?ref=pakvisa`,
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