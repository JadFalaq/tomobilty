const jwt = require('jsonwebtoken');

module.exports.proteger = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Non autorisé' });
  try {
    const token = auth.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports.admin = (req, res, next) => {
  // Pour simplifier: l'admin sera validé par la gateway en ajoutant un header X-Role
  if ((req.headers['x-role'] || '').toLowerCase() === 'admin') return next();
  return res.status(403).json({ message: 'Accès refusé' });
};
