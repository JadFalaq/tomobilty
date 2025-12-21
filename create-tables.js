const { Client } = require('pg');
require('dotenv').config();

async function createTables() {
  console.log('🚀 Creating essential tables in Supabase...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100),
        prenom VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        telephone VARCHAR(20),
        mot_de_passe VARCHAR(255),
        role VARCHAR(20) DEFAULT 'CLIENT',
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Create car_brand table
    await client.query(`
      CREATE TABLE IF NOT EXISTS car_brand (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create car_category table  
    await client.query(`
      CREATE TABLE IF NOT EXISTS car_category (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create car table
    await client.query(`
      CREATE TABLE IF NOT EXISTS car (
        id SERIAL PRIMARY KEY,
        brand_id INTEGER REFERENCES car_brand(id),
        category_id INTEGER REFERENCES car_category(id),
        modele VARCHAR(100) NOT NULL,
        annee INTEGER NOT NULL,
        immatriculation VARCHAR(20) UNIQUE NOT NULL,
        prix_par_jour DECIMAL(10,2) NOT NULL,
        disponible BOOLEAN DEFAULT TRUE,
        ville VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert sample data
    await client.query(`
      INSERT INTO car_brand (name) VALUES ('Dacia'), ('Renault') 
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO car_category (name, description) VALUES 
      ('Économique', 'Voitures économiques'),
      ('Compacte', 'Voitures compactes')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Tables created and sample data inserted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTables();
