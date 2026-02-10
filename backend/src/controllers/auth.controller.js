const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const prisma = require('../config/prisma');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken 
} = require('../utils/jwt.util');
const { 
  sendEmailVerification, 
  sendPasswordResetEmail 
} = require('../utils/email.util');
const { 
  generateVerificationCode,
  isValidMoroccanPhone 
} = require('../utils/validation.util');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register new user
const register = asyncHandler(async (req, res) => {
  const { email, mot_de_passe, nom, prenom, telephone, adresse } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('Un utilisateur avec cet email existe déjà', 409, 'USER_EXISTS');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

  // Generate email verification code
  const verificationCode = generateVerificationCode();

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      mot_de_passe: hashedPassword,
      nom,
      prenom,
      telephone,
      adresse,
      email_verification_code: verificationCode,
      email_verified: false,
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      email_verified: true
    }
  });

  // Create loyalty account for new user
  try {
    await prisma.loyaltyAccount.create({
      data: {
        user_id: user.id,
        tier_id: 1
      }
    });
  } catch (_) {}

  // Send verification email
  try {
    await sendEmailVerification(email, verificationCode);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Delete user if email fails
    await prisma.user.delete({ where: { id: user.id } });
    throw new AppError('Impossible d\'envoyer l\'email de vérification. Veuillez réessayer.', 500, 'EMAIL_SEND_FAILED');
  }

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès. Veuillez entrer le code de vérification envoyé par email.',
    data: {
      user
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, mot_de_passe } = req.body;

  // Find user with password
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      loyaltyAccount: {
        include: {
          tier: true
        }
      }
    }
  });

  if (!user || !user.mot_de_passe) {
    throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
  }

  // Check if email is verified
  if (!user.email_verified) {
    throw new AppError('Veuillez vérifier votre email avant de vous connecter', 403, 'EMAIL_NOT_VERIFIED');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
  
  if (!isPasswordValid) {
    throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
  }

  // Remove password from response
  const { mot_de_passe: _, ...userWithoutPassword } = user;

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  const refreshHash = await bcrypt.hash(refreshToken, 12);
  try {
    await prisma.refreshToken.upsert({
      where: { user_id: user.id },
      update: { token_hash: refreshHash },
      create: { user_id: user.id, token_hash: refreshHash }
    });
  } catch (_) {}

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: userWithoutPassword,
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    }
  });
});

// Google OAuth authentication
const googleAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Token Google requis', 400, 'MISSING_TOKEN');
  }

  let email, given_name, family_name, sub;

  try {
    // Try to verify as ID Token first
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    email = payload.email;
    given_name = payload.given_name;
    family_name = payload.family_name;
    sub = payload.sub;
  } catch (idTokenError) {
    // If ID Token verification fails, try as Access Token
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      email = response.data.email;
      given_name = response.data.given_name;
      family_name = response.data.family_name;
      sub = response.data.sub;
    } catch (accessTokenError) {
      console.error('Google Auth Error:', accessTokenError.message);
      throw new AppError('Token Google invalide', 401, 'INVALID_TOKEN');
    }
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      oauthAccounts: true,
      loyaltyAccount: {
        include: {
          tier: true
        }
      }
    }
  });

  if (user) {
    // Check if Google account is linked
    const googleAccount = user.oauthAccounts.find(
      account => account.provider === 'google' && account.provider_account_id === sub
    );

    if (!googleAccount) {
      // Link Google account
      await prisma.oauthAccount.create({
        data: {
          user_id: user.id,
          provider: 'google',
          provider_account_id: sub
        }
      });
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email,
        nom: family_name || '',
        prenom: given_name || '',
        email_verified: true,
        oauthAccounts: {
          create: {
            provider: 'google',
            provider_account_id: sub
          }
        }
      },
      include: {
        oauthAccounts: true
      }
    });

    // Create loyalty account
    await prisma.loyaltyAccount.create({
      data: {
        user_id: user.id,
        tier_id: 1
      }
    });

    // Fetch user with loyalty account
    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        loyaltyAccount: {
          include: {
            tier: true
          }
        }
      }
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  const refreshHash = await bcrypt.hash(refreshToken, 12);
  await prisma.refreshToken.upsert({
    where: { user_id: user.id },
    update: { token_hash: refreshHash },
    create: { user_id: user.id, token_hash: refreshHash }
  });

  res.json({
    success: true,
    message: 'Connexion Google réussie',
    data: {
      user,
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    }
  });
});

// Verify email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new AppError('Email et code de vérification requis', 400, 'MISSING_FIELDS');
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
  }

  if (user.email_verified) {
    return res.json({
      success: true,
      message: 'Email déjà vérifié'
    });
  }

  if (user.email_verification_code !== code) {
    throw new AppError('Code de vérification invalide', 400, 'INVALID_CODE');
  }

  if (user.email_verification_expires && new Date() > user.email_verification_expires) {
    throw new AppError('Code de vérification expiré', 400, 'CODE_EXPIRED');
  }

  // Update user email verification status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      email_verification_code: null,
      email_verification_expires: null
    }
  });

  // Generate tokens for auto-login
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  const refreshHash = await bcrypt.hash(refreshToken, 12);
  
  try {
    await prisma.refreshToken.upsert({
      where: { user_id: user.id },
      update: { token_hash: refreshHash },
      create: { user_id: user.id, token_hash: refreshHash }
    });
  } catch (_) {}

  res.json({
    success: true,
    message: 'Email vérifié avec succès',
    data: {
      user: {
        ...user,
        email_verified: true,
        mot_de_passe: undefined
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    }
  });
});

// Resend email verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email requis', 400, 'MISSING_EMAIL');
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
  }

  if (user.email_verified) {
    throw new AppError('Email déjà vérifié', 400, 'EMAIL_ALREADY_VERIFIED');
  }

  // Generate new verification code
  const verificationCode = generateVerificationCode();

  // Update user with new code
  await prisma.user.update({
    where: { email },
    data: {
      email_verification_code: verificationCode,
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  // Send verification email
  await sendEmailVerification(email, verificationCode);

  res.json({
    success: true,
    message: 'Code de vérification envoyé'
  });
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email requis', 400, 'MISSING_EMAIL');
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    });
  }

  // Generate reset token
  const resetToken = generatePasswordResetToken(user.id);

  // Send reset email
  await sendPasswordResetEmail(email, resetToken);

  res.json({
    success: true,
    message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
  });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, mot_de_passe } = req.body;

  if (!token || !mot_de_passe) {
    throw new AppError('Token et nouveau mot de passe requis', 400, 'MISSING_DATA');
  }

  try {
    const decoded = verifyToken(token);
    
    if (decoded.type !== 'password_reset') {
      throw new AppError('Token invalide', 400, 'INVALID_TOKEN');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

    // Update user password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        mot_de_passe: hashedPassword
      }
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token de réinitialisation expiré', 400, 'TOKEN_EXPIRED');
    }
    throw new AppError('Token de réinitialisation invalide', 400, 'INVALID_TOKEN');
  }
});

// Send phone verification code
const sendPhoneVerificationCode = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || !isValidMoroccanPhone(phone)) {
    throw new AppError('Numéro de téléphone marocain valide requis', 400, 'INVALID_PHONE');
  }

  // Generate verification code
  const code = generateVerificationCode(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save verification code
  await prisma.phoneVerification.create({
    data: {
      phone,
      code,
      expires_at: expiresAt
    }
  });

  // TODO: Send SMS with Twilio
  // For now, just return success (in production, integrate Twilio)
  console.log(`SMS Code for ${phone}: ${code}`);

  res.json({
    success: true,
    message: 'Code de vérification envoyé par SMS',
    // Remove in production
    ...(process.env.NODE_ENV === 'development' && { code })
  });
});

// Verify phone
const verifyPhone = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    throw new AppError('Téléphone et code requis', 400, 'MISSING_DATA');
  }

  // Find verification record
  const verification = await prisma.phoneVerification.findFirst({
    where: {
      phone,
      code,
      expires_at: {
        gt: new Date()
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  if (!verification) {
    // Increment attempts
    await prisma.phoneVerification.updateMany({
      where: { phone },
      data: {
        attempts: {
          increment: 1
        }
      }
    });

    throw new AppError('Code invalide ou expiré', 400, 'INVALID_CODE');
  }

  // Update user phone verification status
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        phone_verified: true,
        telephone: phone
      }
    });
  }

  // Delete verification record
  await prisma.phoneVerification.delete({
    where: { id: verification.id }
  });

  res.json({
    success: true,
    message: 'Téléphone vérifié avec succès'
  });
});

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      loyaltyAccount: {
        include: {
          tier: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: { user }
  });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone, adresse, permis_conduire, cin, date_naissance, date_obtention_permis, certifie_age_21, certifie_permis_2ans } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(nom && { nom }),
      ...(prenom && { prenom }),
      ...(telephone && { telephone }),
      ...(adresse && { adresse }),
      ...(permis_conduire && { permis_conduire }),
      ...(cin && { cin }),
      ...(date_naissance && { date_naissance: new Date(date_naissance) }),
      ...(date_obtention_permis && { date_obtention_permis: new Date(date_obtention_permis) }),
      ...(certifie_age_21 !== undefined && { certifie_age_21 }),
      ...(certifie_permis_2ans !== undefined && { certifie_permis_2ans })
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      adresse: true,
      role: true,
      email_verified: true,
      phone_verified: true,
      permis_conduire: true,
      cin: true,
      date_naissance: true,
      date_obtention_permis: true,
      certifie_age_21: true,
      certifie_permis_2ans: true
    }
  });

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: { user }
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    throw new AppError('Mot de passe actuel et nouveau mot de passe requis', 400, 'MISSING_DATA');
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user.mot_de_passe) {
    throw new AppError('Impossible de changer le mot de passe pour ce compte', 400, 'OAUTH_ACCOUNT');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(current_password, user.mot_de_passe);
  
  if (!isCurrentPasswordValid) {
    throw new AppError('Mot de passe actuel incorrect', 400, 'INVALID_PASSWORD');
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(new_password, 12);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      mot_de_passe: hashedNewPassword
    }
  });

  res.json({
    success: true,
    message: 'Mot de passe modifié avec succès'
  });
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  // Accept refreshToken in body and verify it without requiring access token
  const { refreshToken: refreshTokenValue } = req.body;

  if (!refreshTokenValue) {
    throw new AppError('Refresh token requis', 400, 'MISSING_REFRESH_TOKEN');
  }

  try {
    const decoded = verifyToken(refreshTokenValue);

    if (decoded.type !== 'refresh') {
      throw new AppError('Type de token invalide', 400, 'INVALID_TOKEN_TYPE');
    }

    // Ensure user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true
      }
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { user_id: user.id },
      select: { token_hash: true }
    });
    if (!stored) {
      throw new AppError('Refresh token invalide', 401, 'INVALID_REFRESH_TOKEN');
    }
    const matches = await bcrypt.compare(refreshTokenValue, stored.token_hash);
    if (!matches) {
      throw new AppError('Refresh token déjà utilisé', 401, 'AUTH_REFRESH_REUSED');
    }

    const access = generateAccessToken(user.id);
    const refresh = generateRefreshToken(user.id);
    const newHash = await bcrypt.hash(refresh, 12);
    await prisma.refreshToken.update({
      where: { user_id: user.id },
      data: { token_hash: newHash }
    });

    res.json({
      success: true,
      data: {
        tokens: {
          access,
          refresh
        }
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expiré', 401, 'TOKEN_EXPIRED');
    }
    throw error;
  }
});

// Logout
const logout = asyncHandler(async (req, res) => {
  await prisma.refreshToken.deleteMany({
    where: { user_id: req.user.id }
  });
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

module.exports = {
  register,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendPhoneVerificationCode,
  verifyPhone,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout
};
