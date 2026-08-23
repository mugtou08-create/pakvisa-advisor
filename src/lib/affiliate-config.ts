/**
 * Affiliate partner configuration.
 * 
 * HOW TO UPDATE YOUR AFFILIATE LINKS:
 * 1. Sign up for each affiliate program (they're all free to join)
 * 2. Replace the placeholder URLs below with your actual affiliate URLs
 * 3. The URLs are used in country detail cards and the footer
 * 
 * CURRENT STATUS: SafetyWing ✅ LIVE | iVisa ✅ LIVE | Booking.com, Skyscanner — placeholders
 */

export const AFFILIATE_CONFIG = {
  /** iVisa — visa processing service (10-25% commission) */
  ivisa: {
    name: 'iVisa',
    baseUrl: 'https://www.ivisa.com',
    referralParam: 'promotion=SHARE20',
    utmSource: 'pakvisa',
    getCountryUrl: (countryName: string) =>
      `https://www.ivisa.com/${countryName.toLowerCase().replace(/\s+/g, '-')}-visa?promotion=SHARE20`,
  },

  /** SafetyWing — travel insurance (10-20% commission) */
  safetyWing: {
    name: 'SafetyWing',
    baseUrl: 'https://safetywing.com',
    referralParam: 'referenceID=26323190',
    utmSource: '26323190',
    getUrl: () =>
      'https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador',
  },

  /** Booking.com — hotel bookings (4-5% commission) */
  booking: {
    name: 'Booking.com',
    baseUrl: 'https://www.booking.com',
    aid: '304142', // Replace with your actual Booking.com affiliate AID
    label: 'pakvisa',
    getCountryUrl: (countryName: string) =>
      `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(countryName)}&aid=304142&label=pakvisa`,
  },

  /** Skyscanner — flight search (per-click commission) */
  skyscanner: {
    name: 'Skyscanner',
    baseUrl: 'https://www.skyscanner.net',
    referralParam: 'ref=pakvisa',
    getCountryUrl: (countryCode: string) =>
      `https://www.skyscanner.net/transport/flights/to/${countryCode.toLowerCase()}/?ref=pakvisa`,
  },

  /** WorldNomads — travel insurance alternative (5-15% commission) */
  worldNomads: {
    name: 'WorldNomads',
    baseUrl: 'https://www.worldnomads.com',
    referralParam: 'ref=pakvisa',
    getUrl: () =>
      'https://www.worldnomads.com/?ref=pakvisa&utm_source=pakvisa',
  },
} as const;
