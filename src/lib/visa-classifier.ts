/**
 * Visa type classifier — determines if a visa type is "tourist/basic" (free to view)
 * or "pro" (requires Pro subscription to see details).
 *
 * Classification rules:
 * - Tourist/Visitor/Short-Stay/Visa Free/VoA/ETA/e-Visa (tourist-only) = FREE
 * - Everything else (Work, Study, Business, Family, Nomad, Residence, Transit, etc.) = PRO
 */

const TOURIST_PATTERNS = [
  /tourist/i,
  /visitor/i,
  /^short[\s-]stay/i,
  /schengen/i,
  /^visa\s*free/i,
  /^visa\s*on\s*arrival/i,
  /^voa$/i,
  /^e-?visa$/i,
  /^eta$/i,
  /^electronic\s*travel\s*authority/i,
  /^asan\s*visa/i,
  /^umrah\s*visa/i,
  /^hajj\s*visa/i,
  /\bB1\/B2\b/i,
  /standard\s*visitor/i,
  /visitor\s*visa\s*\(?TRV/i,
  /social\s*visit/i,
];

const PRO_PATTERNS = [
  /work/i,
  /employment/i,
  /business/i,
  /student|study/i,
  /family|spouse|partner|dependent/i,
  /nomad|digital/i,
  /residen(ce|t)/i,
  /immigration|migrate/i,
  /investor|investment/i,
  /job\s*seeker/i,
  /skilled/i,
  /temporary\s*skill/i,
  /subclass\s*(500|482|457|186|189|190)/i,
  /tier\s*[2-5]/i,
  /\bH1B\b/i,
  /\bF1\b/i,
  /\bJ1\b/i,
  /\bL1\b/i,
  /\bO1\b/i,
  /\bB211A\b/i,
  /KITAS/i,
  /super\s*visa/i,
  /elective\s*residence/i,
  /national\s*d\s*visa/i,
  /type\s*d/i,
  /long\s*stay/i,
  /transit/i,
  /diplomatic/i,
  /official/i,
  /journalist|media/i,
  /au\s*pair/i,
  /intern/i,
  /trainee/i,
  /religious/i,
  /research\s*visa/i,
  /talent/i,
  /graduate/i,
  /post\s*study/i,
];

export type VisaAccessLevel = 'free' | 'pro';

/**
 * Classify a visa type as 'free' (tourist/basic, visible to all) or 'pro' (requires subscription).
 * Uses pattern matching on the visa type name.
 */
export function classifyVisaType(visaTypeName: string): VisaAccessLevel {
  const name = visaTypeName.trim();

  // First check if it explicitly matches a PRO pattern
  for (const pattern of PRO_PATTERNS) {
    if (pattern.test(name)) return 'pro';
  }

  // Then check if it matches a FREE (tourist) pattern
  for (const pattern of TOURIST_PATTERNS) {
    if (pattern.test(name)) return 'free';
  }

  // Default: if it's a Schengen visa without pro keywords, it's tourist/free
  if (/schengen/i.test(name)) return 'free';

  // Default: unknown types are Pro-gated (safer default)
  return 'pro';
}

/**
 * Check if a visa type is tourist/basic (free to view for everyone).
 */
export function isTouristVisa(visaTypeName: string): boolean {
  return classifyVisaType(visaTypeName) === 'free';
}

/**
 * Get a human-readable label for the visa category.
 */
export function getVisaCategoryLabel(visaTypeName: string): string {
  const name = visaTypeName.toLowerCase();
  if (/work|employment|skilled|\bH1B\b|subclass\s*(482|457|186|189|190)|temporary\s*skill/i.test(name)) return 'Work';
  if (/student|study|\bF1\b|subclass\s*500/i.test(name)) return 'Study';
  if (/business|\bM\s*visa\b|\bB211A\b/i.test(name)) return 'Business';
  if (/(?:^|\s)j\d/i.test(name)) return 'Exchange';
  if (/family|spouse|partner|super\s*visa|dependent/i.test(name)) return 'Family';
  if (/nomad|digital/i.test(name)) return 'Digital Nomad';
  if (/residen(ce|t)|national\s*d|long\s*stay|type\s*d/i.test(name)) return 'Residence';
  if (/job\s*seeker/i.test(name)) return 'Job Seeker';
  if (/transit/i.test(name)) return 'Transit';
  if (/umrah|hajj|religious/i.test(name)) return 'Religious';
  return 'Tourist';
}

/**
 * Get a color class for the visa category badge.
 */
export function getVisaCategoryColor(visaTypeName: string): string {
  const cat = getVisaCategoryLabel(visaTypeName);
  const colors: Record<string, string> = {
    'Tourist': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Work': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Study': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'Business': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Family': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'Digital Nomad': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'Residence': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Job Seeker': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'Transit': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    'Religious': 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
    'Exchange': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return colors[cat] || 'bg-muted text-muted-foreground';
}
