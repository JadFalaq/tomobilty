const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function checkCarBrandSchema() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔍 Checking car_brand table structure...');
    
    // Check table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'car_brand' 
      ORDER BY ordinal_position
    `;
    
    console.log('📊 car_brand table columns:');
    tableInfo.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check existing brands
    const existingBrands = await prisma.carBrand.findMany({
      take: 5
    });
    
    console.log(`\n📋 Found ${existingBrands.length > 0 ? existingBrands.length + ' existing brands (showing first 5)' : 'no existing brands'}:`);
    existingBrands.forEach(brand => {
      console.log(`  - ID: ${brand.id}, Name: ${brand.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCarBrandSchema();
