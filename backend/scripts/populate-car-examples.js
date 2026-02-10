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

    if (brands.length === 0 || categories.length === 0) {
        console.log('❌ Brands or Categories missing. Run populate-car-brands.js and populate-car-categories.js first.');
        return;
    }

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
    // Adapted to match schema: Car + VarianteCar
    const carExamples = [
      // Économique
      {
        brand_id: getBrandId('Renault'),
        category_id: getCategoryId('Économique'),
        modele: 'Clio',
        transmission: 'Manuelle',
        nombre_places: 5,
        nombre_portes: 5,
        prix_par_jour: 250,
        statut: 'DISPONIBLE',
        variantes: {
          create: [{
            immatriculation: 'ECO001MA',
            couleur: 'Blanc',
            type_carburant: 'ESSENCE',
            kilometrage: 15000,
            ville: 'Casablanca',
            description: 'Voiture économique parfaite pour la ville, consommation réduite et facile à garer.'
          }]
        }
      },
      {
        brand_id: getBrandId('Peugeot'),
        category_id: getCategoryId('Économique'),
        modele: '208',
        transmission: 'Manuelle',
        nombre_places: 5,
        nombre_portes: 5,
        prix_par_jour: 280,
        statut: 'DISPONIBLE',
        variantes: {
            create: [{
                immatriculation: 'ECO002MA',
                couleur: 'Rouge',
                type_carburant: 'ESSENCE',
                kilometrage: 8000,
                ville: 'Rabat',
                description: 'Citadine moderne avec GPS intégré, idéale pour les trajets urbains.'
            }]
        }
      },

      // Compacte
      {
        brand_id: getBrandId('Volkswagen'),
        category_id: getCategoryId('Compacte'),
        modele: 'Golf',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 5,
        prix_par_jour: 350,
        statut: 'DISPONIBLE',
        variantes: {
            create: [{
                immatriculation: 'COM001MA',
                couleur: 'Gris',
                type_carburant: 'ESSENCE',
                kilometrage: 12000,
                ville: 'Marrakech',
                description: 'Compacte polyvalente avec transmission automatique et équipements modernes.'
            }]
        }
      },
      {
        brand_id: getBrandId('Toyota'),
        category_id: getCategoryId('Compacte'),
        modele: 'Corolla',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 4,
        prix_par_jour: 380,
        statut: 'DISPONIBLE',
        variantes: {
            create: [{
                immatriculation: 'COM002MA',
                couleur: 'Bleu',
                type_carburant: 'HYBRIDE',
                kilometrage: 5000,
                ville: 'Fès',
                description: 'Berline compacte hybride, économique et respectueuse de l\'environnement.'
            }]
        }
      },

      // SUV
      {
        brand_id: getBrandId('Toyota'),
        category_id: getCategoryId('SUV'),
        modele: 'RAV4',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 5,
        prix_par_jour: 550,
        statut: 'DISPONIBLE',
        variantes: {
            create: [{
                immatriculation: 'SUV001MA',
                couleur: 'Gris',
                type_carburant: 'HYBRIDE',
                kilometrage: 20000,
                ville: 'Marrakech',
                description: 'SUV hybride spacieux, parfait pour les aventures en famille.'
            }]
        }
      },
      {
        brand_id: getBrandId('Nissan'),
        category_id: getCategoryId('SUV'),
        modele: 'Qashqai',
        transmission: 'Automatique',
        nombre_places: 5,
        nombre_portes: 5,
        prix_par_jour: 480,
        statut: 'DISPONIBLE',
        variantes: {
            create: [{
                immatriculation: 'SUV002MA',
                couleur: 'Rouge',
                type_carburant: 'ESSENCE',
                kilometrage: 8000,
                ville: 'Agadir',
                description: 'SUV urbain élégant avec position de conduite surélevée.'
            }]
        }
      },

      // Utilitaire
      {
        brand_id: getBrandId('Renault'),
        category_id: getCategoryId('Utilitaire'),
        modele: 'Kangoo',
        transmission: 'Manuelle',
        nombre_places: 2,
        nombre_portes: 4,
        prix_par_jour: 300,
        statut: 'DISPONIBLE',
        variantes: {
            create: [{
                immatriculation: 'UTI001MA',
                couleur: 'Blanc',
                type_carburant: 'DIESEL',
                kilometrage: 40000,
                ville: 'Casablanca',
                description: 'Utilitaire pratique pour le transport de marchandises légères.'
            }]
        }
      },
      {
        brand_id: getBrandId('Peugeot'),
        category_id: getCategoryId('Utilitaire'),
        modele: 'Partner',
        transmission: 'Manuelle',
        nombre_places: 3,
        nombre_portes: 4,
        prix_par_jour: 320,
        statut: 'DISPONIBLE',
        variantes: {
            create: [{
                immatriculation: 'UTI002MA',
                couleur: 'Gris',
                type_carburant: 'DIESEL',
                kilometrage: 35000,
                ville: 'Tanger',
                description: 'Fourgonnette robuste et fiable pour les professionnels.'
            }]
        }
      }
    ];

    // Check existing variants
    const existingVariantes = await prisma.varianteCar.findMany({
      select: { immatriculation: true }
    });
    const existingImmatSet = new Set(existingVariantes.map(v => v.immatriculation));
    
    // Filter out cars where the variante's immatriculation already exists
    // Note: This logic assumes 1 variante per car creation in this script
    const newCars = carExamples.filter(car => {
        const immat = car.variantes.create[0].immatriculation;
        return !existingImmatSet.has(immat);
    });

    console.log(`➕ Inserting ${newCars.length} new car examples...`);
    
    for (const car of newCars) {
      try {
        const immat = car.variantes.create[0].immatriculation;
        await prisma.car.create({ data: car });
        console.log(`  ✅ Added: ${car.modele} (${immat})`);
      } catch (error) {
        console.log(`  ❌ Failed to add ${car.modele}: ${error.message}`);
      }
    }

    // Final stats
    const totalCars = await prisma.car.count();
    const totalVariantes = await prisma.varianteCar.count();
    console.log(`\n📊 Total cars in database: ${totalCars} (Variantes: ${totalVariantes})`);

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
