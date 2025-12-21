// API Monolithique Tomobilty - Optimisée pour Vercel
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Configuration pour Vercel
app.use(helmet({
  contentSecurityPolicy: false, // Vercel gère la sécurité
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes API - Toutes fusionnées
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// Route de santé pour Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'tomobilty-monolith',
    platform: 'vercel'
  });
});

// Route racine
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Tomobilty API - Monolithe sur Vercel',
    version: '2.0.0',
    endpoints: [
      '/api/auth - Authentification',
      '/api/cars - Gestion des voitures', 
      '/api/bookings - Réservations',
      '/api/payments - Paiements Stripe',
      '/api/invoices - Facturation',
      '/api/documents - OCR et documents',
      '/api/chat - Chatbot',
      '/api/admin - Administration'
    ]
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur API:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Route 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.path} non trouvée` });
});

// Export pour Vercel
module.exports = app;
