const express = require('express');
const loyaltyController = require('../controllers/loyalty.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validateId } = require('../middlewares/validation.middleware');

const router = express.Router();

// Protected routes (User must be authenticated)
router.get('/account', verifyToken, loyaltyController.getLoyaltyAccount);
router.get('/rewards', verifyToken, loyaltyController.getAvailableRewards);
router.post('/rewards/:id/redeem', verifyToken, validateId, loyaltyController.redeemReward);
router.get('/transactions', verifyToken, loyaltyController.getLoyaltyTransactions);
router.get('/tiers', loyaltyController.getLoyaltyTiers);

// Admin routes
router.get('/admin/accounts', verifyToken, requireAdmin, loyaltyController.getAllLoyaltyAccounts);
router.post('/admin/points/award', verifyToken, requireAdmin, loyaltyController.awardPointsManually);
router.post('/admin/tiers', verifyToken, requireAdmin, loyaltyController.createTier);
router.put('/admin/tiers/:id', verifyToken, requireAdmin, validateId, loyaltyController.updateTier);
router.post('/admin/rewards', verifyToken, requireAdmin, loyaltyController.createReward);
router.put('/admin/rewards/:id', verifyToken, requireAdmin, validateId, loyaltyController.updateReward);
router.delete('/admin/rewards/:id', verifyToken, requireAdmin, validateId, loyaltyController.deleteReward);

module.exports = router;
