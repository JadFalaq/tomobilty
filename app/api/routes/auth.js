const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.post('/inscription', authController.inscription);
router.post('/connexion', authController.connexion);
router.get('/verify-email', authController.verifyEmail);
router.post('/oauth/google', authController.googleOAuth);

// Routes protégées
router.get('/profil', authMiddleware.protect, authController.getProfil);
router.put('/profil', authMiddleware.protect, authController.updateProfil);

module.exports = router;
