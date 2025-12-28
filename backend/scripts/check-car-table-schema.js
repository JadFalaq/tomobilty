const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function checkCarTableSchema() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔍 Checking car table structure...');
    
    // Check table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'car' 
      ORDER BY ordinal_position
    `;
    
    console.log('📊 car table columns:');
    tableInfo.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check existing cars
    const existingCars = await prisma.car.count();
    console.log(`\n📋 Found ${existingCars} existing cars`);
    
    // Check brands and categories
    const brandsCount = await prisma.carBrand.count();
    const categoriesCount = await prisma.carCategory.count();
    
    console.log(`📊 Available brands: ${brandsCount}`);
    console.log(`📊 Available categories: ${categoriesCount}`);
    
    if (brandsCount > 0) {
      console.log('\n🏷️ Sample brands:');
      const sampleBrands = await prisma.carBrand.findMany({ take: 5 });
      sampleBrands.forEach(brand => console.log(`  - ${brand.name}`));
    }
    
    if (categoriesCount > 0) {
      console.log('\n🏷️ Sample categories:');
      const sampleCategories = await prisma.carCategory.findMany({ take: 5 });
      sampleCategories.forEach(category => console.log(`  - ${category.name}`));
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCarTableSchema();
