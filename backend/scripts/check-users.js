
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('Connecting to database...');
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);

    const recentUsers = await prisma.user.findMany({
      orderBy: { date_creation: 'desc' },
      take: 5,
      include: { oauthAccounts: true }
    });

    console.log('Recent users:');
    recentUsers.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.prenom} ${u.nom}, Auth: ${u.oauthAccounts.map(oa => oa.provider).join(', ')}`);
    });

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
