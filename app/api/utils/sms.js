// Utilitaire pour l'envoi de SMS (Twilio ou autre service)

const sendSMS = async (phone, message) => {
  try {
    // En développement, on simule l'envoi
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📱 SMS simulé vers ${phone}: ${message}`);
      return { success: true, messageId: 'dev-' + Date.now() };
    }

    // Configuration Twilio pour production
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM,
        to: phone
      });

      console.log('📱 SMS envoyé:', result.sid);
      return { success: true, messageId: result.sid };
    }

    throw new Error('Configuration SMS manquante');
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    throw error;
  }
};

module.exports = { sendSMS };
