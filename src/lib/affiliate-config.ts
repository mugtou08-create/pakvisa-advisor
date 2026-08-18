/**
 * Affiliate partner configuration.
 * 
 * HOW TO UPDATE YOUR AFFILIATE LINKS:
 * 1. Sign up for each affiliate program (they're all free to join)
 * 2. Replace the placeholder URLs below with your actual affiliate URLs
 * 3. The URLs are used in country detail cards and the footer
 * 
 * CURRENT STATUS: Placeholder URLs — replace with real affiliate IDs after signing up
 */

export const AFFILIATE_CONFIG = {
  /** iVisa — visa processing service (10-25% commission) */
  ivisa: {
    name: 'iVisa',
    baseUrl: 'https://www.ivisa.com',
    referralParam: 'ref=pakvisa',
    utmSource: 'pakvisa',
    getCountryUrl: (countryName: string) =>
      `https://www.ivisa.com/search?q=${encodeURIComponent(countryName)}&ref=pakvisa&utm_source=pakvisa`,
  },

  /** SafetyWing — travel insurance (10-20% commission) */
  safetyWing: {
    name: 'SafetyWing',
    baseUrl: 'https://safetywing.com',
    referralParam: 'referral=pakvisa',
    utmSource: 'pakvisa',
    getUrl: () =>
      'https://safetywing.com/?referral=pakvisa&utm_source=pakvisa&utm_medium=affiliate',
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
