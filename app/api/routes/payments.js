const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Routes temporaires - à implémenter avec Stripe
router.post('/create-session', authMiddleware.protect, async (req, res) => {
  res.json({ 
    message: 'Paiement Stripe à implémenter',
    data: req.body 
  });
});

router.post('/webhook', async (req, res) => {
  res.json({ message: 'Webhook Stripe à implémenter' });
});

module.exports = router;
