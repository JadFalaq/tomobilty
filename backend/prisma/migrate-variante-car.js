const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function run() {
  const prisma = new PrismaClient();
  try {
    const cars = await prisma.car.findMany();
    for (const car of cars) {
      const existingVar = await prisma.varianteCar.findFirst({ where: { car_id: car.id } });
      if (existingVar) continue;
      const variante = await prisma.varianteCar.create({
        data: {
          car_id: car.id,
          immatriculation: car.immatriculation || `CAR-${car.id}`,
          couleur: car.couleur || null,
          type_carburant: car.type_carburant || 'ESSENCE',
          kilometrage: car.kilometrage || 0,
          description: car.description || null,
          ville: car.ville || 'Casablanca'
        }
      });
      await prisma.booking.updateMany({
        where: { varianteCar: { car_id: car.id } },
        data: { variante_car_id: variante.id }
      });
      await prisma.maintenance.updateMany({
        where: { varianteCar: { car_id: car.id } },
        data: { variante_car_id: variante.id }
      });
    }
    console.log('Migration completed: VarianteCar created and bookings/maintenance linked.');
  } catch (e) {
    console.error('Migration error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
