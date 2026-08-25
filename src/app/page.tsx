import { db } from '@/lib/db';
import { CODE_TO_SLUG } from '@/lib/country-slug';
import type { CountryData, CostProfileData } from '@/lib/types';
import HomeClient from './home-client';
import {
  Globe, CheckCircle2, Plane, FileText, Building, Shield,
  AlertTriangle, Info, ExternalLink,
} from 'lucide-react';

// ============================================================
// Force dynamic rendering (queries the DB)
// ============================================================
export const dynamic = 'force-dynamic';

// ============================================================
// ISO 2-letter code mapping for flag CDN URLs
// (duplicated from constants.ts which is 'use client')
// ============================================================
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

function getFlagUrl(code: string, width = 80): string {
  const iso = FLAG_ISO_MAP[code];
  return iso ? `https://flagcdn.com/w${width}/${iso.toLowerCase()}.png` : '';
}

// ============================================================
// Popular Countries
// ============================================================
const POPULAR_COUNTRIES = [
  'UAE', 'Saudi Arabia', 'Turkey', 'Malaysia',
  'Thailand', 'UK', 'USA', 'China',
];

// ============================================================
// Visa Policy Alerts
// ============================================================
const VISA_ALERTS = [
  { id: 1, icon: 'check', color: 'text-emerald-600', title: 'Turkey e-Visa Now Available', desc: 'Pakistani citizens can apply for a Turkish e-Visa online in minutes.', source: 'evisa.gov.tr', url: 'https://www.evisa.gov.tr/en/' },
  { id: 2, icon: 'plane', color: 'text-amber-600', title: 'Malaysia e-Visa Available', desc: 'Pakistani citizens can apply for a Malaysia e-Visa online. RM 20 fee, 30-day stay, air entry only.', source: 'imi.gov.my', url: 'https://www.imi.gov.my/index.php/main/passport/visa-requirement' },
  { id: 3, icon: 'info', color: 'text-sky-600', title: 'Saudi Visa for Pakistani Tourists', desc: 'Saudi Arabia offers package visas through authorized travel agencies. Includes Umrah and tourism visas.', source: 'visitsaudi.com', url: 'https://visitsaudi.com/' },
  { id: 4, icon: 'alert', color: 'text-orange-600', title: 'UAE Insurance Requirement', desc: 'UAE now requires travel insurance for visa on arrival. Check latest rules.', source: 'uaevisaonline.com', url: 'https://uaevisaonline.com/uae-visa-on-arrival/' },
  { id: 5, icon: 'check', color: 'text-emerald-600', title: 'Azerbaijan e-Visa Online', desc: 'Pakistani citizens can get an Azerbaijan e-Visa online for $20. Processing within 3 business days.', source: 'evisa.gov.az', url: 'https://evisa.gov.az/en/' },
  { id: 6, icon: 'info', color: 'text-sky-600', title: 'Thailand e-Visa for Pakistanis', desc: 'Pakistani citizens must apply for a Thailand Tourist Visa online via thaievisa.go.th. Fee: 2,000 THB.', source: 'thaievisa.go.th', url: 'https://www.thaievisa.go.th/' },
];

// ============================================================
// Visa type helper (server-safe, no React dependency)
// ============================================================
function getVisaTypeLabel(c: { visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }) {
  if (c.visaFree) return { label: 'Visa Free', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
  if (c.visaOnArrival) return { label: 'Visa on Arrival', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' };
  if (c.etaAvailable) return { label: 'e-Visa', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', dot: 'bg-sky-500' };
  return { label: 'Embassy Required', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' };
}

// ============================================================
// Alert icon component (server-safe)
// ============================================================
function AlertIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'check': return <CheckCircle2 className={className} />;
    case 'plane': return <Plane className={className} />;
    case 'alert': return <AlertTriangle className={className} />;
    default: return <Info className={className} />;
  }
}

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
      flagUrl: c.flagUrl || getFlagUrl(c.code),
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

  // Get popular countries data (for static grid)
  const popularData = POPULAR_COUNTRIES
    .map((name) => countries.find((c) => c.name === name))
    .filter((c): c is CountryData => Boolean(c));

  // Collect flag URLs for preloading
  const popularFlagUrls = popularData
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
        {/* ==================== SECTION 2: HERO (static) ==================== */}
        <section className="relative px-4 pt-10 pb-8 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-emerald-200/40 via-emerald-100/20 to-transparent dark:from-emerald-900/20 dark:via-emerald-800/10 rounded-full blur-3xl" />
            <div className="absolute top-20 left-10 w-40 h-40 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl" />
            <div className="absolute top-10 right-10 w-32 h-32 bg-sky-200/20 dark:bg-sky-900/10 rounded-full blur-3xl" />
          </div>
          <div className="max-w-6xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium mb-4">
              <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              Trusted by 10,000+ Pakistani Travelers
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
              Pakistan&apos;s #1 Free{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">Visa Checker</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Instant visa requirements, fees, and processing times for 70+ countries. Trusted by thousands of Pakistani travelers.
            </p>
          </div>
        </section>

        {/* ==================== SECTION 3: STATS BAR (static) ==================== */}
        <section className="px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Countries', value: stats.totalCountries, suffix: '+', icon: <Globe className="w-5 h-5 text-emerald-600 shrink-0" />, color: 'text-emerald-600' },
                { label: 'Visa Free', value: stats.visaFreeCount, suffix: '', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />, color: 'text-emerald-600' },
                { label: 'Visa on Arrival', value: stats.visaOnArrivalCount, suffix: '', icon: <Plane className="w-5 h-5 text-amber-600 shrink-0" />, color: 'text-amber-600' },
                { label: 'e-Visa', value: stats.eVisaCount, suffix: '', icon: <FileText className="w-5 h-5 text-sky-600 shrink-0" />, color: 'text-sky-600' },
                { label: 'Embassy', value: stats.embassyRequiredCount, suffix: '', icon: <Building className="w-5 h-5 text-gray-500 shrink-0" />, color: 'text-gray-500' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="p-2 rounded-lg bg-muted">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums min-w-[2ch]">{stat.value}{stat.suffix}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 4: POPULAR DESTINATIONS GRID (static) ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Popular Destinations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {popularData.map((c) => {
                const vt = getVisaTypeLabel(c);
                const slug = CODE_TO_SLUG[c.code];
                const iso = FLAG_ISO_MAP[c.code];
                const flagSrc = iso ? `https://flagcdn.com/w80/${iso.toLowerCase()}.png` : '';
                return (
                  <a
                    key={c.code}
                    href={slug ? `/${slug}` : '#'}
                    className="rounded-xl border bg-card p-4 text-left hover:shadow-md transition-all group hover:-translate-y-0.5 duration-200 block"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-7 rounded overflow-hidden bg-muted shrink-0">
                        {flagSrc ? (
                          <img src={flagSrc} alt={`${c.name} flag`} className="w-full h-full object-cover" width={80} height={53} />
                        ) : (
                          <span className="text-base">{c.flagEmoji}</span>
                        )}
                      </div>
                      <span className="font-semibold text-sm group-hover:text-emerald-600 transition-colors truncate">{c.name}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${vt.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${vt.dot}`} />
                      {vt.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== TRAVEL ESSENTIALS BAR (static) ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Travel Essentials</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a
                href="/api/go?p=ivisa"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors shrink-0">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Visa Help</p>
                  <p className="text-xs text-muted-foreground">iVisa</p>
                </div>
              </a>
              <a
                href="https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Travel Insurance</p>
                  <p className="text-xs text-muted-foreground">SafetyWing</p>
                </div>
              </a>
              <a
                href="https://www.booking.com/searchresults.html?aid=304142&label=pakvisa"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors shrink-0">
                  <Building className="w-5 h-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">Best Hotels</p>
                  <p className="text-xs text-muted-foreground">Booking.com</p>
                </div>
              </a>
              <a
                href="https://www.skyscanner.net/"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors shrink-0">
                  <Plane className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Cheap Flights</p>
                  <p className="text-xs text-muted-foreground">Skyscanner</p>
                </div>
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">Trusted travel partners — we may earn a commission at no extra cost to you</p>
          </div>
        </section>

        {/* ==================== SECTION 5: VISA POLICY ALERTS CAROUSEL (static) ==================== */}
        <section className="px-4 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wide">Visa Policy Alerts</h2>
            </div>
            <style>{`
              @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
              .alert-carousel-track { animation: scroll-left 30s linear infinite; }
              .alert-carousel-track:hover { animation-play-state: paused; }
            `}</style>
            <div className="overflow-hidden">
              <div className="alert-carousel-track flex gap-3">
                {[...VISA_ALERTS, ...VISA_ALERTS].map((alert, idx) => (
                  <a
                    key={`${alert.id}-${idx}`}
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-72 shrink-0 rounded-xl border bg-card px-4 py-3 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
                  >
                    <div className={`p-1.5 rounded-full bg-muted shrink-0 ${alert.color}`}>
                      <AlertIcon type={alert.icon} className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{alert.source}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </HomeClient>
    </>
  );
}
