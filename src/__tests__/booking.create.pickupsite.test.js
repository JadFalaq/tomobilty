jest.mock('../config/prisma', () => ({
  pickupSite: {
    findUnique: jest.fn()
  }
}));

jest.mock('../services/booking.service', () => ({
  createBooking: jest.fn()
}));

const prisma = require('../config/prisma');
const bookingService = require('../services/booking.service');
const bookingController = require('../controllers/booking.controller');

const mockRes = () => {
  const res = {};
  res._data = undefined;
  res._status = 200;
  res.status = jest.fn().mockImplementation((code) => { res._status = code; return res; });
  res.json = jest.fn().mockImplementation((payload) => { res._data = payload; return res; });
  return res;
};

describe('Booking creation with pickup/return sites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('accepts pickup_site_id/return_site_id and resolves names', async () => {
    prisma.pickupSite.findUnique
      .mockResolvedValueOnce({ id: 10, nom: 'Casablanca Ville', is_active: true })
      .mockResolvedValueOnce({ id: 20, nom: 'Rabat Ville', is_active: true });

    bookingService.createBooking.mockResolvedValue({ booking_id: 99 });

    const req = {
      user: { id: 1 },
      body: {
        car_id: 5,
        date_debut: '2025-01-10T09:00:00.000Z',
        date_fin: '2025-01-12T17:00:00.000Z',
        pickup_site_id: 10,
        return_site_id: 20
      }
    };
    const res = mockRes();

    await bookingController.createBooking(req, res);

    expect(bookingService.createBooking).toHaveBeenCalled();
    const callArg = bookingService.createBooking.mock.calls[0][0];
    expect(callArg.lieu_prise_en_charge).toBe('Casablanca Ville');
    expect(callArg.lieu_retour).toBe('Rabat Ville');
    expect(res._status).toBe(201);
    expect(res._data.success).toBe(true);
  });

  test('legacy string fields still allowed', async () => {
    bookingService.createBooking.mockResolvedValue({ booking_id: 100 });

    const req = {
      user: { id: 1 },
      body: {
        car_id: 6,
        date_debut: '2025-02-10T09:00:00.000Z',
        date_fin: '2025-02-12T17:00:00.000Z',
        lieu_prise_en_charge: 'Marrakech Aéroport',
        lieu_retour: 'Casablanca Ville'
      }
    };
    const res = mockRes();

    await bookingController.createBooking(req, res);

    expect(bookingService.createBooking).toHaveBeenCalled();
    const callArg = bookingService.createBooking.mock.calls[0][0];
    expect(callArg.lieu_prise_en_charge).toBe('Marrakech Aéroport');
    expect(callArg.lieu_retour).toBe('Casablanca Ville');
    expect(res._status).toBe(201);
  });

  test('invalid pickup_site_id returns 400 with INVALID_PICKUP_SITE', async () => {
    prisma.pickupSite.findUnique.mockResolvedValueOnce(null);
    const req = {
      user: { id: 1 },
      body: {
        car_id: 5,
        date_debut: '2025-01-10T09:00:00.000Z',
        date_fin: '2025-01-12T17:00:00.000Z',
        pickup_site_id: 999
      }
    };
    const res = mockRes();

    await bookingController.createBooking(req, res);

    expect(res._status).toBe(400);
    expect(res._data.errors[0].code).toBe('INVALID_PICKUP_SITE');
    expect(bookingService.createBooking).not.toHaveBeenCalled();
  });

  test('invalid return_site_id returns 400 with INVALID_RETURN_SITE', async () => {
    prisma.pickupSite.findUnique
      .mockResolvedValueOnce({ id: 10, nom: 'Casablanca Ville', is_active: true })
      .mockResolvedValueOnce(null);

    const req = {
      user: { id: 1 },
      body: {
        car_id: 5,
        date_debut: '2025-01-10T09:00:00.000Z',
        date_fin: '2025-01-12T17:00:00.000Z',
        pickup_site_id: 10,
        return_site_id: 999
      }
    };
    const res = mockRes();

    await bookingController.createBooking(req, res);

    expect(res._status).toBe(400);
    expect(res._data.errors[0].code).toBe('INVALID_RETURN_SITE');
    expect(bookingService.createBooking).not.toHaveBeenCalled();
  });
});

