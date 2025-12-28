const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function seedProtection() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL }
    }
  });
  try {
    console.log('🔧 Seeding protection types...');
    const records = [
      {
        type: 'BASIQUE',
        frais_par_jour: 0,
        proprietes: {
          vol_collision: true,
          pneus_vitres: false,
          interieure: false,
          occupants: false,
          mobilite: false
        }
      },
      {
        type: 'COMPLETE',
        frais_par_jour: 100,
        proprietes: {
          vol_collision: true,
          pneus_vitres: true,
          interieure: false,
          occupants: false,
          mobilite: false
        }
      },
      {
        type: 'PREMIUM',
        frais_par_jour: 170,
        proprietes: {
          vol_collision: true,
          pneus_vitres: true,
          interieure: true,
          occupants: true,
          mobilite: true
        }
      }
    ];
    for (const rec of records) {
      const existing = await prisma.protection.findFirst({
        where: { type: rec.type }
      });
      if (existing) {
        await prisma.protection.update({
          where: { id: existing.id },
          data: {
            frais_par_jour: rec.frais_par_jour,
            proprietes: rec.proprietes
          }
        });
      } else {
        await prisma.protection.create({ data: rec });
      }
    }
    console.log('✅ Protection types seeded.');
    console.log('🔧 Seeding pickup sites...');
    const pickupSites = [
      { nom: 'Casablanca Aéroport' },
      { nom: 'Casablanca Ville' },
      { nom: 'Rabat Ville' },
      { nom: 'Marrakech Aéroport' },
    ];
    for (const site of pickupSites) {
      const existing = await prisma.pickupSite.findFirst({
        where: { nom: site.nom }
      });
      if (existing) {
        if (existing.is_active !== true) {
          await prisma.pickupSite.update({
            where: { id: existing.id },
            data: { is_active: true }
          });
        }
      } else {
        await prisma.pickupSite.create({
          data: { nom: site.nom, is_active: true }
        });
      }
    }
    console.log('✅ Pickup sites seeded.');
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedProtection();
