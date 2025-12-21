const { Client } = require('pg');
require('dotenv').config();

async function initializeDatabase() {
  console.log('🚀 Initializing Supabase database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase successfully!');

    // Create basic tables for testing
    console.log('📋 Creating basic tables...');

    // Users table
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
        phone_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Car brands table
    await client.query(`
      CREATE TABLE IF NOT EXISTS car_brand (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Car brands table created');

    // Car categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS car_category (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Car categories table created');

    // Cars table
    await client.query(`
      CREATE TABLE IF NOT EXISTS car (
        id SERIAL PRIMARY KEY,
        brand_id INTEGER REFERENCES car_brand(id),
        category_id INTEGER REFERENCES car_category(id),
        modele VARCHAR(100) NOT NULL,
        annee INTEGER NOT NULL,
        couleur VARCHAR(50),
        immatriculation VARCHAR(20) UNIQUE NOT NULL,
        prix_par_jour DECIMAL(10,2) NOT NULL,
        caution DECIMAL(10,2) DEFAULT 0,
        disponible BOOLEAN DEFAULT TRUE,
        statut VARCHAR(20) DEFAULT 'DISPONIBLE',
        ville VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Cars table created');

    // Booking status table
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_status (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT
      )
    `);
    console.log('✅ Booking status table created');

    // Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        car_id INTEGER REFERENCES car(id),
        status_id INTEGER REFERENCES booking_status(id) DEFAULT 1,
        date_debut TIMESTAMP NOT NULL,
        date_fin TIMESTAMP NOT NULL,
        prix_total DECIMAL(10,2) NOT NULL,
        paiement_effectue BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Bookings table created');

    // Insert default data
    console.log('📊 Inserting default data...');

    // Default booking statuses
    await client.query(`
      INSERT INTO booking_status (name, description) VALUES
      ('PENDING', 'Réservation en attente'),
      ('CONFIRMED', 'Réservation confirmée'),
      ('CANCELLED', 'Réservation annulée'),
      ('COMPLETED', 'Réservation terminée')
      ON CONFLICT (name) DO NOTHING
    `);

    // Default car brands
    await client.query(`
      INSERT INTO car_brand (name) VALUES
      ('Dacia'),
      ('Renault'),
      ('Peugeot'),
      ('Citroën'),
      ('Toyota'),
      ('Hyundai')
      ON CONFLICT (name) DO NOTHING
    `);

    // Default car categories
    await client.query(`
      INSERT INTO car_category (name, description) VALUES
      ('Économique', 'Voitures économiques et pratiques'),
      ('Compacte', 'Voitures compactes pour la ville'),
      ('Berline', 'Voitures berlines confortables'),
      ('SUV', 'Véhicules utilitaires sport'),
      ('Luxe', 'Voitures de luxe haut de gamme')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Default data inserted successfully');

    // Test query
    const result = await client.query('SELECT COUNT(*) as total FROM users');
    console.log(`📊 Database initialized! Users count: ${result.rows[0].total}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

initializeDatabase()
  .then(() => {
    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database initialization failed:', error);
    process.exit(1);
  });
