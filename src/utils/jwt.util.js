const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Generate access token
const generateAccessToken = (userId) => {
  return generateToken({ userId }, '24h');
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return generateToken({ userId, type: 'refresh' }, '7d');
};

// Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Generate email verification token
const generateEmailVerificationToken = (email) => {
  return generateToken({ email, type: 'email_verification' }, '24h');
};

// Generate password reset token
const generatePasswordResetToken = (userId) => {
  return generateToken({ userId, type: 'password_reset' }, '1h');
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  generateEmailVerificationToken,
  generatePasswordResetToken
};
