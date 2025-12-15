require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, query } = require('./database');
const path = require('path');
const voituresRoutes = require('./routes/voitures');
const reservationsRoutes = require('./routes/reservations');
const uploadRoutes = require('./routes/upload');

const app = express();
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const ensureSchema = async () => {
  await query(`CREATE TABLE IF NOT EXISTS voitures (
    id SERIAL PRIMARY KEY,
    marque VARCHAR(50) NOT NULL,
    modele VARCHAR(50) NOT NULL,
    annee INTEGER NOT NULL,
    immatriculation VARCHAR(20) UNIQUE,
    couleur VARCHAR(30),
    type_carburant VARCHAR(20),
    transmission VARCHAR(20),
    nombre_places INTEGER,
    nombre_portes INTEGER,
    climatisation BOOLEAN DEFAULT true,
    gps BOOLEAN DEFAULT false,
    images TEXT,
    prix_par_jour DECIMAL(10,2) NOT NULL,
    caution DECIMAL(10,2) DEFAULT 0,
    kilometrage INTEGER DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'disponible',
    agence_nom VARCHAR(100),
    agence_ville VARCHAR(100),
    agence_adresse VARCHAR(255),
    agence_telephone VARCHAR(20),
    caracteristiques TEXT,
    description TEXT,
    ville VARCHAR(100) NOT NULL,
    disponible BOOLEAN DEFAULT true,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await query(`CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    voiture_id INTEGER NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    lieu_prise_en_charge VARCHAR(255),
    lieu_retour VARCHAR(255),
    prix_total DECIMAL(10,2) NOT NULL,
    caution_payee DECIMAL(10,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'en_attente',
    mode_paiement VARCHAR(30),
    paiement_effectue BOOLEAN DEFAULT false,
    montant_paye DECIMAL(10,2) DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
};

app.get('/health', async (req, res) => {
  try { await pool.query('SELECT NOW()'); res.json({ status: 'OK' }); } catch (e) { res.status(500).json({ status: 'ERROR', error: e.message }); }
});

app.use('/api/voitures', voituresRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 8002;
ensureSchema().then(() => {
  app.listen(PORT, () => console.log(`rental-service on ${PORT}`));
});
