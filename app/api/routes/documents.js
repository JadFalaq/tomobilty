const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Routes temporaires - à implémenter avec OCR
router.post('/upload', authMiddleware.protect, async (req, res) => {
  res.json({ 
    message: 'Upload de documents à implémenter',
    data: req.body 
  });
});

router.post('/ocr-scan', authMiddleware.protect, async (req, res) => {
  res.json({ 
    message: 'OCR scanning à implémenter',
    data: req.body 
  });
});

module.exports = router;
