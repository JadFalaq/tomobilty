const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function migratePaymentModeData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔧 Normalisation des valeurs booking.mode_paiement avant migration...');

    const res1 = await prisma.$executeRawUnsafe(`
      UPDATE booking 
      SET mode_paiement = 'EN_LIGNE'
      WHERE mode_paiement IN ('en ligne','EN_LIGNE','stripe','cmi','online','en_ligne','EN-LIGNE')
    `);
    console.log('EN_LIGNE rows updated:', res1);

    const res2 = await prisma.$executeRawUnsafe(`
      UPDATE booking 
      SET mode_paiement = 'EN_AGENCE'
      WHERE mode_paiement IN ('en agence','EN_AGENCE','agence','sur_place','sur place')
    `);
    console.log('EN_AGENCE rows updated:', res2);

    const res3 = await prisma.$executeRawUnsafe(`
      UPDATE booking 
      SET mode_paiement = NULL
      WHERE mode_paiement IS NOT NULL
      AND mode_paiement NOT IN ('EN_LIGNE','EN_AGENCE')
    `);
    console.log('NULLed invalid rows:', res3);

    console.log('Normalisation terminée.');
  } catch (e) {
    console.error('❌ Erreur lors de la normalisation:', e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

migratePaymentModeData();
