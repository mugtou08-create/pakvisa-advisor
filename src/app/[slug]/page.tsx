import type { Metadata } from 'next';
import { db } from '@/lib/db';
import Link from 'next/link';
import {
  Clock, DollarSign, Shield, Calendar, Plane, FileText, Building,
  CheckCircle2, ArrowRight, Globe, Home, ChevronRight, ExternalLink,
  Thermometer, UtensilsCrossed, Phone, Mail, MapPin, AlertTriangle,
} from 'lucide-react';

// ============================================================
// Inline slug maps (avoid cross-module import issues with Turbopack)
// ============================================================

const COUNTRY_SLUG_ENTRIES: [string, string][] = [
  ['afghanistan','Afghanistan'],['algeria','Algeria'],['armenia','Armenia'],['australia','Australia'],['austria','Austria'],
  ['azerbaijan','Azerbaijan'],['bahrain','Bahrain'],['bangladesh','Bangladesh'],['belgium','Belgium'],['brazil','Brazil'],
  ['cambodia','Cambodia'],['canada','Canada'],['china','China'],['czechia','Czechia'],['denmark','Denmark'],
  ['egypt','Egypt'],['ethiopia','Ethiopia'],['france','France'],['georgia','Georgia'],['germany','Germany'],
  ['greece','Greece'],['hong-kong','HongKong'],['hungary','Hungary'],['iceland','Iceland'],['india','India'],
  ['indonesia','Indonesia'],['iran','Iran'],['iraq','Iraq'],['ireland','Ireland'],['italy','Italy'],
  ['japan','Japan'],['jordan','Jordan'],['kenya','Kenya'],['kuwait','Kuwait'],['lebanon','Lebanon'],
  ['luxembourg','Luxembourg'],['malaysia','Malaysia'],['maldives','Maldives'],['mexico','Mexico'],['mongolia','Mongolia'],
  ['morocco','Morocco'],['nepal','Nepal'],['netherlands','Netherlands'],['new-zealand','NewZealand'],['nigeria','Nigeria'],
  ['norway','Norway'],['oman','Oman'],['philippines','Philippines'],['poland','Poland'],['portugal','Portugal'],
  ['qatar','Qatar'],['romania','Romania'],['russia','Russia'],['saudi-arabia','SaudiArabia'],['singapore','Singapore'],
  ['south-africa','SouthAfrica'],['south-korea','SouthKorea'],['spain','Spain'],['sri-lanka','SriLanka'],['sweden','Sweden'],
  ['switzerland','Switzerland'],['tanzania','Tanzania'],['thailand','Thailand'],['tunisia','Tunisia'],
  ['turkmenistan','Turkmenistan'],['turkey','Turkey'],['uae','UAE'],['uk','UK'],
  ['usa','USA'],['vietnam','Vietnam'],
];

const SLUG_TO_CODE = Object.fromEntries(COUNTRY_SLUG_ENTRIES);
const CODE_TO_SLUG = Object.fromEntries(COUNTRY_SLUG_ENTRIES.map(([s,c])=>[c,s]));

// ============================================================
// Inline data (server-safe, no 'use client')
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
  USA:'US', Vietnam:'VN'
};

const EXCHANGE_RATES: Record<string, number> = {
  AED: 75.8, SAR: 74.2, QAR: 76.1, OMR: 727.3, BHD: 745.6,
  TRY: 8.1, USD: 278.5, GBP: 351.2, EUR: 302.8, AUD: 182.3,
  CAD: 201.5, CNY: 38.4, JPY: 1.87, KRW: 0.21, MYR: 62.5,
  THB: 7.9, SGD: 206.8, IDR: 0.017, LKR: 0.95, BDT: 2.38,
  AFN: 3.9, AMD: 0.72, DZD: 2.08, BRL: 56.8, MGA: 0.061,
  EG: 5.7, GEL: 104.2, KZT: 0.61, KWD: 904.2, JOD: 393.2,
  KE: 1.79, LB: 0.0003, MA: 28.1, NP: 2.09, TN: 90.1,
  ZAR: 15.2, IQD: 0.19, IRR: 0.0004, MXN: 16.4,
};

const EMBASSY_DATA: Record<string, { address: string; phone: string; email: string; website: string; hours: string; appointmentUrl: string; note?: string }> = {
  Afghanistan: { address: 'House No. 8, Street 90, G-6/3, Islamabad', phone: '+92-51-282-4505', email: 'contact@islamabad.mfa.gov.af', website: 'https://islamabad.mfa.gov.af', hours: 'Mon-Thu 09:00-16:00', appointmentUrl: 'https://islamabad.mfa.gov.af' },
  Algeria: { address: 'House No. 107, St. No. 9, Sector E-7, Islamabad', phone: '+92-51-265-4744', email: 'amb.algerie@isb.comsats.net.pk', website: 'https://www.mfa.gov.dz', hours: 'Sun-Thu 09:00-16:00', appointmentUrl: 'https://www.mfa.gov.dz/en/embassys-locations-list' },
  Azerbaijan: { address: 'Plot 1D & 1E, Diplomatic Enclave II, Islamabad', phone: '+92-51-260-0704', email: 'islamabad@mission.mfa.gov.az', website: 'https://islamabad.mfa.gov.az/en', hours: 'Mon-Fri 09:00-17:00', appointmentUrl: 'https://islamabad.mfa.gov.az/en' },
  Austria: { address: 'Embassy of Austria, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-227-6491', email: 'islamabad-ob@bmeia.gv.at', website: 'https://www.bmeia.gv.at', hours: 'Mon-Fri 09:00-12:00', appointmentUrl: 'https://www.bmeia.gv.at' },
  Bangladesh: { address: 'House No. 1, Street No. 5, Sector F-6, Islamabad', phone: '+92-51-227-9267', email: 'mission.islamabad@mofa.gov.bd', website: 'https://islamabad.mofa.gov.bd', hours: 'Sun-Thu 09:00-17:00', appointmentUrl: 'https://islamabad.mofa.gov.bd' },
  Belgium: { address: 'Embassy of Belgium, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-287-0850', email: 'islamabad@diplobel.fed.be', website: 'https://www.diplomatie.belgium.be', hours: 'Mon-Fri 09:00-12:30', appointmentUrl: 'https://www.diplomatie.belgium.be' },
  China: { address: 'Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-849-6389', email: 'chinaemb_pk@mfa.gov.cn', website: 'https://www.visaforchina.org', hours: 'Mon-Fri 09:00-12:00', appointmentUrl: 'https://www.visaforchina.org' },
  Denmark: { address: 'Embassy of Denmark, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-207-7000', email: 'islambad@um.dk', website: 'https://islamabad.um.dk', hours: 'Mon-Fri 09:00-16:00', appointmentUrl: 'https://islamabad.um.dk' },
  France: { address: 'Embassy of France, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-287-8000', email: 'info@ambafrance-pk.org', website: 'https://pk.ambafrance.org', hours: 'Mon-Fri 08:30-12:00', appointmentUrl: 'https://pk.ambafrance.org' },
  Germany: { address: 'Embassy of the Federal Republic of Germany, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-227-9400', email: 'info@islamabad.diplo.de', website: 'https://islamabad.diplo.de', hours: 'Mon-Fri 08:30-12:00', appointmentUrl: 'https://islamabad.diplo.de' },
  Greece: { address: '33A, School Road, F-6/2, Islamabad', phone: '+92-51-282-5186', email: 'grcon.isl@mfa.gr', website: 'https://www.mfa.gr/missionsabroad/en/pakistan-en', hours: 'Mon-Fri 09:00-16:00', appointmentUrl: 'https://www.mfa.gr/missionsabroad/en/pakistan-en' },
  Iran: { address: 'Plot No. 222-238, St. No. 2, G-5/1, Diplomatic Enclave, Islamabad', phone: '+92-51-283-3070', email: 'info@iranembassy.pk', website: 'https://www.islamabad.mfa.ir/en', hours: 'Mon-Fri 08:00-12:00', appointmentUrl: 'https://www.islamabad.mfa.ir/en' },
  Iraq: { address: 'Street 33, Ramna 4, Diplomatic Enclave, Islamabad', phone: '+92-51-225-3738', email: 'iabemb@iraqmofamail.net', website: 'https://mofa.gov.iq/islamabad', hours: 'Sun-Thu 09:00-15:00', appointmentUrl: 'https://mofa.gov.iq/islamabad' },
  Ireland: { address: 'Embassy of Ireland, Diplomatic Enclave, F-6, Islamabad', phone: '+92-51-835-5800', email: 'islamabad@dfa.ie', website: 'https://www.dfa.ie/irish-embassy/pakistan', hours: 'Mon-Fri 09:00-12:30', appointmentUrl: 'https://www.dfa.ie/irish-embassy/pakistan' },
  Italy: { address: 'Embassy of Italy, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-287-0131', email: 'ambasciata.islamabad@esteri.it', website: 'https://ambislamabad.esteri.it', hours: 'Mon-Fri 09:00-12:30', appointmentUrl: 'https://ambislamabad.esteri.it' },
  Japan: { address: 'Embassy of Japan, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-211-3371', email: 'jpemb-pk@mofa.go.jp', website: 'https://www.pk.emb-japan.go.jp', hours: 'Mon-Fri 09:00-12:30, 13:30-16:30', appointmentUrl: 'https://www.pk.emb-japan.go.jp' },
  Luxembourg: { address: 'Visa applications handled by Embassy of Belgium, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-287-0850', email: 'islamabad@diplobel.fed.be', website: 'https://mae.gouvernement.lu/en/missions-diplomatiques/missions-diplomatiques-et-consulaires-luxembourgeoises/pakistan.html', hours: 'Mon-Fri 09:00-12:30', appointmentUrl: 'https://www.diplomatie.belgium.be', note: 'No Luxembourg embassy in Pakistan. Visa applications processed through the Embassy of Belgium in Islamabad.' },
  Mongolia: { address: 'No embassy in Pakistan. Nearest: Embassy in New Delhi, India', phone: '+91-11-2688-5370', email: 'mongolia@mongolianembassy.in', website: 'https://www.mfa.mn/en/missions-abroad', hours: 'Mon-Fri 09:00-17:00', appointmentUrl: 'https://www.mfa.mn/en/missions-abroad', note: 'No Mongolian embassy in Pakistan. Apply through the Embassy of Mongolia in New Delhi, India.' },
  Morocco: { address: 'Plot 52, Street # 7, Diplomatic Enclave, Islamabad', phone: '+92-51-283-2271', email: 'sifamapak@morocco-embassy.com.pk', website: 'https://www.morocco-embassy.com.pk', hours: 'Mon-Fri 09:00-16:00', appointmentUrl: 'https://www.morocco-embassy.com.pk' },
  Netherlands: { address: 'Embassy of the Netherlands, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-287-0910', email: 'islam@minbuza.nl', website: 'https://www.nederlandwereldwijd.nl/pakistan', hours: 'Mon-Fri 08:30-12:00', appointmentUrl: 'https://www.nederlandwereldwijd.nl/pakistan' },
  NewZealand: { address: 'High Commission of New Zealand, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-282-0216', email: 'hcnz.islamabad@mfat.govt.nz', website: 'https://www.mfat.govt.nz/en/missions-and-international-relationships/pakistan', hours: 'Mon-Fri 09:00-12:00', appointmentUrl: 'https://www.immigration.govt.nz' },
  Norway: { address: 'Diplomatic Enclave, Islamabad', phone: '+92-51-849-7700', email: 'emb.islamabad@mfa.no', website: 'https://www.norway.no/en/pakistan', hours: 'Mon-Thu 08:00-16:00, Fri 08:00-13:00', appointmentUrl: 'https://www.norway.no/en/pakistan', note: 'Norwegian visa applications handled by the Norwegian Embassy in Abu Dhabi.' },
  Poland: { address: 'Embassy of the Republic of Poland, Diplomatic Enclave, F-6, Islamabad', phone: '+92-51-211-3144', email: 'islamabad@embassy.pl', website: 'https://www.gov.pl/web/pakistan', hours: 'Mon-Fri 08:30-16:30', appointmentUrl: 'https://www.gov.pl/web/pakistan' },
  Portugal: { address: 'House 8, Street 36, F-7/1, Islamabad', phone: '+92-51-844-7041', email: 'islamabad@mne.pt', website: 'https://islamabad.embaixadaportugal.mne.gov.pt/en', hours: 'Mon-Fri 09:00-17:00', appointmentUrl: 'https://islamabad.embaixadaportugal.mne.gov.pt/en/consular-section' },
  Romania: { address: 'House No. 5-A, Street No. 30, Sector F-7/1, Islamabad', phone: '+92-51-843-6662', email: 'islamabad@mae.ro', website: 'https://islamabad.mae.ro/en', hours: 'Mon-Fri 09:00-17:00', appointmentUrl: 'https://islamabad.mae.ro/en/node/397' },
  Russia: { address: 'Diplomatic Enclave, Khayaban-e-Suhrawardy, G-4, Islamabad', phone: '+92-51-260-08-11', email: 'pakistan@mid.ru', website: 'https://pakistan.mid.ru/en', hours: 'Mon-Fri 09:00-13:00', appointmentUrl: 'https://islamabad.kdmid.ru' },
  Singapore: { address: 'High Commission of Singapore, Diplomatic Enclave, F-6, Islamabad', phone: '+92-51-211-4844', email: 'singhc_isb@mfa.gov.sg', website: 'https://www.mfa.gov.sg/overseas-mission/islamabad', hours: 'Mon-Fri 09:00-12:30, 14:00-16:30', appointmentUrl: 'https://www.mfa.gov.sg/overseas-mission/islamabad' },
  SouthAfrica: { address: 'High Commission of South Africa, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-287-0600', email: 'islamabad@dirco.gov.za', website: 'https://www.dirco.gov.za', hours: 'Mon-Fri 08:30-13:00', appointmentUrl: 'https://www.dirco.gov.za' },
  SouthKorea: { address: 'Embassy of the Republic of Korea, Diplomatic Enclave, F-6, Islamabad', phone: '+92-51-211-3166', email: 'islbkorea@mofa.go.kr', website: 'https://overseas.mofa.go.kr/pk-en', hours: 'Mon-Fri 09:00-12:00, 13:30-17:30', appointmentUrl: 'https://overseas.mofa.go.kr/pk-en' },
  Spain: { address: 'Embassy of Spain, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-282-5300', email: 'emb.islamabad@maec.es', website: 'https://www.exteriores.gob.es', hours: 'Mon-Fri 09:00-14:00', appointmentUrl: 'https://www.exteriores.gob.es' },
  Sweden: { address: 'Embassy of Sweden, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-287-0700', email: 'ambassaden.islamabad@gov.se', website: 'https://www.swedenabroad.se/pakistan', hours: 'Mon-Fri 09:00-12:00', appointmentUrl: 'https://www.swedenabroad.se/pakistan' },
  Switzerland: { address: 'Embassy of Switzerland, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-287-0400', email: 'islamabad@eda.admin.ch', website: 'https://www.eda.admin.ch/pakistan', hours: 'Mon-Fri 09:00-12:00', appointmentUrl: 'https://www.eda.admin.ch/pakistan' },
  Tunisia: { address: 'House No. 221, St. No. 21, Sector E-7, Islamabad', phone: '+92-51-265-2387', email: 'atisl@tunisie.nat.tn', website: 'https://www.diplomatie.tn', hours: 'Mon-Fri 09:00-16:00', appointmentUrl: 'https://www.diplomatie.tn' },
  Turkmenistan: { address: 'Parveen Shakir Road 1-A, Str. 25, F-7/2, Islamabad', phone: '+92-51-260-9775', email: 'tmembislamabad2@mfa.gov.tm', website: 'https://pakistan.tmembassy.gov.tm', hours: 'Mon-Fri 09:00-18:00', appointmentUrl: 'https://pakistan.tmembassy.gov.tm' },
  UK: { address: 'British High Commission, Diplomatic Enclave, Islamabad', phone: '+92-51-201-2000', email: 'bhc.general@fco.gov.uk', website: 'https://www.gov.uk/government/world/organisations/british-high-commission-islamabad', hours: 'Mon-Fri 08:30-12:00', appointmentUrl: 'https://www.gov.uk/browse/visas-immigration' },
  USA: { address: 'Embassy of the United States, Diplomatic Enclave, G-5, Islamabad', phone: '+92-51-201-4000', email: 'islamabadacs@state.gov', website: 'https://pk.usembassy.gov', hours: 'Mon-Fri 08:00-16:30', appointmentUrl: 'https://www.ustraveldocs.com/pk' },
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================
// Helpers
// ============================================================

function getFlagUrl(code: string, width = 160): string {
  const iso = FLAG_ISO_MAP[code];
  return iso ? `https://flagcdn.com/w${width}/${iso.toLowerCase()}.png` : '';
}

function getVisaLabel(country: { visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }): string {
  if (country.visaFree) return 'Visa Free';
  if (country.visaOnArrival) return 'Visa on Arrival';
  if (country.etaAvailable) return 'e-Visa';
  return 'Embassy Required';
}

function getVisaBadgeClass(country: { visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }): string {
  if (country.visaFree) return 'bg-emerald-100 text-emerald-700';
  if (country.visaOnArrival) return 'bg-amber-100 text-amber-700';
  if (country.etaAvailable) return 'bg-sky-100 text-sky-700';
  return 'bg-gray-100 text-gray-600';
}

function getVisaDotClass(country: { visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }): string {
  if (country.visaFree) return 'bg-emerald-500';
  if (country.visaOnArrival) return 'bg-amber-500';
  if (country.etaAvailable) return 'bg-sky-500';
  return 'bg-gray-400';
}

function usdToPkr(usd: number): string {
  return Math.round(usd * 278.5).toLocaleString();
}

function safetyStars(rating: number): string {
  const clamped = Math.min(Math.max(rating, 0), 5);
  return '\u2605'.repeat(clamped) + '\u2606'.repeat(5 - clamped);
}

// ============================================================
// Static Params
// ============================================================

export async function generateStaticParams() {
  const countries = await db.country.findMany({ select: { code: true } });
  return countries.map((c) => ({ slug: CODE_TO_SLUG[c.code] || c.code }));
}

// ============================================================
// Metadata
// ============================================================

type CountryPageData = {
  code: string;
  name: string;
  flagEmoji: string;
  visaFree: boolean;
  visaOnArrival: boolean;
  etaAvailable: boolean;
  processingDaysMin: number;
  processingDaysMax: number;
  safetyRating: number;
  currency: string;
  currencyCode: string;
};

type CostProfileData = {
  visaFeeUSD: number;
  serviceFeeUSD: number;
  monthlyLivingUSD: number;
  monthlyRentUSD: number;
  monthlyFoodUSD: number;
  monthlyTransportUSD: number;
  healthInsuranceUSD: number;
  totalMonthlyUSD: number;
};

type VisaTypeData = {
  type: string;
  description: string;
  maxDuration: string;
  extensions: boolean;
  multipleEntry: boolean;
};

type VisaRequirementData = {
  category: string;
  requirement: string;
  mandatory: boolean;
  description: string;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const code = SLUG_TO_CODE[slug];
  if (!code) return { title: 'Country Not Found | PakVisa Advisor' };

  const country = await db.country.findUnique({
    where: { code },
    include: { costProfiles: true, visaTypes: true },
  });

  if (!country) return { title: 'Country Not Found | PakVisa Advisor' };

  const visaLabel = getVisaLabel(country);
  const costProfile = country.costProfiles[0];
  const visaFee = costProfile ? `$${costProfile.visaFeeUSD} (≈ PKR ${usdToPkr(costProfile.visaFeeUSD)})` : 'Free';
  const processing = country.visaFree ? 'No processing required' : `${country.processingDaysMin}-${country.processingDaysMax} business days`;
  const title = `${country.name} Visa for Pakistani Citizens - Requirements, Fees & Guide 2026`;
  const description = `Complete ${country.name} visa guide for Pakistani passport holders. ${visaLabel} access, ${visaFee} fee, ${processing} processing. Updated for 2026 with requirements, costs, and embassy details.`;

  return {
    title,
    description,
    keywords: [
      `${country.name} visa Pakistan`,
      `${country.name} visa Pakistani passport`,
      `${country.name} ${visaLabel.toLowerCase()} Pakistan`,
      `Pakistani passport ${country.name}`,
      `${country.name} embassy Islamabad`,
      `${country.name} visa requirements 2026`,
      `how to get ${country.name} visa from Pakistan`,
      `${country.name} visa fee PKR`,
    ],
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: `https://pakvisaadvisor.com/${slug}`,
      siteName: 'PakVisa Advisor',
      title,
      description,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${country.name} Visa Guide - PakVisa Advisor` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: { canonical: `https://pakvisaadvisor.com/${slug}` },
  };
}

// ============================================================
// Page Component
// ============================================================

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const code = SLUG_TO_CODE[slug];

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Country Not Found</h1>
          <p className="text-muted-foreground mb-4">The country you are looking for does not exist in our database.</p>
          <Link href="/" className="text-emerald-600 hover:underline flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to PakVisa Advisor
          </Link>
        </div>
      </div>
    );
  }

  const country = await db.country.findUnique({
    where: { code },
    include: {
      visaTypes: true,
      costProfiles: true,
      requirements: { orderBy: { category: 'asc' } },
    },
  });

  if (!country) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Country Not Found</h1>
          <p className="text-muted-foreground mb-4">The country you are looking for does not exist in our database.</p>
          <Link href="/" className="text-emerald-600 hover:underline flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to PakVisa Advisor
          </Link>
        </div>
      </div>
    );
  }

  const visaLabel = getVisaLabel(country);
  const visaBadgeClass = getVisaBadgeClass(country);
  const visaDotClass = getVisaDotClass(country);
  const flagUrl = getFlagUrl(country.code);
  const costProfile = country.costProfiles[0] as CostProfileData | undefined;
  const visaTypes = country.visaTypes as VisaTypeData[];
  const requirements = country.requirements as VisaRequirementData[];
  const embassyInfo = EMBASSY_DATA[country.code];
  const isEmbassyRequired = !country.visaFree && !country.visaOnArrival && !country.etaAvailable;

  // Parse monthly temps
  let monthlyTemps: Record<string, number> = {};
  try { monthlyTemps = JSON.parse(country.monthlyTemps || '{}'); } catch { /* empty */ }

  // Parse best travel months
  const bestMonths = country.bestTravelMonths ? country.bestTravelMonths.split(',').map((m: string) => m.trim()).filter(Boolean) : [];

  // Group requirements by category
  const groupedRequirements = requirements.reduce((acc, r) => {
    const cat = r.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {} as Record<string, VisaRequirementData[]>);

  // Generate FAQ based on country data
  const faqs = generateFAQs(country, costProfile, visaLabel, isEmbassyRequired);

  // Related countries from same continent
  const relatedCountries = await db.country.findMany({
    where: { continent: country.continent, code: { not: country.code } },
    take: 6,
    orderBy: { name: 'asc' },
    select: { code: true, name: true, flagUrl: true, flagEmoji: true, visaFree: true, visaOnArrival: true, etaAvailable: true },
  });

  // JSON-LD structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${country.name} Visa for Pakistani Citizens`,
    description: `Complete ${country.name} visa guide for Pakistani passport holders. ${visaLabel} access, updated for 2026.`,
    url: `https://pakvisaadvisor.com/${slug}`,
    isPartOf: { '@type': 'WebSite', name: 'PakVisa Advisor', url: 'https://pakvisaadvisor.com' },
    about: {
      '@type': 'Country',
      name: country.name,
    },
    dateModified: country.updatedAt?.toISOString().split('T')[0] || '2026-01-01',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
              <Globe className="w-5 h-5 text-emerald-600" />
              <span>PakVisa</span>
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <Home className="w-4 h-4" /> Home
            </Link>
          </div>
        </header>

        <main className="flex-1">
          {/* Breadcrumb */}
          <nav className="max-w-5xl mx-auto px-4 py-3" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li><ChevronRight className="w-3.5 h-3.5" /></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Countries</Link></li>
              <li><ChevronRight className="w-3.5 h-3.5" /></li>
              <li className="text-foreground font-medium">{country.name}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <section className="max-w-5xl mx-auto px-4 pb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {flagUrl && (
                <img
                  src={flagUrl}
                  alt={`${country.name} flag`}
                  className="w-32 h-auto sm:w-40 rounded-lg shadow-lg border bg-muted"
                  width={160}
                  height={107}
                />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold">{country.name} Visa Guide</h1>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${visaBadgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${visaDotClass}`} />
                    {visaLabel}
                  </span>
                </div>
                <p className="text-lg text-muted-foreground mb-1">
                  Complete visa information for <strong>Pakistani passport holders</strong> traveling to {country.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {country.updatedAt ? new Date(country.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '2026'} | Continent: {country.continent}
                  {country.currencyCode && <span> | Currency: {country.currency} ({country.currencyCode})</span>}
                </p>
              </div>
            </div>
          </section>

          {/* Quick Facts Row */}
          <section className="max-w-5xl mx-auto px-4 pb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">
                💰 {country.currency} ({country.currencyCode})
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 shrink-0">
                🌍 {country.continent}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                🕐 {country.timezone}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 shrink-0">
                📅 {bestMonths.length > 0 ? bestMonths.join(', ') : 'Year-round'}
              </span>
            </div>
          </section>

          {/* iVisa CTA for non-visa-free */}
          {!country.visaFree && (
            <section className="max-w-5xl mx-auto px-4 pb-6">
              <a
                href={`/api/go?p=ivisa&c=${encodeURIComponent(country.name)}&page=${encodeURIComponent(`/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-base font-semibold transition-colors"
              >
                Apply for {country.name} Visa on iVisa <ExternalLink className="w-4 h-4" />
              </a>
            </section>
          )}

          {/* Key Info Cards */}
          <section className="max-w-5xl mx-auto px-4 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoCard
                icon={<Clock className="w-5 h-5 text-sky-600" />}
                label="Processing Time"
                value={country.visaFree ? 'Instant' : `${country.processingDaysMin}-${country.processingDaysMax} days`}
                subtext={country.visaFree ? 'No processing needed' : 'Business days'}
              />
              <InfoCard
                icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                label="Visa Fee"
                value={costProfile && costProfile.visaFeeUSD > 0 ? `$${costProfile.visaFeeUSD}` : 'Free'}
                subtext={costProfile && costProfile.visaFeeUSD > 0 ? `≈ PKR ${usdToPkr(costProfile.visaFeeUSD)}` : 'No fee required'}
              />
              <InfoCard
                icon={<Shield className="w-5 h-5 text-amber-600" />}
                label="Safety Rating"
                value={`${Math.min(country.safetyRating, 5)}/5`}
                subtext={safetyStars(country.safetyRating)}
              />
              <InfoCard
                icon={<Calendar className="w-5 h-5 text-purple-600" />}
                label="Best Travel Months"
                value={bestMonths.length > 0 ? bestMonths.slice(0, 3).join(', ') : 'Year-round'}
                subtext={bestMonths.length > 3 ? `+ ${bestMonths.length - 3} more` : ''}
              />
            </div>
          </section>

          {/* Visa Types Section */}
          {visaTypes.length > 0 && (
            <section className="max-w-5xl mx-auto px-4 pb-8">
              <SectionTitle icon={<FileText className="w-5 h-5" />} title="Available Visa Types" />
              <div className="grid gap-4 sm:grid-cols-2">
                {visaTypes.map((vt, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Plane className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-semibold">{vt.type}</h3>
                    </div>
                    {vt.description && <p className="text-sm text-muted-foreground mb-3">{vt.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {vt.maxDuration && (
                        <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
                          <Clock className="w-3 h-3" /> {vt.maxDuration}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
                        {vt.multipleEntry ? 'Multiple Entry' : 'Single Entry'}
                      </span>
                      {vt.extensions && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded">
                          Extensions Available
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Requirements Section */}
          {requirements.length > 0 && (
            <section className="max-w-5xl mx-auto px-4 pb-8">
              <SectionTitle icon={<ClipboardIcon className="w-5 h-5" />} title={`Visa Requirements for ${country.name}`} />
              <div className="space-y-6">
                {Object.entries(groupedRequirements).map(([category, items]) => (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <h3 className="font-semibold text-sm">{category}</h3>
                    </div>
                    <div className="divide-y">
                      {items.map((item, i) => (
                        <div key={i} className="px-4 py-3 flex items-start gap-3">
                          {item.mandatory ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          ) : (
                            <span className="mt-1.5 w-3 h-3 rounded-full border-2 border-amber-400 shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.requirement}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.mandatory ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {item.mandatory ? 'Required' : 'Recommended'}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cost Breakdown Section */}
          {costProfile && costProfile.visaFeeUSD > 0 && (
            <section className="max-w-5xl mx-auto px-4 pb-8">
              <SectionTitle icon={<DollarSign className="w-5 h-5" />} title="Cost Breakdown" />
              <div className="border rounded-lg overflow-hidden">
                {/* One-time Costs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x">
                  <CostCell label="Visa Fee (one-time)" usd={costProfile.visaFeeUSD} />
                  <CostCell label="Service Fee (one-time)" usd={costProfile.serviceFeeUSD} />
                  <CostCell label={"Upfront Total"} usd={costProfile.visaFeeUSD + costProfile.serviceFeeUSD} highlight />
                  <CostCell label="Monthly Living Total" usd={costProfile.totalMonthlyUSD} highlight />
                </div>
                {/* Monthly Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x border-t bg-muted/20">
                  <CostCell label="Rent (monthly)" usd={costProfile.monthlyRentUSD} />
                  <CostCell label="Food (monthly)" usd={costProfile.monthlyFoodUSD} />
                  <CostCell label="Transport (monthly)" usd={costProfile.monthlyTransportUSD} />
                  <CostCell label="Insurance (monthly)" usd={costProfile.healthInsuranceUSD} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">* PKR conversions based on approximate exchange rate (1 USD ≈ PKR 278.5). Actual rates may vary. Monthly total includes rent, food, transport, and insurance.</p>
            </section>
          )}

          {/* Embassy Section */}
          {isEmbassyRequired && embassyInfo && (
            <section className="max-w-5xl mx-auto px-4 pb-8">
              <SectionTitle icon={<Building className="w-5 h-5" />} title="Embassy & Visa Application" />
              {embassyInfo.note && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">{embassyInfo.note}</p>
                </div>
              )}
              <div className="border rounded-lg divide-y">
                <div className="px-4 py-3 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm">{embassyInfo.address}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm">{embassyInfo.phone}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{embassyInfo.email}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Hours</p>
                    <p className="text-sm">{embassyInfo.hours}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-start gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a href={embassyInfo.website} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                      {embassyInfo.website.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <a
                href={embassyInfo.appointmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Book Appointment <ExternalLink className="w-4 h-4" />
              </a>
            </section>
          )}

          {/* SafetyWing Travel Insurance Banner */}
          <section className="max-w-5xl mx-auto px-4 pb-8">
            <a
              href="https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador"
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-5 bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">🛡️</div>
                <div className="flex-1">
                  <p className="font-bold text-base">Travel Insurance for {country.name}</p>
                  <p className="text-sm text-muted-foreground">Get comprehensive nomad insurance from SafetyWing — coverage from $42/month worldwide.</p>
                </div>
                <span className="text-emerald-600 font-semibold text-sm shrink-0">Get Covered →</span>
              </div>
            </a>
          </section>

          {/* Safety Overview */}
          {country.safetyRating > 0 && (
            <section className="max-w-5xl mx-auto px-4 pb-8">
              <SectionTitle icon={<Shield className="w-5 h-5" />} title="Safety Overview" />
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{safetyStars(country.safetyRating)}</span>
                  <span className="text-lg font-semibold">{Math.min(country.safetyRating, 5)}/5</span>
                </div>
                {country.safetySummary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{country.safetySummary}</p>
                )}
              </div>
            </section>
          )}

          {/* Temperature & Climate */}
          {Object.keys(monthlyTemps).length > 0 && (
            <section className="max-w-5xl mx-auto px-4 pb-8">
              <SectionTitle icon={<Thermometer className="w-5 h-5" />} title="Climate & Temperature" />
              <p className="text-sm text-muted-foreground mb-3">Average temperature: <strong>{country.avgTempC}\u00B0C</strong></p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                {MONTH_NAMES.map((m, i) => {
                  const temp = monthlyTemps[m] ?? monthlyTemps[String(i + 1)];
                  return (
                    <div key={m} className={`text-center rounded-lg p-2 border ${bestMonths.some((bm: string) => bm.toLowerCase().startsWith(m.toLowerCase())) ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-card'}`}>
                      <p className="text-[10px] text-muted-foreground font-medium">{m}</p>
                      <p className="text-sm font-semibold">{temp !== undefined ? `${temp}\u00B0` : '--'}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          <section className="max-w-5xl mx-auto px-4 pb-8">
            <SectionTitle icon={<HelpIcon className="w-5 h-5" />} title="Frequently Asked Questions" />
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details key={i} className="border rounded-lg group">
                  <summary className="px-4 py-3 cursor-pointer text-sm font-medium hover:bg-muted/50 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed border-t">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="max-w-5xl mx-auto px-4 pb-12">
            <div className="bg-emerald-600 dark:bg-emerald-700 rounded-xl p-6 sm:p-8 text-center text-white">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready to Apply?</h2>
              <p className="text-emerald-100 mb-6 text-sm sm:text-base max-w-lg mx-auto">
                {country.etaAvailable
                  ? `Apply for your ${country.name} e-Visa online in minutes. No embassy visit required.`
                  : country.visaOnArrival
                    ? `Get your visa on arrival at the ${country.name} airport. Just bring your documents.`
                    : country.visaFree
                      ? `No visa needed! Just pack your bags and travel to ${country.name}.`
                      : `Start your ${country.name} visa application today. Check requirements and book an appointment.`}
              </p>
              <div className="flex flex-col items-center gap-3 w-full">
                {country.etaAvailable && (
                  <a
                    href={`/api/go?p=ivisa&c=${encodeURIComponent(country.name)}&page=${encodeURIComponent(`/${slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    Apply for e-Visa <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {!country.visaFree && (
                  <a
                    href={`/api/go?p=ivisa&c=${encodeURIComponent(country.name)}&page=${encodeURIComponent(`/${slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors border border-emerald-400"
                  >
                    Check on iVisa <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Check on PakVisa Advisor <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 w-full">
                <a
                  href="https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  🛡️ Travel Insurance
                </a>
                <a
                  href={`/api/go?p=booking&c=${encodeURIComponent(country.name)}&page=${encodeURIComponent(`/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  🏨 Book Hotels
                </a>
                <a
                  href={`/api/go?p=skyscanner&c=${encodeURIComponent(country.name)}&page=${encodeURIComponent(`/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  ✈️ Search Flights
                </a>
              </div>
            </div>
          </section>

          {/* Explore More Destinations */}
          {relatedCountries.length > 0 && (
            <section className="max-w-5xl mx-auto px-4 pb-12">
              <SectionTitle icon={<Globe className="w-5 h-5" />} title="Explore More Destinations" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {relatedCountries.map((rc) => {
                  const rcSlug = CODE_TO_SLUG[rc.code];
                  const rcFlag = getFlagUrl(rc.code, 80);
                  return (
                    <Link
                      key={rc.code}
                      href={rcSlug ? `/${rcSlug}` : '/'}
                      className="flex flex-col items-center gap-2 border rounded-lg p-3 bg-card hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-center group"
                    >
                      {rcFlag ? (
                        <img src={rcFlag} alt={`${rc.name} flag`} className="w-10 h-auto rounded" width={80} height={53} />
                      ) : (
                        <span className="text-2xl">{rc.flagEmoji}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate group-hover:text-emerald-600 transition-colors">{rc.name}</p>
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 ${getVisaBadgeClass(rc)}`}>
                          {getVisaLabel(rc)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t bg-muted/30 mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-2">PakVisa Advisor</p>
                <p className="text-muted-foreground text-xs">AI-powered visa intelligence for Pakistani passport holders. Check requirements, fees, and processing times for 70+ countries.</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Quick Links</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
                  <li><Link href="/" className="hover:text-foreground transition-colors">All Countries</Link></li>
                  <li><Link href="/" className="hover:text-foreground transition-colors">AI Visa Consultant</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Legal</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li><Link href="/" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                  <li><Link href="/" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t mt-4 pt-4 text-center text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} PakVisa Advisor. All rights reserved. Visa information is for guidance only. Always verify with official sources.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// ============================================================
// Sub-components (inline, no 'use client' needed)
// ============================================================

function InfoCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext?: string }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-bold text-lg">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
}

function CostCell({ label, usd, highlight }: { label: string; usd: number; highlight?: boolean }) {
  return (
    <div className={`px-4 py-3 text-center ${highlight ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`font-semibold text-sm ${highlight ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>${usd}</p>
      <p className="text-[10px] text-muted-foreground">≈ PKR {usdToPkr(usd)}</p>
    </div>
  );
}

function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}

function HelpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
    </svg>
  );
}

function ArrowLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

// ============================================================
// FAQ Generator
// ============================================================

function generateFAQs(
  country: {
    name: string; code: string; visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean;
    processingDaysMin: number; processingDaysMax: number; safetyRating: number; safetySummary: string;
    bestTravelMonths: string; avgTempC: string; currency: string; currencyCode: string;
  },
  costProfile: CostProfileData | undefined,
  visaLabel: string,
  isEmbassyRequired: boolean,
): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];

  // Q1: Do Pakistani citizens need a visa?
  faqs.push({
    q: `Do Pakistani citizens need a visa for ${country.name}?`,
    a: country.visaFree
      ? `No, Pakistani citizens do not need a visa to visit ${country.name}. You can travel visa-free with a valid Pakistani passport. Make sure your passport has at least 6 months of validity remaining.`
      : country.visaOnArrival
        ? `Pakistani citizens can get a visa on arrival at ${country.name}. Simply present your valid Pakistani passport at the immigration counter upon arrival. Processing is usually instant.`
        : country.etaAvailable
          ? `Yes, Pakistani citizens need an e-Visa to visit ${country.name}. The e-Visa can be applied for online through the official government portal. Processing typically takes ${country.processingDaysMin}-${country.processingDaysMax} business days.`
          : `Yes, Pakistani citizens need a visa to visit ${country.name}. You must apply at the embassy or consulate. The application process typically takes ${country.processingDaysMin}-${country.processingDaysMax} business days.`,
  });

  // Q2: What is the visa fee?
  const feeText = costProfile && costProfile.visaFeeUSD > 0
    ? `The visa fee for ${country.name} is approximately $${costProfile.visaFeeUSD} USD (≈ PKR ${usdToPkr(costProfile.visaFeeUSD)}). Additional service fees of $${costProfile.serviceFeeUSD} may apply.`
    : `There is no visa fee for Pakistani citizens visiting ${country.name} as it is ${visaLabel.toLowerCase()}.`
  ;
  faqs.push({
    q: `What is the visa fee for ${country.name} for Pakistani citizens?`,
    a: feeText,
  });

  // Q3: Processing time
  faqs.push({
    q: `How long does it take to get a ${country.name} visa?`,
    a: country.visaFree
      ? `No processing time is needed as ${country.name} offers visa-free entry to Pakistani passport holders. You can travel immediately.`
      : country.visaOnArrival
        ? `The visa on arrival for ${country.name} is processed instantly at the airport or border crossing. The entire process typically takes 5-15 minutes.`
        : `${country.name} visa processing typically takes ${country.processingDaysMin}-${country.processingDaysMax} business days for Pakistani citizens. It is recommended to apply at least 2-3 weeks before your planned travel date.`,
  });

  // Q4: Safety
  faqs.push({
    q: `Is ${country.name} safe for Pakistani tourists?`,
    a: country.safetySummary
      ? `${country.name} has a safety rating of ${Math.min(country.safetyRating, 5)}/5. ${country.safetySummary}`
      : `${country.name} has a safety rating of ${Math.min(country.safetyRating, 5)}/5. As with any travel destination, exercise standard precautions, keep your belongings secure, and follow local laws and customs.`,
  });

  // Q5: Best time to visit or documents required
  if (country.bestTravelMonths) {
    faqs.push({
      q: `What is the best time to visit ${country.name} from Pakistan?`,
      a: `The best months to visit ${country.name} are ${country.bestTravelMonths}. The average temperature is around ${country.avgTempC}\u00B0C. The local currency is ${country.currency} (${country.currencyCode}). Plan your trip during these months for the most comfortable weather conditions.`,
    });
  } else {
    faqs.push({
      q: `What documents do I need for a ${country.name} visa?`,
      a: `Common requirements for a ${country.name} visa include: a valid Pakistani passport with 6+ months validity, passport-sized photographs, proof of accommodation, return flight ticket, travel insurance, and proof of sufficient funds. For the complete and most up-to-date list, check the official embassy website or use PakVisa Advisor.`,
    });
  }

  return faqs;
}
