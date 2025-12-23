require('dotenv').config();
const prisma = require('./src/config/prisma');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database with default data...');

    // Check if loyalty tiers exist
    const tierCount = await prisma.loyaltyTier.count();
    
    if (tierCount === 0) {
      console.log('📊 Creating default loyalty tiers...');
      await prisma.loyaltyTier.createMany({
        data: [
          {
            name: 'Bronze',
            min_points: 0,
            discount_percent: 0,
            benefits: 'Accès aux offres de base'
          },
          {
            name: 'Argent',
            min_points: 500,
            discount_percent: 5,
            benefits: '5% de réduction sur toutes les réservations'
          },
          {
            name: 'Or',
            min_points: 1500,
            discount_percent: 10,
            benefits: '10% de réduction + priorité sur les réservations'
          },
          {
            name: 'Platine',
            min_points: 3000,
            discount_percent: 15,
            benefits: '15% de réduction + surclassements gratuits + support prioritaire'
          }
        ]
      });
      console.log('✅ Loyalty tiers created');
    } else {
      console.log(`✓ Loyalty tiers already exist (${tierCount} tiers)`);
    }

    // Check if booking statuses exist
    const statusCount = await prisma.bookingStatus.count();
    
    if (statusCount === 0) {
      console.log('📊 Creating default booking statuses...');
      await prisma.bookingStatus.createMany({
        data: [
          { name: 'PENDING', description: 'En attente de confirmation' },
          { name: 'CONFIRMED', description: 'Réservation confirmée' },
          { name: 'IN_PROGRESS', description: 'Location en cours' },
          { name: 'COMPLETED', description: 'Location terminée' },
          { name: 'CANCELLED', description: 'Réservation annulée' },
          { name: 'REJECTED', description: 'Réservation rejetée' }
        ]
      });
      console.log('✅ Booking statuses created');
    } else {
      console.log(`✓ Booking statuses already exist (${statusCount} statuses)`);
    }

    console.log('\n✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
