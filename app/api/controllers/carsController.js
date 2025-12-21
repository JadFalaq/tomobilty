const { query } = require('../config/database');

const carsController = {
  // Lister toutes les voitures disponibles
  async getCars(req, res) {
    try {
      const { ville, marque, prix_min, prix_max, page = 1, limit = 12 } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = ['disponible = true'];
      const params = [];
      let paramCount = 0;

      if (ville) {
        paramCount++;
        whereConditions.push(`ville ILIKE $${paramCount}`);
        params.push(`%${ville}%`);
      }

      if (marque) {
        paramCount++;
        whereConditions.push(`marque ILIKE $${paramCount}`);
        params.push(`%${marque}%`);
      }

      if (prix_min) {
        paramCount++;
        whereConditions.push(`prix_par_jour >= $${paramCount}`);
        params.push(prix_min);
      }

      if (prix_max) {
        paramCount++;
        whereConditions.push(`prix_par_jour <= $${paramCount}`);
        params.push(prix_max);
      }

      const whereClause = whereConditions.join(' AND ');
      
      // Requête principale avec pagination
      const mainQuery = `
        SELECT * FROM voitures 
        WHERE ${whereClause} 
        ORDER BY date_creation DESC 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);

      const result = await query(mainQuery, params);

      // Compter le total
      const countQuery = `SELECT COUNT(*) FROM voitures WHERE ${whereClause}`;
      const countResult = await query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);

      // Formatter les données
      const cars = result.rows.map(car => ({
        ...car,
        images: car.images ? JSON.parse(car.images) : [],
        caracteristiques: car.caracteristiques ? JSON.parse(car.caracteristiques) : []
      }));

      res.json({
        cars,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erreur récupération voitures:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des voitures', error: error.message });
    }
  },

  // Détails d'une voiture
  async getCar(req, res) {
    try {
      const { id } = req.params;
      const result = await query('SELECT * FROM voitures WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Voiture non trouvée' });
      }

      const car = result.rows[0];
      car.images = car.images ? JSON.parse(car.images) : [];
      car.caracteristiques = car.caracteristiques ? JSON.parse(car.caracteristiques) : [];

      res.json(car);
    } catch (error) {
      console.error('Erreur récupération voiture:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération de la voiture', error: error.message });
    }
  },

  // Vérifier la disponibilité d'une voiture
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { date_debut, date_fin } = req.body;

      if (!date_debut || !date_fin) {
        return res.status(400).json({ message: 'Dates de début et fin requises' });
      }

      const conflictQuery = `
        SELECT COUNT(*) as count 
        FROM reservations 
        WHERE voiture_id = $1 
          AND statut IN ('en_attente', 'confirmee', 'en_cours')
          AND (
            (date_debut <= $2 AND date_fin >= $2) OR
            (date_debut <= $3 AND date_fin >= $3) OR
            (date_debut >= $2 AND date_fin <= $3)
          )
      `;

      const result = await query(conflictQuery, [id, date_debut, date_fin]);
      const isAvailable = result.rows[0].count === '0';

      res.json({
        disponible: isAvailable,
        voiture_id: id,
        periode: { date_debut, date_fin }
      });
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      res.status(500).json({ message: 'Erreur lors de la vérification de disponibilité', error: error.message });
    }
  },

  // Créer une voiture (admin uniquement)
  async createCar(req, res) {
    try {
      const {
        marque, modele, annee, immatriculation, couleur, type_carburant,
        transmission, nombre_places, nombre_portes, climatisation, gps,
        images, prix_par_jour, caution, kilometrage, statut, agence_nom,
        agence_ville, agence_adresse, agence_telephone, caracteristiques,
        description, ville
      } = req.body;

      const insertQuery = `
        INSERT INTO voitures (
          marque, modele, annee, immatriculation, couleur, type_carburant,
          transmission, nombre_places, nombre_portes, climatisation, gps,
          images, prix_par_jour, caution, kilometrage, statut, agence_nom,
          agence_ville, agence_adresse, agence_telephone, caracteristiques,
          description, ville, disponible
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24
        ) RETURNING *
      `;

      const params = [
        marque, modele, annee, immatriculation, couleur, type_carburant,
        transmission, nombre_places, nombre_portes, climatisation ?? true,
        gps ?? false, JSON.stringify(images || []), prix_par_jour,
        caution ?? 0, kilometrage ?? 0, statut || 'disponible', agence_nom,
        agence_ville, agence_adresse, agence_telephone,
        JSON.stringify(caracteristiques || []), description, ville, true
      ];

      const result = await query(insertQuery, params);
      const car = result.rows[0];
      
      // Formatter la réponse
      car.images = JSON.parse(car.images);
      car.caracteristiques = JSON.parse(car.caracteristiques);

      res.status(201).json({
        message: 'Voiture créée avec succès',
        car
      });
    } catch (error) {
      console.error('Erreur création voiture:', error);
      res.status(500).json({ message: 'Erreur lors de la création de la voiture', error: error.message });
    }
  },

  // Mettre à jour une voiture (admin uniquement)
  async updateCar(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Construire la requête de mise à jour dynamiquement
      const fields = [];
      const params = [];
      let paramCount = 0;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          paramCount++;
          fields.push(`${key} = $${paramCount}`);
          
          // Stringify les objets JSON
          if (key === 'images' || key === 'caracteristiques') {
            params.push(JSON.stringify(updates[key]));
          } else {
            params.push(updates[key]);
          }
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
      }

      fields.push(`date_modification = CURRENT_TIMESTAMP`);
      paramCount++;
      params.push(id);

      const updateQuery = `
        UPDATE voitures 
        SET ${fields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await query(updateQuery, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Voiture non trouvée' });
      }

      const car = result.rows[0];
      car.images = car.images ? JSON.parse(car.images) : [];
      car.caracteristiques = car.caracteristiques ? JSON.parse(car.caracteristiques) : [];

      res.json({
        message: 'Voiture mise à jour avec succès',
        car
      });
    } catch (error) {
      console.error('Erreur mise à jour voiture:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour de la voiture', error: error.message });
    }
  },

  // Supprimer une voiture (admin uniquement)
  async deleteCar(req, res) {
    try {
      const { id } = req.params;

      // Vérifier s'il y a des réservations actives
      const reservationsResult = await query(
        'SELECT COUNT(*) as count FROM reservations WHERE voiture_id = $1 AND statut IN (\'en_attente\', \'confirmee\', \'en_cours\')',
        [id]
      );

      if (reservationsResult.rows[0].count > 0) {
        return res.status(400).json({ 
          message: 'Impossible de supprimer cette voiture car elle a des réservations actives' 
        });
      }

      const result = await query('DELETE FROM voitures WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Voiture non trouvée' });
      }

      res.json({ message: 'Voiture supprimée avec succès' });
    } catch (error) {
      console.error('Erreur suppression voiture:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression de la voiture', error: error.message });
    }
  }
};

module.exports = carsController;
