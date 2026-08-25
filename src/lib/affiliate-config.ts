/**
 * Affiliate partner configuration.
 * 
 * HOW TO UPDATE YOUR AFFILIATE LINKS:
 * 1. Sign up for each affiliate program (they're all free to join)
 * 2. Replace the placeholder URLs below with your actual affiliate URLs
 * 3. The URLs are used in country detail cards and the footer
 * 
 * CURRENT STATUS: SafetyWing LIVE | iVisa LIVE | Booking.com, Skyscanner — placeholders
 * NEW: Wise (money transfer) | Holafly (travel eSIM — 20-30% commission)
 */

export const AFFILIATE_CONFIG = {
  /** iVisa — visa processing service (10-25% commission) */
  ivisa: {
    name: 'iVisa',
    baseUrl: 'https://www.ivisa.com',
    referralParam: 'promotion=SHARE20',
    utmSource: 'pakvisa',
    getCountryUrl: (_countryName: string) =>
      `https://www.ivisa.com/?promotion=SHARE20`,
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
    aid: '304142',
    label: 'pakvisa',
    getCountryUrl: (countryName: string) =>
      `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(countryName)}&aid=304142&label=pakvisa`,
  },

  /** Skyscanner — flight search */
  skyscanner: {
    name: 'Skyscanner',
    baseUrl: 'https://www.skyscanner.net',
    getCountryUrl: (countryName: string) =>
      `https://www.skyscanner.net/transport/flights/isl/${countryName.toLowerCase().replace(/\s+/g, '-')}/`,
  },

  /** WorldNomads — travel insurance alternative (5-15% commission) */
  worldNomads: {
    name: 'WorldNomads',
    baseUrl: 'https://www.worldnomads.com',
    getUrl: () =>
      'https://www.worldnomads.com/?ref=pakvisa&utm_source=pakvisa',
  },

  /** Wise — international money transfer (10-15% of transfer fee commission)
   *  Pakistani travelers NEED this to pay visa fees in foreign currency.
   *  Better exchange rates than banks, fast transfers. */
  wise: {
    name: 'Wise',
    baseUrl: 'https://wise.com',
    getUrl: () =>
      'https://wise.com/pub/a/pakvisa?utm_source=pakvisa&utm_medium=affiliate',
  },

  /** Holafly — travel eSIM (20-30% commission)
   *  Instant data in 190+ countries. Unlimited data plans available.
   *  Very popular with Pakistani travelers avoiding expensive roaming.
   *  Affiliate sign-up: https://esim.holafly.com/affiliate-program */
  holafly: {
    name: 'Holafly',
    baseUrl: 'https://esim.holafly.com',
    getUrl: () =>
      'https://esim.holafly.com/?utm_source=pakvisa&utm_medium=affiliate',
  },
} as const;
