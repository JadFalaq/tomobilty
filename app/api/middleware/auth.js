const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authMiddleware = {
  // Vérifier le token JWT et charger l'utilisateur
  async protect(req, res, next) {
    try {
      let token;

      // Récupérer le token depuis l'en-tête Authorization
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({ message: 'Token d\'accès requis' });
      }

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur depuis la base de données
      const result = await query(
        'SELECT id, nom, prenom, email, telephone, role, email_verified, phone_verified FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }

      // Attacher l'utilisateur à la requête
      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Erreur middleware auth:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token invalide' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expiré' });
      }
      
      res.status(401).json({ message: 'Erreur d\'authentification' });
    }
  },

  // Vérifier que l'utilisateur est admin
  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès administrateur requis' });
    }

    next();
  },

  // Vérifier que l'email est vérifié
  requireEmailVerified(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!req.user.email_verified) {
      return res.status(403).json({ 
        message: 'Email non vérifié. Vérifiez votre boîte mail.' 
      });
    }

    next();
  },

  // Middleware optionnel - charge l'utilisateur si token présent
  async optionalAuth(req, res, next) {
    try {
      let token;

      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await query(
          'SELECT id, nom, prenom, email, telephone, role, email_verified, phone_verified FROM users WHERE id = $1',
          [decoded.id]
        );

        if (result.rows.length > 0) {
          req.user = result.rows[0];
        }
      }

      next();
    } catch (error) {
      // En cas d'erreur, on continue sans utilisateur
      next();
    }
  }
};

module.exports = authMiddleware;
