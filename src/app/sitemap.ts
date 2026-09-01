import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { CODE_TO_SLUG } from '@/lib/country-slug';

const BASE_URL = 'https://pakvisa-advisor.vercel.app';

// Popular countries that should have higher priority and more frequent crawling
const HIGH_PRIORITY = new Set([
  'UAE', 'SaudiArabia', 'Turkey', 'Malaysia', 'Thailand',
  'UK', 'USA', 'Canada', 'Australia', 'Germany',
  'China', 'Japan', 'Singapore',
]);

// Countries with hero images on their pages
const HAS_HERO_IMAGE = new Set([
  'afghanistan','algeria','armenia','australia','austria','azerbaijan','bahrain','bangladesh',
  'belgium','brazil','cambodia','canada','china','czechia','denmark','egypt','ethiopia',
  'france','georgia','germany','greece','hong-kong','hungary','iceland','india','indonesia',
  'iran','iraq','ireland','italy','japan','jordan','kenya','kuwait','lebanon','luxembourg',
  'malaysia','maldives','mexico','mongolia','morocco','nepal','netherlands','new-zealand',
  'nigeria','norway','oman','philippines','poland','portugal','qatar','romania','russia',
  'saudi-arabia','singapore','south-africa','south-korea','spain','sri-lanka','sweden',
  'switzerland','tanzania','thailand','tunisia','turkmenistan','turkey','uae','uk','usa','vietnam',
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const countries = await db.country.findMany({
    select: { code: true, name: true, updatedAt: true, visaFree: true, visaOnArrival: true, etaAvailable: true },
  });

  const countryPages: MetadataRoute.Sitemap = countries.map((c) => {
    const slug = CODE_TO_SLUG[c.code] || c.code.toLowerCase();
    const isHigh = HIGH_PRIORITY.has(c.code);
    const hasHero = HAS_HERO_IMAGE.has(slug);
    const entry: any = {
      url: `${BASE_URL}/${slug}`,
      lastModified: c.updatedAt ?? new Date(),
      changeFrequency: isHigh ? 'weekly' as const : 'monthly' as const,
      priority: isHigh ? 0.9 : 0.8,
    };
    // Add image entry for countries with hero images (helps Google Image search)
    if (hasHero) {
      entry.images = [{
        loc: `${BASE_URL}/country-heroes/${slug}.webp`,
        title: `${c.name} - Travel Destination for Pakistani Travelers`,
        caption: `${c.name} visa guide and travel information for Pakistani citizens`,
      }];
    }
    return entry;
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
