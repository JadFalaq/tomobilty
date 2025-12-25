const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('../src/routes/auth.routes');
const userRoutes = require('../src/routes/user.routes');
const carRoutes = require('../src/routes/car.routes');
const bookingRoutes = require('../src/routes/booking.routes');
const loyaltyRoutes = require('../src/routes/loyalty.routes');
const paymentRoutes = require('../src/routes/payment.routes');
const contractRoutes = require('../src/routes/contract.routes');
const reviewRoutes = require('../src/routes/review.routes');
const adminRoutesComplete = require('../src/routes/admin.routes.complete');
const testRoutes = require('../src/routes/test.routes');
const protectionRoutes = require('../src/routes/protection.routes');

// Import middlewares
const { errorHandler } = require('../src/middlewares/errorHandler.middleware');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutesComplete);
app.use('/api/test', testRoutes);
app.use('/api/protections', protectionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Tomobilty API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel
module.exports = app;
