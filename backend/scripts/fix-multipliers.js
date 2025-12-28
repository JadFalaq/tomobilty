const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function fixMultipliers() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔧 Fixing tier multipliers directly in database...');
    
    // Update each tier individually with raw SQL
    await prisma.$executeRaw`UPDATE loyalty_tier SET points_multiplier = 1.0, max_points = 999 WHERE name = 'Bronze'`;
    await prisma.$executeRaw`UPDATE loyalty_tier SET points_multiplier = 1.5, max_points = 2999 WHERE name = 'Argent'`;
    await prisma.$executeRaw`UPDATE loyalty_tier SET points_multiplier = 2.0, max_points = 6999 WHERE name = 'Or'`;
    await prisma.$executeRaw`UPDATE loyalty_tier SET points_multiplier = 3.0, max_points = NULL WHERE name = 'Platine'`;
    
    console.log('✅ Updated all tier multipliers');
    
    // Verify with raw SQL
    const tiers = await prisma.$queryRaw`
      SELECT name, min_points, max_points, discount_percent, points_multiplier 
      FROM loyalty_tier 
      ORDER BY min_points ASC
    `;
    
    console.log('\n🔍 Verified tiers:');
    tiers.forEach(tier => {
      console.log(`  - ${tier.name}: ${tier.min_points}-${tier.max_points || '∞'} points, ${tier.discount_percent}% discount, x${tier.points_multiplier} multiplier`);
    });

    console.log('\n✅ All multipliers fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing multipliers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMultipliers();
