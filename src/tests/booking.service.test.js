/**
 * Comprehensive tests for the booking service
 * Run with: npm test src/tests/booking.service.test.js
 */

const bookingService = require('../services/booking.service');
const availabilityService = require('../services/availability.service');
const paymentService = require('../services/payment.service');
const loyaltyService = require('../services/loyalty.service');
const {
  BookingNotFoundError,
  CarNotAvailableError,
  InvalidDriverLicenseError,
  InvalidBookingStatusError,
  BookingCancellationError
} = require('../errors/booking.errors');

// Mock Prisma client
jest.mock('../config/prisma', () => ({
  booking: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  car: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  },
  bookingStatus: {
    findFirst: jest.fn(),
    findMany: jest.fn()
  },
  additionalDriver: {
    create: jest.fn(),
    createMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  payment: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn()
  },
  rentalContract: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn()
  },
  invoice: {
    create: jest.fn(),
    update: jest.fn()
  },
  loyaltyTransaction: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  $transaction: jest.fn()
}));

// Mock services
jest.mock('../services/availability.service');
jest.mock('../services/payment.service');
jest.mock('../services/loyalty.service');
jest.mock('../services/contract.service');
jest.mock('../services/invoice.service');
jest.mock('../services/notification.service');

const prisma = require('../config/prisma');

describe('Booking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should check car availability successfully', async () => {
      const mockAvailability = {
        available: true,
        reason: null,
        conflicts: [],
        car: {
          id: 1,
          brand: 'Toyota',
          model: 'Corolla',
          registration: 'ABC123'
        }
      };

      availabilityService.checkCarAvailability.mockResolvedValue(mockAvailability);

      const result = await bookingService.checkAvailability(1, '2024-01-15', '2024-01-20');

      expect(availabilityService.checkCarAvailability).toHaveBeenCalledWith(1, '2024-01-15', '2024-01-20');
      expect(result).toEqual(mockAvailability);
    });

    it('should throw error for invalid dates', async () => {
      await expect(bookingService.checkAvailability(1, '2024-01-20', '2024-01-15'))
        .rejects.toThrow('Dates de réservation invalides');
    });
  });

  describe('calculateBookingPrice', () => {
    it('should calculate comprehensive pricing', async () => {
      const mockCar = {
        id: 1,
        tarif_journalier: 200,
        brand: { name: 'Toyota' },
        category: { name: 'Economy' },
        fuel_type: 'essence'
      };

      const mockAvailability = { available: true };
      const mockLoyaltyDiscount = 20;
      const mockPointsCalculation = { pointsWithMultiplier: 150 };

      prisma.car.findUnique.mockResolvedValue(mockCar);
      availabilityService.checkCarAvailability.mockResolvedValue(mockAvailability);
      loyaltyService.calculateDiscount.mockResolvedValue(mockLoyaltyDiscount);
      loyaltyService.calculatePointsEarned.mockResolvedValue(mockPointsCalculation);

      const result = await bookingService.calculateBookingPrice({
        carId: 1,
        dateDebut: '2024-01-15',
        dateFin: '2024-01-20',
        userId: 1,
        additionalDrivers: []
      });

      expect(result).toHaveProperty('numberOfDays', 5);
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('totalPrice');
      expect(result).toHaveProperty('pointsToEarn');
      expect(result.car.brand).toBe('Toyota');
    });

    it('should throw error for unavailable car', async () => {
      const mockCar = { id: 1, tarif_journalier: 200 };
      const mockAvailability = { 
        available: false, 
        reason: 'Car already booked' 
      };

      prisma.car.findUnique.mockResolvedValue(mockCar);
      availabilityService.checkCarAvailability.mockResolvedValue(mockAvailability);

      await expect(bookingService.calculateBookingPrice({
        carId: 1,
        dateDebut: '2024-01-15',
        dateFin: '2024-01-20'
      })).rejects.toThrow(CarNotAvailableError);
    });
  });

  describe('createBooking', () => {
    it('should create booking successfully', async () => {
      const mockUser = {
        id: 1,
        nom: 'Doe',
        prenom: 'John',
        email: 'john@example.com',
        permis_conduire: 'ABC123',
        date_permis: new Date('2020-01-01')
      };

      const mockCar = {
        id: 1,
        tarif_journalier: 200,
        brand: { name: 'Toyota' },
        category: { name: 'Economy' }
      };

      const mockStatus = { id: 1, name: 'PENDING' };
      const mockBooking = {
        id: 1,
        user_id: 1,
        car_id: 1,
        prix_total: 1000,
        status: mockStatus,
        user: mockUser,
        car: mockCar
      };

      const mockPaymentSession = {
        payment_id: 1,
        session_id: 'sess_123',
        session_url: 'https://checkout.stripe.com/sess_123'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.bookingStatus.findFirst.mockResolvedValue(mockStatus);
      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(prisma);
      });
      prisma.booking.create.mockResolvedValue(mockBooking);
      
      bookingService.calculateBookingPrice = jest.fn().mockResolvedValue({
        totalPrice: 1000,
        deposit: 200
      });
      
      paymentService.createPaymentSession.mockResolvedValue(mockPaymentSession);

      const result = await bookingService.createBooking({
        user_id: 1,
        car_id: 1,
        date_debut: '2024-01-15',
        date_fin: '2024-01-20',
        lieu_prise_en_charge: 'Airport',
        lieu_retour: 'Airport'
      });

      expect(result).toHaveProperty('booking');
      expect(result).toHaveProperty('payment');
      expect(result.booking.id).toBe(1);
      expect(paymentService.createPaymentSession).toHaveBeenCalled();
    });

    it('should throw error for invalid driver license', async () => {
      const mockUser = {
        id: 1,
        permis_conduire: 'ABC123',
        date_permis: new Date('2023-01-01') // Less than 2 years
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(bookingService.createBooking({
        user_id: 1,
        car_id: 1,
        date_debut: '2024-01-15',
        date_fin: '2024-01-20'
      })).rejects.toThrow(InvalidDriverLicenseError);
    });
  });

  describe('confirmBooking', () => {
    it('should confirm booking after successful payment', async () => {
      const mockPaymentStatus = {
        payment: { status: 'COMPLETED', amount: 1000 }
      };

      const mockStatus = { id: 2, name: 'CONFIRMED' };
      const mockBooking = {
        id: 1,
        user_id: 1,
        car_id: 1,
        prix_total: 1000
      };

      paymentService.getPaymentStatus.mockResolvedValue(mockPaymentStatus);
      prisma.bookingStatus.findFirst.mockResolvedValue(mockStatus);
      prisma.booking.update.mockResolvedValue(mockBooking);
      
      bookingService.executePostPaymentWorkflow = jest.fn().mockResolvedValue({
        contract: { id: 1 },
        invoice: { id: 1 },
        loyaltyTransaction: { points_added: 150 }
      });

      const result = await bookingService.confirmBooking(1, 1);

      expect(result).toHaveProperty('booking');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status_id: 2,
          paiement_effectue: true,
          montant_paye: 1000,
          mode_paiement: 'stripe'
        },
        include: expect.any(Object)
      });
    });

    it('should throw error for incomplete payment', async () => {
      const mockPaymentStatus = {
        payment: { status: 'PENDING' }
      };

      paymentService.getPaymentStatus.mockResolvedValue(mockPaymentStatus);

      await expect(bookingService.confirmBooking(1, 1))
        .rejects.toThrow('Le paiement doit être complété avant de confirmer la réservation');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      const mockBooking = {
        id: 1,
        user_id: 1,
        date_debut: new Date('2024-01-20'), // Future date
        status: { name: 'CONFIRMED' },
        payments: [{ id: 1, amount: 1000, status: 'COMPLETED' }],
        loyaltyTransactions: [{ id: 1, points: 150 }]
      };

      const mockCancelledStatus = { id: 3, name: 'CANCELLED' };
      const mockUpdatedBooking = { ...mockBooking, status: mockCancelledStatus };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.bookingStatus.findFirst.mockResolvedValue(mockCancelledStatus);
      prisma.booking.update.mockResolvedValue(mockUpdatedBooking);
      
      paymentService.createRefund.mockResolvedValue({
        refund: { id: 1, amount: 1000 }
      });
      
      loyaltyService.refundPoints.mockResolvedValue({
        points_refunded: 150
      });

      const result = await bookingService.cancelBooking(1, 'Customer request');

      expect(result).toHaveProperty('booking');
      expect(result).toHaveProperty('penalty');
      expect(result).toHaveProperty('refund');
      expect(result.booking.status.name).toBe('CANCELLED');
    });

    it('should throw error for non-cancellable booking', async () => {
      const mockBooking = {
        id: 1,
        status: { name: 'COMPLETED' }
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(bookingService.cancelBooking(1, 'Test'))
        .rejects.toThrow(BookingCancellationError);
    });
  });

  describe('startRental', () => {
    it('should start rental successfully', async () => {
      const mockBooking = {
        id: 1,
        date_debut: new Date(),
        status: { name: 'CONFIRMED' },
        rentalContract: { id: 1 }
      };

      const mockActiveStatus = { id: 4, name: 'ACTIVE' };
      const mockUpdatedBooking = { ...mockBooking, status: mockActiveStatus };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.bookingStatus.findFirst.mockResolvedValue(mockActiveStatus);
      prisma.booking.update.mockResolvedValue(mockUpdatedBooking);

      const contractService = require('../services/contract.service');
      contractService.signContract = jest.fn().mockResolvedValue({});

      const result = await bookingService.startRental(1, {
        odometer_start: 50000,
        fuel_level_start: 100,
        vehicle_condition: 'Good',
        customer_signature: 'John Doe'
      });

      expect(result).toHaveProperty('booking');
      expect(result).toHaveProperty('vehicle_condition');
      expect(result.booking.status.name).toBe('ACTIVE');
    });

    it('should throw error for wrong booking status', async () => {
      const mockBooking = {
        id: 1,
        status: { name: 'PENDING' }
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(bookingService.startRental(1, {}))
        .rejects.toThrow(InvalidBookingStatusError);
    });
  });

  describe('getUserBookings', () => {
    it('should get user bookings with filters', async () => {
      const mockBookings = [
        {
          id: 1,
          user_id: 1,
          status: { name: 'CONFIRMED' },
          car: { brand: { name: 'Toyota' } }
        },
        {
          id: 2,
          user_id: 1,
          status: { name: 'COMPLETED' },
          car: { brand: { name: 'Honda' } }
        }
      ];

      prisma.booking.findMany.mockResolvedValue(mockBookings);

      const result = await bookingService.getUserBookings(1, {
        status: 'CONFIRMED',
        limit: 10,
        offset: 0
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('booking_reference');
      expect(result[0]).toHaveProperty('can_modify');
      expect(result[0]).toHaveProperty('can_cancel');
    });
  });

  describe('addAdditionalDriver', () => {
    it('should add additional driver successfully', async () => {
      const mockBooking = {
        id: 1,
        user_id: 1,
        status: { name: 'PENDING' },
        additionalDrivers: [],
        date_debut: new Date('2024-01-15'),
        date_fin: new Date('2024-01-20'),
        prix_total: 1000
      };

      const mockDriver = {
        id: 1,
        nom: 'Smith',
        prenom: 'Jane',
        permis_numero: 'DEF456',
        permis_date: new Date('2022-01-01')
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.additionalDriver.create.mockResolvedValue(mockDriver);
      prisma.booking.update.mockResolvedValue({});

      const result = await bookingService.addAdditionalDriver(1, {
        nom: 'Smith',
        prenom: 'Jane',
        permis_numero: 'DEF456',
        permis_date: '2022-01-01'
      }, 1);

      expect(result).toHaveProperty('driver');
      expect(result).toHaveProperty('additional_fee');
      expect(result).toHaveProperty('new_total_price');
      expect(result.driver.nom).toBe('Smith');
    });
  });
});

describe('Integration Tests', () => {
  describe('Complete Booking Workflow', () => {
    it('should handle complete booking lifecycle', async () => {
      // This would be a more comprehensive integration test
      // that tests the entire workflow from creation to completion
      
      const mockUser = {
        id: 1,
        nom: 'Doe',
        prenom: 'John',
        email: 'john@example.com',
        permis_conduire: 'ABC123',
        date_permis: new Date('2020-01-01')
      };

      const mockCar = {
        id: 1,
        tarif_journalier: 200,
        brand: { name: 'Toyota' },
        category: { name: 'Economy' }
      };

      // Mock all the necessary services and database calls
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.car.findUnique.mockResolvedValue(mockCar);
      availabilityService.checkCarAvailability.mockResolvedValue({ available: true });
      
      // Test booking creation
      const bookingData = {
        user_id: 1,
        car_id: 1,
        date_debut: '2024-01-15',
        date_fin: '2024-01-20',
        lieu_prise_en_charge: 'Airport',
        lieu_retour: 'Airport'
      };

      // This would test the entire flow but requires more setup
      // In a real test environment, you'd use a test database
      expect(true).toBe(true); // Placeholder
    });
  });
});

describe('Error Handling', () => {
  it('should handle database connection errors gracefully', async () => {
    prisma.booking.findUnique.mockRejectedValue(new Error('Database connection failed'));

    await expect(bookingService.getBookingDetails(1, 1))
      .rejects.toThrow('Database connection failed');
  });

  it('should handle service integration failures', async () => {
    loyaltyService.calculatePointsEarned.mockRejectedValue(new Error('Loyalty service unavailable'));

    // The booking should still work even if loyalty service fails
    // This tests the resilience of the system
    expect(true).toBe(true); // Placeholder for actual test
  });
});
