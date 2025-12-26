jest.mock('../config/prisma', () => ({
  pickupSite: {
    findMany: jest.fn(),
    findUnique: jest.fn()
  }
}));

const prisma = require('../config/prisma');
const bookingController = require('../controllers/booking.controller');

const mockRes = () => {
  const res = {};
  res._data = undefined;
  res._status = 200;
  res.status = jest.fn().mockImplementation((code) => { res._status = code; return res; });
  res.json = jest.fn().mockImplementation((payload) => { res._data = payload; return res; });
  return res;
};

describe('PickupSite endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/pickup-sites returns active sites sorted by nom ASC', async () => {
    prisma.pickupSite.findMany.mockResolvedValue([
      { id: 2, nom: 'Casablanca Ville' },
      { id: 1, nom: 'Casablanca Aéroport' },
      { id: 3, nom: 'Rabat Ville' }
    ].sort((a, b) => a.nom.localeCompare(b.nom)));

    const req = {};
    const res = mockRes();

    await bookingController.getPickupSites(req, res);

    expect(res._status).toBe(200);
    expect(res._data.success).toBe(true);
    expect(res._data.data.items.map(i => i.nom)).toEqual([
      'Casablanca Aéroport',
      'Casablanca Ville',
      'Rabat Ville'
    ]);
    expect(res._data.data.total).toBe(3);
    expect(prisma.pickupSite.findMany).toHaveBeenCalledWith({
      where: { is_active: true },
      orderBy: { nom: 'asc' },
      select: { id: true, nom: true }
    });
  });
});

