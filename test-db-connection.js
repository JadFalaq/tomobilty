const { Client } = require('pg');
require('dotenv').config({ override: true });

// Test de connexion PostgreSQL direct
async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', process.env.DATABASE_URL);
  
  // Extraire les informations de l'URL
  const url = new URL(process.env.DATABASE_URL);
  
  const client = new Client({
    host: url.hostname,
    port: url.port,
    database: url.pathname.slice(1), // Remove leading slash
    user: url.username,
    password: url.password,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test simple query
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version);
    
    // Test if we can create a simple table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Test table created successfully');
    
    // Clean up
    await client.query('DROP TABLE IF EXISTS test_connection');
    console.log('🧹 Test table cleaned up');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

testConnection();
