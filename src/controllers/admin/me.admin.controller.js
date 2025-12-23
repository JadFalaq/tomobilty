const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../../middlewares/errorHandler.middleware');

// Get current admin's settings (profile + preferences)
const getMySettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      adresse: true,
      role: true
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get or create admin settings
  let settings = await prisma.adminSettings.findUnique({
    where: { user_id: userId }
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.adminSettings.create({
      data: {
        user_id: userId,
        language: 'fr',
        timezone: 'Africa/Casablanca',
        notification_email: true,
        notification_sms: false,
        dashboard_default_range: '7d'
      }
    });
  }

  res.json({
    success: true,
    data: {
      profile: user,
      preferences: {
        language: settings.language,
        timezone: settings.timezone,
        notification_email: settings.notification_email,
        notification_sms: settings.notification_sms,
        dashboard_default_range: settings.dashboard_default_range
      }
    }
  });
});

// Update current admin's settings
const updateMySettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { profile, preferences } = req.body;

  // Whitelist allowed profile fields
  const allowedProfileFields = ['nom', 'prenom', 'telephone', 'adresse'];
  const profileUpdates = {};
  
  if (profile) {
    allowedProfileFields.forEach(field => {
      if (profile[field] !== undefined) {
        profileUpdates[field] = profile[field];
      }
    });
  }

  // Whitelist allowed preference fields
  const allowedPreferenceFields = [
    'language',
    'timezone',
    'notification_email',
    'notification_sms',
    'dashboard_default_range'
  ];
  const preferenceUpdates = {};
  
  if (preferences) {
    allowedPreferenceFields.forEach(field => {
      if (preferences[field] !== undefined) {
        preferenceUpdates[field] = preferences[field];
      }
    });
  }

  // Update profile if there are changes
  if (Object.keys(profileUpdates).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: profileUpdates
    });
  }

  // Update or create preferences if there are changes
  if (Object.keys(preferenceUpdates).length > 0) {
    await prisma.adminSettings.upsert({
      where: { user_id: userId },
      update: preferenceUpdates,
      create: {
        user_id: userId,
        ...preferenceUpdates
      }
    });
  }

  // Fetch updated data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      adresse: true,
      role: true
    }
  });

  const settings = await prisma.adminSettings.findUnique({
    where: { user_id: userId }
  });

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      profile: user,
      preferences: {
        language: settings.language,
        timezone: settings.timezone,
        notification_email: settings.notification_email,
        notification_sms: settings.notification_sms,
        dashboard_default_range: settings.dashboard_default_range
      }
    }
  });
});

// Change current admin's password
const changeMyPassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // Validate required fields
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long'
    });
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.mot_de_passe) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.mot_de_passe);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { mot_de_passe: hashedPassword }
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  getMySettings,
  updateMySettings,
  changeMyPassword
};
