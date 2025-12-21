const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const { verifyGoogleIdToken } = require('../utils/oauth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const authController = {
  // Inscription
  async inscription(req, res) {
    try {
      const { nom, prenom, email, telephone, motDePasse } = req.body;
      
      // Vérifier si l'email existe
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(motDePasse, 12);
      
      // Créer l'utilisateur
      const result = await query(`
        INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, nom, prenom, email, telephone, role
      `, [nom, prenom, email, telephone, hashedPassword, 'client']);

      const user = result.rows[0];

      // Générer token de vérification email
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await query(
        'UPDATE users SET email_verification_token=$1, email_verification_expires=$2 WHERE id=$3',
        [token, expires, user.id]
      );

      // Envoyer email de vérification
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      await sendEmail({
        to: email,
        subject: 'Vérification de votre compte Tomobilty',
        html: `
          <h2>Bienvenue sur Tomobilty !</h2>
          <p>Merci de vous être inscrit. Veuillez confirmer votre email en cliquant sur le lien ci-dessous :</p>
          <a href="${verifyUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Vérifier mon email
          </a>
          <p>Ce lien expire dans 24 heures.</p>
        `
      });

      res.status(201).json({
        message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
        user: { ...user, mot_de_passe: undefined }
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
    }
  },

  // Connexion
  async connexion(req, res) {
    try {
      const { email, motDePasse } = req.body;

      // Trouver l'utilisateur
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      const user = result.rows[0];

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(motDePasse, user.mot_de_passe);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      // Vérifier si l'email est vérifié
      if (!user.email_verified) {
        return res.status(403).json({ 
          message: 'Email non vérifié. Vérifiez votre boîte mail.' 
        });
      }

      const token = signToken(user.id);

      res.json({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        token
      });
    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
    }
  },

  // Vérification email
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ message: 'Token de vérification requis' });
      }

      const result = await query(
        'SELECT * FROM users WHERE email_verification_token = $1',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Token de vérification invalide' });
      }

      const user = result.rows[0];

      // Vérifier l'expiration
      if (user.email_verification_expires && new Date(user.email_verification_expires) < new Date()) {
        return res.status(400).json({ message: 'Token de vérification expiré' });
      }

      // Activer le compte
      await query(
        'UPDATE users SET email_verified=true, email_verification_token=NULL, email_verification_expires=NULL WHERE id=$1',
        [user.id]
      );

      res.json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });
    } catch (error) {
      console.error('Erreur vérification email:', error);
      res.status(500).json({ message: 'Erreur lors de la vérification', error: error.message });
    }
  },

  // Connexion Google OAuth
  async googleOAuth(req, res) {
    try {
      const { id_token } = req.body;
      const payload = await verifyGoogleIdToken(id_token);
      const email = payload.email;

      let user = await query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (user.rows.length === 0) {
        // Créer un nouvel utilisateur
        const result = await query(`
          INSERT INTO users (nom, prenom, email, mot_de_passe, role, email_verified) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING *
        `, [
          payload.given_name || '',
          payload.family_name || '',
          email,
          crypto.randomBytes(16).toString('hex'),
          'client',
          true
        ]);
        user = result;
      } else {
        // Marquer l'email comme vérifié
        await query('UPDATE users SET email_verified=true WHERE id=$1', [user.rows[0].id]);
      }

      // Enregistrer le compte OAuth
      await query(`
        INSERT INTO oauth_accounts (user_id, provider, provider_account_id) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (provider, provider_account_id) DO NOTHING
      `, [user.rows[0].id, 'google', payload.sub]);

      const token = signToken(user.rows[0].id);

      res.json({
        id: user.rows[0].id,
        nom: user.rows[0].nom,
        prenom: user.rows[0].prenom,
        email: user.rows[0].email,
        role: user.rows[0].role,
        token
      });
    } catch (error) {
      console.error('Erreur OAuth Google:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion Google', error: error.message });
    }
  },

  // Profil utilisateur
  async getProfil(req, res) {
    try {
      const result = await query(`
        SELECT id, nom, prenom, email, telephone, role, email_verified, phone_verified, 
               adresse, permis_conduire, date_creation 
        FROM users WHERE id = $1
      `, [req.user.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const user = result.rows[0];
      res.json({
        ...user,
        permisConduire: user.permis_conduire
      });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération du profil', error: error.message });
    }
  },

  // Mettre à jour le profil
  async updateProfil(req, res) {
    try {
      const { nom, prenom, telephone, adresse, permisConduire } = req.body;
      
      const result = await query(`
        UPDATE users 
        SET nom = $1, prenom = $2, telephone = $3, adresse = $4, permis_conduire = $5, date_modification = CURRENT_TIMESTAMP 
        WHERE id = $6 
        RETURNING id, nom, prenom, email, telephone, adresse, permis_conduire, role
      `, [nom, prenom, telephone, adresse, permisConduire, req.user.id]);

      const user = result.rows[0];
      const token = signToken(user.id);

      res.json({
        message: 'Profil mis à jour avec succès',
        user: {
          ...user,
          permisConduire: user.permis_conduire
        },
        token
      });
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour du profil', error: error.message });
    }
  }
};

module.exports = authController;
