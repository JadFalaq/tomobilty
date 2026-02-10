const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ override: true });

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'falaqjad@tommobilty.com';
    const password = 'Admin123@';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`👤 Checking for admin user: ${email}`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('🔄 User exists. Updating role and password...');
      await prisma.user.update({
        where: { email },
        data: {
          mot_de_passe: hashedPassword,
          role: 'ADMIN',
          nom: 'Falaq',
          prenom: 'Jad',
          email_verified: true
        }
      });
      console.log('✅ Admin user updated successfully.');
    } else {
      console.log('➕ Creating new admin user...');
      await prisma.user.create({
        data: {
          email,
          mot_de_passe: hashedPassword,
          role: 'ADMIN',
          nom: 'Falaq',
          prenom: 'Jad',
          email_verified: true,
          phone_verified: true
        }
      });
      console.log('✅ Admin user created successfully.');
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
