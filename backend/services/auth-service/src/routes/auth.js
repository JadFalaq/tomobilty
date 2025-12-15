const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const { proteger } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const { verifyGoogleIdToken } = require('../utils/oauth');
const { query } = require('../database');

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, motDePasse } = req.body;
    const exist = await User.findByEmail(email);
    if (exist) return res.status(400).json({ message: 'Email déjà utilisé' });
    const user = await User.create({ nom, prenom, email, telephone, motDePasse, role: 'client' });
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query('UPDATE users SET email_verification_token=$1, email_verification_expires=$2 WHERE id=$3', [token, expires, user.id]);
    const base = process.env.GATEWAY_URL || 'http://localhost:8000';
    const verifyUrl = `${base}/api/auth/verify-email?token=${token}`;
    const mail = await sendEmail({ to: email, subject: 'Vérification de votre email', html: `<p>Bienvenue sur Tomobilty</p><p>Confirmez votre email: <a href="${verifyUrl}">${verifyUrl}</a></p>` });
    res.status(201).json({ message: 'Inscription créée, vérification envoyée', previewUrl: mail.previewUrl });
  } catch (e) {
    res.status(500).json({ message: 'Erreur inscription', error: e.message });
  }
});

router.post('/connexion', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
    const ok = await User.comparePassword(motDePasse, user.mot_de_passe);
    if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });
    if (!user.email_verified) return res.status(403).json({ message: 'Email non vérifié' });
    res.json({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      token: signToken(user.id)
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur connexion', error: e.message });
  }
});

router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: 'Token requis' });
    const r = await query('SELECT * FROM users WHERE email_verification_token=$1', [token]);
    if (!r.rows.length) return res.status(400).json({ message: 'Token invalide' });
    const u = r.rows[0];
    if (u.email_verification_expires && new Date(u.email_verification_expires) < new Date()) return res.status(400).json({ message: 'Token expiré' });
    await query('UPDATE users SET email_verified=true, email_verification_token=NULL, email_verification_expires=NULL WHERE id=$1', [u.id]);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontend}/connexion?verified=true`);
  } catch (e) {
    res.status(500).json({ message: 'Erreur vérification', error: e.message });
  }
});

router.post('/oauth/google', async (req, res) => {
  try {
    const { id_token } = req.body;
    const payload = await verifyGoogleIdToken(id_token);
    const email = payload.email;
    let user = await User.findByEmail(email);
    if (!user) {
      const nom = payload.given_name || '';
      const prenom = payload.family_name || '';
      user = await User.create({ nom, prenom, email, telephone: '', motDePasse: crypto.randomBytes(16).toString('hex'), role: 'client' });
    }
    await query('UPDATE users SET email_verified=true WHERE id=$1', [user.id]);
    await query('INSERT INTO oauth_accounts (user_id, provider, provider_account_id) VALUES ($1,$2,$3) ON CONFLICT (provider, provider_account_id) DO NOTHING', [user.id, 'google', payload.sub]);
    res.json({ id: user.id, email: email, role: user.role, token: signToken(user.id) });
  } catch (e) {
    res.status(500).json({ message: 'Erreur OAuth', error: e.message });
  }
});

router.post('/phone/start', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Téléphone requis' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await query('INSERT INTO phone_verifications (phone, code, expires_at) VALUES ($1,$2,$3)', [phone, code, expires]);
    await sendSMS(phone, `Code de vérification: ${code}`);
    res.json({ message: 'Code envoyé' });
  } catch (e) {
    res.status(500).json({ message: 'Erreur envoi code', error: e.message });
  }
});

router.post('/phone/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ message: 'Données requises' });
    const r = await query('SELECT * FROM phone_verifications WHERE phone=$1 ORDER BY created_at DESC LIMIT 1', [phone]);
    if (!r.rows.length) return res.status(400).json({ message: 'Aucun code' });
    const pv = r.rows[0];
    if (pv.code !== code) return res.status(400).json({ message: 'Code invalide' });
    if (new Date(pv.expires_at) < new Date()) return res.status(400).json({ message: 'Code expiré' });
    let userRes = await query('SELECT * FROM users WHERE telephone=$1', [phone]);
    let user = userRes.rows[0];
    if (!user) {
      const u = await query('INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, email_verified, phone_verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', ['', '', null, phone, crypto.randomBytes(16).toString('hex'), 'client', false, true]);
      user = u.rows[0];
    } else {
      await query('UPDATE users SET phone_verified=true WHERE id=$1', [user.id]);
    }
    res.json({ id: user.id, telephone: phone, role: user.role, token: signToken(user.id) });
  } catch (e) {
    res.status(500).json({ message: 'Erreur vérification téléphone', error: e.message });
  }
});

router.get('/profil', proteger, async (req, res) => {
  try {
    const user = await User.findById(req.utilisateur.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const { mot_de_passe, permis_conduire, ...rest } = user;
    res.json({
      ...rest,
      permisConduire: permis_conduire
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur profil', error: e.message });
  }
});

router.put('/profil', proteger, async (req, res) => {
  try {
    const updated = await User.update(req.utilisateur.id, {
      nom: req.body.nom,
      prenom: req.body.prenom,
      telephone: req.body.telephone,
      adresse: req.body.adresse,
      permis_conduire: req.body.permisConduire
    });
    res.json({
      id: updated.id,
      nom: updated.nom,
      prenom: updated.prenom,
      email: updated.email,
      telephone: updated.telephone,
      adresse: updated.adresse,
      permisConduire: updated.permis_conduire,
      role: updated.role,
      token: signToken(updated.id)
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur mise à jour profil', error: e.message });
  }
});

module.exports = router;
