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

// ============================================================
// Static fallback: All known country slugs embedded directly.
// If the DB is unreachable, the sitemap still contains ALL URLs.
// This prevents Google from dropping pages from its index
// during a temporary DB outage.
// ============================================================
const STATIC_SLUGS = [...new Set(Object.values(CODE_TO_SLUG))];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let countries: { code: string; name: string; updatedAt: Date | null; visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }[] = [];
  let dbAvailable = false;

  try {
    countries = await db.country.findMany({
      select: { code: true, name: true, updatedAt: true, visaFree: true, visaOnArrival: true, etaAvailable: true },
    });
    dbAvailable = countries.length > 0;
  } catch {
    // DB unreachable — will use static fallback below
  }

  // Build country page entries
  const countryPages: MetadataRoute.Sitemap = [];

  if (dbAvailable) {
    // Use DB data (has updatedAt timestamps)
    for (const c of countries) {
      const slug = CODE_TO_SLUG[c.code] || c.code.toLowerCase();
      const isHigh = HIGH_PRIORITY.has(c.code);
      countryPages.push({
        url: `${BASE_URL}/${slug}`,
        lastModified: c.updatedAt ?? new Date(),
        changeFrequency: isHigh ? 'weekly' as const : 'monthly' as const,
        priority: isHigh ? 0.9 : 0.8,
      });
    }

    // Also include any static slugs not in DB (future countries)
    const dbSlugs = new Set(countries.map(c => CODE_TO_SLUG[c.code] || c.code.toLowerCase()));
    for (const slug of STATIC_SLUGS) {
      if (!dbSlugs.has(slug)) {
        countryPages.push({
          url: `${BASE_URL}/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        });
      }
    }
  } else {
    // DB unavailable — use static fallback with ALL known slugs
    for (const slug of STATIC_SLUGS) {
      const isHighPrioritySlug = ['uae', 'saudi-arabia', 'turkey', 'malaysia', 'thailand', 'uk', 'usa', 'canada', 'australia', 'germany', 'china', 'japan', 'singapore'].includes(slug);
      countryPages.push({
        url: `${BASE_URL}/${slug}`,
        lastModified: new Date(),
        changeFrequency: isHighPrioritySlug ? 'weekly' as const : 'monthly' as const,
        priority: isHighPrioritySlug ? 0.9 : 0.8,
      });
    }
  }

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ...countryPages,
  ];
}
