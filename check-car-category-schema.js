const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function checkCarCategorySchema() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔍 Checking car_category table structure...');
    
    // Check table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'car_category' 
      ORDER BY ordinal_position
    `;
    
    console.log('📊 car_category table columns:');
    tableInfo.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check existing categories
    const existingCategories = await prisma.carCategory.findMany({
      take: 5
    });
    
    console.log(`\n📋 Found ${existingCategories.length > 0 ? existingCategories.length + ' existing categories (showing first 5)' : 'no existing categories'}:`);
    existingCategories.forEach(category => {
      console.log(`  - ID: ${category.id}, Name: ${category.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCarCategorySchema();
