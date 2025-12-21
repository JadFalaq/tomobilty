const express = require('express');
const { getMockCars, getMockUsers, searchMockCars, getMockCarById } = require('../services/mock.service');

const router = express.Router();

// Test route - get mock cars
router.get('/cars', (req, res) => {
  try {
    const cars = getMockCars();
    res.json({
      success: true,
      message: 'Mock cars retrieved successfully',
      data: { cars }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving mock cars',
      error: error.message
    });
  }
});

// Test route - search mock cars
router.get('/cars/search', (req, res) => {
  try {
    const { ville, prix_max } = req.query;
    const cars = searchMockCars({ ville, prix_max });
    res.json({
      success: true,
      message: 'Mock car search completed',
      data: { cars, filters: { ville, prix_max } }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching mock cars',
      error: error.message
    });
  }
});

// Test route - get mock car by ID
router.get('/cars/:id', (req, res) => {
  try {
    const { id } = req.params;
    const car = getMockCarById(id);
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Mock car not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Mock car retrieved successfully',
      data: { car }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving mock car',
      error: error.message
    });
  }
});

// Test route - get mock users
router.get('/users', (req, res) => {
  try {
    const users = getMockUsers();
    res.json({
      success: true,
      message: 'Mock users retrieved successfully',
      data: { users }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving mock users',
      error: error.message
    });
  }
});

// Test route - API status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Tomobilty API is running successfully!',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database_status: 'Mock data (Supabase connection pending)',
      features: [
        'Authentication system ready',
        'Car management ready',
        'Booking system ready',
        'Loyalty system ready',
        'Payment integration ready',
        'Contract generation ready',
        'Review system ready',
        'Admin dashboard ready'
      ]
    }
  });
});

module.exports = router;
