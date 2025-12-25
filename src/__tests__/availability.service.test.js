jest.mock('../config/prisma', () => ({
  varianteCar: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  booking: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  maintenance: {
    findMany: jest.fn(),
  },
  car: {
    findMany: jest.fn(),
  }
}));

const availability = require('../services/availability.service');
const mockPrisma = require('../config/prisma');

describe('availability.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkCarAvailability', () => {
    test('returns available=true when no conflicts', async () => {
      mockPrisma.varianteCar.findUnique.mockResolvedValue({
        id: 10,
        car_id: 1,
        immatriculation: 'A-123',
        car: { brand: { name: 'Toyota' }, category: { name: 'SUV' }, modele: 'RAV4' }
      });
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.maintenance.findMany.mockResolvedValue([]);

      const res = await availability.checkCarAvailability(10, '2025-01-10', '2025-01-12');
      expect(res.available).toBe(true);
      expect(res.conflicts).toEqual([]);
      expect(res.variante).toEqual({
        id: 10,
        car_id: 1,
        brand: 'Toyota',
        model: 'RAV4',
        registration: 'A-123'
      });
    });

    test('returns conflicts when overlapping booking exists', async () => {
      mockPrisma.varianteCar.findUnique.mockResolvedValue({
        id: 10,
        car_id: 1,
        immatriculation: 'A-123',
        car: { brand: { name: 'Toyota' }, category: { name: 'SUV' }, modele: 'RAV4' }
      });
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 99,
          date_debut: new Date('2025-01-11'),
          date_fin: new Date('2025-01-13'),
          status_name: 'EN_COURS',
          user: { nom: 'Doe', prenom: 'Jane', email: 'jane@example.com' }
        }
      ]);
      mockPrisma.maintenance.findMany.mockResolvedValue([]);

      const res = await availability.checkCarAvailability(10, '2025-01-10', '2025-01-12');
      expect(res.available).toBe(false);
      expect(res.reason).toBe('Conflits de réservation ou maintenance');
      expect(res.conflicts).toEqual([
        expect.objectContaining({
          type: 'BOOKING',
          id: 99,
          status: 'EN_COURS'
        })
      ]);
    });
  });

  describe('getAvailableCars', () => {
    test('returns cars with pricing when a variant is available', async () => {
      mockPrisma.car.findMany.mockResolvedValue([
        {
          id: 1,
          brand_id: 1,
          category_id: 2,
          modele: 'RAV4',
          transmission: 'AUTO',
          nombre_places: 5,
          nombre_portes: 5,
          prix_par_jour: 400,
          statut: 'DISPONIBLE',
          brand: { name: 'Toyota' },
          category: { name: 'SUV' },
          images: []
        }
      ]);
      mockPrisma.varianteCar.findMany.mockResolvedValue([{ id: 10 }]);
      // First variant availability returns available
      mockPrisma.varianteCar.findUnique.mockResolvedValue({
        id: 10,
        car_id: 1,
        immatriculation: 'A-123',
        car: { brand: { name: 'Toyota' }, category: { name: 'SUV' }, modele: 'RAV4' }
      });
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.maintenance.findMany.mockResolvedValue([]);

      const res = await availability.getAvailableCars({
        date_debut: '2025-02-01',
        date_fin: '2025-02-03'
      });

      expect(res).toHaveLength(1);
      expect(res[0].pricing.total_price).toBe(400 * 2);
      expect(res[0].availability.available).toBe(true);
    });

    test('returns empty list when no variants are available', async () => {
      mockPrisma.car.findMany.mockResolvedValue([
        {
          id: 2,
          brand_id: 1,
          category_id: 2,
          modele: 'Corolla',
          transmission: 'MANUAL',
          nombre_places: 5,
          nombre_portes: 4,
          prix_par_jour: 300,
          statut: 'DISPONIBLE',
          brand: { name: 'Toyota' },
          category: { name: 'SEDAN' },
          images: []
        }
      ]);
      mockPrisma.varianteCar.findMany.mockResolvedValue([{ id: 20 }, { id: 21 }]);
      // Both variants have conflicts
      mockPrisma.varianteCar.findUnique.mockResolvedValue({
        id: 20,
        car_id: 2,
        immatriculation: 'B-456',
        car: { brand: { name: 'Toyota' }, category: { name: 'SEDAN' }, modele: 'Corolla' }
      });
      mockPrisma.booking.findMany.mockResolvedValue([
        { id: 100, date_debut: new Date('2025-03-10'), date_fin: new Date('2025-03-12'), status_name: 'EN_COURS', user: { nom: 'Smith', prenom: 'John', email: 'john@example.com' } }
      ]);
      mockPrisma.maintenance.findMany.mockResolvedValue([]);

      const res = await availability.getAvailableCars({
        date_debut: '2025-03-10',
        date_fin: '2025-03-11'
      });

      expect(res).toHaveLength(0);
    });
  });
});
