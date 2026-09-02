import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { CODE_TO_SLUG } from '@/lib/country-slug';

const BASE_URL = 'https://pakvisa-advisor.vercel.app';

// Popular countries that should have higher priority
const HIGH_PRIORITY = new Set([
  'UAE', 'SaudiArabia', 'Turkey', 'Malaysia', 'Thailand',
  'UK', 'USA', 'Canada', 'Australia', 'Germany',
  'China', 'Japan', 'Singapore',
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let countries: { code: string; name: string; updatedAt: Date | null; visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }[] = [];

  try {
    countries = await db.country.findMany({
      select: { code: true, name: true, updatedAt: true, visaFree: true, visaOnArrival: true, etaAvailable: true },
    });
  } catch {
    // Fallback: if DB is unreachable, return minimal sitemap with just the homepage.
    // The sitemap will be correct once the runtime DB is accessible.
    return [{ url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 }];
  }

  const countryPages: MetadataRoute.Sitemap = countries.map((c) => {
    const slug = CODE_TO_SLUG[c.code] || c.code.toLowerCase();
    const isHigh = HIGH_PRIORITY.has(c.code);
    return {
      url: `${BASE_URL}/${slug}`,
      lastModified: c.updatedAt ?? new Date(),
      changeFrequency: isHigh ? 'weekly' as const : 'monthly' as const,
      priority: isHigh ? 0.9 : 0.8,
    };
  });

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ...countryPages,
  ];
}
