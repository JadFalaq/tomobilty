
const { pool } = require('./src/database');
const User = require('./src/models/user');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const nom = 'Falaq';
  const prenom = 'Jad';
  const email = 'jadfalaq@gmail.com';
  const telephone = '0600000000'; // Placeholder phone number
  const password = 'Password123!'; // Mot de passe par défaut
  
  console.log(`Checking for user ${email}...`);
  
  try {
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      console.log('User exists. Updating role to admin...');
      await pool.query("UPDATE users SET role = 'admin', nom = $1, prenom = $2 WHERE email = $3", [nom, prenom, email]);
      console.log('User updated successfully.');
    } else {
      console.log('User does not exist. Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      
      await pool.query(
        `INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, 'admin', true)`,
        [nom, prenom, email, telephone, hashed]
      );
      console.log(`User created successfully with password: ${password}`);
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
