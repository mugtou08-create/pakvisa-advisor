import { db } from '../src/lib/db';

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/€/g, 'eur').replace(/'/g, "'").replace(/\s+/g, ' ').trim();
}

function isSimilar(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  const wordsA = new Set(na.split(' ').filter(w => w.length > 2));
  const wordsB = new Set(nb.split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  const maxWords = Math.max(wordsA.size, wordsB.size);
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  return intersection.length >= maxWords * 0.6;
}

async function main() {
  const countries = await db.country.findMany({
    include: {
      visaTypes: {
        include: { requirements: true },
        orderBy: { type: 'asc' },
      },
    },
  });

  let totalDupes = 0;
  let vtWithDupes = 0;

  for (const country of countries) {
    for (const vt of country.visaTypes) {
      const reqs = vt.requirements;
      if (reqs.length <= 1) continue;

      const dupes: string[] = [];
      for (let i = 0; i < reqs.length; i++) {
        for (let j = i + 1; j < reqs.length; j++) {
          if (isSimilar(reqs[i].requirement, reqs[j].requirement)) {
            dupes.push(`  [${reqs[i].category}] '${reqs[i].requirement}' ~ [${reqs[j].category}] '${reqs[j].requirement}'`);
          }
        }
      }

      if (dupes.length > 0) {
        vtWithDupes++;
        totalDupes += dupes.length;
        console.log(`\n=== ${country.name} / ${vt.type} (${reqs.length} reqs, ${dupes.length} dupes) ===`);
        for (const d of dupes.slice(0, 5)) console.log(d);
        if (dupes.length > 5) console.log(`  ... and ${dupes.length - 5} more`);
      }
    }
  }

  console.log(`\n=== PER-VISA-TYPE SUMMARY ===`);
  console.log(`Visa types with duplicates: ${vtWithDupes}`);
  console.log(`Total duplicate pairs: ${totalDupes}`);
}

main().then(() => process.exit(0));
