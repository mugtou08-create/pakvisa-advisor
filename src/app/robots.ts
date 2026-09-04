import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',          // API routes — no SEO value, wastes crawl budget
          '/country/',      // Redirect-only route — no indexable content
        ],
      },
    ],
    sitemap: 'https://pakvisa-advisor.vercel.app/sitemap.xml',
  };
}
