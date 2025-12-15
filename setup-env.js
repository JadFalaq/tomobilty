const fs = require('fs');
const path = require('path');

// Contenu du fichier .env
const envContent = `# Base de données MongoDB
MONGODB_URI=mongodb://localhost:27017/tomobilty

# JWT Secret pour l'authentification
JWT_SECRET=tomobilty_secret_key_2024_change_this_in_production

# Configuration du serveur
PORT=5000
NODE_ENV=development

# URL du frontend (pour CORS)
FRONTEND_URL=http://localhost:3000
`;

// Eviter d'écraser la config en environnement CI/Vercel
const isCI = process.env.CI === 'true' || !!process.env.VERCEL;

// Créer le fichier .env (utile en local uniquement)
const envPath = path.join(__dirname, '.env');
if (!isCI) {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Fichier .env créé avec succès!');
  } else {
    console.log('ℹ️  Le fichier .env existe déjà');
  }
} else {
  console.log('⏭️  CI/Vercel détecté: skip création .env');
}

// Créer le fichier .env.local pour Next.js (local uniquement)
const envLocalContent = `NEXT_PUBLIC_API_URL=http://localhost:8000/api
`;

const envLocalPath = path.join(__dirname, '.env.local');

if (!isCI) {
  if (!fs.existsSync(envLocalPath)) {
    fs.writeFileSync(envLocalPath, envLocalContent);
    console.log('✅ Fichier .env.local créé avec succès!');
  } else {
    console.log('ℹ️  Le fichier .env.local existe déjà');
  }
} else {
  console.log('⏭️  CI/Vercel détecté: skip création .env.local');
}

console.log('\n📝 Configuration terminée!');
console.log('Vous pouvez maintenant lancer l\'application avec: npm run dev:all');
