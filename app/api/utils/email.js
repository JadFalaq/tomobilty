const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Configuration pour production (ex: SendGrid, Mailgun, etc.)
    return nodemailer.createTransporter({
      service: 'gmail', // ou autre service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Configuration pour développement (Ethereal Email)
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Tomobilty <noreply@tomobilty.ma>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Fallback text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email envoyé:', info.messageId);
    
    // Pour le développement, retourner l'URL de prévisualisation
    if (process.env.NODE_ENV !== 'production') {
      return {
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    }

    return { messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
