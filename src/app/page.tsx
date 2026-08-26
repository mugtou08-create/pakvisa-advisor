import { db } from '@/lib/db';
import type { CountryData } from '@/lib/types';
import HomeClient from './home-client';

// ============================================================
// ISR: Revalidate every 5 minutes
// Country visa data changes rarely — cache at the edge for speed.
// First request renders from DB; subsequent requests served from cache.
// ============================================================
export const revalidate = 300; // 5 minutes

// ============================================================
// Main Server Component
// ============================================================
export default async function HomePage() {
  // Fetch all countries from DB (full data for client-side filtering)
  const dbCountries = await db.country.findMany({
    include: {
      visaTypes: true,
      requirements: true,
      costProfiles: true,
    },
  });

  // Format to CountryData[]
  const countries: CountryData[] = dbCountries.map((c) => {
    let monthlyTemps: Record<string, number>;
    try {
      monthlyTemps = JSON.parse(c.monthlyTemps || '{}');
    } catch {
      monthlyTemps = {};
    }
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
      fetchTimestamp: c.fetchTimestamp.toISOString(),
      fetchHash: c.fetchHash,
      parserVersion: c.parserVersion,
      parserConfidence: c.parserConfidence,
      visaTypes: c.visaTypes.map((vt) => ({
        id: vt.id,
        type: vt.type,
        description: vt.description,
        maxDuration: vt.maxDuration,
        extensions: vt.extensions,
        multipleEntry: vt.multipleEntry,
        sourceUrl: vt.sourceUrl,
        parserConfidence: vt.parserConfidence,
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
        id: r.id,
        category: r.category,
        requirement: r.requirement,
        mandatory: r.mandatory,
        description: r.description,
        scoringWeight: r.scoringWeight,
        sourceUrl: r.sourceUrl,
        parserConfidence: r.parserConfidence,
        needsReview: r.needsReview,
      })),
      createdAt: c.createdAt?.toISOString(),
    };
  });

  // Compute stats (exclusive classification: visaFree > visaOnArrival > eVisa > embassy)
  const stats = {
    totalCountries: countries.length,
    visaFreeCount: countries.filter((c) => c.visaFree).length,
    visaOnArrivalCount: countries.filter((c) => !c.visaFree && c.visaOnArrival).length,
    eVisaCount: countries.filter((c) => !c.visaFree && !c.visaOnArrival && c.etaAvailable).length,
    embassyRequiredCount: countries.filter((c) => !c.visaFree && !c.visaOnArrival && !c.etaAvailable).length,
  };

  // Collect flag URLs for preloading (top 4 most popular — avoid bloating critical path)
  const POPULAR = ['UAE', 'Saudi Arabia', 'Turkey', 'Malaysia'];
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
      {/* Preconnect + preload for flag CDN */}
      <link rel="preconnect" href="https://flagcdn.com" crossOrigin="" />
      {popularFlagUrls.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}

      <HomeClient initialCountries={countries} initialStats={stats}>
        {null}
      </HomeClient>
    </>
  );
}
