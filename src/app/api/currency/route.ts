import { NextResponse } from 'next/server';

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;

// Exchange rates relative to PKR (1 PKR = X foreign currency)
// We use USD as base and convert
const TARGET_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', flag: '🇧🇭' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', flag: '🇰🇼' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', flag: '🇦🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', flag: '🇲🇻' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', flag: '🇧🇳' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
];

async function fetchRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // Use frankfurter.app (free, no API key, ECB rates)
    const resp = await fetch('https://api.frankfurter.app/latest?from=USD', {
      next: { revalidate: 1800 },
    });
    if (!resp.ok) throw new Error('Failed to fetch rates');

    const data = await resp.json();
    const usdRates = data.rates as Record<string, number>;
    // frankfurter API uses USD as base, so USD is not in rates — set it explicitly
    usdRates['USD'] = 1;

    // Hardcoded USD rates for currencies not covered by frankfurter API
    const hardcodedUsdRates: Record<string, number> = {
      PKR: 278,      // 1 USD = 278 PKR
      AED: 3.6725,   // 1 USD = 3.67 AED (pegged)
      SAR: 3.75,     // 1 USD = 3.75 SAR (pegged)
      QAR: 3.64,     // 1 USD = 3.64 QAR (pegged)
      OMR: 0.3845,   // 1 USD = 0.385 OMR (pegged)
      BHD: 0.376,    // 1 USD = 0.376 BHD (pegged)
      KWD: 0.307,    // 1 USD = 0.307 KWD
      AZN: 1.7,      // 1 USD = 1.7 AZN
      MVR: 15.4,     // 1 USD = 15.4 MVR
      BND: 1.34,     // 1 USD = 1.34 BND
      EGP: 48.5,     // 1 USD = 48.5 EGP
    };

    // Merge: API rates override hardcoded, hardcoded fills gaps
    for (const [code, rate] of Object.entries(hardcodedUsdRates)) {
      if (!usdRates[code]) usdRates[code] = rate;
    }

    // 1 PKR = ? foreign currency
    const usdToPkr = usdRates['PKR'] || 278;

    const pkrRates: Record<string, number> = {};
    for (const currency of TARGET_CURRENCIES) {
      if (currency.code === 'PKR') {
        pkrRates['PKR'] = 1;
      } else if (usdRates[currency.code]) {
        pkrRates[currency.code] = usdRates[currency.code] / usdToPkr;
      }
    }

    cachedRates = pkrRates;
    cacheTimestamp = now;
    return pkrRates;
  } catch (error) {
    // Fallback hardcoded rates if API fails
    console.warn('Currency API failed, using fallback rates:', error);
    const fallback: Record<string, number> = {
      USD: 1 / 278, EUR: 1 / 303, GBP: 1 / 352, AED: 1 / 75.7, SAR: 1 / 74.1,
      MYR: 1 / 62.1, THB: 1 / 8.1, TRY: 1 / 8.1, CNY: 1 / 38.3, JPY: 1 / 1.8,
      AUD: 1 / 178, CAD: 1 / 200, SGD: 1 / 207, QAR: 1 / 76.4, OMR: 1 / 722,
      BHD: 1 / 738, KWD: 1 / 906, INR: 1 / 3.3, AZN: 1 / 163, ZAR: 1 / 15.2,
      KRW: 1 / 0.2, IDR: 1 / 0.017, MVR: 1 / 18.0, BND: 1 / 207,
      EGP: 1 / 5.6, PKR: 1,
    };
    cachedRates = fallback;
    cacheTimestamp = now;
    return fallback;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'PKR';
    const to = searchParams.get('to') || 'USD';
    const amount = parseFloat(searchParams.get('amount') || '1');
    const refresh = searchParams.get('refresh') === 'true';

    if (refresh) {
      cachedRates = null;
      cacheTimestamp = 0;
    }

    const rates = await fetchRates();
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;

    // Convert: amount in 'from' → PKR → 'to'
    const pkrAmount = amount / fromRate;
    const result = pkrAmount * toRate;

    return NextResponse.json({
      success: true,
      data: {
        from,
        to,
        amount,
        result: Math.round(result * 10000) / 10000,
        rate: Math.round((toRate / fromRate) * 10000) / 10000,
        rateInverse: Math.round((fromRate / toRate) * 10000) / 10000,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch exchange rates' }, { status: 500 });
  }
}
