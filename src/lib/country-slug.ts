// ============================================================
// Country slug utility – pretty URLs like /malaysia instead of /country/Malaysia
// Note: DB codes are PascalCase names (e.g. 'Malaysia', 'SaudiArabia'), NOT ISO codes
// ============================================================

const COUNTRY_ENTRIES: [string, string][] = [
  ['afghanistan','Afghanistan'],['algeria','Algeria'],['armenia','Armenia'],['australia','Australia'],['austria','Austria'],
  ['azerbaijan','Azerbaijan'],['bahrain','Bahrain'],['bangladesh','Bangladesh'],['belgium','Belgium'],['brazil','Brazil'],
  ['cambodia','Cambodia'],['canada','Canada'],['china','China'],['czechia','Czechia'],['denmark','Denmark'],
  ['egypt','Egypt'],['ethiopia','Ethiopia'],['france','France'],['georgia','Georgia'],['germany','Germany'],
  ['greece','Greece'],['hong-kong','HongKong'],['hungary','Hungary'],['iceland','Iceland'],['india','India'],
  ['indonesia','Indonesia'],['iran','Iran'],['iraq','Iraq'],['ireland','Ireland'],['italy','Italy'],
  ['japan','Japan'],['jordan','Jordan'],['kenya','Kenya'],['kuwait','Kuwait'],['lebanon','Lebanon'],
  ['luxembourg','Luxembourg'],['malaysia','Malaysia'],['maldives','Maldives'],['mexico','Mexico'],['mongolia','Mongolia'],
  ['morocco','Morocco'],['nepal','Nepal'],['netherlands','Netherlands'],['new-zealand','NewZealand'],['nigeria','Nigeria'],
  ['norway','Norway'],['oman','Oman'],['philippines','Philippines'],['poland','Poland'],['portugal','Portugal'],
  ['qatar','Qatar'],['romania','Romania'],['russia','Russia'],['saudi-arabia','SaudiArabia'],['singapore','Singapore'],
  ['south-africa','SouthAfrica'],['south-korea','SouthKorea'],['spain','Spain'],['sri-lanka','SriLanka'],['sweden','Sweden'],
  ['switzerland','Switzerland'],['tanzania','Tanzania'],['thailand','Thailand'],['tunisia','Tunisia'],
  ['turkmenistan','Turkmenistan'],['turkey','Turkey'],['uae','UAE'],['uk','UK'],
  ['usa','USA'],['vietnam','Vietnam'],
];

// slug → DB code (e.g. 'malaysia' → 'Malaysia')
export const SLUG_TO_CODE: Record<string, string> = Object.fromEntries(COUNTRY_ENTRIES);

// DB code → slug (e.g. 'Malaysia' → 'malaysia')
export const CODE_TO_SLUG: Record<string, string> = Object.fromEntries(
  COUNTRY_ENTRIES.map(([slug, code]) => [code, slug])
);

/** Convert a country name to a URL-safe slug */
export function slugifyCountryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Reverse-lookup: DB code → display name */
export function getCountryNameFromCode(code: string): string {
  return code || '';
}
