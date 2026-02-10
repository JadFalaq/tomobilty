const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

const prisma = new PrismaClient();

const moroccanCities = [
  "Agadir", "Al Hoceïma", "Assilah", "Azemmour", "Azrou", "Beni Mellal", 
  "Benslimane", "Berkane", "Berrechid", "Boujdour", "Bouznika", "Casablanca", 
  "Chefchaouen", "Dakhla", "Drargua", "El Jadida", "El Kelaa des Sraghna", 
  "Errachidia", "Essaouira", "Fès", "Fnideq", "Fquih Ben Salah", "Guelmim", 
  "Guercif", "Ifrane", "Inezgane", "Kénitra", "Khemisset", "Khouribga", 
  "Ksar El Kebir", "Laâyoune", "Larache", "Marrakech", "Martil", "Meknès", 
  "Midelt", "Mohammedia", "Nador", "Ouarzazate", "Oujda", "Rabat", "Safi", 
  "Salé", "Sefrou", "Settat", "Sidi Bennour", "Sidi Ifni", "Sidi Kacem", 
  "Sidi Slimane", "Skhirate", "Tanger", "Tan-Tan", "Taroudant", "Taza", 
  "Témara", "Tétouan", "Tiznit", "Youssoufia", "Zagora"
];

async function populatePickupSites() {
  try {
    console.log('🌍 Populating Pickup Sites with Moroccan cities...');

    let addedCount = 0;
    let skippedCount = 0;

    for (const city of moroccanCities) {
      const existing = await prisma.pickupSite.findUnique({
        where: { nom: city }
      });

      if (!existing) {
        await prisma.pickupSite.create({
          data: {
            nom: city,
            is_active: true
          }
        });
        console.log(`✅ Added: ${city}`);
        addedCount++;
      } else {
        // console.log(`⏭️  Skipped (already exists): ${city}`);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Process completed!`);
    console.log(`✅ Added: ${addedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📊 Total cities in list: ${moroccanCities.length}`);

  } catch (error) {
    console.error('❌ Error populating pickup sites:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  populatePickupSites();
}

module.exports = { populatePickupSites };
