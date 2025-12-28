const express = require('express');
const reviewController = require('../controllers/review.controller');
const { verifyToken, requireAdmin, optionalAuth } = require('../middlewares/auth.middleware');
const { validateReviewCreation, validateId, validatePagination } = require('../middlewares/validation.middleware');

const router = express.Router();

// Public routes
router.get('/', validatePagination, optionalAuth, reviewController.getReviews);
router.get('/car/:carId', validateId, optionalAuth, reviewController.getReviewsByCar);

// Protected routes (User must be authenticated)
router.post('/', verifyToken, validateReviewCreation, reviewController.createReview);
router.get('/my-reviews', verifyToken, validatePagination, reviewController.getUserReviews);
router.put('/:id', verifyToken, validateId, reviewController.updateReview);
router.delete('/:id', verifyToken, validateId, reviewController.deleteReview);

// Admin routes
router.get('/admin/all', verifyToken, requireAdmin, validatePagination, reviewController.getAllReviews);
router.put('/:id/verify', verifyToken, requireAdmin, validateId, reviewController.verifyReview);
router.delete('/admin/:id', verifyToken, requireAdmin, validateId, reviewController.deleteReviewAdmin);

module.exports = router;
