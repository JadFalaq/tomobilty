const request = require('supertest');
const crypto = require('crypto');
const app = require('../../backend/api/index');
const bookingService = require('../../backend/src/services/booking.service');
const prisma = require('../../backend/src/config/prisma');

// Ensure deterministic provider config for tests
jest.setTimeout(20000);
process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'cmi';
process.env.CMI_STORE_KEY = process.env.CMI_STORE_KEY || 'TEST_STORE_KEY';
process.env.CMI_MERCHANT_ID = process.env.CMI_MERCHANT_ID || 'TEST_MERCHANT';
process.env.CMI_TERMINAL_ID = process.env.CMI_TERMINAL_ID || 'TEST_TERMINAL';
process.env.CMI_GATEWAY_URL = process.env.CMI_GATEWAY_URL || 'https://testpayment.cmi.co.ma/fim/est3Dgate';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

describe('Payment flow', () => {
  let user, brand, category, car, variant, bookingId, accessToken;
  let initialAmount; // MAD
  let paymentId, providerRef; // values after session creation

  const email = `payment_tester_${Date.now()}@example.com`;
  const password = 'StrongPass123';

  const start = new Date();
  start.setDate(start.getDate() + 8);
  const end = new Date();
  end.setDate(end.getDate() + 9);

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, mot_de_passe: password, nom: 'Paul', prenom: 'Test' })
      .expect(201);
    user = reg.body.data.user;
    brand = await prisma.carBrand.create({ data: { name: `PB_${Date.now()}` } });
    category = await prisma.carCategory.create({ data: { name: `PC_${Date.now()}` } });
    car = await prisma.car.create({
      data: { brand_id: brand.id, category_id: category.id, modele: 'ModelP', prix_par_jour: 120, statut: 'DISPONIBLE' }
    });
    variant = await prisma.varianteCar.create({
      data: { car_id: car.id, immatriculation: `PIMM-${Date.now()}`, type_carburant: 'ESSENCE', ville: 'Casa' }
    });

    const login = await request(app).post('/api/auth/login').send({ email, mot_de_passe: password }).expect(200);
    accessToken = login.body.data.tokens.access;

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
  const created = await bookingService.createBooking({
      user_id: user.id,
      variante_car_id: variant.id,
      date_debut: startStr,
      date_fin: endStr,
      mode_paiement: 'EN_AGENCE'
    });
    bookingId = created.booking.id;
    initialAmount = Number(created.pricing.finalPrice);
  });

  afterAll(async () => {
    const invoices = await prisma.invoice.findMany({ where: { booking_id: bookingId } });
    if (invoices.length) {
      await prisma.invoice.deleteMany({ where: { booking_id: bookingId } });
    }
    await prisma.payment.deleteMany({ where: { booking_id: bookingId } });
    await prisma.booking.deleteMany({ where: { variante_car_id: variant.id } });
    await prisma.varianteCar.deleteMany({ where: { car_id: car.id } });
    await prisma.car.delete({ where: { id: car.id } });
    await prisma.carBrand.delete({ where: { id: brand.id } });
    await prisma.carCategory.delete({ where: { id: category.id } });
    try {
      await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
    } catch (_) {}
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('Payment session idempotency for same booking', async () => {
    const create1 = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ booking_id: bookingId, amount: initialAmount, currency: 'MAD' })
      .expect(200);
    expect(create1.body.success).toBe(true);
    paymentId = create1.body.data.payment_id;
    providerRef = create1.body.data.provider_ref;
    const sessionId1 = create1.body.data.session_id;

    const create2 = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ booking_id: bookingId, amount: initialAmount, currency: 'MAD' })
      .expect(200);
    expect(create2.body.success).toBe(true);
    expect(create2.body.data.payment_id).toBe(paymentId);
    expect(create2.body.data.provider_ref).toBe(providerRef);

    const paymentRows = await prisma.payment.count({ where: { booking_id: bookingId, provider: 'cmi' } });
    expect(paymentRows).toBe(1);

    const paymentRow = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(paymentRow.provider_session_id).toBeDefined();
    expect(sessionId1).toBeDefined();
  });

  it('Webhook/IPN confirms booking exactly once', async () => {
    const amountCents = Math.round(initialAmount * 100).toString();
    const payload = {
      orderId: providerRef,
      amount: amountCents,
      ProcReturnCode: '00',
      HASH: generateReturnHash({
        orderId: providerRef,
        amount: amountCents,
        ProcReturnCode: '00'
      })
    };

    const ipn1 = await request(app)
      .post('/api/payments/cmi/ipn')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(new URLSearchParams(payload).toString());
    expect(ipn1.statusCode).toBe(200);
    expect(ipn1.text).toBe('ACTION=POSTAUTH');

    const ipn2 = await request(app)
      .post('/api/payments/cmi/ipn')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(new URLSearchParams(payload).toString());
    expect(ipn2.statusCode).toBe(200);
    expect(ipn2.text).toBe('ACTION=POSTAUTH');

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(booking.status_name || booking.status?.name).toBe('EN_COURS');

    const invoicesCount = await prisma.invoice.count({ where: { booking_id: bookingId } });
    expect(invoicesCount).toBe(1);

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(payment.status).toBe('COMPLETED');
  });
});

function generateReturnHash(params) {
  const storeKey = process.env.CMI_STORE_KEY;
  const hashString = [
    params.orderId,
    params.amount,
    params.ProcReturnCode || '00',
    storeKey
  ].join('|');
  return crypto.createHash('sha512').update(hashString, 'utf8').digest('base64');
}
