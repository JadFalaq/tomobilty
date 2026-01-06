const express = require('express');
const carController = require('../controllers/car.controller');
const { verifyToken, requireAdmin, optionalAuth } = require('../middlewares/auth.middleware');
const { 
  validateCarCreation, 
  validateId, 
  validatePagination, 
  validateCarFilters 
} = require('../middlewares/validation.middleware');

const router = express.Router();

// Public routes
router.get('/', validatePagination, validateCarFilters, optionalAuth, carController.getCars);
router.get('/search', validateCarFilters, optionalAuth, carController.searchCars);
router.get('/brands', carController.getBrands);
router.get('/categories', carController.getCategories);
router.get('/available', carController.getAvailableCars);
router.get('/least-demanded', optionalAuth, carController.getLeastDemandedCars);
router.get('/:id', validateId, optionalAuth, carController.getCarById);
router.get('/:id/availability', validateId, carController.checkAvailability);

// Protected routes (Admin only)
router.post('/', verifyToken, requireAdmin, validateCarCreation, carController.createCar);
router.put('/:id', verifyToken, requireAdmin, validateId, carController.updateCar);
router.delete('/:id', verifyToken, requireAdmin, validateId, carController.deleteCar);
router.post('/:id/images', verifyToken, requireAdmin, validateId, carController.uploadCarImages);
router.delete('/:id/images/:imageId', verifyToken, requireAdmin, carController.deleteCarImage);

// Brand management (Admin only)
router.post('/brands', verifyToken, requireAdmin, carController.createBrand);
router.put('/brands/:id', verifyToken, requireAdmin, validateId, carController.updateBrand);
router.delete('/brands/:id', verifyToken, requireAdmin, validateId, carController.deleteBrand);

// Category management (Admin only)
router.post('/categories', verifyToken, requireAdmin, carController.createCategory);
router.put('/categories/:id', verifyToken, requireAdmin, validateId, carController.updateCategory);
router.delete('/categories/:id', verifyToken, requireAdmin, validateId, carController.deleteCategory);

module.exports = router;
