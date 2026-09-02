import type { CountryData } from './types';

// ============================================================
// City → Country mapping
// Maps well-known cities to their parent country name (exact match).
// ============================================================
export const CITY_TO_COUNTRY: Record<string, string> = {
  // UAE cities
  'dubai': 'UAE',
  'abu dhabi': 'UAE',
  'sharjah': 'UAE',
  'ajman': 'UAE',
  'ras al khaimah': 'UAE',
  'fujairah': 'UAE',
  'umm al quwain': 'UAE',

  // Saudi Arabia cities
  'riyadh': 'Saudi Arabia',
  'jeddah': 'Saudi Arabia',
  'mecca': 'Saudi Arabia',
  'medina': 'Saudi Arabia',
  'makkah': 'Saudi Arabia',
  'madinah': 'Saudi Arabia',
  'dammam': 'Saudi Arabia',
  'khobar': 'Saudi Arabia',

  // Turkey cities
  'istanbul': 'Turkey',
  'ankara': 'Turkey',
  'izmir': 'Turkey',
  'antalya': 'Turkey',

  // Malaysia cities
  'kuala lumpur': 'Malaysia',
  'penang': 'Malaysia',
  'langkawi': 'Malaysia',
  'johor bahru': 'Malaysia',

  // UK cities
  'london': 'UK',
  'manchester': 'UK',
  'birmingham': 'UK',
  'edinburgh': 'UK',
  'glasgow': 'UK',
  'liverpool': 'UK',

  // USA cities
  'new york': 'USA',
  'los angeles': 'USA',
  'chicago': 'USA',
  'houston': 'USA',
  'san francisco': 'USA',
  'washington': 'USA',
  'washington dc': 'USA',
  'miami': 'USA',
  'dallas': 'USA',
  'seattle': 'USA',
  'boston': 'USA',

  // Canada cities
  'toronto': 'Canada',
  'vancouver': 'Canada',
  'montreal': 'Canada',
  'ottawa': 'Canada',
  'calgary': 'Canada',

  // Europe cities
  'paris': 'France',
  'berlin': 'Germany',
  'rome': 'Italy',
  'madrid': 'Spain',
  'barcelona': 'Spain',
  'amsterdam': 'Netherlands',
  'brussels': 'Belgium',
  'vienna': 'Austria',
  'zurich': 'Switzerland',
  'geneva': 'Switzerland',
  'prague': 'Czechia',
  'budapest': 'Hungary',
  'warsaw': 'Poland',
  'stockholm': 'Sweden',
  'oslo': 'Norway',
  'copenhagen': 'Denmark',
  'helsinki': 'Finland',
  'lisbon': 'Portugal',
  'dublin': 'Ireland',
  'luxembourg': 'Luxembourg',
  'bucharest': 'Romania',
  'athens': 'Greece',

  // Middle East cities
  'doha': 'Qatar',
  'kuwait city': 'Kuwait',
  'manama': 'Bahrain',
  'muscat': 'Oman',
  'amman': 'Jordan',
  'beirut': 'Lebanon',
  'baghdad': 'Iraq',
  'tehran': 'Iran',
  'baku': 'Azerbaijan',
  'tbilisi': 'Georgia',
  'yerevan': 'Armenia',

  // Africa cities
  'cairo': 'Egypt',
  'nairobi': 'Kenya',
  'johannesburg': 'South Africa',
  'cape town': 'South Africa',
  'casablanca': 'Morocco',
  'marrakech': 'Morocco',
  'tunis': 'Tunisia',
  'algiers': 'Algeria',
  'addis ababa': 'Ethiopia',
  'dar es salaam': 'Tanzania',
  'lagos': 'Nigeria',
  'abuja': 'Nigeria',

  // Asia cities
  'tokyo': 'Japan',
  'beijing': 'China',
  'shanghai': 'China',
  'hong kong': 'HongKong',
  'bangkok': 'Thailand',
  'jakarta': 'Indonesia',
  'bali': 'Indonesia',
  'manila': 'Philippines',
  'seoul': 'SouthKorea',
  'singapore': 'Singapore',
  'hanoi': 'Vietnam',
  'ho chi minh': 'Vietnam',
  'phnom penh': 'Cambodia',
  'kathmandu': 'Nepal',
  'dhaka': 'Bangladesh',
  'colombo': 'SriLanka',
  'male': 'Maldives',
  'ulaanbaatar': 'Mongolia',
  'ashgabat': 'Turkmenistan',
  'new delhi': 'India',
  'mumbai': 'India',
  'delhi': 'India',

  // Oceania cities
  'sydney': 'Australia',
  'melbourne': 'Australia',
  'auckland': 'NewZealand',
  'wellington': 'NewZealand',

  // South America
  'sao paulo': 'Brazil',
  'rio de janeiro': 'Brazil',
  'mexico city': 'Mexico',
  'buenos aires': 'Argentina',

  // Misc / alternatives
  'holland': 'Netherlands',
  'turkiye': 'Turkey',
  'czech republic': 'Czechia',
  'south korea': 'SouthKorea',
  'saudi': 'Saudi Arabia',
  'emirates': 'UAE',
  'britain': 'UK',
  'england': 'UK',
  'scotland': 'UK',
  'wales': 'UK',
  'america': 'USA',
  'states': 'USA',
  'korea': 'SouthKorea',
};

// ============================================================
// Country alias mapping (alternative names → canonical name)
// ============================================================
export const COUNTRY_ALIASES: Record<string, string> = {
  'united arab emirates': 'UAE',
  'uae': 'UAE',
  'emirates': 'UAE',

  'united states': 'USA',
  'united states of america': 'USA',
  'us': 'USA',
  'usa': 'USA',
  'america': 'USA',

  'united kingdom': 'UK',
  'uk': 'UK',
  'great britain': 'UK',
  'england': 'UK',

  'saudi arabia': 'Saudi Arabia',
  'ksa': 'Saudi Arabia',
  'kingdom of saudi arabia': 'Saudi Arabia',

  'turkey': 'Turkey',
  'turkiye': 'Turkey',

  'czech republic': 'Czechia',
  'czech': 'Czechia',

  'south korea': 'SouthKorea',
  'korea': 'SouthKorea',
  'republic of korea': 'SouthKorea',

  'hong kong': 'HongKong',

  'new zealand': 'NewZealand',

  'sri lanka': 'SriLanka',

  // Common abbreviations and variations
  'brunei': 'Brunei',
  'macau': 'Macau',
  'vietnam': 'Vietnam',
  'viet nam': 'Vietnam',
};

// ============================================================
// Build a lookup map: alias/city name → canonical country name
// (combines CITY_TO_COUNTRY and COUNTRY_ALIASES)
// ============================================================
const ALIAS_LOOKUP: Record<string, string> = {
  ...CITY_TO_COUNTRY,
  ...COUNTRY_ALIASES,
};

// ============================================================
// Fuzzy matching: returns true if the query is a close enough
// match to the target (handles typos, missing letters, etc.)
// ============================================================
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(query: string, target: string): boolean {
  // Allow 1 edit distance per 5 chars, minimum 1
  const maxDist = Math.max(1, Math.floor(query.length / 5));
  return levenshtein(query, target) <= maxDist;
}

function containsAllLetters(query: string, target: string): boolean {
  // Check if all letters of query appear in order in target
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

// ============================================================
// Main search function
// ============================================================
export interface SearchResult {
  country: CountryData;
  matchType: 'exact' | 'alias' | 'city' | 'fuzzy' | 'substring';
  matchedQuery: string;
}

/**
 * Intelligent search that handles:
 * - Exact country name/code match
 * - City name → country resolution
 * - Country aliases (UAE ↔ United Arab Emirates, etc.)
 * - Fuzzy matching (typos like "DUbai" → "Dubai")
 * - Substring matching
 *
 * Returns an array of SearchResult sorted by relevance.
 */
export function intelligentSearch(
  query: string,
  countries: CountryData[]
): CountryData[] {
  if (!query.trim()) return countries;

  const q = query.trim().toLowerCase();
  const qWords = q.split(/\s+/);
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  function addResult(country: CountryData, matchType: SearchResult['matchType'], matchedQuery: string) {
    if (seen.has(country.code)) return;
    seen.add(country.code);
    results.push({ country, matchType, matchedQuery });
  }

  // 1. Check if the query IS a city or alias → return that single country
  const aliasTarget = ALIAS_LOOKUP[q];
  if (aliasTarget) {
    const match = countries.find(
      (c) =>
        c.name === aliasTarget ||
        c.code === aliasTarget ||
        c.name.toLowerCase() === aliasTarget.toLowerCase()
    );
    if (match) {
      addResult(match, CITY_TO_COUNTRY[q] ? 'city' : 'alias', aliasTarget);
    }
  }

  // 2. Check multi-word queries as a phrase
  if (qWords.length > 1) {
    const phraseTarget = ALIAS_LOOKUP[q];
    if (phraseTarget && !seen.has(countries.find(c => c.name === phraseTarget || c.code === phraseTarget)?.code || '')) {
      const match = countries.find(
        (c) =>
          c.name === phraseTarget ||
          c.code === phraseTarget ||
          c.name.toLowerCase() === phraseTarget.toLowerCase()
      );
      if (match) addResult(match, CITY_TO_COUNTRY[q] ? 'city' : 'alias', phraseTarget);
    }
  }

  // 3. Exact name/code match
  for (const c of countries) {
    if (c.name.toLowerCase() === q || c.code.toLowerCase() === q) {
      addResult(c, 'exact', c.name);
    }
  }

  // 4. Check each word of the query against aliases/cities
  for (const word of qWords) {
    const wordTarget = ALIAS_LOOKUP[word];
    if (wordTarget) {
      const match = countries.find(
        (c) =>
          c.name === wordTarget ||
          c.code === wordTarget ||
          c.name.toLowerCase() === wordTarget.toLowerCase()
      );
      if (match) addResult(match, CITY_TO_COUNTRY[word] ? 'city' : 'alias', wordTarget);
    }
  }

  // 5. Fuzzy match against country names
  for (const c of countries) {
    const nameLower = c.name.toLowerCase();
    if (fuzzyMatch(q, nameLower)) {
      addResult(c, 'fuzzy', c.name);
    }
  }

  // 6. Substring match (name contains query)
  for (const c of countries) {
    const nameLower = c.name.toLowerCase();
    if (nameLower.includes(q) || c.code.toLowerCase().includes(q)) {
      addResult(c, 'substring', c.name);
    }
  }

  // 7. Contains-all-letters match (e.g. "uae" matches any country with u,a,e in order)
  if (results.length === 0 && q.length >= 2) {
    for (const c of countries) {
      if (containsAllLetters(q, c.name.toLowerCase())) {
        addResult(c, 'substring', c.name);
      }
    }
  }

  // Sort by match type priority: exact > alias/city > fuzzy > substring
  const priority: Record<string, number> = { exact: 0, alias: 1, city: 1, fuzzy: 2, substring: 3 };
  results.sort((a, b) => (priority[a.matchType] ?? 4) - (priority[b.matchType] ?? 4));

  return results.map((r) => r.country);
}

/**
 * Resolves a query string to a single country (for search box behavior).
 * Returns null if no match found.
 */
export function resolveSearchToCountry(
  query: string,
  countries: CountryData[]
): CountryData | null {
  const results = intelligentSearch(query, countries);
  return results.length > 0 ? results[0] : null;
}
