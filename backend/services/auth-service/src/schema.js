const { query } = require('./database');

const ensureSchema = async () => {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telephone VARCHAR(20),
    mot_de_passe VARCHAR(255),
    role VARCHAR(20) DEFAULT 'client',
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await query(`CREATE TABLE IF NOT EXISTS oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  try {
    await query(`ALTER TABLE oauth_accounts ADD CONSTRAINT oauth_accounts_unique UNIQUE (provider, provider_account_id)`);
  } catch (e) {
    // Ignore if constraint already exists
  }

  await query(`CREATE TABLE IF NOT EXISTS phone_verifications (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add missing columns for profile
  try {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse JSONB`);
  } catch (e) {
    console.log('Column adresse might already exist');
  }

  try {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permis_conduire JSONB`);
  } catch (e) {
    console.log('Column permis_conduire might already exist');
  }
};

module.exports = { ensureSchema };
