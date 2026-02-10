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
const sendEmailVerification = async (email, code) => {
  const transporter = createTransporter();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Path to the logo file
  const path = require('path');
  const fs = require('fs');
  // Use __dirname to resolve path relative to this file
  // backend/src/utils -> backend/src -> backend -> root -> public
  const logoPath = path.join(__dirname, '../../../public/uploads/logo_banner.png');
  
  console.log('--- Email Debug ---');
  console.log('Sending email to:', email);
  console.log('Logo Path:', logoPath);
  console.log('Logo Exists:', fs.existsSync(logoPath));
  console.log('SMTP User:', process.env.EMAIL_USER);
  
  // Clean email input to avoid whitespace issues
  const cleanEmail = email.trim();

  const mailOptions = {
    from: `"Tommobilty" <${process.env.EMAIL_USER}>`,
    to: cleanEmail,
    subject: '🔐 Vérifiez votre compte Tommobilty',
    attachments: [{
      filename: 'logo.png',
      path: logoPath,
      cid: 'logo' // same cid value as in the html img src
    }],
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification de compte Tommobilty</title>
        <style>
          /* Reset styles */
          body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #000000; }
          img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            body, table, td { background-color: #000000 !important; color: #ffffff !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000 !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <!-- Wrapper Table (Forces Background) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; margin: 0; padding: 0;" bgcolor="#000000">
          <tr>
            <td align="center" style="padding: 40px 0; background-color: #000000;" bgcolor="#000000">
              
              <!-- Container -->
              <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="background-color: #000000; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 30px rgba(0,0,0,0.5); border: 1px solid #333333; max-width: 600px;">
                
                <!-- Header with Logo -->
                <tr>
                  <td align="center" style="padding: 40px 0; background-color: #000000; border-bottom: 1px solid #222222;" bgcolor="#000000">
                    <img src="cid:logo" alt="Tommobilty" width="300" style="display: block; border: 0; max-width: 100%; height: auto;" />
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px; background-color: #111111;" bgcolor="#111111">
                    <h1 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px; text-align: center; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Bienvenue chez <span style="color: #ff003c;">Tommobilty</span></h1>
                    
                    <p style="color: #aaaaaa; font-size: 16px; line-height: 24px; text-align: center; margin: 0 0 30px 0;">
                      Merci de rejoindre l'élite de la location de voitures au Maroc. Pour finaliser votre inscription et accéder à votre espace, veuillez utiliser le code de vérification ci-dessous.
                    </p>

                    <!-- Code Box -->
                    <div style="background-color: #1a1a1a; border: 1px solid #ff003c; border-radius: 12px; padding: 20px; text-align: center; margin: 0 auto 30px auto; width: 80%;">
                      <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">${code}</span>
                    </div>

                    <p style="color: #666666; font-size: 14px; text-align: center; margin: 0 0 0 0;">
                      Ce code est valable pendant <strong style="color: #ff003c;">24 heures</strong>.
                    </p>
                    <p style="color: #666666; font-size: 14px; text-align: center; margin: 10px 0 0 0;">
                      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #000000; padding: 30px; border-top: 1px solid #222222; text-align: center;" bgcolor="#000000">
                    <p style="color: #ffffff; font-weight: bold; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase;">Tommobilty Maroc</p>
                    <p style="color: #666666; font-size: 12px; margin: 0 0 20px 0;">L'expérience automobile premium.</p>
                    
                    <!-- Social Links -->
                    <div style="margin-bottom: 20px;">
                      <a href="https://web.facebook.com/profile.php?id=61585338434243" style="color: #aaaaaa; text-decoration: none; margin: 0 10px; font-size: 12px;">Facebook</a>
                      <span style="color: #333333;">|</span>
                      <a href="https://www.instagram.com/tommobilty?igsh=d2xnZXR0ZGw5ZWg=" style="color: #aaaaaa; text-decoration: none; margin: 0 10px; font-size: 12px;">Instagram</a>
                      <span style="color: #333333;">|</span>
                      <a href="https://tommobilty.com" style="color: #aaaaaa; text-decoration: none; margin: 0 10px; font-size: 12px;">Site Web</a>
                    </div>
                    
                    <p style="color: #444444; font-size: 10px; margin: 0;">
                      © ${new Date().getFullYear()} Tommobilty. Tous droits réservés.<br>
                      Ceci est un message automatique, merci de ne pas y répondre.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
