import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { CODE_TO_SLUG } from '@/lib/country-slug';

const BASE_URL = 'https://pakvisa-advisor.vercel.app';

// Popular countries that should have higher priority
const HIGH_PRIORITY = new Set([
  'UAE', 'SaudiArabia', 'Turkey', 'Malaysia', 'Thailand',
  'UK', 'USA', 'Canada', 'Australia', 'Germany',
  'China', 'Japan', 'Singapore', 'Saudi Arabia',
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const countries = await db.country.findMany({
    select: { code: true, name: true, updatedAt: true, visaFree: true, visaOnArrival: true, etaAvailable: true },
  });

  const countryPages: MetadataRoute.Sitemap = countries.map((c) => {
    const slug = CODE_TO_SLUG[c.code] || c.code.toLowerCase();
    const isHigh = HIGH_PRIORITY.has(c.code);
    return {
      url: `${BASE_URL}/${slug}`,
      lastModified: c.updatedAt ?? new Date(),
      changeFrequency: isHigh ? 'daily' as const : 'weekly' as const,
      priority: isHigh ? 0.9 : 0.8,
    };
  });

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...countryPages,
  ];
}
