import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const r = await p.country.findMany({
    where: { OR: [{ name: { contains: 'Turkey' } }, { name: { contains: 'Türkiye' } }, { code: 'TR' }] },
    select: { name: true, code: true, id: true },
  });
  console.log(JSON.stringify(r, null, 2));
  await p.$disconnect();
}
main();
