import { db } from '@/lib/db';
import type { CountryData } from '@/lib/types';
import { CODE_TO_SLUG } from '@/lib/country-slug';
import { getStaticCountries } from '@/lib/static-countries';
import HomeClient from './home-client';

// ============================================================
// ISR: Revalidate every 1 hour instead of force-dynamic.
// Vercel caches the page and revalidates in the background.
// This gives Googlebot fast cached HTML for indexing.
// ============================================================
export const revalidate = 3600;

// ============================================================
// Helpers
// ============================================================
function safeISO(val: any): string | undefined {
  if (!val) return undefined;
  try { return (val instanceof Date ? val : new Date(val)).toISOString(); } catch { return undefined; }
}

function computeStats(countries: CountryData[]) {
  return {
    totalCountries: countries.length,
    visaFreeCount: countries.filter((c) => c.visaFree).length,
    visaOnArrivalCount: countries.filter((c) => !c.visaFree && c.visaOnArrival).length,
    eVisaCount: countries.filter((c) => !c.visaFree && !c.visaOnArrival && c.etaAvailable).length,
    embassyRequiredCount: countries.filter((c) => !c.visaFree && !c.visaOnArrival && !c.etaAvailable).length,
  };
}

const FLAG_ISO_MAP: Record<string, string> = {
  Afghanistan:'AF', Algeria:'DZ', Armenia:'AM', Australia:'AU', Austria:'AT',
  Azerbaijan:'AZ', Bahrain:'BH', Bangladesh:'BD', Belgium:'BE', Brazil:'BR',
  Cambodia:'KH', Canada:'CA', China:'CN', Czechia:'CZ', Denmark:'DK',
  Egypt:'EG', Ethiopia:'ET', France:'FR', Georgia:'GE', Germany:'DE',
  Greece:'GR', HongKong:'HK', Hungary:'HU', Iceland:'IS', India:'IN',
  Indonesia:'ID', Iran:'IR', Iraq:'IQ', Ireland:'IE', Italy:'IT',
  Japan:'JP', Jordan:'JO', Kenya:'KE', Kuwait:'KW', Lebanon:'LB',
  Luxembourg:'LU', Malaysia:'MY', Maldives:'MV', Mexico:'MX', Mongolia:'MN',
  Morocco:'MA', Nepal:'NP', Netherlands:'NL', NewZealand:'NZ', Nigeria:'NG',
  Norway:'NO', Oman:'OM', Philippines:'PH', Poland:'PL', Portugal:'PT',
  Qatar:'QA', Romania:'RO', Russia:'RU', SaudiArabia:'SA', Singapore:'SG',
  SouthAfrica:'ZA', SouthKorea:'KR', Spain:'ES', SriLanka:'LK', Sweden:'SE',
  Switzerland:'CH', Tanzania:'TZ', Thailand:'TH', Tunisia:'TN',
  Turkmenistan:'TM', Turkey:'TR', UAE:'AE', UK:'GB',
  USA:'US', Vietnam:'VN',
};

const POPULAR = ['UAE', 'Saudi Arabia', 'Turkey', 'Malaysia'];

// ============================================================
// Main Server Component
// ============================================================
export default async function HomePage() {
  let countries: CountryData[] = [];
  let stats = computeStats([]);
  let serverDataLoaded = false;
  let dataSource = 'none'; // for debugging: 'db' | 'static' | 'none'

  // ── Strategy 1: Try the database ──
  try {
    const dbCountries = await db.country.findMany({
      include: {
        visaTypes: {
          include: {
            costProfiles: true,
            requirements: { orderBy: { category: 'asc' } },
          },
          orderBy: { type: 'asc' },
        },
        requirements: { orderBy: { category: 'asc' } },
        costProfiles: true,
      },
    });

    if (dbCountries && dbCountries.length > 0) {
      countries = dbCountries.map((c) => {
        let monthlyTemps: Record<string, number>;
        try { monthlyTemps = JSON.parse(c.monthlyTemps || '{}'); } catch { monthlyTemps = {}; }
        return {
          id: c.id,
          code: c.code,
          name: c.name,
          flagEmoji: c.flagEmoji,
          flagUrl: c.flagUrl || '',
          continent: c.continent,
          currency: c.currency,
          currencyCode: c.currencyCode,
          timezone: c.timezone,
          visaFree: c.visaFree,
          visaOnArrival: c.visaOnArrival,
          etaAvailable: c.etaAvailable,
          safetyRating: c.safetyRating,
          safetySummary: c.safetySummary,
          bestTravelMonths: c.bestTravelMonths,
          avgTempC: c.avgTempC,
          monthlyTemps,
          processingDaysMin: c.processingDaysMin,
          processingDaysMax: c.processingDaysMax,
          sourceUrl: c.sourceUrl,
          fetchTimestamp: safeISO(c.fetchTimestamp),
          fetchHash: c.fetchHash,
          parserVersion: c.parserVersion,
          parserConfidence: c.parserConfidence,
          visaTypes: c.visaTypes.map((vt) => ({
            id: vt.id, type: vt.type, description: vt.description,
            maxDuration: vt.maxDuration, extensions: vt.extensions,
            multipleEntry: vt.multipleEntry,
            processingDaysMin: vt.processingDaysMin,
            processingDaysMax: vt.processingDaysMax,
            sourceUrl: vt.sourceUrl, verifiedTill: vt.verifiedTill,
            parserConfidence: vt.parserConfidence,
            costProfile: vt.costProfiles && vt.costProfiles.length > 0 ? {
              id: vt.costProfiles[0].id,
              visaFeeUSD: vt.costProfiles[0].visaFeeUSD,
              serviceFeeUSD: vt.costProfiles[0].serviceFeeUSD,
              processingDaysMin: vt.costProfiles[0].processingDaysMin,
              processingDaysMax: vt.costProfiles[0].processingDaysMax,
              totalMonthlyUSD: vt.costProfiles[0].totalMonthlyUSD,
              currency: vt.costProfiles[0].currency,
              verifiedTill: vt.costProfiles[0].verifiedTill,
            } : null,
            requirements: vt.requirements ? vt.requirements.map((r) => ({
              id: r.id, category: r.category, requirement: r.requirement,
              mandatory: r.mandatory, description: r.description,
              scoringWeight: r.scoringWeight, sourceUrl: r.sourceUrl,
              parserConfidence: r.parserConfidence, needsReview: r.needsReview,
            })) : [],
          })),
          costProfile: c.costProfiles.length > 0
            ? {
                id: c.costProfiles[0].id,
                visaFeeUSD: c.costProfiles[0].visaFeeUSD,
                serviceFeeUSD: c.costProfiles[0].serviceFeeUSD,
                processingDays: c.costProfiles[0].processingDays,
                monthlyLivingUSD: c.costProfiles[0].monthlyLivingUSD,
                monthlyRentUSD: c.costProfiles[0].monthlyRentUSD,
                monthlyFoodUSD: c.costProfiles[0].monthlyFoodUSD,
                monthlyTransportUSD: c.costProfiles[0].monthlyTransportUSD,
                healthInsuranceUSD: c.costProfiles[0].healthInsuranceUSD,
                totalMonthlyUSD: c.costProfiles[0].totalMonthlyUSD,
                currency: c.costProfiles[0].currency,
                parserConfidence: c.costProfiles[0].parserConfidence,
              }
            : null,
          requirements: c.requirements.map((r) => ({
            id: r.id, category: r.category, requirement: r.requirement,
            mandatory: r.mandatory, description: r.description,
            scoringWeight: r.scoringWeight, sourceUrl: r.sourceUrl,
            parserConfidence: r.parserConfidence, needsReview: r.needsReview,
          })),
          createdAt: safeISO(c.createdAt),
        };
      });
      stats = computeStats(countries);
      serverDataLoaded = true;
      dataSource = 'db';
    }
  } catch (error) {
    // DB unavailable — fall through to static fallback
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[HomePage] DB query failed (falling back to static data): ${msg}`);
    if (msg.includes('Unable to open') || msg.includes('ENOTFOUND') || msg.includes('ENOENT')) {
      console.error('[HomePage] ROOT CAUSE: Database file not found or unreachable. Check DATABASE_URL and TURSO_DATABASE_URL env vars.');
    }
  }

  // ── Strategy 2: Static fallback (embedded JSON, always available) ──
  if (countries.length === 0) {
    try {
      countries = getStaticCountries();
      stats = computeStats(countries);
      serverDataLoaded = true;
      dataSource = 'static';
      console.log(`[HomePage] Using static fallback: ${countries.length} countries`);
    } catch (staticError) {
      console.error('[HomePage] Static fallback also failed:', staticError);
    }
  }

  // Collect flag URLs for preloading (top 4 most popular)
  const popularFlagUrls = POPULAR
    .map((name) => countries.find((c) => c.name === name))
    .filter((c): c is CountryData => Boolean(c))
    .map((c) => {
      const iso = FLAG_ISO_MAP[c.code];
      return iso ? `https://flagcdn.com/w80/${iso.toLowerCase()}.png` : null;
    })
    .filter((url): url is string => Boolean(url));

  return (
    <>
      {/* Data source diagnostic (visible in dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <span data-datasource={dataSource} className="hidden" />
      )}

      {/* Preconnect + preload for flag CDN */}
      <link rel="preconnect" href="https://flagcdn.com" crossOrigin="" />
      {popularFlagUrls.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}

      <HomeClient initialCountries={countries} initialStats={stats} serverDataLoaded={serverDataLoaded}>
        {null}
      </HomeClient>

      {/* SEO: Hidden HTML sitemap with real <a> links to all country pages. */}
      {serverDataLoaded && countries.length > 0 && (
        <nav aria-label="All Countries" className="sr-only">
          <h2>All Countries Visa Guide for Pakistani Citizens</h2>
          <ul>
            {countries.map((c) => {
              const slug = CODE_TO_SLUG[c.code] || c.code.toLowerCase();
              const visaLabel = c.visaFree ? 'Visa Free' : c.visaOnArrival ? 'Visa on Arrival' : c.etaAvailable ? 'e-Visa' : 'Embassy Visa Required';
              return (
                <li key={c.code}>
                  <a
                    href={`/${slug}`}
                    title={`${c.name} Visa for Pakistani Citizens - ${visaLabel} - Requirements, Fees & Guide 2026`}
                  >
                    {c.name} Visa for Pakistani Citizens
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
