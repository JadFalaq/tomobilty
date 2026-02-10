const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ override: true });

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
const protectionRoutes = require('../src/routes/protection.routes');
const pickupSiteRoutes = require('../src/routes/pickupsite.routes');

// Import middlewares
const { errorHandler } = require('../src/middlewares/errorHandler.middleware');
const { publicGetLimiter, writeLimiter } = require('../src/middlewares/rateLimit.middleware');
const { sanitizeRequest } = require('../src/middlewares/validation.middleware');

const app = express();

// Security middleware
app.use(helmet());

app.set('etag', false);

// Request logging with request id
const requestLogger = require('../src/middlewares/requestLogger.middleware');
app.use(requestLogger);

// CORS configuration (allow dev ports 3000/3001 and Authorization header)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeRequest);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

app.use((req, res, next) => {
  const skipPaths = [
    '/api/payments/cmi/ipn',
    '/api/payments/stripe/webhook'
  ];

  if (skipPaths.some((p) => req.path.startsWith(p))) {
    return next();
  }

  if (req.method === 'GET') {
    return publicGetLimiter(req, res, next);
  }
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    return writeLimiter(req, res, next);
  }
  next();
});

// Health routes
app.use('/api', require('../src/routes/health.routes'));

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
app.use('/api/protections', protectionRoutes);
app.use('/api/pickup-sites', pickupSiteRoutes);

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
if (process.env.NODE_ENV !== 'production' && !process.env.JEST_WORKER_ID) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Tommobilty API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel
module.exports = app;

// Background jobs
try {
  if (process.env.ENABLE_BOOKING_CLEANUP === 'true') {
    const { start } = require('../src/jobs/cancelExpiredBookings');
    start();
  }
} catch (e) {}
