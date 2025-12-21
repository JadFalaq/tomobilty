const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function testConnection() {
  console.log('🔍 Testing fixed Supabase connection...');
  console.log('📍 Host:', process.env.DATABASE_URL.match(/@([^:]+)/)?.[1] || 'Unknown');
  console.log('📍 Port:', process.env.DATABASE_URL.match(/:(\d+)/)?.[1] || 'Unknown');
  
  const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await prisma.$connect();
    console.log('✅ Prisma connected successfully!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL version:', result[0].version.split(' ')[0]);
    
    // Test table listing
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `;
    console.log('📋 Sample tables:', tables.map(t => t.table_name).join(', '));
    
    console.log('🎉 Connection test successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error code:', error.code);
    return false;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Connection closed');
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
