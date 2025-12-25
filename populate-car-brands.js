const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function populateCarBrands() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🚗 Populating car brands database...');

    // Comprehensive list of car brands (adapted to your table structure)
    const carBrands = [
      // Marques de luxe
      { name: 'Aston Martin' },
      { name: 'Bentley' },
      { name: 'Ferrari' },
      { name: 'Lamborghini' },
      { name: 'Maserati' },
      { name: 'McLaren' },
      { name: 'Porsche' },
      { name: 'Rolls-Royce' },

      // Marques allemandes
      { name: 'Audi' },
      { name: 'BMW' },
      { name: 'Mercedes-Benz' },
      { name: 'Volkswagen' },
      { name: 'Opel' },
      { name: 'Smart' },

      // Marques françaises
      { name: 'Peugeot' },
      { name: 'Renault' },
      { name: 'Citroën' },
      { name: 'DS Automobiles' },
      { name: 'Alpine' },

      // Marques italiennes
      { name: 'Fiat' },
      { name: 'Alfa Romeo' },
      { name: 'Lancia' },

      // Marques japonaises
      { name: 'Toyota' },
      { name: 'Honda' },
      { name: 'Nissan' },
      { name: 'Mazda' },
      { name: 'Mitsubishi' },
      { name: 'Subaru' },
      { name: 'Suzuki' },
      { name: 'Lexus' },
      { name: 'Infiniti' },
      { name: 'Acura' },

      // Marques coréennes
      { name: 'Hyundai' },
      { name: 'Kia' },
      { name: 'Genesis' },

      // Marques américaines
      { name: 'Ford' },
      { name: 'Chevrolet' },
      { name: 'Cadillac' },
      { name: 'Lincoln' },
      { name: 'Jeep' },
      { name: 'Dodge' },
      { name: 'Chrysler' },
      { name: 'Buick' },
      { name: 'GMC' },

      // Marques électriques / modernes
      { name: 'Tesla' },
      { name: 'Rivian' },
      { name: 'Lucid Motors' },
      { name: 'Polestar' },

      // Marques britanniques
      { name: 'Jaguar' },
      { name: 'Land Rover' },
      { name: 'Range Rover' },
      { name: 'Mini' },
      { name: 'Lotus' },

      // Marques suédoises
      { name: 'Volvo' },
      { name: 'Saab' },

      // Marques chinoises
      { name: 'BYD' },
      { name: 'Geely' },
      { name: 'NIO' },
      { name: 'Xpeng' },
      { name: 'Li Auto' },

      // Marques tchèques
      { name: 'Škoda' },

      // Marques roumaines
      { name: 'Dacia' },

      // Marques espagnoles
      { name: 'SEAT' },
      { name: 'Cupra' },

      // Marques indiennes
      { name: 'Tata Motors' },
      { name: 'Mahindra' },

      // Marques malaises
      { name: 'Proton' },

      // Marques russes
      { name: 'Lada' },

      // Marques australiennes
      { name: 'Holden' },

      // Autres marques importantes
      { name: 'Isuzu' },
      { name: 'Iveco' },
      { name: 'MAN' },
      { name: 'Scania' },
      { name: 'DAF' }
    ];

    // Check if brands already exist
    const existingBrands = await prisma.carBrand.findMany();
    console.log(`📊 Found ${existingBrands.length} existing brands`);

    if (existingBrands.length > 0) {
      console.log('⚠️  Brands already exist. Do you want to:');
      console.log('1. Skip insertion (brands already populated)');
      console.log('2. Add only new brands (recommended)');
      console.log('3. Clear all and repopulate');
      
      // For this script, we'll add only new brands
      const existingBrandNames = existingBrands.map(brand => brand.name.toLowerCase());
      const newBrands = carBrands.filter(brand => 
        !existingBrandNames.includes(brand.name.toLowerCase())
      );
      
      if (newBrands.length === 0) {
        console.log('✅ All brands already exist in database');
        return;
      }
      
      console.log(`➕ Adding ${newBrands.length} new brands...`);
      
      // Insert new brands
      const result = await prisma.carBrand.createMany({
        data: newBrands,
        skipDuplicates: true
      });
      
      console.log(`✅ Successfully added ${result.count} new car brands`);
    } else {
      // Insert all brands
      console.log(`➕ Inserting ${carBrands.length} car brands...`);
      
      const result = await prisma.carBrand.createMany({
        data: carBrands,
        skipDuplicates: true
      });
      
      console.log(`✅ Successfully inserted ${result.count} car brands`);
    }

    // Display final count
    const totalBrands = await prisma.carBrand.count();
    console.log(`📊 Total brands in database: ${totalBrands}`);

    // Show some examples
    console.log('\n🔍 Sample brands:');
    const sampleBrands = await prisma.carBrand.findMany({
      take: 10,
      orderBy: { name: 'asc' }
    });
    
    sampleBrands.forEach(brand => {
      console.log(`  - ${brand.name}`);
    });

    console.log('\n✅ Car brands population completed successfully!');

  } catch (error) {
    console.error('❌ Error populating car brands:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  populateCarBrands()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { populateCarBrands };
