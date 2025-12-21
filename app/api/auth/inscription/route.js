import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../../config/database';
import { sendEmail } from '../../utils/email';

export async function POST(request) {
  try {
    const { nom, prenom, email, telephone, motDePasse } = await request.json();
    
    // Vérifier si l'email existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ message: 'Email déjà utilisé' }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 12);
    
    // Créer l'utilisateur
    const result = await query(`
      INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, nom, prenom, email, telephone, role
    `, [nom, prenom, email, telephone, hashedPassword, 'client']);

    const user = result.rows[0];

    // Générer token de vérification email
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await query(
      'UPDATE users SET email_verification_token=$1, email_verification_expires=$2 WHERE id=$3',
      [token, expires, user.id]
    );

    // Envoyer email de vérification (en développement, on simule)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔗 Lien de vérification: ${process.env.FRONTEND_URL}/verify-email?token=${token}`);
    } else {
      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      await sendEmail({
        to: email,
        subject: 'Vérification de votre compte Tomobilty',
        html: `
          <h2>Bienvenue sur Tomobilty !</h2>
          <p>Merci de vous être inscrit. Veuillez confirmer votre email en cliquant sur le lien ci-dessous :</p>
          <a href="${verifyUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Vérifier mon email
          </a>
          <p>Ce lien expire dans 24 heures.</p>
        `
      });
    }

    return NextResponse.json({
      message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
      user: { ...user, mot_de_passe: undefined }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json({ 
      message: 'Erreur lors de l\'inscription', 
      error: error.message 
    }, { status: 500 });
  }
}
