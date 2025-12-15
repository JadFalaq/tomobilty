require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use(cors({ origin: '*', credentials: true }));

const SERVICES = {
  auth: process.env.AUTH_URL || 'http://auth-service:8001',
  rental: process.env.RENTAL_URL || 'http://rental-service:8002',
  invoice: process.env.INVOICE_URL || 'http://invoice-service:8003',
  ocr: process.env.OCR_URL || 'http://ocr-service:8004',
  chat: process.env.CHAT_URL || 'http://chatbot-service:8005',
  payment: process.env.PAYMENT_URL || 'http://payment-service:8006',
  admin: process.env.ADMIN_URL || 'http://admin-service:8007'
};

// Proxy upload requests before body parser
app.use('/api/upload', createProxyMiddleware({ target: SERVICES.rental, changeOrigin: true }));
app.use('/uploads', createProxyMiddleware({ target: SERVICES.rental, changeOrigin: true }));

app.use(express.json());

const forward = async (req, res, base, path) => {
  try {
    const url = `${base}${path}`;
    const headers = { ...req.headers };
    const method = req.method.toLowerCase();
    const config = { headers };
    const data = req.body;
    const response = await axios({ url, method, data, headers });
    res.status(response.status).send(response.data);
  } catch (e) {
    console.error('Proxy Error:', e.message);
    if (e.response) {
      console.error('Response Status:', e.response.status);
      console.error('Response Data:', e.response.data);
    }
    const status = e.response?.status || 500;
    res.status(status).send(e.response?.data || { message: 'Erreur proxy', error: e.message });
  }
};

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use('/api/auth', (req, res) => forward(req, res, SERVICES.auth, req.originalUrl.replace('/api/auth', '/api/auth')));
app.use('/api/voitures', (req, res) => forward(req, res, SERVICES.rental, req.originalUrl.replace('/api/voitures', '/api/voitures')));
app.use('/api/reservations', (req, res) => forward(req, res, SERVICES.rental, req.originalUrl.replace('/api/reservations', '/api/reservations')));
app.use('/api/invoices', (req, res) => forward(req, res, SERVICES.invoice, req.originalUrl.replace('/api/invoices', '/api/invoices')));
app.use('/api/ocr', (req, res) => forward(req, res, SERVICES.ocr, req.originalUrl.replace('/api/ocr', '/api/ocr')));
app.use('/api/chat', (req, res) => forward(req, res, SERVICES.chat, req.originalUrl.replace('/api/chat', '/api/chat')));
app.use('/api/payments', (req, res) => forward(req, res, SERVICES.payment, req.originalUrl.replace('/api/payments', '/api/payments')));
app.use('/api/admin', (req, res) => forward(req, res, SERVICES.admin, req.originalUrl.replace('/api/admin', '/api/admin')));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`api-gateway on ${PORT}`));
