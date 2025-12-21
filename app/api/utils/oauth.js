const { OAuth2Client } = require('google-auth-library');

// Configuration Google OAuth
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleIdToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error('❌ Erreur vérification Google token:', error);
    throw new Error('Token Google invalide');
  }
};

module.exports = { verifyGoogleIdToken };
