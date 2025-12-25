const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function migrateLoyaltySchema() {
  // Force the correct DATABASE_URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔧 Migrating loyalty schema...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? 'Set correctly' : 'Not set');
    
    // Check if points_multiplier column exists
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'loyalty_tier' 
        AND column_name = 'points_multiplier'
      `;
      
      if (result.length === 0) {
        console.log('➕ Adding points_multiplier column...');
        await prisma.$executeRaw`
          ALTER TABLE loyalty_tier 
          ADD COLUMN points_multiplier DECIMAL(3,1) DEFAULT 1.0
        `;
        console.log('✅ Added points_multiplier column');
      } else {
        console.log('✅ points_multiplier column already exists');
      }
    } catch (error) {
      console.error('Error checking/adding column:', error);
    }

    // Check if max_points column exists
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'loyalty_tier' 
        AND column_name = 'max_points'
      `;
      
      if (result.length === 0) {
        console.log('➕ Adding max_points column...');
        await prisma.$executeRaw`
          ALTER TABLE loyalty_tier 
          ADD COLUMN max_points INTEGER
        `;
        console.log('✅ Added max_points column');
      } else {
        console.log('✅ max_points column already exists');
      }
    } catch (error) {
      console.error('Error checking/adding max_points column:', error);
    }

    // Update tiers with correct data
    console.log('🔄 Updating tier data...');
    
    const tierUpdates = [
      { name: 'Bronze', points_multiplier: 1.0, max_points: 999 },
      { name: 'Argent', points_multiplier: 1.5, max_points: 2999 },
      { name: 'Or', points_multiplier: 2.0, max_points: 6999 },
      { name: 'Platine', points_multiplier: 3.0, max_points: null }
    ];

    for (const update of tierUpdates) {
      await prisma.$executeRaw`
        UPDATE loyalty_tier 
        SET points_multiplier = ${update.points_multiplier}, 
            max_points = ${update.max_points}
        WHERE name = ${update.name}
      `;
      console.log(`✅ Updated ${update.name} tier`);
    }

    // Verify the updates
    console.log('\n🔍 Verifying updated tiers:');
    const updatedTiers = await prisma.loyaltyTier.findMany({
      orderBy: { min_points: 'asc' }
    });
    
    updatedTiers.forEach(tier => {
      console.log(`  - ${tier.name}: ${tier.min_points}-${tier.max_points || '∞'} points, ${tier.discount_percent}% discount, x${tier.points_multiplier} multiplier`);
    });

    console.log('\n✅ Loyalty schema migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error migrating loyalty schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateLoyaltySchema();
