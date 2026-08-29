import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const r = await p.$queryRawUnsafe(`SELECT c.name, c.code, vt.id, vt.type, vt.description FROM VisaType vt JOIN Country c ON vt.countryId = c.id WHERE c.name IN ('Denmark', 'Switzerland', 'Luxembourg', 'Belgium', 'Azerbaijan', 'Turkmenistan', 'Romania', 'Thailand', 'Brazil', 'Singapore', 'Japan', 'South Korea', 'Oman', 'Qatar', 'Bahrain', 'Kuwait', 'Greece', 'Czech Republic', 'Poland', 'Hungary', 'Austria', 'New Zealand', 'Finland', 'Iceland') ORDER BY c.name, vt.type`);
  console.log(JSON.stringify(r, null, 2));
  await p.$disconnect();
}
main();
