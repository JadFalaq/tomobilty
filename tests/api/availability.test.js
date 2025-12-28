const request = require('supertest');
const app = require('../../backend/api/index');
const prisma = require('../../backend/src/config/prisma');

describe('Availability contracts', () => {
  let brand, category, car, v1, v2;
  const start = new Date();
  start.setDate(start.getDate() + 3);
  const end = new Date();
  end.setDate(end.getDate() + 5);

  beforeAll(async () => {
    brand = await prisma.carBrand.create({ data: { name: `Brand_${Date.now()}` } });
    category = await prisma.carCategory.create({ data: { name: `Cat_${Date.now()}` } });
    car = await prisma.car.create({
      data: {
        brand_id: brand.id,
        category_id: category.id,
        modele: 'TestModel',
        prix_par_jour: 100,
        statut: 'DISPONIBLE'
      }
    });
    v1 = await prisma.varianteCar.create({
      data: {
        car_id: car.id,
        immatriculation: `ABC-${Date.now()}-01`,
        type_carburant: 'ESSENCE',
        ville: 'Casa'
      }
    });
    v2 = await prisma.varianteCar.create({
      data: {
        car_id: car.id,
        immatriculation: `ABC-${Date.now()}-02`,
        type_carburant: 'ESSENCE',
        ville: 'Casa'
      }
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { variante_car_id: { in: [v1.id, v2.id] } } });
    await prisma.varianteCar.deleteMany({ where: { car_id: car.id } });
    await prisma.car.delete({ where: { id: car.id } });
    await prisma.carBrand.delete({ where: { id: brand.id } });
    await prisma.carCategory.delete({ where: { id: category.id } });
  });

  it('car appears if ≥1 variant available', async () => {
    await prisma.booking.create({
      data: {
        user_id: 1, // dummy user, not used in listing
        variante_car_id: v1.id,
        date_debut: start,
        date_fin: end,
        prix_total: 200,
        status_id: 1,
        status_name: 'EN_ATTENTE'
      }
    });
    const res = await request(app)
      .get('/api/cars/available')
      .query({ dateDebut: start.toISOString(), dateFin: end.toISOString() })
      .expect(200);
    const ids = res.body.data.cars.map(c => c.id);
    expect(ids).toContain(car.id);
  });

  it('car disappears if all variants booked', async () => {
    await prisma.booking.create({
      data: {
        user_id: 1,
        variante_car_id: v2.id,
        date_debut: start,
        date_fin: end,
        prix_total: 200,
        status_id: 1,
        status_name: 'EN_ATTENTE'
      }
    });
    const res = await request(app)
      .get('/api/cars/available')
      .query({ dateDebut: start.toISOString(), dateFin: end.toISOString() })
      .expect(200);
    const ids = res.body.data.cars.map(c => c.id);
    expect(ids).not.toContain(car.id);
  });

  it('car reappears when one booking is cancelled', async () => {
    await prisma.booking.updateMany({
      where: { variante_car_id: v2.id },
      data: { status_name: 'ANNULE' }
    });
    const res = await request(app)
      .get('/api/cars/available')
      .query({ dateDebut: start.toISOString(), dateFin: end.toISOString() })
      .expect(200);
    const ids = res.body.data.cars.map(c => c.id);
    expect(ids).toContain(car.id);
  });
});
