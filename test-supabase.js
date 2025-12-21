const { Client } = require('pg');
require('dotenv').config({ override: true });

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    
    console.log('🎉 Supabase connection working!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testSupabase();
