const { Client } = require('pg');
require('dotenv').config();

async function checkExistingDatabase() {
  console.log('🔍 Checking existing Supabase database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to existing Supabase database');

    // List all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📋 Existing tables in your database:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    // Check some common tables and their structure
    const commonTables = ['users', 'car', 'booking', 'reservations'];
    
    for (const tableName of commonTables) {
      try {
        const tableCheck = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);

        if (tableCheck.rows.length > 0) {
          console.log(`\n📊 Structure of table "${tableName}":`);
          tableCheck.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
          });

          // Get row count
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  📈 Rows: ${countResult.rows[0].count}`);
        }
      } catch (error) {
        // Table doesn't exist, skip
      }
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

checkExistingDatabase();
