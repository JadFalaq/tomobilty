const { PrismaClient } = require('@prisma/client');

// Disable SSL certificate verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Test database connection (non-blocking)
const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Prisma connection error:', error);
    console.log('⚠️  API will continue running with mock data');
    return false;
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Try to connect but don't block startup
connectDatabase();

module.exports = prisma;
