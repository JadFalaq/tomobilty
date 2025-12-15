require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, query } = require('./database');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });
const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

const ensureSchema = async () => {
  await query(`CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'MAD',
    status VARCHAR(20) DEFAULT 'created',
    provider VARCHAR(20) DEFAULT 'stripe',
    provider_session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
};

app.get('/health', async (req, res) => { try { await pool.query('SELECT NOW()'); res.json({ status: 'OK' }); } catch(e){ res.status(500).json({ status:'ERROR', error:e.message }); }});

app.post('/api/payments/create-checkout-session', async (req, res) => {
  try {
    const { reservation_id, amount, currency = 'MAD' } = req.body;
    if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ message: 'Stripe non configuré' });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency, product_data: { name: `Réservation #${reservation_id}` }, unit_amount: Math.round(Number(amount) * 100) }, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/succes?res_id=${reservation_id}&amount=${amount}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/annule?res_id=${reservation_id}`
    });
    await query('INSERT INTO payments (reservation_id, amount, currency, status, provider, provider_session_id) VALUES ($1,$2,$3,$4,$5,$6)', [reservation_id, amount, currency, 'created', 'stripe', session.id]);
    res.json({ url: session.url });
  } catch(e){ res.status(500).json({ message:'Erreur création paiement', error:e.message }); }
});

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = require('stripe').webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await query('UPDATE payments SET status=$2 WHERE provider_session_id=$1', [session.id, 'paid']);
    }
    res.json({ received: true });
  } catch(e){ res.status(500).json({ message:'Erreur webhook', error:e.message }); }
});

const PORT = process.env.PORT || 8006;
ensureSchema().then(() => {
  app.listen(PORT, () => console.log(`payment-service on ${PORT}`));
});
