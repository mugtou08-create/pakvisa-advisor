// Country Detection Utility
// Detects country names from user messages and matches against database country codes

// Known aliases: common alternative names / abbreviations
const COUNTRY_ALIASES: Record<string, string[]> = {
  'USA': ['USA', 'US', 'United States', 'America', 'United States of America'],
  'UK': ['UK', 'United Kingdom', 'Britain', 'England', 'Great Britain'],
  'UAE': ['UAE', 'Dubai', 'Abu Dhabi', 'Emirates', 'United Arab Emirates'],
  'SouthKorea': ['South Korea', 'Korea'],
  'SaudiArabia': ['Saudi Arabia', 'KSA', 'Saudi'],
  'NewZealand': ['New Zealand'],
  'SriLanka': ['Sri Lanka', 'Ceylon'],
  'HongKong': ['Hong Kong'],
  'SouthAfrica': ['South Africa'],
  'Turkmenistan': ['Turkmenistan'],
  'Maldives': ['Maldives'],
  'Azerbaijan': ['Azerbaijan', 'Azerbaidjan'],
  'Kyrgyzstan': ['Kyrgyzstan', 'Kyrgyz'],
  'Tajikistan': ['Tajikistan'],
  'Uzbekistan': ['Uzbekistan'],
  'Kazakhstan': ['Kazakhstan'],
  'Afghanistan': ['Afghanistan'],
  'Iran': ['Iran', 'Persia'],
  'Iraq': ['Iraq'],
  'Turkey': ['Turkey', 'Türkiye', 'Turkiye'],
  'China': ['China', 'PRC'],
  'Japan': ['Japan'],
  'Malaysia': ['Malaysia', 'KL', 'Kuala Lumpur'],
  'Thailand': ['Thailand', 'Bangkok'],
  'Indonesia': ['Indonesia', 'Jakarta', 'Bali'],
  'Singapore': ['Singapore'],
  'Qatar': ['Qatar', 'Doha'],
  'Oman': ['Oman', 'Muscat'],
  'Bahrain': ['Bahrain'],
  'Kuwait': ['Kuwait'],
  'Jordan': ['Jordan', 'Amman'],
  'Lebanon': ['Lebanon', 'Beirut'],
  'Egypt': ['Egypt', 'Cairo'],
  'Morocco': ['Morocco', 'Morroco'],
  'Tunisia': ['Tunisia'],
  'Kenya': ['Kenya', 'Nairobi'],
  'Germany': ['Germany', 'Deutschland'],
  'France': ['France', 'French'],
  'Italy': ['Italy', 'Italian', 'Rome', 'Italia'],
  'Spain': ['Spain', 'Spanish', 'Madrid', 'Espana'],
  'Netherlands': ['Netherlands', 'Holland', 'Dutch', 'Amsterdam'],
  'Belgium': ['Belgium', 'Brussels'],
  'Austria': ['Austria', 'Vienna', 'Austrian'],
  'Switzerland': ['Switzerland', 'Swiss', 'Bern'],
  'Sweden': ['Sweden', 'Stockholm', 'Swedish'],
  'Denmark': ['Denmark', 'Copenhagen', 'Danish'],
  'Norway': ['Norway', 'Oslo', 'Norwegian'],
  'Poland': ['Poland', 'Warsaw', 'Polish'],
  'Portugal': ['Portugal', 'Lisbon', 'Portuguese'],
  'Greece': ['Greece', 'Athens', 'Greek'],
  'Romania': ['Romania', 'Bucharest', 'Romanian'],
  'Luxembourg': ['Luxembourg'],
  'Ireland': ['Ireland', 'Dublin', 'Irish'],
  'Australia': ['Australia', 'Sydney', 'Melbourne', 'Aussie'],
  'Canada': ['Canada', 'Toronto', 'Canadian'],
  'Brazil': ['Brazil', 'Brasil', 'Sao Paulo', 'Rio'],
  'Mexico': ['Mexico', 'Mexican'],
  'Mongolia': ['Mongolia', 'Ulaanbaatar'],
  'Nepal': ['Nepal', 'Kathmandu'],
  'Bangladesh': ['Bangladesh', 'Dhaka'],
  'India': ['India', 'Delhi', 'Mumbai', 'Indian'],
  'Russia': ['Russia', 'Moscow', 'Russian'],
  'Armenia': ['Armenia', 'Yerevan'],
  'Algeria': ['Algeria'],
};

// Build reverse lookup: normalized alias → country code
const ALIAS_TO_CODE = new Map<string, string>();
for (const [code, aliases] of Object.entries(COUNTRY_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_TO_CODE.set(alias.toLowerCase().replace(/[^a-z0-9]/g, ''), code);
  }
}

/**
 * Detects country codes mentioned in a user message.
 * Returns up to 3 detected country codes (most relevant first).
 */
export function detectCountries(message: string): string[] {
  if (!message || !message.trim()) return [];

  const normalized = message.toLowerCase();
  const detected = new Map<string, number>(); // code → match position (earlier = more relevant)

  // Strategy 1: Check multi-word aliases first (longer matches first to avoid "India" matching "Indiana")
  const sortedAliases = Array.from(ALIAS_TO_CODE.entries())
    .sort((a, b) => b[0].length - a[0].length);

  for (const [alias, code] of sortedAliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) {
      if (!detected.has(code) || detected.get(code)! > idx) {
        detected.set(code, idx);
      }
    }
  }

  // Strategy 2: Check for exact word matches from raw country names
  // Handle two-word countries like "Saudi Arabia" properly
  const multiWordCodes = Object.entries(COUNTRY_ALIASES)
    .filter(([, aliases]) => aliases.some(a => a.includes(' ')))
    .map(([code]) => code);

  for (const [code, aliases] of Object.entries(COUNTRY_ALIASES)) {
    for (const alias of aliases) {
      if (!alias.includes(' ')) continue; // skip single-word — already handled
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      const match = normalized.match(regex);
      if (match && match.index !== undefined) {
        if (!detected.has(code) || detected.get(code)! > match.index) {
          detected.set(code, match.index);
        }
      }
    }
  }

  // Sort by position in text (earlier mention = higher relevance)
  return Array.from(detected.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([code]) => code);
}

/**
 * Returns the full country name for a given code
 */
export function getCountryName(code: string): string {
  for (const [c, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (c === code) return aliases[0]; // return the primary name
  }
  return code;
}
