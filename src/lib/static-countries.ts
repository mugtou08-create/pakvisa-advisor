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
  // Derive country-level processing days from visa types if missing
  const visaTypes = (raw.visaTypes || []).map((vt: any) => ({
    ...vt,
    requirements: deduplicateRequirements(vt.requirements || []),
  }));

  let processingDaysMin = raw.processingDaysMin;
  let processingDaysMax = raw.processingDaysMax;
  if (!processingDaysMin || !processingDaysMax) {
    const nonZero = visaTypes.filter((vt: any) => (vt.processingDaysMin > 0 || vt.processingDaysMax > 0));
    if (nonZero.length > 0) {
      processingDaysMin = Math.min(...nonZero.map((vt: any) => vt.processingDaysMin || 999).filter((v: number) => v < 999));
      processingDaysMax = Math.max(...nonZero.map((vt: any) => vt.processingDaysMax || 0));
    }
  }
  // If still missing, provide sensible defaults based on visa status
  if (!processingDaysMin && !processingDaysMax) {
    if (raw.visaFree || raw.visaOnArrival || raw.etaAvailable) {
      processingDaysMin = 0;
      processingDaysMax = 0;
    } else {
      processingDaysMin = 5;
      processingDaysMax = 30;
    }
  }

  return {
    fetchHash: '',
    parserVersion: '1.0.0',
    createdAt: raw.fetchTimestamp || new Date().toISOString(),
    ...raw,
    processingDaysMin,
    processingDaysMax,
    safetyRating: typeof raw.safetyRating === 'number' && !isNaN(raw.safetyRating) ? raw.safetyRating : 0,
    requirements: deduplicateRequirements(raw.requirements || []),
    visaTypes,
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
