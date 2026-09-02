/**
 * Shared requirement deduplication utility.
 * Ensures zero duplicate requirements ever reach the UI,
 * regardless of data source (DB, static JSON, API).
 */

export interface ReqItem {
  requirement: string;
  category?: string | null;
  mandatory?: boolean;
  description?: string | null;
  id?: string;
  [key: string]: any;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/€/g, 'eur').replace(/'/g, "'").replace(/\s+/g, ' ').trim();
}

function isSimilar(a: string, b: string): boolean {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return true;
  const wa = new Set(na.split(' ').filter(w => w.length > 2));
  const wb = new Set(nb.split(' ').filter(w => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return false;
  return [...wa].filter(w => wb.has(w)).length >= Math.max(wa.size, wb.size) * 0.6;
}

/**
 * Descriptiveness score — longer requirement text + description = more informative.
 * Used to pick which duplicate to keep.
 */
function score(r: ReqItem): number {
  let s = (r.requirement || '').length;
  if (r.description?.trim()) s += r.description.trim().length * 2;
  if (r.mandatory) s += 10;
  return s;
}

/**
 * Deduplicates an array of requirements, keeping the most descriptive version.
 * Also fixes the 'ealth' category typo → 'health'.
 *
 * This is O(n²) but requirements arrays are small (typically <30 items).
 * For production safety, this runs at EVERY data access point.
 */
export function deduplicateRequirements<T extends ReqItem>(reqs: T[]): T[] {
  if (!reqs || reqs.length === 0) return [];

  const result: T[] = [];

  for (const item of reqs) {
    let processed = item as T;
    // Fix category typo
    if (processed.category === 'ealth') {
      processed = { ...processed, category: 'health' } as T;
    }

    // Check if this is a duplicate of anything already kept
    const isDupe = result.some(kept => isSimilar(kept.requirement, processed.requirement));
    if (isDupe) {
      // If the new item is MORE descriptive than the existing one, replace it
      const existingIdx = result.findIndex(kept => isSimilar(kept.requirement, processed.requirement));
      if (existingIdx >= 0 && score(processed) > score(result[existingIdx])) {
        result[existingIdx] = processed;
      }
      continue;
    }

    result.push(processed);
  }

  return result;
}
