const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email verification
const sendEmailVerification = async (email, token) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Tommobilty" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Vérification de votre adresse email - Tommobilty',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">Bienvenue sur Tommobilty !</h2>
        <p>Merci de vous être inscrit sur notre plateforme de location de voitures.</p>
        <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Vérifier mon email
        </a>
        <p>Ce lien expire dans 24 heures.</p>
        <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Tommobilty - Location de voitures au Maroc<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Tommobilty" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe - Tommobilty',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Réinitialiser mon mot de passe
        </a>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Tommobilty - Location de voitures au Maroc<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

// Send booking confirmation email
const sendBookingConfirmation = async (email, booking) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Tommobilty" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Confirmation de réservation #${booking.id} - Tommobilty`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #16a34a;">Réservation confirmée !</h2>
        <p>Votre réservation a été confirmée avec succès.</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <h3>Détails de la réservation</h3>
          <p><strong>Numéro de réservation :</strong> #${booking.id}</p>
          <p><strong>Véhicule :</strong> ${booking.car.brand.name} ${booking.car.modele}</p>
          <p><strong>Date de début :</strong> ${new Date(booking.date_debut).toLocaleDateString('fr-FR')}</p>
          <p><strong>Date de fin :</strong> ${new Date(booking.date_fin).toLocaleDateString('fr-FR')}</p>
          <p><strong>Prix total :</strong> ${booking.prix_total} MAD</p>
        </div>
        
        <p>Vous recevrez bientôt votre contrat de location par email.</p>
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Tommobilty - Location de voitures au Maroc<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

// Send contract email
const sendContractEmail = async (email, contractPath, booking) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Tommobilty" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Contrat de location #${booking.id} - Tommobilty`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">Votre contrat de location</h2>
        <p>Veuillez trouver ci-joint votre contrat de location.</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Réservation :</strong> #${booking.id}</p>
          <p><strong>Véhicule :</strong> ${booking.car.brand.name} ${booking.car.modele}</p>
        </div>
        
        <p>Merci de bien vouloir lire attentivement le contrat avant la prise en charge du véhicule.</p>
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Tommobilty - Location de voitures au Maroc<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `contrat-${booking.id}.pdf`,
        path: contractPath
      }
    ]
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmailVerification,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendContractEmail
};
