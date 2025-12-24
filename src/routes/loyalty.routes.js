const express = require('express');
const loyaltyController = require('../controllers/loyalty.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validateId } = require('../middlewares/validation.middleware');
const { validatePoints, checkLoyaltyAccount } = require('../middlewares/loyalty.middleware');

const router = express.Router();

/**
 * Public routes
 */
// GET /api/loyalty/tiers - Get all loyalty tiers
router.get('/tiers', loyaltyController.getAllTiers);

/**
 * Protected routes (User must be authenticated)
 */
// GET /api/loyalty/account - Get current user loyalty information
router.get('/account', verifyToken, loyaltyController.getUserLoyaltyInfo);

// GET /api/loyalty/account/:userId - Get specific user loyalty information
router.get('/account/:userId', verifyToken, loyaltyController.getUserLoyaltyInfo);

// POST /api/loyalty/calculate-points - Calculate points for booking amount
router.post('/calculate-points', verifyToken, loyaltyController.calculatePoints);

// POST /api/loyalty/add-points - Add points to user account (Admin or system)
router.post('/add-points', verifyToken, requireAdmin, loyaltyController.addPoints);

// POST /api/loyalty/redeem-points - Redeem points for discount
router.post('/redeem-points', verifyToken, validatePoints(100), loyaltyController.redeemPoints);

// GET /api/loyalty/rewards - Get available rewards for user
router.get('/rewards', verifyToken, loyaltyController.getAvailableRewards);

// POST /api/loyalty/redeem-reward - Redeem a specific reward
router.post('/redeem-reward', verifyToken, loyaltyController.redeemReward);

// GET /api/loyalty/transactions - Get current user transaction history
router.get('/transactions', verifyToken, loyaltyController.getTransactionHistory);

// GET /api/loyalty/transactions/:userId - Get specific user transaction history
router.get('/transactions/:userId', verifyToken, loyaltyController.getTransactionHistory);

// POST /api/loyalty/calculate-discount - Calculate discount based on tier
router.post('/calculate-discount', verifyToken, loyaltyController.calculateDiscount);

/**
 * Admin routes
 */
// GET /api/loyalty/admin/accounts - Get all loyalty accounts
router.get('/admin/accounts', verifyToken, requireAdmin, loyaltyController.getAllLoyaltyAccounts);

// POST /api/loyalty/admin/points/award - Award points manually
router.post('/admin/points/award', verifyToken, requireAdmin, loyaltyController.awardPointsManually);

// Tier management
router.post('/admin/tiers', verifyToken, requireAdmin, loyaltyController.createTier);
router.put('/admin/tiers/:id', verifyToken, requireAdmin, validateId, loyaltyController.updateTier);

// Reward management
router.post('/admin/rewards', verifyToken, requireAdmin, loyaltyController.createReward);
router.put('/admin/rewards/:id', verifyToken, requireAdmin, validateId, loyaltyController.updateReward);
router.delete('/admin/rewards/:id', verifyToken, requireAdmin, validateId, loyaltyController.deleteReward);

// Apply error handler at the end
router.use(loyaltyController.handleLoyaltyErrors);

module.exports = router;
