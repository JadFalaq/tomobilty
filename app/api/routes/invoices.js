const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Routes temporaires - à implémenter
router.get('/', authMiddleware.protect, async (req, res) => {
  res.json({ 
    message: 'Factures à implémenter',
    invoices: [] 
  });
});

router.get('/:id', authMiddleware.protect, async (req, res) => {
  res.json({ 
    message: 'Détail facture à implémenter',
    id: req.params.id 
  });
});

module.exports = router;
