const express = require('express');
const { getPickupSites } = require('../controllers/booking.controller');

const router = express.Router();

// Public endpoint: GET /api/pickup-sites
router.get('/', getPickupSites);

module.exports = router;

