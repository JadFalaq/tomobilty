const express = require('express');
const { listProtections } = require('../controllers/protection.controller');

const router = express.Router();

// Public
router.get('/', listProtections);

module.exports = router;
