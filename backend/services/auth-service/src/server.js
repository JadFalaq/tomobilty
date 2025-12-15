require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./database');
const authRoutes = require('./routes/auth');
const { ensureSchema } = require('./schema');

const app = express();
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'OK' });
  } catch (e) {
    res.status(500).json({ status: 'ERROR', error: e.message });
  }
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 8001;
ensureSchema().then(() => {
  app.listen(PORT, () => console.log(`auth-service on ${PORT}`));
});
