const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function fixLoyaltyData() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Fixing loyalty data in Supabase...');
    
    // Update tiers with correct multipliers
    const tierUpdates = [
      { name: 'Bronze', points_multiplier: 1.0 },
      { name: 'Argent', points_multiplier: 1.5 },
      { name: 'Or', points_multiplier: 2.0 },
      { name: 'Platine', points_multiplier: 3.0 }
    ];

    for (const update of tierUpdates) {
      await prisma.loyaltyTier.updateMany({
        where: { name: update.name },
        data: { points_multiplier: update.points_multiplier }
      });
      console.log(`✅ Updated ${update.name} tier with multiplier x${update.points_multiplier}`);
    }

    // Verify the updates
    console.log('\n🔍 Verifying updated tiers:');
    const updatedTiers = await prisma.loyaltyTier.findMany({
      orderBy: { min_points: 'asc' }
    });
    
    updatedTiers.forEach(tier => {
      console.log(`  - ${tier.name}: ${tier.min_points}+ points, ${tier.discount_percent}% discount, x${tier.points_multiplier} multiplier`);
    });

    console.log('\n✅ Loyalty data fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing loyalty data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixLoyaltyData();
