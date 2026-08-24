import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { CODE_TO_SLUG } from '@/lib/country-slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const countries = await db.country.findMany({
    select: { code: true, name: true, updatedAt: true },
  });

  const BASE_URL = 'https://pakvisa-advisor.vercel.app';

  const countryPages: MetadataRoute.Sitemap = countries.map((c) => ({
    url: `${BASE_URL}/${CODE_TO_SLUG[c.code] || c.code}`,
    lastModified: c.updatedAt ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

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
