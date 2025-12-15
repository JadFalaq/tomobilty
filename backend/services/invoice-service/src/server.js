require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, query } = require('./database');
const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());
const ensureSchema = async () => {
  await query(`CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reservation_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'MAD',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
};

app.get('/health', async (req, res) => { try { await pool.query('SELECT NOW()'); res.json({ status: 'OK' }); } catch(e){ res.status(500).json({ status:'ERROR', error:e.message }); }});
app.post('/api/invoices', async (req, res) => {
  try {
    const b = req.body;
    const r = await query(`INSERT INTO invoices (user_id, reservation_id, amount, currency, status) VALUES ($1,$2,$3,'MAD','pending') RETURNING *`, [b.user_id, b.reservation_id, b.amount]);
    res.status(201).json(r.rows[0]);
  } catch(e){ res.status(500).json({ message:'Erreur facture', error:e.message }); }
});
app.get('/api/invoices/:id', async (req, res) => {
  try { const r = await query('SELECT * FROM invoices WHERE id=$1', [req.params.id]); if(!r.rows.length) return res.status(404).json({ message:'Not found' }); res.json(r.rows[0]); } catch(e){ res.status(500).json({ message:'Erreur', error:e.message }); }
});
const PORT = process.env.PORT || 8003;
ensureSchema().then(() => {
  app.listen(PORT, () => console.log(`invoice-service on ${PORT}`));
});
