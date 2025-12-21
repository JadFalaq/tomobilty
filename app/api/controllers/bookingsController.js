const { query } = require('../config/database');

const bookingsController = {
  // Créer une nouvelle réservation
  async createBooking(req, res) {
    try {
      const {
        voiture_id, date_debut, date_fin, lieu_prise_en_charge,
        lieu_retour, prix_total, caution_payee, mode_paiement
      } = req.body;

      const user_id = req.user.id;

      // Vérifier la disponibilité de la voiture
      const availabilityQuery = `
        SELECT COUNT(*) as count 
        FROM reservations 
        WHERE voiture_id = $1 
          AND statut IN ('en_attente', 'confirmee', 'en_cours')
          AND (
            (date_debut <= $2 AND date_fin > $2) OR
            (date_debut < $3 AND date_fin >= $3) OR
            (date_debut >= $2 AND date_fin <= $3)
          )
      `;

      const availabilityResult = await query(availabilityQuery, [voiture_id, date_debut, date_fin]);
      
      if (parseInt(availabilityResult.rows[0].count) !== 0) {
        return res.status(409).json({ 
          message: 'Voiture non disponible pour ces dates' 
        });
      }

      // Créer la réservation
      const insertQuery = `
        INSERT INTO reservations (
          user_id, voiture_id, date_debut, date_fin, lieu_prise_en_charge,
          lieu_retour, prix_total, caution_payee, statut, mode_paiement
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente', $9)
        RETURNING *
      `;

      const result = await query(insertQuery, [
        user_id, voiture_id, date_debut, date_fin, lieu_prise_en_charge,
        lieu_retour, prix_total, caution_payee || 0, mode_paiement
      ]);

      res.status(201).json({
        message: 'Réservation créée avec succès',
        booking: result.rows[0]
      });
    } catch (error) {
      console.error('Erreur création réservation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la création de la réservation', 
        error: error.message 
      });
    }
  },

  // Récupérer les réservations de l'utilisateur connecté
  async getMyBookings(req, res) {
    try {
      const user_id = req.user.id;
      
      const result = await query(`
        SELECT r.*, v.marque, v.modele, v.images, v.prix_par_jour
        FROM reservations r
        LEFT JOIN voitures v ON r.voiture_id = v.id
        WHERE r.user_id = $1
        ORDER BY r.date_creation DESC
      `, [user_id]);

      const bookings = result.rows.map(booking => ({
        ...booking,
        images: booking.images ? JSON.parse(booking.images) : []
      }));

      res.json(bookings);
    } catch (error) {
      console.error('Erreur récupération réservations:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des réservations', 
        error: error.message 
      });
    }
  },

  // Récupérer toutes les réservations (admin uniquement)
  async getAllBookings(req, res) {
    try {
      const { page = 1, limit = 20, statut } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params = [];
      
      if (statut) {
        whereClause = 'WHERE r.statut = $1';
        params.push(statut);
      }

      const result = await query(`
        SELECT r.*, v.marque, v.modele, v.immatriculation,
               u.nom, u.prenom, u.email, u.telephone
        FROM reservations r
        LEFT JOIN voitures v ON r.voiture_id = v.id
        LEFT JOIN users u ON r.user_id = u.id
        ${whereClause}
        ORDER BY r.date_creation DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      // Compter le total
      const countResult = await query(`
        SELECT COUNT(*) FROM reservations r ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].count);

      res.json({
        bookings: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erreur récupération toutes réservations:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des réservations', 
        error: error.message 
      });
    }
  },

  // Récupérer une réservation spécifique
  async getBooking(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      const is_admin = req.user.role === 'admin';

      let whereClause = 'WHERE r.id = $1';
      const params = [id];

      // Si pas admin, limiter aux réservations de l'utilisateur
      if (!is_admin) {
        whereClause += ' AND r.user_id = $2';
        params.push(user_id);
      }

      const result = await query(`
        SELECT r.*, v.marque, v.modele, v.images, v.prix_par_jour,
               v.agence_nom, v.agence_ville, v.agence_adresse,
               u.nom, u.prenom, u.email, u.telephone
        FROM reservations r
        LEFT JOIN voitures v ON r.voiture_id = v.id
        LEFT JOIN users u ON r.user_id = u.id
        ${whereClause}
      `, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Réservation non trouvée' });
      }

      const booking = result.rows[0];
      booking.images = booking.images ? JSON.parse(booking.images) : [];

      res.json(booking);
    } catch (error) {
      console.error('Erreur récupération réservation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération de la réservation', 
        error: error.message 
      });
    }
  },

  // Confirmer une réservation
  async confirmBooking(req, res) {
    try {
      const { id } = req.params;
      const { montant_paye } = req.body;
      const user_id = req.user.id;
      const is_admin = req.user.role === 'admin';

      let whereClause = 'WHERE id = $1';
      const params = [id];

      if (!is_admin) {
        whereClause += ' AND user_id = $2';
        params.push(user_id);
      }

      const result = await query(`
        UPDATE reservations 
        SET statut = 'confirmee', paiement_effectue = true, montant_paye = $${params.length + 1}, date_modification = CURRENT_TIMESTAMP
        ${whereClause}
        RETURNING *
      `, [...params, montant_paye || 0]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Réservation non trouvée' });
      }

      res.json({
        message: 'Réservation confirmée avec succès',
        booking: result.rows[0]
      });
    } catch (error) {
      console.error('Erreur confirmation réservation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la confirmation de la réservation', 
        error: error.message 
      });
    }
  },

  // Annuler une réservation
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      const is_admin = req.user.role === 'admin';

      let whereClause = 'WHERE id = $1';
      const params = [id];

      if (!is_admin) {
        whereClause += ' AND user_id = $2';
        params.push(user_id);
      }

      const result = await query(`
        UPDATE reservations 
        SET statut = 'annulee', date_modification = CURRENT_TIMESTAMP
        ${whereClause}
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Réservation non trouvée' });
      }

      res.json({
        message: 'Réservation annulée avec succès',
        booking: result.rows[0]
      });
    } catch (error) {
      console.error('Erreur annulation réservation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de l\'annulation de la réservation', 
        error: error.message 
      });
    }
  },

  // Mettre à jour le statut d'une réservation (admin uniquement)
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      const validStatuses = ['en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee'];
      if (!validStatuses.includes(statut)) {
        return res.status(400).json({ 
          message: 'Statut invalide', 
          validStatuses 
        });
      }

      const result = await query(`
        UPDATE reservations 
        SET statut = $1, date_modification = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [statut, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Réservation non trouvée' });
      }

      res.json({
        message: 'Statut mis à jour avec succès',
        booking: result.rows[0]
      });
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la mise à jour du statut', 
        error: error.message 
      });
    }
  }
};

module.exports = bookingsController;
