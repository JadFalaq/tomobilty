const express = require('express');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validatePagination } = require('../middlewares/validation.middleware');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireAdmin);

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
