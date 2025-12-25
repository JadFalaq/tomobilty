const express = require('express');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validatePagination } = require('../middlewares/validation.middleware');
const { getDashboardStats } = require('../controllers/admin/stats.admin.controller.simple');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireAdmin);

// Stats endpoint
router.get('/stats', getDashboardStats);

// Database schema fix endpoint (temporary)
router.post('/fix-schema', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    
    console.log('🔧 Début de la correction du schéma de base de données...');

    // 1. Vérifier et ajouter la colonne lifetime_points si manquante
    try {
      await prisma.$queryRaw`SELECT lifetime_points FROM loyalty_account LIMIT 1`;
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

    // 2. Vérifier et créer la table loyalty_transaction si elle n'existe pas
    try {
      await prisma.$queryRaw`SELECT id FROM loyalty_transaction LIMIT 1`;
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
      }
    }

    // 3. Mettre à jour lifetime_points pour les comptes existants
    await prisma.$executeRaw`
      UPDATE loyalty_account 
      SET lifetime_points = points_balance 
      WHERE lifetime_points = 0 AND points_balance > 0
    `;

    res.json({
      success: true,
      message: 'Schéma de base de données corrigé avec succès',
      data: {
        fixed: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction du schéma:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction du schéma',
      error: error.message
    });
  }
});

// Placeholder routes - these can be implemented later
router.get('/dashboard', async (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard endpoint',
    data: {
      stats: {
        totalUsers: 0,
        totalCars: 0,
        totalBookings: 0,
        revenue: 0
      }
    }
  });
});

router.get('/users', validatePagination, async (req, res) => {
  res.json({
    success: true,
    message: 'Admin users endpoint',
    data: {
      users: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    }
  });
});

module.exports = router;
