jest.mock('../config/prisma', () => ({
  booking: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  bookingStatus: {
    findFirst: jest.fn()
  },
  notification: {
    create: jest.fn()
  }
}));

const { requireAgent } = require('../middlewares/auth.middleware');
const bookingController = require('../controllers/booking.controller');
const prisma = require('../config/prisma');
const mockRes = () => {
  const res = {};
  res._data = undefined;
  res._status = 200;
  res.status = jest.fn().mockImplementation((code) => { res._status = code; return res; });
  res.json = jest.fn().mockImplementation((payload) => { res._data = payload; return res; });
  return res;
};

describe('Admin Booking Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requireAgent denies CLIENT and allows ADMIN/AGENT', () => {
    const next = jest.fn();
    const res = mockRes();

    requireAgent({ user: { role: 'CLIENT' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();

    const res2 = mockRes();
    next.mockReset();
    requireAgent({ user: { role: 'ADMIN' } }, res2, next);
    expect(next).toHaveBeenCalled();

    const res3 = mockRes();
    next.mockReset();
    requireAgent({ user: { role: 'AGENT' } }, res3, next);
    expect(next).toHaveBeenCalled();
  });

  test('updateBookingStatus: valid transitions succeed', async () => {
    const next = jest.fn();
    prisma.bookingStatus.findFirst.mockImplementation(async ({ where }) => {
      return { id: { EN_ATTENTE: 1, EN_COURS: 2, TERMINE: 3, ANNULE: 4 }[where.name], name: where.name };
    });
    prisma.booking.update.mockImplementation(async (args) => ({ id: args.where.id, status_name: args.data.status_name }));

    const cases = [
      { current: 'EN_ATTENTE', target: 'EN_COURS' },
      { current: 'EN_COURS', target: 'TERMINE' },
      { current: 'EN_ATTENTE', target: 'ANNULE' }
    ];
    for (const c of cases) {
      expect(bookingController.canTransition(c.current, c.target)).toBe(true);
      const req = { params: { id: '10' }, body: { status: c.target } };
      const res = mockRes();
      prisma.booking.findUnique.mockResolvedValue({ id: 10, status: { name: c.current }, status_name: c.current, metadata: null });
      await bookingController.updateBookingStatus(req, res, next);
      expect(res._status).toBe(200);
    }
  });

  test('updateBookingStatus: invalid transition returns 400', async () => {
    const next = jest.fn();
    const reqInvalid = { params: { id: '10' }, body: { status: 'EN_ATTENTE' } };
    const resInvalid = mockRes();
    prisma.booking.findUnique.mockResolvedValue({ id: 10, status: { name: 'EN_COURS' }, status_name: 'EN_COURS' });
    await bookingController.updateBookingStatus(reqInvalid, resInvalid, next);
    expect(resInvalid._status).toBe(400);
    expect(resInvalid._data?.code).toBe('INVALID_STATUS_TRANSITION');
    expect(next).not.toHaveBeenCalled();
  });

  test('getAllBookings: overdue flag and unique notification', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const req = { query: {} };
    const res = mockRes();
    const overdueBooking = {
      id: 1,
      user_id: 5,
      status: { name: 'EN_COURS' },
      status_name: 'EN_COURS',
      date_fin: past,
      metadata: null,
      car: { brand: { name: 'Toyota' }, modele: 'Yaris' }
    };
    expect(bookingController.isOverdueTZ(overdueBooking, 'Africa/Casablanca')).toBe(true);
    expect(bookingController.shouldCreateOverdueNotification(overdueBooking, 'Africa/Casablanca')).toBe(true);
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 1,
        user_id: 5,
        status: { name: 'EN_COURS' },
        status_name: 'EN_COURS',
        date_fin: past,
        metadata: null,
        car: { brand: { name: 'Toyota' }, modele: 'Yaris' }
      }
    ]);
    prisma.booking.count.mockResolvedValue(1);
    prisma.notification.create.mockResolvedValue({ id: 100 });
    prisma.booking.update.mockResolvedValue({ id: 1 });

    const next3 = jest.fn();
    await bookingController.getAllBookings(req, res, next3);
    expect(res._status).toBe(200);
    expect(prisma.booking.findMany).toHaveBeenCalled();
    expect(next3).not.toHaveBeenCalled();

    const res2 = mockRes();
    const alreadyNotified = {
      ...overdueBooking,
      metadata: JSON.stringify({ overdue_notified_at: new Date().toISOString() })
    };
    expect(bookingController.shouldCreateOverdueNotification(alreadyNotified, 'Africa/Casablanca')).toBe(false);
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 1,
        user_id: 5,
        status: { name: 'EN_COURS' },
        status_name: 'EN_COURS',
        date_fin: past,
        metadata: JSON.stringify({ overdue_notified_at: new Date().toISOString() }),
        car: { brand: { name: 'Toyota' }, modele: 'Yaris' }
      }
    ]);
    const next4 = jest.fn();
    await bookingController.getAllBookings(req, res2, next4);
    expect(res2._status).toBe(200);
    expect(prisma.booking.findMany).toHaveBeenCalled();
    expect(next4).not.toHaveBeenCalled();
  });
});
