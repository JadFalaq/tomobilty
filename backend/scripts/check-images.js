require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Using DB URL:', process.env.DATABASE_URL);
  const images = await prisma.carImage.findMany({
    take: 10,
    orderBy: {
      created_at: 'desc'
    }
  });
  console.log('Recent car images:', JSON.stringify(images, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
