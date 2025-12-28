const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function populateCarExamples() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🚗 Adding car examples for each category...');

    // Get all brands and categories
    const brands = await prisma.carBrand.findMany();
    const categories = await prisma.carCategory.findMany();

    console.log(`📊 Found ${brands.length} brands and ${categories.length} categories`);

    // Helper function to get brand ID by name
    const getBrandId = (brandName) => {
      const brand = brands.find(b => b.name === brandName);
      return brand ? brand.id : brands[0].id; // fallback to first brand
    };

    // Helper function to get category ID by name
    const getCategoryId = (categoryName) => {
      const category = categories.find(c => c.name === categoryName);
      return category ? category.id : categories[0].id; // fallback to first category
    };

    // Comprehensive car examples organized by category
    const carExamples = [
      // Économique
      {
        brand_id: getBrandId('Renault'),
        category_id: getCategoryId('Économique'),
        modele: 'Clio',
        annee: 2022,
        immatriculation: 'ECO001MA',
        couleur: 'Blanc',
        transmission: 'Manuelle',
        nombre_places: 5,
        nombre_portes: 5,
        climatisation: true,
        gps: false,
        prix_par_jour: 250,
        caution: 2000,
        kilometrage: 15000,
        statut: 'DISPONIBLE',
        ville: 'Casablanca',
        disponible: true,
        type_carburant: 'ESSENCE',
        description: 'Voiture économique parfaite pour la ville, consommation réduite et facile à garer.'
      },
      {
        brand_id: getBrandId('Peugeot'),
        category_id: getCategoryId('Économique'),
        modele: '208',
        annee: 2023,
        immatriculation: 'ECO002MA',
        couleur: 'Rouge',
        transmission: 'Manuelle',
        nombre_places: 5,
        nombre_portes: 5,
        climatisation: true,
        gps: true,
        prix_par_jour: 280,
        caution: 2200,
        kilometrage: 8000,
        statut: 'DISPONIBLE',
        ville: 'Rabat',
        disponible: true,
        type_carburant: 'ESSENCE',
        description: 'Citadine moderne avec GPS intégré, idéale pour les trajets urbains.'
      },

      // Compacte
      {
        brand_id: getBrandId('Volkswagen'),
        category_id: getCategoryId('Compacte'),
        modele: 'Golf',
        annee: 2022,
        immatriculation: 'COM001MA',
        couleur: 'Gris',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 5,
        climatisation: true,
        gps: true,
        prix_par_jour: 350,
        caution: 2500,
        kilometrage: 12000,
        statut: 'DISPONIBLE',
        ville: 'Marrakech',
        disponible: true,
        type_carburant: 'ESSENCE',
        description: 'Compacte polyvalente avec transmission automatique et équipements modernes.'
      },
      {
        brand_id: getBrandId('Toyota'),
        category_id: getCategoryId('Compacte'),
        modele: 'Corolla',
        annee: 2023,
        immatriculation: 'COM002MA',
        couleur: 'Bleu',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 4,
        climatisation: true,
        gps: true,
        prix_par_jour: 380,
        caution: 2800,
        kilometrage: 5000,
        statut: 'DISPONIBLE',
        ville: 'Fès',
        disponible: true,
        type_carburant: 'HYBRIDE',
        description: 'Berline compacte hybride, économique et respectueuse de l\'environnement.'
      },

      // Berline
      {
        brand_id: getBrandId('Mercedes-Benz'),
        category_id: getCategoryId('Berline'),
        modele: 'Classe C',
        annee: 2022,
        immatriculation: 'BER001MA',
        couleur: 'Noir',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 4,
        climatisation: true,
        gps: true,
        prix_par_jour: 650,
        caution: 5000,
        kilometrage: 18000,
        statut: 'DISPONIBLE',
        ville: 'Casablanca',
        disponible: true,
        type_carburant: 'ESSENCE',
        description: 'Berline de prestige avec finitions premium et confort exceptionnel.'
      },
      {
        brand_id: getBrandId('BMW'),
        category_id: getCategoryId('Berline'),
        modele: 'Série 3',
        annee: 2023,
        immatriculation: 'BER002MA',
        couleur: 'Blanc',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 4,
        climatisation: true,
        gps: true,
        prix_par_jour: 700,
        caution: 5500,
        kilometrage: 10000,
        statut: 'DISPONIBLE',
        ville: 'Rabat',
        disponible: true,
        type_carburant: 'DIESEL',
        description: 'Berline sportive allemande alliant performance et élégance.'
      },

      // SUV
      {
        brand_id: getBrandId('Toyota'),
        category_id: getCategoryId('SUV'),
        modele: 'RAV4',
        annee: 2022,
        immatriculation: 'SUV001MA',
        couleur: 'Gris',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 5,
        climatisation: true,
        gps: true,
        prix_par_jour: 550,
        caution: 4000,
        kilometrage: 20000,
        statut: 'DISPONIBLE',
        ville: 'Marrakech',
        disponible: true,
        type_carburant: 'HYBRIDE',
        description: 'SUV hybride spacieux, parfait pour les aventures en famille.'
      },
      {
        brand_id: getBrandId('Nissan'),
        category_id: getCategoryId('SUV'),
        modele: 'Qashqai',
        annee: 2023,
        immatriculation: 'SUV002MA',
        couleur: 'Rouge',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 5,
        climatisation: true,
        gps: true,
        prix_par_jour: 480,
        caution: 3500,
        kilometrage: 8000,
        statut: 'DISPONIBLE',
        ville: 'Agadir',
        disponible: true,
        type_carburant: 'ESSENCE',
        description: 'SUV urbain élégant avec position de conduite surélevée.'
      },

      // Luxe
      {
        brand_id: getBrandId('Mercedes-Benz'),
        category_id: getCategoryId('Luxe'),
        modele: 'Classe S',
        annee: 2023,
        immatriculation: 'LUX001MA',
        couleur: 'Noir',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 4,
        climatisation: true,
        gps: true,
        prix_par_jour: 1200,
        caution: 10000,
        kilometrage: 5000,
        statut: 'DISPONIBLE',
        ville: 'Casablanca',
        disponible: true,
        type_carburant: 'ESSENCE',
        description: 'Limousine de luxe avec équipements haut de gamme et confort absolu.'
      },
      {
        brand_id: getBrandId('BMW'),
        category_id: getCategoryId('Luxe'),
        modele: 'Série 7',
        annee: 2022,
        immatriculation: 'LUX002MA',
        couleur: 'Gris',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 4,
        climatisation: true,
        gps: true,
        prix_par_jour: 1100,
        caution: 9000,
        kilometrage: 12000,
        statut: 'DISPONIBLE',
        ville: 'Rabat',
        disponible: true,
        type_carburant: 'HYBRIDE',
        description: 'Berline de luxe hybride avec technologies avancées.'
      },

      // Électrique
      {
        brand_id: getBrandId('Tesla'),
        category_id: getCategoryId('Électrique'),
        modele: 'Model 3',
        annee: 2023,
        immatriculation: 'ELE001MA',
        couleur: 'Blanc',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 4,
        climatisation: true,
        gps: true,
        prix_par_jour: 800,
        caution: 6000,
        kilometrage: 3000,
        statut: 'DISPONIBLE',
        ville: 'Casablanca',
        disponible: true,
        type_carburant: 'ELECTRIQUE',
        description: 'Berline électrique premium avec autopilote et technologies innovantes.'
      },
      {
        brand_id: getBrandId('Renault'),
        category_id: getCategoryId('Électrique'),
        modele: 'Zoe',
        annee: 2022,
        immatriculation: 'ELE002MA',
        couleur: 'Bleu',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 5,
        climatisation: true,
        gps: true,
        prix_par_jour: 400,
        caution: 3000,
        kilometrage: 15000,
        statut: 'DISPONIBLE',
        ville: 'Rabat',
        disponible: true,
        type_carburant: 'ELECTRIQUE',
        description: 'Citadine électrique française, silencieuse et écologique.'
      },

      // Sportive
      {
        brand_id: getBrandId('Porsche'),
        category_id: getCategoryId('Sportive'),
        modele: '911',
        annee: 2023,
        immatriculation: 'SPO001MA',
        couleur: 'Rouge',
        transmission: 'Automatique',
        nombre_places: 4,
        nombre_portes: 2,
        climatisation: true,
        gps: true,
        prix_par_jour: 2000,
        caution: 15000,
        kilometrage: 2000,
        statut: 'DISPONIBLE',
        ville: 'Marrakech',
        disponible: true,
        type_carburant: 'ESSENCE',
        description: 'Coupé sportif légendaire pour sensations fortes garanties.'
      },

      // Monospace
      {
        brand_id: getBrandId('Renault'),
        category_id: getCategoryId('Monospace'),
        modele: 'Espace',
        annee: 2022,
        immatriculation: 'MON001MA',
        couleur: 'Gris',
        transmission: 'Automatique',
        nombre_places: 7,
        nombre_portes: 5,
        climatisation: true,
        gps: true,
        prix_par_jour: 600,
        caution: 4500,
        kilometrage: 25000,
        statut: 'DISPONIBLE',
        ville: 'Fès',
        disponible: true,
        type_carburant: 'DIESEL',
        description: 'Monospace familial spacieux pour grands groupes et familles nombreuses.'
      }
    ];

    // Check existing cars
    const existingCars = await prisma.car.count();
    console.log(`📊 Found ${existingCars} existing cars`);

    if (existingCars > 0) {
      console.log('⚠️  Cars already exist. Adding only new examples...');
      
      // Check for existing immatriculations
      const existingImmatriculations = await prisma.car.findMany({
        select: { immatriculation: true }
      });
      const existingImmatSet = new Set(existingImmatriculations.map(c => c.immatriculation));
      
      const newCars = carExamples.filter(car => 
        !existingImmatSet.has(car.immatriculation)
      );
      
      if (newCars.length === 0) {
        console.log('✅ All car examples already exist in database');
      } else {
        console.log(`➕ Adding ${newCars.length} new car examples...`);
        
        for (const car of newCars) {
          try {
            await prisma.car.create({ data: car });
            console.log(`  ✅ Added: ${car.modele} (${car.immatriculation})`);
          } catch (error) {
            console.log(`  ❌ Failed to add ${car.modele}: ${error.message}`);
          }
        }
      }
    } else {
      // Insert all cars
      console.log(`➕ Inserting ${carExamples.length} car examples...`);
      
      for (const car of carExamples) {
        try {
          await prisma.car.create({ data: car });
          console.log(`  ✅ Added: ${car.modele} (${car.immatriculation})`);
        } catch (error) {
          console.log(`  ❌ Failed to add ${car.modele}: ${error.message}`);
        }
      }
    }

    // Final stats
    const totalCars = await prisma.car.count();
    console.log(`\n📊 Total cars in database: ${totalCars}`);

    // Show cars by category
    console.log('\n🔍 Cars by category:');
    for (const category of categories) {
      const carsInCategory = await prisma.car.count({
        where: { category_id: category.id }
      });
      console.log(`  - ${category.name}: ${carsInCategory} cars`);
    }

    console.log('\n✅ Car examples population completed successfully!');

  } catch (error) {
    console.error('❌ Error populating car examples:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  populateCarExamples()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { populateCarExamples };
