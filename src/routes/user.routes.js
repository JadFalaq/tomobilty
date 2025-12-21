const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validateId, validatePagination } = require('../middlewares/validation.middleware');

const router = express.Router();

// Protected routes (User must be authenticated)
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);
router.get('/bookings', verifyToken, userController.getUserBookings);
router.get('/notifications', verifyToken, userController.getNotifications);
router.put('/notifications/:id/read', verifyToken, validateId, userController.markNotificationAsRead);
router.delete('/notifications/:id', verifyToken, validateId, userController.deleteNotification);

// Admin routes
router.get('/', verifyToken, requireAdmin, validatePagination, userController.getAllUsers);
router.get('/:id', verifyToken, requireAdmin, validateId, userController.getUserById);
router.put('/:id/role', verifyToken, requireAdmin, validateId, userController.updateUserRole);
router.delete('/:id', verifyToken, requireAdmin, validateId, userController.deleteUser);

module.exports = router;
