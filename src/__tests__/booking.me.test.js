jest.mock('../config/prisma', () => ({
  booking: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  bookingStatus: {
    findFirst: jest.fn()
  }
}));

jest.mock('../services/booking.service', () => ({
  getBookingDetails: jest.fn()
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
  res.sendFile = jest.fn().mockImplementation(() => res);
  return res;
};

describe('Client Mes Réservations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/bookings/me returns only user bookings with pagination', async () => {
    const req = { user: { id: 7 }, query: { page: '1', limit: '10' } };
    const res = mockRes();
    const next = jest.fn();
    prisma.booking.findMany.mockResolvedValue([{
      id: 1,
      user_id: 7,
      date_debut: new Date(),
      date_fin: new Date(),
      prix_total: 1000,
      status: { name: 'EN_ATTENTE' },
      status_name: 'EN_ATTENTE',
      mode_paiement: 'EN_LIGNE',
      date_creation: new Date(),
      varianteCar: { car: { id: 2, modele: 'Yaris', brand: { name: 'Toyota' }, images: [] } },
      payments: [],
      invoices: []
    }]);
    prisma.booking.count.mockResolvedValue(1);

    await bookingController.getMyBookings(req, res, next);
    expect(res._status).toBe(200);
    expect(prisma.booking.findMany).toHaveBeenCalled();
  });

  test('GET /api/bookings/me/:id invoice returns 404 if not available', async () => {
    const req = { user: { id: 7 }, params: { bookingId: '10' } };
    const res = mockRes();
    const next = jest.fn();
    bookingService.getBookingDetails.mockResolvedValue({
      id: 10,
      user_id: 7,
      invoices: []
    });
    await bookingController.getMyBookingInvoice(req, res, next);
    expect(res._status).toBe(404);
    expect(res._data?.message).toMatch(/Facture non disponible/);
  });

  test('DELETE /api/bookings/me/:id only allows EN_ATTENTE', async () => {
    const req = { user: { id: 7 }, params: { bookingId: '11' } };
    const res = mockRes();
    const next = jest.fn();
    prisma.booking.findUnique.mockResolvedValue({
      id: 11,
      user_id: 7,
      status: { name: 'EN_COURS' },
      status_name: 'EN_COURS',
      metadata: null,
      prix_total: 500
    });
    await bookingController.cancelMyBooking(req, res, next);
    expect(res._status).toBe(400);
    expect(res._data?.code).toBe('BOOKING_NOT_CANCELLABLE');

    const res2 = mockRes();
    prisma.booking.findUnique.mockResolvedValue({
      id: 12,
      user_id: 7,
      status: { name: 'EN_ATTENTE' },
      status_name: 'EN_ATTENTE',
      metadata: null,
      prix_total: 500
    });
    prisma.bookingStatus.findFirst.mockResolvedValue({ id: 4, name: 'ANNULE' });
    prisma.booking.update.mockResolvedValue({ id: 12, status_name: 'ANNULE' });
    req.params.bookingId = '12';
    await bookingController.cancelMyBooking(req, res2, next);
    expect(res2._status).toBe(200);
  });
});
