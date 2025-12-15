const express = require('express');
const { query } = require('../database');
const { proteger, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', proteger, async (req, res) => {
  try {
    const b = req.body;
    const dispo = await query(
      `SELECT COUNT(*) AS count FROM reservations WHERE voiture_id=$1 AND statut IN ('en_attente','confirmée','en_cours') AND (
        (date_debut <= $2 AND date_fin > $2) OR (date_debut < $3 AND date_fin >= $3) OR (date_debut >= $2 AND date_fin <= $3))`,
      [b.voiture_id, b.date_debut, b.date_fin]
    );
    if (parseInt(dispo.rows[0].count) !== 0) return res.status(409).json({ message: 'Voiture non disponible' });

    const ins = await query(
      `INSERT INTO reservations (user_id, voiture_id, date_debut, date_fin, lieu_prise_en_charge, lieu_retour, prix_total, caution_payee, statut, mode_paiement)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'en_attente',$9) RETURNING *`,
      [b.user_id, b.voiture_id, b.date_debut, b.date_fin, b.lieu_prise_en_charge, b.lieu_retour, b.prix_total, b.caution_payee || 0, b.mode_paiement]
    );
    res.status(201).json(ins.rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Erreur création réservation', error: e.message });
  }
});

router.get('/mes-reservations', proteger, async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const r = await query(`SELECT r.*, v.marque, v.modele, v.images FROM reservations r LEFT JOIN voitures v ON r.voiture_id=v.id WHERE r.user_id=$1 ORDER BY r.date_creation DESC`, [userId]);
    const rows = r.rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : []
    }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erreur liste', error: e.message });
  }
});

router.put('/:id/confirmer', proteger, async (req, res) => {
  try {
    const r = await query(`UPDATE reservations SET statut='confirmée', paiement_effectue=true, montant_paye=$2 WHERE id=$1 RETURNING *`, [req.params.id, req.body.montant_paye || 0]);
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Erreur confirmation', error: e.message });
  }
});

router.put('/:id/annuler', proteger, async (req, res) => {
  try {
    const r = await query(`UPDATE reservations SET statut='annulée' WHERE id=$1 RETURNING *`, [req.params.id]);
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Erreur annulation', error: e.message });
  }
});

router.put('/:id/statut', proteger, admin, async (req, res) => {
  try {
    const r = await query(`UPDATE reservations SET statut=$2 WHERE id=$1 RETURNING *`, [req.params.id, req.body.statut]);
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Erreur statut', error: e.message });
  }
});

module.exports = router;
