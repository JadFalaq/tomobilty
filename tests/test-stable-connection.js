const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function testStableConnection() {
  console.log('🔍 Testing stable connection to Supabase...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test multiple connections in sequence
    for (let i = 1; i <= 5; i++) {
      console.log(`\n📡 Connection test ${i}/5...`);
      
      await prisma.$connect();
      console.log(`✅ Connection ${i} successful`);
      
      // Test a simple query
      const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
      console.log(`⏰ Server time: ${result[0].current_time}`);
      
      // Test loyalty data
      const tiersCount = await prisma.loyaltyTier.count();
      console.log(`📊 Found ${tiersCount} loyalty tiers`);
      
      await prisma.$disconnect();
      console.log(`🔌 Connection ${i} closed`);
      
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n✅ All connection tests passed! Database is stable.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Troubleshooting suggestions:');
      console.log('1. Check if Supabase project is active and not paused');
      console.log('2. Verify database URL is correct');
      console.log('3. Check if your IP is whitelisted');
      console.log('4. Try using direct connection instead of pooler');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testStableConnection();
