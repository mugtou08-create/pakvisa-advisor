// Static country data fallback — used when the database is unavailable or empty.
// This ensures the homepage ALWAYS shows countries regardless of DB state.
// Generated from the production database.

import type { CountryData } from './types';
import { deduplicateRequirements } from './dedup-requirements';
import staticJson from '@/data/static-countries.json';

/**
 * Patches raw JSON to conform to the full CountryData interface.
 * Adds missing optional fields with safe defaults.
 * Deduplicates requirements at load time using shared utility.
 */
function patchCountry(raw: any): CountryData {
  return {
    fetchHash: '',
    parserVersion: '1.0.0',
    createdAt: raw.fetchTimestamp || new Date().toISOString(),
    ...raw,
    requirements: deduplicateRequirements(raw.requirements || []),
    visaTypes: (raw.visaTypes || []).map((vt: any) => ({
      ...vt,
      requirements: deduplicateRequirements(vt.requirements || []),
    })),
  };
}

/**
 * Returns the full list of 70 countries from the static JSON fallback.
 * This data is embedded in the server bundle and does NOT depend on any database.
 */
export function getStaticCountries(): CountryData[] {
  return (staticJson as any[]).map(patchCountry);
}

/**
 * Returns a single country by code from the static fallback.
 */
export function getStaticCountry(code: string): CountryData | undefined {
  const raw = (staticJson as any[]).find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );
  return raw ? patchCountry(raw) : undefined;
}
