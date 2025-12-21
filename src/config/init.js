const loyaltyService = require('../services/loyalty.service');
const contractService = require('../services/contract.service');
const prisma = require('./prisma');

// Initialize system with default data
const initializeSystem = async () => {
  try {
    console.log('🚀 Initializing Tomobilty system...');

    // Initialize default loyalty tiers
    await loyaltyService.initializeDefaultTiers();
    console.log('✅ Default loyalty tiers initialized');

    // Initialize default loyalty rewards
    await loyaltyService.initializeDefaultRewards();
    console.log('✅ Default loyalty rewards initialized');

    // Initialize default booking statuses
    await loyaltyService.initializeDefaultBookingStatuses();
    console.log('✅ Default booking statuses initialized');

    // Initialize default contract template
    await contractService.initializeDefaultTemplate();
    console.log('✅ Default contract template initialized');

    // Initialize default car brands if none exist
    const brandCount = await prisma.carBrand.count();
    if (brandCount === 0) {
      await prisma.carBrand.createMany({
        data: [
          { name: 'Dacia', logo_url: null },
          { name: 'Renault', logo_url: null },
          { name: 'Peugeot', logo_url: null },
          { name: 'Citroën', logo_url: null },
          { name: 'Hyundai', logo_url: null },
          { name: 'Kia', logo_url: null },
          { name: 'Toyota', logo_url: null },
          { name: 'Volkswagen', logo_url: null }
        ]
      });
      console.log('✅ Default car brands initialized');
    }

    // Initialize default car categories if none exist
    const categoryCount = await prisma.carCategory.count();
    if (categoryCount === 0) {
      await prisma.carCategory.createMany({
        data: [
          { name: 'Économique', description: 'Voitures économiques et compactes' },
          { name: 'Berline', description: 'Berlines confortables' },
          { name: 'SUV', description: 'Véhicules utilitaires sport' },
          { name: 'Familiale', description: 'Voitures familiales spacieuses' },
          { name: 'Luxe', description: 'Véhicules de luxe' },
          { name: 'Utilitaire', description: 'Véhicules utilitaires' }
        ]
      });
      console.log('✅ Default car categories initialized');
    }

    console.log('🎉 System initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    throw error;
  }
};

module.exports = {
  initializeSystem
};
