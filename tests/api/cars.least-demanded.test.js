const request = require('supertest');
const app = require('../../backend/api/index');
const prisma = require('../../backend/src/config/prisma');

describe('GET /api/cars/least-demanded', () => {
  let brand, category, carA, carB, vA1, vB1, vB2, bookingB1, bookingB2;

  beforeAll(async () => {
    brand = await prisma.carBrand.create({ data: { name: `LeastBrand_${Date.now()}` } });
    category = await prisma.carCategory.create({ data: { name: `LeastCat_${Date.now()}` } });

    carA = await prisma.car.create({
      data: {
        brand_id: brand.id,
        category_id: category.id,
        modele: 'A_Model',
        prix_par_jour: 100,
        statut: 'DISPONIBLE'
      }
    });
    carB = await prisma.car.create({
      data: {
        brand_id: brand.id,
        category_id: category.id,
        modele: 'B_Model',
        prix_par_jour: 120,
        statut: 'DISPONIBLE'
      }
    });

    vA1 = await prisma.varianteCar.create({
      data: {
        car_id: carA.id,
        immatriculation: `A-${Date.now()}`,
        type_carburant: 'ESSENCE',
        ville: 'Casa'
      }
    });
    vB1 = await prisma.varianteCar.create({
      data: {
        car_id: carB.id,
        immatriculation: `B-${Date.now()}-1`,
        type_carburant: 'ESSENCE',
        ville: 'Casa'
      }
    });
    vB2 = await prisma.varianteCar.create({
      data: {
        car_id: carB.id,
        immatriculation: `B-${Date.now()}-2`,
        type_carburant: 'ESSENCE',
        ville: 'Casa'
      }
    });

    const start = new Date();
    start.setDate(start.getDate() + 2);
    const end = new Date();
    end.setDate(end.getDate() + 3);

    bookingB1 = await prisma.booking.create({
      data: {
        user_id: (await prisma.user.create({ data: { email: `u_${Date.now()}@ex.com`, mot_de_passe: 'pass', nom: 'U', prenom: 'T' } })).id,
        variante_car_id: vB1.id,
        date_debut: start,
        date_fin: end,
        prix_total: 200,
        status_id: 1,
        status_name: 'EN_ATTENTE'
      }
    });
    bookingB2 = await prisma.booking.create({
      data: {
        user_id: (await prisma.user.create({ data: { email: `u2_${Date.now()}@ex.com`, mot_de_passe: 'pass', nom: 'U', prenom: 'T' } })).id,
        variante_car_id: vB2.id,
        date_debut: start,
        date_fin: end,
        prix_total: 220,
        status_id: 1,
        status_name: 'EN_COURS'
      }
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { id: { in: [bookingB1.id, bookingB2.id] } } });
    await prisma.varianteCar.deleteMany({ where: { car_id: { in: [carA.id, carB.id] } } });
    await prisma.car.deleteMany({ where: { id: { in: [carA.id, carB.id] } } });
    await prisma.carBrand.delete({ where: { id: brand.id } });
    await prisma.carCategory.delete({ where: { id: category.id } });
  });

  it('returns cars sorted by ascending demand', async () => {
    const res = await request(app).get('/api/cars/least-demanded').query({ limit: 100 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cars = res.body.data.cars || [];
    const idxA = cars.findIndex(c => c.modele === 'A_Model');
    const idxB = cars.findIndex(c => c.modele === 'B_Model');
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThanOrEqual(0);
    expect(cars[idxA].demand_count).toBeLessThanOrEqual(cars[idxB].demand_count);
    expect(idxA).toBeLessThan(idxB);
  });
});
