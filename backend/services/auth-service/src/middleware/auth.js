const jwt = require('jsonwebtoken');
const User = require('../models/user');

const proteger = async (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Non autorisé' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });
    req.utilisateur = user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

const admin = (req, res, next) => {
  if (req.utilisateur?.role === 'admin') return next();
  return res.status(403).json({ message: 'Accès refusé' });
};

module.exports = { proteger, admin };
