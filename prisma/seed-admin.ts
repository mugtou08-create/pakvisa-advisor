import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function seed() {
  console.log('Seeding admin user...');

  const existingAdmin = await db.adminUser.findUnique({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
  } else {
    const passwordHash = await bcrypt.hash('PakVisa@2024!', 12);
    await db.adminUser.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'admin',
        permissions: 'full',
      },
    });
    console.log('Admin user created successfully!');
    console.log('  Username: admin');
    console.log('  Password: PakVisa@2024!');
  }

  // Seed default settings
  const defaultSettings = [
    { key: 'ai_enabled', value: 'true' },
    { key: 'maintenance_mode', value: 'false' },
  ];

  for (const setting of defaultSettings) {
    const existing = await db.siteSettings.findUnique({
      where: { key: setting.key },
    });
    if (!existing) {
      await db.siteSettings.create({ data: setting });
      console.log(`Created setting: ${setting.key} = ${setting.value}`);
    } else {
      console.log(`Setting already exists: ${setting.key}`);
    }
  }

  await db.$disconnect();
  console.log('Seeding complete!');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
