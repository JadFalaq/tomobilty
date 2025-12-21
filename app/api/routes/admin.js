const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Routes admin
router.get('/dashboard', authMiddleware.protect, authMiddleware.requireAdmin, async (req, res) => {
  res.json({ 
    message: 'Dashboard admin à implémenter',
    stats: {
      totalUsers: 0,
      totalCars: 0,
      totalBookings: 0,
      revenue: 0
    }
  });
});

router.get('/users', authMiddleware.protect, authMiddleware.requireAdmin, async (req, res) => {
  res.json({ 
    message: 'Liste utilisateurs à implémenter',
    users: [] 
  });
});

module.exports = router;
