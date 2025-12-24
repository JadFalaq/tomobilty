/**
 * Script pour corriger le schéma de base de données
 * Ajoute les colonnes manquantes et synchronise avec le schéma Prisma
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabaseSchema() {
  console.log('🔧 Début de la correction du schéma de base de données...');

  try {
    // 1. Vérifier si la colonne lifetime_points existe
    console.log('📊 Vérification de la colonne lifetime_points...');
    
    try {
      await prisma.$queryRaw`
        SELECT lifetime_points FROM loyalty_account LIMIT 1
      `;
      console.log('✅ La colonne lifetime_points existe déjà');
    } catch (error) {
      if (error.message.includes('lifetime_points') && error.message.includes('does not exist')) {
        console.log('➕ Ajout de la colonne lifetime_points...');
        
        await prisma.$executeRaw`
          ALTER TABLE loyalty_account 
          ADD COLUMN IF NOT EXISTS lifetime_points INTEGER DEFAULT 0
        `;
        
        console.log('✅ Colonne lifetime_points ajoutée avec succès');
      } else {
        throw error;
      }
    }

    // 2. Vérifier et créer la table LoyaltyTransaction si elle n'existe pas
    console.log('📊 Vérification de la table loyalty_transaction...');
    
    try {
      await prisma.$queryRaw`
        SELECT id FROM loyalty_transaction LIMIT 1
      `;
      console.log('✅ La table loyalty_transaction existe déjà');
    } catch (error) {
      if (error.message.includes('loyalty_transaction') && error.message.includes('does not exist')) {
        console.log('➕ Création de la table loyalty_transaction...');
        
        // Créer l'enum si il n'existe pas
        await prisma.$executeRaw`
          DO $$ BEGIN
            CREATE TYPE loyalty_transaction_type AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `;
        
        // Créer la table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS loyalty_transaction (
            id SERIAL PRIMARY KEY,
            loyalty_account_id INTEGER NOT NULL,
            booking_id INTEGER,
            type loyalty_transaction_type NOT NULL,
            points INTEGER NOT NULL,
            description TEXT,
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loyalty_account_id) REFERENCES loyalty_account(id) ON DELETE CASCADE,
            FOREIGN KEY (booking_id) REFERENCES booking(id)
          )
        `;
        
        console.log('✅ Table loyalty_transaction créée avec succès');
      } else {
        throw error;
      }
    }

    // 3. Vérifier les autres tables importantes
    console.log('📊 Vérification des autres tables...');
    
    const tables = [
      'loyalty_tier',
      'loyalty_account', 
      'loyalty_reward',
      'booking',
      'car',
      'user'
    ];

    for (const table of tables) {
      try {
        await prisma.$queryRaw`SELECT 1 FROM ${prisma.$queryRawUnsafe(`"${table}"`)} LIMIT 1`;
        console.log(`✅ Table ${table} existe`);
      } catch (error) {
        console.log(`❌ Table ${table} manquante:`, error.message);
      }
    }

    // 4. Mettre à jour les données existantes si nécessaire
    console.log('🔄 Mise à jour des données existantes...');
    
    // Mettre à jour lifetime_points pour les comptes existants
    await prisma.$executeRaw`
      UPDATE loyalty_account 
      SET lifetime_points = points_balance 
      WHERE lifetime_points = 0 AND points_balance > 0
    `;

    console.log('✅ Schéma de base de données corrigé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction du schéma:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('🎉 Script terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec du script:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema };
