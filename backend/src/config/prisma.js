const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

// Disable SSL certificate verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const runtimeDatabaseUrl = process.env.DATABASE_URL;
const dataSourceLabel = 'DATABASE_URL';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: runtimeDatabaseUrl
    }
  }
});

// Test database connection with retry logic
const connectDatabase = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log(`✅ Database connected successfully via ${dataSourceLabel}`);
      return true;
    } catch (error) {
      console.error(`❌ Prisma connection attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        console.log(`⚠️  All connection attempts failed using ${dataSourceLabel}. API will continue running with mock data`);
        return false;
      }
    }
  }
  return false;
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Try to connect but don't block startup
connectDatabase();

module.exports = prisma;
