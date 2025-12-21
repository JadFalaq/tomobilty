const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Routes temporaires - à implémenter avec chatbot
router.post('/message', authMiddleware.optionalAuth, async (req, res) => {
  res.json({ 
    message: 'Chatbot à implémenter',
    response: 'Bonjour ! Comment puis-je vous aider ?',
    data: req.body 
  });
});

router.get('/conversations', authMiddleware.protect, async (req, res) => {
  res.json({ 
    message: 'Historique conversations à implémenter',
    conversations: [] 
  });
});

module.exports = router;
