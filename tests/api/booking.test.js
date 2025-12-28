const request = require('supertest');
const app = require('../../backend/api/index');
const prisma = require('../../backend/src/config/prisma');

describe('Booking flow', () => {
  let user, brand, category, car, variant;
  const email = `booking_tester_${Date.now()}@example.com`;
  const password = 'StrongPass123';

  const start = new Date();
  start.setDate(start.getDate() + 6);
  const end = new Date();
  end.setDate(end.getDate() + 7);

  let accessToken;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: { email, mot_de_passe: password, nom: 'B', prenom: 'T' }
    });
    brand = await prisma.carBrand.create({ data: { name: `B_${Date.now()}` } });
    category = await prisma.carCategory.create({ data: { name: `C_${Date.now()}` } });
    car = await prisma.car.create({
      data: { brand_id: brand.id, category_id: category.id, modele: 'M', prix_par_jour: 100, statut: 'DISPONIBLE' }
    });
    variant = await prisma.varianteCar.create({
      data: { car_id: car.id, immatriculation: `IMM-${Date.now()}`, type_carburant: 'ESSENCE', ville: 'Casa' }
    });
    const login = await request(app).post('/api/auth/login').send({ email, mot_de_passe: password });
    accessToken = login.body.data.tokens.access;
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { variante_car_id: variant.id } });
    await prisma.varianteCar.deleteMany({ where: { car_id: car.id } });
    await prisma.car.delete({ where: { id: car.id } });
    await prisma.carBrand.delete({ where: { id: brand.id } });
    await prisma.carCategory.delete({ where: { id: category.id } });
    await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('creates booking successfully', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        car_id: car.id,
        variante_car_id: variant.id,
        date_debut: start.toISOString(),
        date_fin: end.toISOString(),
        prix_total: 200
      })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking).toBeDefined();
  });

  it('overlapping booking fails', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        car_id: car.id,
        variante_car_id: variant.id,
        date_debut: start.toISOString(),
        date_fin: end.toISOString(),
        prix_total: 200
      })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});
