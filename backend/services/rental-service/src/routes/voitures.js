const express = require('express');
const { query } = require('../database');
const { proteger, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM voitures WHERE disponible = true ORDER BY date_creation DESC');
    const rows = result.rows.map(v => ({
      ...v,
      images: v.images ? JSON.parse(v.images) : [],
      caracteristiques: v.caracteristiques ? JSON.parse(v.caracteristiques) : []
    }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erreur', error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM voitures WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Voiture non trouvée' });
    const v = result.rows[0];
    v.images = v.images ? JSON.parse(v.images) : [];
    v.caracteristiques = v.caracteristiques ? JSON.parse(v.caracteristiques) : [];
    res.json(v);
  } catch (e) {
    res.status(500).json({ message: 'Erreur', error: e.message });
  }
});

router.post('/', proteger, admin, async (req, res) => {
  try {
    const body = req.body;
    const params = [
      body.marque, body.modele, body.annee, body.immatriculation, body.couleur,
      body.type_carburant, body.transmission, body.nombre_places, body.nombre_portes,
      body.climatisation ?? true, body.gps ?? false, JSON.stringify(body.images || []),
      body.prix_par_jour, body.caution ?? 0, body.kilometrage ?? 0, body.statut || 'disponible',
      body.agence_nom, body.agence_ville, body.agence_adresse, body.agence_telephone,
      JSON.stringify(body.caracteristiques || []), body.description, body.ville, true
    ];
    const sql = `INSERT INTO voitures (marque, modele, annee, immatriculation, couleur, type_carburant,
      transmission, nombre_places, nombre_portes, climatisation, gps, images, prix_par_jour, caution,
      kilometrage, statut, agence_nom, agence_ville, agence_adresse, agence_telephone, caracteristiques,
      description, ville, disponible) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING *`;
    const result = await query(sql, params);
    const v = result.rows[0];
    v.images = JSON.parse(v.images);
    v.caracteristiques = JSON.parse(v.caracteristiques);
    res.status(201).json(v);
  } catch (e) {
    res.status(500).json({ message: 'Erreur', error: e.message });
  }
});

router.post('/:id/disponibilite', async (req, res) => {
  try {
    const { date_debut, date_fin } = req.body;
    const conflictSql = `SELECT COUNT(*) AS count FROM reservations WHERE voiture_id=$1 AND statut IN ('en_attente','confirmée','en_cours') AND (
      (date_debut <= $2 AND date_fin >= $2) OR (date_debut <= $3 AND date_fin >= $3) OR (date_debut >= $2 AND date_fin <= $3))`;
    const c = await query(conflictSql, [req.params.id, date_debut, date_fin]);
    res.json({ disponible: c.rows[0].count === '0' });
  } catch (e) {
    res.status(500).json({ message: 'Erreur dispo', error: e.message });
  }
});

module.exports = router;
