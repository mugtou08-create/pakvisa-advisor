'use client';

import type { CountryData } from '@/lib/types';
import {
  CheckCircle2, Plane, FileText, Building, Wallet, Timer, Shield, Bookmark,
  Lightbulb, Send, Clock,
} from 'lucide-react';

// ISO 2-letter code mapping for flag CDN URLs
export const FLAG_ISO_MAP: Record<string, string> = {
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

/** Returns the flagcdn.com URL for a given country code (e.g. "UAE" → "ae") */
export function getFlagUrl(code: string, width = 80): string {
  const iso = FLAG_ISO_MAP[code];
  return iso ? `https://flagcdn.com/w${width}/${iso.toLowerCase()}.png` : '';
}

export const REGIONS = ['Asia', 'Middle East', 'Africa', 'Europe', 'Americas', 'Oceania'];
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const SCORING_HISTORY_KEY = 'pakvisa-scoring-history';
export const RECENT_SEARCHES_KEY = 'pakvisa-recent-searches';
export const TYPING_PHRASES = [
  'Check visa for UAE  •',
  'e-Visa for Turkey  •',
  'Visa-free Malaysia  •',
  'Schengen visa requirements  •',
  'Visa on Arrival Thailand  •',
  'Pakistani Passport Visa Guide 2026  •',
  'AI-Powered Visa Intelligence  •',
];

// ============ REGION HELPER ============
export function getRegion(country: CountryData): string {
  const middleEasternCountries = [
    'Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Bahrain', 'Kuwait',
    'Jordan', 'Iraq', 'Lebanon', 'Iran', 'Egypt', 'Azerbaijan',
  ];
  if (middleEasternCountries.includes(country.name)) return 'Middle East';
  if (country.continent === 'Africa') return 'Africa';
  if (country.continent === 'Europe' || country.continent === 'Europe/Asia') return 'Europe';
  if (country.continent === 'North America' || country.continent === 'South America') return 'Americas';
  if (country.continent === 'Asia') return 'Asia';
  if (country.continent === 'Oceania') return 'Oceania';
  return 'All';
}

export const QUICK_FILTERS = [
  { id: 'visa-free', label: 'Visa Free', icon: CheckCircle2 },
  { id: 'visa-on-arrival', label: 'Visa on Arrival', icon: Plane },
  { id: 'e-visa', label: 'e-Visa', icon: FileText },
  { id: 'embassy', label: 'Embassy Required', icon: Building },
  { id: 'cheapest', label: 'Budget-Friendly', icon: Wallet },
  { id: 'fastest', label: 'Fast Processing', icon: Timer },
  { id: 'safest', label: 'Safest', icon: Shield },
  { id: 'favorites', label: 'Favorites', icon: Bookmark },
];

// ============ EXCHANGE RATES (Approximate) ============
export const EXCHANGE_RATES: Record<string, number> = {
  AED: 75.8, SAR: 74.2, QAR: 76.1, OMR: 727.3, BHD: 745.6,
  TRY: 8.1, USD: 278.5, GBP: 351.2, EUR: 302.8, AUD: 182.3,
  CAD: 201.5, CNY: 38.4, JPY: 1.87, KRW: 0.21, MYR: 62.5,
  THB: 7.9, SGD: 206.8, IDR: 0.017, LKR: 0.95, BDT: 2.38,
  AFN: 3.9, AMD: 0.72, DZD: 2.08, BRL: 56.8, MGA: 0.061,
  EG: 5.7, GEL: 104.2, KZT: 0.61, KWD: 904.2, JOD: 393.2,
  KE: 1.79, LB: 0.0003, MA: 28.1, NP: 2.09, TN: 90.1,
  ZAR: 15.2, IQD: 0.19, IRR: 0.0004, MXN: 16.4,
};

// ============ EMBASSY DATA (Verified Official Sources - 2025) ============
// Keys match the database `code` field for countries requiring embassy visas (visaFree=false, visaOnArrival=false, etaAvailable=false)
export const EMBASSY_DATA: Record<string, { address: string; phone: string; email: string; website: string; hours: string; appointmentUrl: string; note?: string }> = {
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
  Mongolia: { address: 'No embassy in Pakistan. Nearest: Embassy in New Delhi, India', phone: '+91-11-2688-5370', email: 'mongolia@mongolianembassy.in', website: 'https://www.mfa.mn/en/missions-abroad', hours: 'Mon-Fri 09:00-17:00', appointmentUrl: 'https://www.mfa.mn/en/missions-abroad', note: 'No Mongolian embassy in Pakistan. Apply through the Embassy of Mongolia in New Delhi, India or contact Honorary Consulate in Karachi.' },
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
export const GENERIC_EMBASSY = { address: 'Diplomatic Enclave, Islamabad — visit the official embassy website for exact address', phone: '+92-51-920-0000 (MOFA Pakistan switchboard)', email: 'info@mofa.gov.pk', website: 'https://www.mofa.gov.pk', hours: 'Varies by embassy — typically Mon-Fri 09:00-17:00', appointmentUrl: 'https://www.mofa.gov.pk' };

// ============ APPLICATION TIMELINE STAGES ============
export const TIMELINE_STAGES = [
  { id: 'preparation', title: 'Preparation', icon: Lightbulb, items: ['Research visa requirements', 'Check passport validity (6+ months)', 'Determine visa type needed', 'Review processing timeline'] },
  { id: 'documents', title: 'Document Collection', icon: FileText, items: ['Valid passport with blank pages', 'Passport-sized photographs', 'Bank statements (6 months)', 'Employment/education verification', 'Travel itinerary', 'Accommodation proof'] },
  { id: 'submission', title: 'Application Submission', icon: Send, items: ['Complete visa application form', 'Pay visa application fee', 'Schedule embassy appointment', 'Attend biometrics session', 'Submit all documents'] },
  { id: 'processing', title: 'Processing', icon: Clock, items: ['Application under review', 'Background check in progress', 'Verification of documents', 'Possible interview request', 'Track application status'] },
  { id: 'decision', title: 'Decision', icon: CheckCircle2, items: ['Receive visa decision', 'Collect visa/stamp', 'Plan travel arrangements', 'Book flights and accommodation', 'Prepare for departure'] },
];

// ============ VISA CATEGORY COLORS ============
export const VISA_CATEGORY_COLORS = {
  visaFree: { fill: '#f59e0b', label: 'Visa Free', className: 'bg-amber-500' },
  visaOnArrival: { fill: '#f97316', label: 'Visa on Arrival', className: 'bg-orange-500' },
  eVisa: { fill: '#fb923c', label: 'e-Visa', className: 'bg-orange-400' },
  embassy: { fill: '#ef4444', label: 'Embassy Required', className: 'bg-red-500' },
  unknown: { fill: '#9ca3af', label: 'No Data', className: 'bg-gray-400' },
} as const;

// ============ COUNTRY NAME ALIASES (map SVG names -> DB names) ============
export const COUNTRY_NAME_ALIASES: Record<string, string[]> = {
  'Hong Kong': ['Hong Kong', 'HongKong'],
  'South Korea': ['South Korea', 'SouthKorea'],
  'Sri Lanka': ['Sri Lanka', 'SriLanka'],
  'Saudi Arabia': ['Saudi Arabia', 'SaudiArabia'],
  'South Africa': ['South Africa', 'SouthAfrica'],
  'New Zealand': ['New Zealand', 'NewZealand'],
  'United States': ['USA'],
  'United Kingdom': ['UK'],
  'Czech Republic': ['Czech Republic', 'CzechRepublic'],
  'Ivory Coast': ['Ivory Coast', 'IvoryCoast'],
  'Bosnia and Herzegovina': ['Bosnia and Herzegovina', 'BosniaandHerzegovina'],
  'Dominican Republic': ['Dominican Republic', 'DominicanRepublic'],
  'Papua New Guinea': ['Papua New Guinea', 'PapuaNewGuinea'],
  'Trinidad and Tobago': ['Trinidad and Tobago', 'TrinidadandTobago'],
  'Solomon Islands': ['Solomon Islands', 'SolomonIslands'],
  'Democratic Republic of Congo': ['Democratic Republic of Congo'],
  'French Southern Territories': ['French Southern Territories'],
  'Timor-Leste': ['Timor-Leste', 'TimorLeste'],
  'Western Sahara': ['Western Sahara', 'WesternSahara'],
};

// ============ SUCCESS STORIES ============
export const SUCCESS_STORIES = [
  { id: 1, name: 'Ahmed K.', avatar: '🇵🇰', destination: 'Malaysia', flag: '🇲🇾', visaType: 'Visa Free', story: 'Visited Malaysia for a 2-week holiday. No visa needed! Just showed my Pakistani passport at immigration. The process was incredibly smooth.', date: 'March 2026', rating: 5, difficulty: 'Easy' },
  { id: 2, name: 'Fatima S.', avatar: '🇵🇰', destination: 'Turkey', flag: '🇹🇷', visaType: 'e-Visa', story: 'Got my Turkish e-Visa in 24 hours! Applied online, paid the fee, received approval via email. Highly recommend for tourism.', date: 'June 2026', rating: 4, difficulty: 'Easy' },
  { id: 3, name: 'Omar R.', avatar: '🇵🇰', destination: 'UAE', flag: '🇦🇪', visaType: 'On Arrival', story: 'Visa on arrival at Dubai airport was instant. The process took about 5 minutes at the immigration counter. Make sure your passport has 6 months validity.', date: 'July 2026', rating: 5, difficulty: 'Easy' },
  { id: 5, name: 'Hassan A.', avatar: '🇵🇰', destination: 'Saudi Arabia', flag: '🇸🇦', visaType: 'e-Visa', story: 'Applied for Saudi e-Visa for Umrah. The online system was straightforward. Got approved in 3 days. Make sure to upload a clear passport photo.', date: 'August 2026', rating: 4, difficulty: 'Medium' },
];

// ============ KEYBOARD SHORTCUTS ============
export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', '1'], action: 'Explore Tab', category: 'Navigation' },
  { keys: ['Ctrl', '2'], action: 'Questionnaire Tab', category: 'Navigation' },
  { keys: ['Ctrl', '3'], action: 'Compare Tab', category: 'Navigation' },
  { keys: ['Ctrl', '4'], action: 'AI Consultant Tab', category: 'Navigation' },
  { keys: ['Ctrl', '5'], action: 'Reports Tab', category: 'Navigation' },
  { keys: ['Ctrl', 'K'], action: 'Focus Search', category: 'Search' },
  { keys: ['Ctrl', 'B'], action: 'Toggle Grid/List', category: 'Actions' },
  { keys: ['Ctrl', 'F'], action: 'Toggle Favorites', category: 'Actions' },
  { keys: ['Ctrl', 'D'], action: 'Quick Score All', category: 'Actions' },
  { keys: ['Ctrl', '/'], action: 'Toggle Shortcuts', category: 'Actions' },
  { keys: ['Esc'], action: 'Close Dialog', category: 'Navigation' },
];
