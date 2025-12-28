const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('📡 Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    console.log('🔍 Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test successful:', result);
    
    // Check if tables exist
    console.log('📋 Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📊 Existing tables:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'P1001') {
      console.log('💡 Suggestions:');
      console.log('1. Check if your Supabase project is active');
      console.log('2. Verify the database URL is correct');
      console.log('3. Check if your IP is whitelisted in Supabase');
      console.log('4. Try using the direct connection URL instead of pooler');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
