import Link from 'next/link';
import { ArrowLeft, Globe, Compass } from 'lucide-react';

const POPULAR_COUNTRIES = [
  { slug: 'uae', name: 'UAE', emoji: '🇦🇪' },
  { slug: 'saudi-arabia', name: 'Saudi Arabia', emoji: '🇸🇦' },
  { slug: 'turkey', name: 'Turkey', emoji: '🇹🇷' },
  { slug: 'malaysia', name: 'Malaysia', emoji: '🇲🇾' },
  { slug: 'uk', name: 'UK', emoji: '🇬🇧' },
  { slug: 'usa', name: 'USA', emoji: '🇺🇸' },
  { slug: 'canada', name: 'Canada', emoji: '🇨🇦' },
  { slug: 'australia', name: 'Australia', emoji: '🇦🇺' },
  { slug: 'germany', name: 'Germany', emoji: '🇩🇪' },
  { slug: 'thailand', name: 'Thailand', emoji: '🇹🇭' },
  { slug: 'china', name: 'China', emoji: '🇨🇳' },
  { slug: 'japan', name: 'Japan', emoji: '🇯🇵' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="text-center max-w-lg">
        <div className="mb-4">
          <Globe className="w-16 h-16 text-muted-foreground/40 mx-auto" />
        </div>
        <h1 className="text-5xl font-bold mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to PakVisa Advisor
        </Link>

        <div className="mt-8 pt-8 border-t">
          <div className="flex items-center gap-2 justify-center mb-4">
            <Compass className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Popular Visa Guides
            </h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {POPULAR_COUNTRIES.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
              >
                <span className="text-base">{c.emoji}</span>
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
