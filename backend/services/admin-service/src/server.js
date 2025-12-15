require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, query } = require('./database');
const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());
app.get('/health', async (req, res) => { try { await pool.query('SELECT NOW()'); res.json({ status: 'OK' }); } catch(e){ res.status(500).json({ status:'ERROR', error:e.message }); }});
app.get('/api/admin/agences', async (req, res) => {
  const r = await query('SELECT * FROM agences ORDER BY nom');
  res.json(r.rows);
});
app.post('/api/admin/agences', async (req, res) => {
  const b = req.body;
  const r = await query('INSERT INTO agences (nom, ville, adresse, telephone) VALUES ($1,$2,$3,$4) RETURNING *', [b.nom, b.ville, b.adresse, b.telephone]);
  res.status(201).json(r.rows[0]);
});
app.put('/api/admin/agences/:id', async (req, res) => {
  const b = req.body;
  const r = await query('UPDATE agences SET nom=$2, ville=$3, adresse=$4, telephone=$5 WHERE id=$1 RETURNING *', [req.params.id, b.nom, b.ville, b.adresse, b.telephone]);
  res.json(r.rows[0]);
});
app.delete('/api/admin/agences/:id', async (req, res) => {
  await query('DELETE FROM agences WHERE id=$1', [req.params.id]);
  res.status(204).send();
});
app.get('/api/admin/config', async (req, res) => {
  const r = await query('SELECT key, value FROM config');
  const cfg = {}; r.rows.forEach(x => { cfg[x.key] = x.value; });
  res.json(cfg);
});
app.put('/api/admin/config', async (req, res) => {
  const entries = Object.entries(req.body || {});
  for (const [k,v] of entries) {
    await query('INSERT INTO config (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=excluded.value', [k, v]);
  }
  res.json({ updated: entries.length });
});
const PORT = process.env.PORT || 8007;
app.listen(PORT, () => console.log(`admin-service on ${PORT}`));
