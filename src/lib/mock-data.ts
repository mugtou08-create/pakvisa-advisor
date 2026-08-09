import type { CountryData } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface RawCountry {
  name: string;
  code: string;
  flag: string;
  continent: string;
  visaFree: boolean;
  voa: boolean;
  eVisa: boolean;
  currency: string;
  cc: string;
  tz: string;
  safety: number;
  temp: string;
  months: string;
  processingMin: number;
  processingMax: number;
  fee: number;
  living: number;
  rent: number;
  food: number;
  transport: number;
  insurance: number;
  service: number;
}

const rawCountries: RawCountry[] = [
  { name: "Turkey", code: "TR", flag: "🇹🇷", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Turkish Lira", cc: "TRY", tz: "Europe/Istanbul", safety: 7, temp: "15", months: "Apr, May, Sep, Oct", processingMin: 0, processingMax: 0, fee: 0, living: 600, rent: 300, food: 150, transport: 50, insurance: 40, service: 0 },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "UAE Dirham", cc: "AED", tz: "Asia/Dubai", safety: 9, temp: "33", months: "Nov, Dec, Jan, Feb", processingMin: 0, processingMax: 0, fee: 0, living: 1200, rent: 700, food: 250, transport: 100, insurance: 60, service: 0 },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Ringgit", cc: "MYR", tz: "Asia/Kuala_Lumpur", safety: 7, temp: "28", months: "Mar, Apr, May, Jun", processingMin: 0, processingMax: 0, fee: 0, living: 500, rent: 250, food: 120, transport: 40, insurance: 30, service: 0 },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Saudi Riyal", cc: "SAR", tz: "Asia/Riyadh", safety: 8, temp: "30", months: "Nov, Dec, Jan, Feb", processingMin: 0, processingMax: 0, fee: 0, living: 800, rent: 400, food: 200, transport: 60, insurance: 50, service: 0 },
  { name: "Qatar", code: "QA", flag: "🇶🇦", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Qatari Riyal", cc: "QAR", tz: "Asia/Qatar", safety: 9, temp: "32", months: "Nov, Dec, Jan, Feb", processingMin: 0, processingMax: 0, fee: 0, living: 1000, rent: 600, food: 200, transport: 80, insurance: 55, service: 0 },
  { name: "Oman", code: "OM", flag: "🇴🇲", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Omani Rial", cc: "OMR", tz: "Asia/Muscat", safety: 8, temp: "29", months: "Oct, Nov, Mar, Apr", processingMin: 0, processingMax: 0, fee: 0, living: 700, rent: 350, food: 180, transport: 50, insurance: 40, service: 0 },
  { name: "Jordan", code: "JO", flag: "🇯🇴", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Jordanian Dinar", cc: "JOD", tz: "Asia/Amman", safety: 7, temp: "20", months: "Mar, Apr, May, Oct", processingMin: 0, processingMax: 0, fee: 0, living: 500, rent: 250, food: 120, transport: 40, insurance: 30, service: 0 },
  { name: "Thailand", code: "TH", flag: "🇹🇭", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Thai Baht", cc: "THB", tz: "Asia/Bangkok", safety: 6, temp: "29", months: "Nov, Dec, Jan, Feb", processingMin: 0, processingMax: 0, fee: 30, living: 450, rent: 200, food: 100, transport: 30, insurance: 25, service: 0 },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Sri Lankan Rupee", cc: "LKR", tz: "Asia/Colombo", safety: 6, temp: "27", months: "Dec, Jan, Feb, Mar", processingMin: 0, processingMax: 0, fee: 50, living: 350, rent: 150, food: 80, transport: 25, insurance: 20, service: 0 },
  { name: "Nepal", code: "NP", flag: "🇳🇵", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Nepalese Rupee", cc: "NPR", tz: "Asia/Kathmandu", safety: 5, temp: "20", months: "Oct, Nov, Mar, Apr", processingMin: 0, processingMax: 0, fee: 0, living: 300, rent: 120, food: 70, transport: 15, insurance: 15, service: 0 },
  { name: "Indonesia", code: "ID", flag: "🇮🇩", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Indonesian Rupiah", cc: "IDR", tz: "Asia/Jakarta", safety: 6, temp: "28", months: "Apr, May, Jun, Sep", processingMin: 0, processingMax: 0, fee: 0, living: 400, rent: 180, food: 100, transport: 30, insurance: 20, service: 0 },
  { name: "Maldives", code: "MV", flag: "🇲🇻", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Maldivian Rufiyaa", cc: "MVR", tz: "Asia/Male", safety: 8, temp: "29", months: "Nov, Dec, Jan, Apr", processingMin: 0, processingMax: 0, fee: 0, living: 1500, rent: 800, food: 400, transport: 100, insurance: 50, service: 0 },
  { name: "Kenya", code: "KE", flag: "🇰🇪", continent: "Africa", visaFree: false, voa: true, eVisa: false, currency: "Kenyan Shilling", cc: "KES", tz: "Africa/Nairobi", safety: 5, temp: "25", months: "Jan, Feb, Jun, Jul", processingMin: 0, processingMax: 0, fee: 50, living: 400, rent: 200, food: 100, transport: 30, insurance: 25, service: 0 },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿", continent: "Africa", visaFree: false, voa: true, eVisa: false, currency: "Tanzanian Shilling", cc: "TZS", tz: "Africa/Dar_es_Salaam", safety: 5, temp: "26", months: "Jun, Jul, Aug, Sep", processingMin: 0, processingMax: 0, fee: 50, living: 350, rent: 150, food: 80, transport: 25, insurance: 20, service: 0 },
  { name: "Rwanda", code: "RW", flag: "🇷🇼", continent: "Africa", visaFree: true, voa: false, eVisa: false, currency: "Rwandan Franc", cc: "RWF", tz: "Africa/Kigali", safety: 8, temp: "21", months: "Jun, Jul, Aug, Sep", processingMin: 0, processingMax: 0, fee: 0, living: 400, rent: 180, food: 100, transport: 30, insurance: 25, service: 0 },
  { name: "Azerbaijan", code: "AZ", flag: "🇦🇿", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Azerbaijani Manat", cc: "AZN", tz: "Asia/Baku", safety: 7, temp: "15", months: "Apr, May, Sep, Oct", processingMin: 0, processingMax: 0, fee: 30, living: 400, rent: 200, food: 100, transport: 25, insurance: 20, service: 0 },
  { name: "Georgia", code: "GE", flag: "🇬🇪", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Georgian Lari", cc: "GEL", tz: "Asia/Tbilisi", safety: 7, temp: "13", months: "May, Jun, Sep, Oct", processingMin: 0, processingMax: 0, fee: 0, living: 350, rent: 150, food: 80, transport: 20, insurance: 15, service: 0 },
  { name: "Armenia", code: "AM", flag: "🇦🇲", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Armenian Dram", cc: "AMD", tz: "Asia/Yerevan", safety: 7, temp: "12", months: "May, Jun, Sep, Oct", processingMin: 0, processingMax: 0, fee: 0, living: 300, rent: 130, food: 70, transport: 15, insurance: 15, service: 0 },
  { name: "Egypt", code: "EG", flag: "🇪🇬", continent: "Africa", visaFree: false, voa: true, eVisa: false, currency: "Egyptian Pound", cc: "EGP", tz: "Africa/Cairo", safety: 5, temp: "26", months: "Oct, Nov, Mar, Apr", processingMin: 0, processingMax: 0, fee: 25, living: 350, rent: 150, food: 80, transport: 20, insurance: 15, service: 0 },
  { name: "Morocco", code: "MA", flag: "🇲🇦", continent: "Africa", visaFree: false, voa: false, eVisa: true, currency: "Moroccan Dirham", cc: "MAD", tz: "Africa/Casablanca", safety: 6, temp: "20", months: "Mar, Apr, May, Oct", processingMin: 3, processingMax: 7, fee: 80, living: 350, rent: 150, food: 80, transport: 20, insurance: 15, service: 30 },
  { name: "Tunisia", code: "TN", flag: "🇹🇳", continent: "Africa", visaFree: false, voa: false, eVisa: true, currency: "Tunisian Dinar", cc: "TND", tz: "Africa/Tunis", safety: 6, temp: "19", months: "Apr, May, Sep, Oct", processingMin: 5, processingMax: 10, fee: 70, living: 300, rent: 130, food: 70, transport: 20, insurance: 15, service: 25 },
  { name: "Senegal", code: "SN", flag: "🇸🇳", continent: "Africa", visaFree: false, voa: true, eVisa: false, currency: "CFA Franc", cc: "XOF", tz: "Africa/Dakar", safety: 5, temp: "27", months: "Nov, Dec, Jan, Feb", processingMin: 0, processingMax: 0, fee: 50, living: 350, rent: 150, food: 80, transport: 20, insurance: 15, service: 0 },
  { name: "Ghana", code: "GH", flag: "🇬🇭", continent: "Africa", visaFree: false, voa: true, eVisa: false, currency: "Ghanaian Cedi", cc: "GHS", tz: "Africa/Accra", safety: 5, temp: "27", months: "Jun, Jul, Aug, Sep", processingMin: 0, processingMax: 0, fee: 50, living: 350, rent: 150, food: 80, transport: 20, insurance: 15, service: 0 },
  { name: "Uganda", code: "UG", flag: "🇺🇬", continent: "Africa", visaFree: false, voa: true, eVisa: false, currency: "Ugandan Shilling", cc: "UGX", tz: "Africa/Kampala", safety: 5, temp: "24", months: "Jun, Jul, Dec, Jan", processingMin: 0, processingMax: 0, fee: 50, living: 300, rent: 130, food: 70, transport: 20, insurance: 15, service: 0 },
  { name: "Cambodia", code: "KH", flag: "🇰🇭", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Cambodian Riel", cc: "KHR", tz: "Asia/Phnom_Penh", safety: 5, temp: "29", months: "Nov, Dec, Jan, Feb", processingMin: 0, processingMax: 0, fee: 30, living: 400, rent: 180, food: 100, transport: 30, insurance: 20, service: 0 },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", continent: "Asia", visaFree: false, voa: false, eVisa: true, currency: "Vietnamese Dong", cc: "VND", tz: "Asia/Ho_Chi_Minh", safety: 6, temp: "27", months: "Feb, Mar, Apr, Nov", processingMin: 3, processingMax: 5, fee: 50, living: 350, rent: 150, food: 80, transport: 20, insurance: 15, service: 25 },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Taka", cc: "BDT", tz: "Asia/Dhaka", safety: 5, temp: "27", months: "Oct, Nov, Dec, Jan", processingMin: 0, processingMax: 0, fee: 0, living: 250, rent: 100, food: 60, transport: 15, insurance: 10, service: 0 },
  { name: "Iran", code: "IR", flag: "🇮🇷", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Iranian Rial", cc: "IRR", tz: "Asia/Tehran", safety: 6, temp: "18", months: "Apr, May, Sep, Oct", processingMin: 0, processingMax: 0, fee: 0, living: 300, rent: 120, food: 70, transport: 15, insurance: 15, service: 0 },
  { name: "Iraq", code: "IQ", flag: "🇮🇶", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Iraqi Dinar", cc: "IQD", tz: "Asia/Baghdad", safety: 3, temp: "28", months: "Mar, Apr, Nov, Dec", processingMin: 0, processingMax: 0, fee: 40, living: 350, rent: 150, food: 80, transport: 20, insurance: 20, service: 0 },
  { name: "Uzbekistan", code: "UZ", flag: "🇺🇿", continent: "Asia", visaFree: false, voa: true, eVisa: false, currency: "Uzbekistani Som", cc: "UZS", tz: "Asia/Tashkent", safety: 7, temp: "16", months: "Apr, May, Sep, Oct", processingMin: 0, processingMax: 0, fee: 20, living: 300, rent: 130, food: 70, transport: 15, insurance: 15, service: 0 },
  { name: "Kyrgyzstan", code: "KG", flag: "🇰🇬", continent: "Asia", visaFree: true, voa: false, eVisa: false, currency: "Som", cc: "KGS", tz: "Asia/Bishkek", safety: 6, temp: "12", months: "Jun, Jul, Aug, Sep", processingMin: 0, processingMax: 0, fee: 0, living: 250, rent: 100, food: 60, transport: 10, insurance: 10, service: 0 },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹", continent: "Africa", visaFree: false, voa: true, eVisa: false, currency: "Ethiopian Birr", cc: "ETB", tz: "Africa/Addis_Ababa", safety: 5, temp: "22", months: "Oct, Nov, Dec, Jan", processingMin: 0, processingMax: 0, fee: 50, living: 300, rent: 120, food: 70, transport: 20, insurance: 15, service: 0 },
  { name: "Dominica", code: "DM", flag: "🇩🇲", continent: "Americas", visaFree: true, voa: false, eVisa: false, currency: "East Caribbean Dollar", cc: "XCD", tz: "America/Dominica", safety: 6, temp: "27", months: "Dec, Jan, Feb, Mar", processingMin: 0, processingMax: 0, fee: 0, living: 600, rent: 300, food: 150, transport: 40, insurance: 30, service: 0 },
  { name: "Haiti", code: "HT", flag: "🇭🇹", continent: "Americas", visaFree: true, voa: false, eVisa: false, currency: "Gourde", cc: "HTG", tz: "America/Port-au-Prince", safety: 3, temp: "27", months: "Nov, Dec, Jan, Feb", processingMin: 0, processingMax: 0, fee: 0, living: 400, rent: 180, food: 100, transport: 30, insurance: 20, service: 0 },
  { name: "Trinidad & Tobago", code: "TT", flag: "🇹🇹", continent: "Americas", visaFree: false, voa: false, eVisa: true, currency: "TT Dollar", cc: "TTD", tz: "America/Port_of_Spain", safety: 6, temp: "28", months: "Jan, Feb, Mar, Apr", processingMin: 5, processingMax: 10, fee: 100, living: 700, rent: 350, food: 180, transport: 50, insurance: 35, service: 40 },
  { name: "Vanuatu", code: "VU", flag: "🇻🇺", continent: "Oceania", visaFree: true, voa: false, eVisa: false, currency: "Vanuatu Vatu", cc: "VUV", tz: "Pacific/Efate", safety: 6, temp: "26", months: "May, Jun, Jul, Aug", processingMin: 0, processingMax: 0, fee: 0, living: 600, rent: 300, food: 150, transport: 40, insurance: 30, service: 0 },
  { name: "Micronesia", code: "FM", flag: "🇫🇲", continent: "Oceania", visaFree: true, voa: false, eVisa: false, currency: "US Dollar", cc: "USD", tz: "Pacific/Pohnpei", safety: 7, temp: "28", months: "Jan, Feb, Mar, Apr", processingMin: 0, processingMax: 0, fee: 0, living: 500, rent: 250, food: 120, transport: 30, insurance: 25, service: 0 },
  { name: "Germany", code: "DE", flag: "🇩🇪", continent: "Europe", visaFree: false, voa: false, eVisa: false, currency: "Euro", cc: "EUR", tz: "Europe/Berlin", safety: 9, temp: "10", months: "May, Jun, Sep, Oct", processingMin: 15, processingMax: 30, fee: 80, living: 1200, rent: 700, food: 300, transport: 100, insurance: 60, service: 30 },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", continent: "Europe", visaFree: false, voa: false, eVisa: false, currency: "Pound Sterling", cc: "GBP", tz: "Europe/London", safety: 8, temp: "12", months: "May, Jun, Jul, Aug", processingMin: 15, processingMax: 30, fee: 150, living: 1500, rent: 900, food: 350, transport: 120, insurance: 70, service: 40 },
  { name: "Canada", code: "CA", flag: "🇨🇦", continent: "Americas", visaFree: false, voa: false, eVisa: false, currency: "Canadian Dollar", cc: "CAD", tz: "America/Toronto", safety: 9, temp: "8", months: "Jun, Jul, Aug, Sep", processingMin: 20, processingMax: 45, fee: 100, living: 1300, rent: 800, food: 300, transport: 100, insurance: 60, service: 35 },
  { name: "Australia", code: "AU", flag: "🇦🇺", continent: "Oceania", visaFree: false, voa: false, eVisa: true, currency: "Australian Dollar", cc: "AUD", tz: "Australia/Sydney", safety: 9, temp: "18", months: "Sep, Oct, Mar, Apr", processingMin: 15, processingMax: 30, fee: 150, living: 1400, rent: 800, food: 350, transport: 100, insurance: 60, service: 40 },
  { name: "Japan", code: "JP", flag: "🇯🇵", continent: "Asia", visaFree: false, voa: false, eVisa: false, currency: "Yen", cc: "JPY", tz: "Asia/Tokyo", safety: 9, temp: "15", months: "Mar, Apr, Oct, Nov", processingMin: 5, processingMax: 15, fee: 30, living: 1200, rent: 600, food: 300, transport: 80, insurance: 50, service: 20 },
  { name: "South Korea", code: "KR", flag: "🇰🇷", continent: "Asia", visaFree: false, voa: false, eVisa: false, currency: "Won", cc: "KRW", tz: "Asia/Seoul", safety: 9, temp: "13", months: "Apr, May, Sep, Oct", processingMin: 5, processingMax: 15, fee: 40, living: 900, rent: 500, food: 250, transport: 60, insurance: 40, service: 20 },
];

const safetySummaries: Record<string, string> = {
  Turkey: "Generally safe for tourists. Exercise caution in border areas.",
  "United Arab Emirates": "Very safe. Low crime rates, strict law enforcement.",
  Malaysia: "Generally safe. Some petty crime in tourist areas.",
  "Saudi Arabia": "Very safe. Strict laws and cultural norms apply.",
  Qatar: "Very safe. Low crime rates with modern infrastructure.",
  Oman: "Very safe. Friendly locals and low crime rates.",
  Jordan: "Generally safe. Some areas near borders require caution.",
  Thailand: "Generally safe for tourists. Beware of scams.",
  "Sri Lanka": "Generally safe. Some political instability possible.",
  Nepal: "Moderate safety. Natural disaster risks exist.",
  Indonesia: "Generally safe. Some areas have higher risks.",
  Maldives: "Very safe for tourists. Resort areas are highly secure.",
  Kenya: "Moderate safety. Some regions have security concerns.",
  Tanzania: "Moderate safety. Wildlife areas require precautions.",
  Rwanda: "Very safe. One of the safest countries in Africa.",
  Azerbaijan: "Generally safe. Low crime rates.",
  Georgia: "Generally safe. Popular tourist destination.",
  Armenia: "Generally safe. Low crime rates.",
  Egypt: "Moderate safety. Tourist areas generally secure.",
  Morocco: "Generally safe. Petty crime in tourist areas.",
  Tunisia: "Moderate safety. Some regions require caution.",
  Germany: "Very safe. Low crime rates with excellent infrastructure.",
  "United Kingdom": "Very safe. Standard urban precautions apply.",
  Canada: "Very safe. Low crime rates.",
  Australia: "Very safe. Low crime rates.",
  Japan: "Extremely safe. Very low crime rates.",
  "South Korea": "Very safe. Low crime rates.",
};

const tempData: Record<string, Record<string, number>> = {
  Turkey: { Jan: 5, Feb: 6, Mar: 10, Apr: 15, May: 20, Jun: 25, Jul: 28, Aug: 27, Sep: 23, Oct: 17, Nov: 11, Dec: 7 },
  "United Arab Emirates": { Jan: 20, Feb: 22, Mar: 25, Apr: 29, May: 34, Jun: 37, Jul: 40, Aug: 40, Sep: 37, Oct: 32, Nov: 27, Dec: 22 },
  Malaysia: { Jan: 27, Feb: 28, Mar: 28, Apr: 29, May: 29, Jun: 28, Jul: 28, Aug: 28, Sep: 28, Oct: 28, Nov: 28, Dec: 27 },
  Thailand: { Jan: 27, Feb: 28, Mar: 30, Apr: 31, May: 29, Jun: 29, Jul: 29, Aug: 28, Sep: 28, Oct: 28, Nov: 27, Dec: 26 },
  Japan: { Jan: 5, Feb: 6, Mar: 10, Apr: 15, May: 20, Jun: 23, Jul: 27, Aug: 28, Sep: 24, Oct: 18, Nov: 13, Dec: 8 },
  Germany: { Jan: 1, Feb: 2, Mar: 6, Apr: 10, May: 15, Jun: 18, Jul: 20, Aug: 20, Sep: 16, Oct: 10, Nov: 5, Dec: 2 },
};

function buildMonthlyTemps(c: RawCountry): Record<string, number> {
  const base = parseFloat(c.temp);
  const result: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    result[MONTHS[i]] = Math.round(base + Math.sin((i - 3) * 0.5) * 8);
  }
  return tempData[c.name] || result;
}

function buildRequirements(c: RawCountry) {
  const reqs = [
    { id: c.code.toLowerCase() + "-r1", category: "Documents", requirement: "Valid Passport (6+ months)", mandatory: true, description: "Must be valid for at least 6 months beyond intended stay", scoringWeight: 10, sourceUrl: "", parserConfidence: 0.95, needsReview: false },
    { id: c.code.toLowerCase() + "-r2", category: "Documents", requirement: "Passport Photos", mandatory: true, description: "2 recent passport-size photos with white background", scoringWeight: 5, sourceUrl: "", parserConfidence: 0.95, needsReview: false },
    { id: c.code.toLowerCase() + "-r3", category: "Financial", requirement: "Proof of Funds", mandatory: true, description: "Bank statements showing sufficient funds for the trip", scoringWeight: 10, sourceUrl: "", parserConfidence: 0.9, needsReview: false },
    { id: c.code.toLowerCase() + "-r4", category: "Travel", requirement: "Return/Onward Ticket", mandatory: false, description: "Proof of return or onward travel", scoringWeight: 5, sourceUrl: "", parserConfidence: 0.85, needsReview: false },
    { id: c.code.toLowerCase() + "-r5", category: "Travel", requirement: "Accommodation Proof", mandatory: false, description: "Hotel booking or invitation letter", scoringWeight: 5, sourceUrl: "", parserConfidence: 0.85, needsReview: false },
    { id: c.code.toLowerCase() + "-r6", category: "Insurance", requirement: "Travel Insurance", mandatory: false, description: "Health/travel insurance with adequate coverage", scoringWeight: 5, sourceUrl: "", parserConfidence: 0.8, needsReview: false },
  ];
  if (!c.visaFree && !c.voa) {
    reqs.push({ id: c.code.toLowerCase() + "-r7", category: "Application", requirement: "Visa Application Form", mandatory: true, description: "Completed and signed visa application form", scoringWeight: 5, sourceUrl: "", parserConfidence: 0.95, needsReview: false });
  }
  return reqs;
}

function buildVisaTypes(c: RawCountry) {
  const types = [
    { id: c.code.toLowerCase() + "-tourist", type: "Tourist", description: "Tourist visa for " + c.name, maxDuration: c.visaFree ? "90 days" : c.voa ? "30 days" : "30 days", extensions: true, multipleEntry: false, sourceUrl: "https://example.com/visa-" + c.code.toLowerCase(), parserConfidence: 0.85 },
  ];
  if (!c.visaFree && !c.voa) {
    types.push({ id: c.code.toLowerCase() + "-business", type: "Business", description: "Business visa for " + c.name, maxDuration: "90 days", extensions: true, multipleEntry: true, sourceUrl: "https://example.com/visa-" + c.code.toLowerCase(), parserConfidence: 0.8 });
  }
  return types;
}

export function generateMockCountries(): CountryData[] {
  return rawCountries.map(function (c, idx) {
    return {
      id: c.code.toLowerCase(),
      code: c.code,
      name: c.name,
      flagEmoji: c.flag,
      flagUrl: "https://flagcdn.com/w80/" + c.code.toLowerCase() + ".png",
      continent: c.continent,
      currency: c.currency,
      currencyCode: c.cc,
      timezone: c.tz,
      visaFree: c.visaFree,
      visaOnArrival: c.voa,
      etaAvailable: c.eVisa,
      safetyRating: c.safety,
      safetySummary: safetySummaries[c.name] || "Information not available.",
      bestTravelMonths: c.months,
      avgTempC: c.temp + "°C",
      monthlyTemps: buildMonthlyTemps(c),
      processingDaysMin: c.processingMin,
      processingDaysMax: c.processingMax,
      sourceUrl: "https://example.com/visa-" + c.code.toLowerCase(),
      fetchTimestamp: new Date().toISOString(),
      fetchHash: "hash-" + idx,
      parserVersion: "1.0",
      parserConfidence: 0.85 + Math.random() * 0.1,
      visaTypes: buildVisaTypes(c),
      costProfile: {
        id: "cost-" + c.code.toLowerCase(),
        visaFeeUSD: c.fee,
        serviceFeeUSD: c.service,
        processingDays: Math.round((c.processingMin + c.processingMax) / 2) || 7,
        monthlyLivingUSD: c.living,
        monthlyRentUSD: c.rent,
        monthlyFoodUSD: c.food,
        monthlyTransportUSD: c.transport,
        healthInsuranceUSD: c.insurance,
        totalMonthlyUSD: c.living,
        currency: c.cc,
        parserConfidence: 0.85,
      },
      requirements: buildRequirements(c),
    };
  });
}
