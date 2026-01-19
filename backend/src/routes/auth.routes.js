const express = require('express');
const authController = require('../controllers/auth.controller');
const { loginLimiter, sensitiveLimiter } = require('../middlewares/rateLimit.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require('../middlewares/validation.middleware');

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/inscription', validateUserRegistration, authController.register);
router.post('/login', loginLimiter, validateUserLogin, authController.login);
router.post('/connexion', loginLimiter, validateUserLogin, authController.login);
router.post('/forgot-password', sensitiveLimiter, authController.forgotPassword);
router.post('/reset-password', sensitiveLimiter, authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Phone verification
router.post('/send-phone-code', authController.sendPhoneVerificationCode);
router.post('/verify-phone', authController.verifyPhone);

// OAuth routes
router.post('/google', loginLimiter, authController.googleAuth);

// Protected routes
router.post('/refresh-token', sensitiveLimiter, authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
