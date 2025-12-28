const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function populateCarCategories() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🚗 Populating car categories and examples...');

    // Comprehensive list of car categories
    const carCategories = [
      {
        name: 'Économique',
        description: 'Voitures compactes et économiques, parfaites pour la ville et les trajets courts. Consommation réduite et tarifs avantageux.'
      },
      {
        name: 'Compacte',
        description: 'Véhicules de taille moyenne offrant un bon compromis entre espace et maniabilité. Idéales pour les familles et trajets urbains.'
      },
      {
        name: 'Berline',
        description: 'Voitures spacieuses et confortables avec coffre séparé. Parfaites pour les voyages d\'affaires et longs trajets.'
      },
      {
        name: 'SUV',
        description: 'Véhicules utilitaires sport offrant une position de conduite élevée et un grand espace. Adaptés à tous terrains.'
      },
      {
        name: 'Luxe',
        description: 'Véhicules haut de gamme avec équipements premium et finitions exceptionnelles. Pour une expérience de conduite raffinée.'
      },
      {
        name: 'Monospace',
        description: 'Véhicules familiaux spacieux pouvant accueillir jusqu\'à 7-9 passagers. Idéaux pour les grands groupes et familles nombreuses.'
      },
      {
        name: 'Cabriolet',
        description: 'Voitures décapotables pour profiter du soleil et des paysages. Parfaites pour les escapades romantiques et vacances.'
      },
      {
        name: 'Sportive',
        description: 'Véhicules haute performance avec moteurs puissants et design dynamique. Pour les amateurs de sensations fortes.'
      },
      {
        name: 'Électrique',
        description: 'Véhicules 100% électriques respectueux de l\'environnement. Silencieux, économiques et écologiques.'
      },
      {
        name: 'Hybride',
        description: 'Véhicules combinant moteur thermique et électrique. Consommation réduite et respect de l\'environnement.'
      },
      {
        name: 'Utilitaire',
        description: 'Véhicules de transport et livraison avec grand volume de chargement. Parfaits pour déménagements et transport de marchandises.'
      },
      {
        name: 'Break',
        description: 'Voitures familiales avec grand coffre et modularité. Idéales pour les vacances et transport d\'équipements volumineux.'
      }
    ];

    // Check if categories already exist
    const existingCategories = await prisma.carCategory.findMany();
    console.log(`📊 Found ${existingCategories.length} existing categories`);

    if (existingCategories.length > 0) {
      console.log('⚠️  Categories already exist. Adding only new categories...');
      
      const existingCategoryNames = existingCategories.map(cat => cat.name.toLowerCase());
      const newCategories = carCategories.filter(cat => 
        !existingCategoryNames.includes(cat.name.toLowerCase())
      );
      
      if (newCategories.length === 0) {
        console.log('✅ All categories already exist in database');
      } else {
        console.log(`➕ Adding ${newCategories.length} new categories...`);
        
        const result = await prisma.carCategory.createMany({
          data: newCategories,
          skipDuplicates: true
        });
        
        console.log(`✅ Successfully added ${result.count} new car categories`);
      }
    } else {
      // Insert all categories
      console.log(`➕ Inserting ${carCategories.length} car categories...`);
      
      const result = await prisma.carCategory.createMany({
        data: carCategories,
        skipDuplicates: true
      });
      
      console.log(`✅ Successfully inserted ${result.count} car categories`);
    }

    // Get all categories for car examples
    const allCategories = await prisma.carCategory.findMany();
    console.log(`📊 Total categories in database: ${allCategories.length}`);

    // Show categories
    console.log('\n🔍 Car categories:');
    allCategories.forEach(category => {
      console.log(`  - ${category.name}: ${category.description?.substring(0, 80)}...`);
    });

    console.log('\n✅ Car categories population completed successfully!');
    console.log('\n💡 Next step: You can now add car examples for each category using the car management system.');

  } catch (error) {
    console.error('❌ Error populating car categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  populateCarCategories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { populateCarCategories };
