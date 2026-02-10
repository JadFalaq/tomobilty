const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        email_verified: true,
        email_verification_code: true,
        date_creation: true
      },
      orderBy: {
        date_creation: 'desc'
      },
      take: 10
    });

    console.log('\n--- Derniers utilisateurs inscrits ---');
    if (users.length === 0) {
      console.log('Aucun utilisateur trouvé.');
    } else {
      console.table(users.map(u => ({
        Email: u.email,
        'Nom complet': `${u.prenom} ${u.nom}`,
        'Vérifié': u.email_verified ? 'OUI' : 'NON',
        'Code': u.email_verification_code || 'N/A',
        'Date': u.date_creation ? new Date(u.date_creation).toLocaleString() : 'N/A'
      })));
    }
    console.log('--------------------------------------\n');
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
