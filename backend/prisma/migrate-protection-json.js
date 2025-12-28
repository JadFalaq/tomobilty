const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function migrateProtectionProprietesToJson() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } }
  });
  try {
    console.log('🔧 Migrating protection.proprietes to JSONB with tiered properties...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE protection
      ALTER COLUMN proprietes TYPE jsonb USING
      CASE
        WHEN type = 'BASIQUE' THEN '{"vol_collision":true,"pneus_vitres":false,"interieure":false,"occupants":false,"mobilite":false}'::jsonb
        WHEN type = 'COMPLETE' THEN '{"vol_collision":true,"pneus_vitres":true,"interieure":false,"occupants":false,"mobilite":false}'::jsonb
        WHEN type = 'PREMIUM' THEN '{"vol_collision":true,"pneus_vitres":true,"interieure":true,"occupants":true,"mobilite":true}'::jsonb
        ELSE '{}'::jsonb
      END;
    `);
    console.log('✅ Column converted to JSONB with values set.');
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

migrateProtectionProprietesToJson();
