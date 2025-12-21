const express = require('express');
const router = express.Router();
const carsController = require('../controllers/carsController');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.get('/', carsController.getCars);
router.get('/:id', carsController.getCar);
router.post('/:id/availability', carsController.checkAvailability);

// Routes admin
router.post('/', authMiddleware.protect, authMiddleware.requireAdmin, carsController.createCar);
router.put('/:id', authMiddleware.protect, authMiddleware.requireAdmin, carsController.updateCar);
router.delete('/:id', authMiddleware.protect, authMiddleware.requireAdmin, carsController.deleteCar);

module.exports = router;
