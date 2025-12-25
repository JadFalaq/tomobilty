/**
 * Unit tests for loyalty service
 * Run with: npm test src/services/__tests__/loyalty.service.test.js
 */

const loyaltyService = require('../loyalty.service');
const {
  InsufficientPointsError,
  LoyaltyAccountNotFoundError,
  InvalidRewardError,
  InvalidPointsAmountError
} = require('../../errors/loyalty.errors');

// Mock Prisma client
jest.mock('../../config/prisma', () => ({
  loyaltyAccount: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  loyaltyTier: {
    findMany: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn()
  },
  loyaltyTransaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn()
  },
  loyaltyReward: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn()
  },
  notification: {
    create: jest.fn()
  },
  booking: {
    count: jest.fn()
  }
}));

const prisma = require('../../config/prisma');

describe('Loyalty Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLoyaltyAccount', () => {
    it('should create a new loyalty account', async () => {
      const userId = 1;
      const mockAccount = {
        id: 1,
        user_id: userId,
        tier_id: 1,
        points_balance: 0,
        lifetime_points: 0,
        total_spent: 0
      };

      prisma.loyaltyAccount.findUnique.mockResolvedValue(null);
      prisma.loyaltyAccount.create.mockResolvedValue(mockAccount);

      const result = await loyaltyService.createLoyaltyAccount(userId);

      expect(prisma.loyaltyAccount.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          tier_id: 1,
          points_balance: 0,
          lifetime_points: 0,
          total_spent: 0
        },
        include: {
          tier: true,
          user: true
        }
      });
      expect(result).toEqual(mockAccount);
    });

    it('should return existing account if already exists', async () => {
      const userId = 1;
      const existingAccount = { id: 1, user_id: userId };

      prisma.loyaltyAccount.findUnique.mockResolvedValue(existingAccount);

      const result = await loyaltyService.createLoyaltyAccount(userId);

      expect(prisma.loyaltyAccount.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingAccount);
    });
  });

  describe('calculatePointsEarned', () => {
    it('should calculate points with tier multiplier', async () => {
      const userId = 1;
      const bookingAmount = 1000; // 1000 MAD
      const mockAccount = {
        user_id: userId,
        tier: { name: 'Argent' } // 1.5x multiplier
      };

      prisma.loyaltyAccount.findUnique.mockResolvedValue(mockAccount);

      const result = await loyaltyService.calculatePointsEarned(bookingAmount, userId);

      expect(result).toEqual({
        basePoints: 100, // 1000 MAD / 10 = 100 base points
        tierMultiplier: 1.5,
        pointsWithMultiplier: 150, // 100 * 1.5 = 150
        tierName: 'Argent'
      });
    });

    it('should throw error if loyalty account not found', async () => {
      const userId = 1;
      const bookingAmount = 1000;

      prisma.loyaltyAccount.findUnique.mockResolvedValue(null);

      await expect(loyaltyService.calculatePointsEarned(bookingAmount, userId))
        .rejects.toThrow(LoyaltyAccountNotFoundError);
    });
  });

  describe('addPoints', () => {
    it('should add points and check for tier upgrade', async () => {
      const userId = 1;
      const points = 500;
      const mockAccount = {
        id: 1,
        user_id: userId,
        tier: { name: 'Bronze' }
      };
      const updatedAccount = {
        ...mockAccount,
        points_balance: 500,
        lifetime_points: 500
      };

      prisma.loyaltyAccount.findUnique.mockResolvedValue(mockAccount);
      prisma.loyaltyAccount.update.mockResolvedValue(updatedAccount);
      prisma.loyaltyTransaction.create.mockResolvedValue({});
      
      // Mock tier upgrade check
      prisma.loyaltyTier.findMany.mockResolvedValue([
        { id: 1, name: 'Bronze', min_points: 0 },
        { id: 2, name: 'Argent', min_points: 1000 }
      ]);

      const result = await loyaltyService.addPoints(userId, points);

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: {
          points_balance: { increment: points },
          lifetime_points: { increment: points }
        },
        include: { tier: true }
      });

      expect(result.points_added).toBe(points);
      expect(result.new_balance).toBe(500);
    });

    it('should throw error for invalid points amount', async () => {
      const userId = 1;
      const invalidPoints = -100;

      await expect(loyaltyService.addPoints(userId, invalidPoints))
        .rejects.toThrow(InvalidPointsAmountError);
    });
  });

  describe('redeemPoints', () => {
    it('should redeem points successfully', async () => {
      const userId = 1;
      const points = 500;
      const mockAccount = {
        id: 1,
        user_id: userId,
        points_balance: 1000
      };
      const updatedAccount = {
        ...mockAccount,
        points_balance: 500
      };

      prisma.loyaltyAccount.findUnique.mockResolvedValue(mockAccount);
      prisma.loyaltyAccount.update.mockResolvedValue(updatedAccount);
      prisma.loyaltyTransaction.create.mockResolvedValue({});

      const result = await loyaltyService.redeemPoints(userId, points);

      expect(result.points_redeemed).toBe(points);
      expect(result.discount_amount).toBe(50); // 500 points = 50 MAD
      expect(result.new_balance).toBe(500);
    });

    it('should throw error for insufficient points', async () => {
      const userId = 1;
      const points = 1000;
      const mockAccount = {
        id: 1,
        user_id: userId,
        points_balance: 500
      };

      prisma.loyaltyAccount.findUnique.mockResolvedValue(mockAccount);

      await expect(loyaltyService.redeemPoints(userId, points))
        .rejects.toThrow(InsufficientPointsError);
    });

    it('should throw error for points below minimum', async () => {
      const userId = 1;
      const points = 50; // Below 100 minimum

      await expect(loyaltyService.redeemPoints(userId, points))
        .rejects.toThrow(InvalidPointsAmountError);
    });
  });

  describe('redeemReward', () => {
    it('should redeem reward successfully', async () => {
      const userId = 1;
      const rewardId = 1;
      const mockReward = {
        id: rewardId,
        name: 'Test Reward',
        points_cost: 500,
        is_active: true
      };
      const mockAccount = {
        id: 1,
        user_id: userId,
        points_balance: 1000
      };

      prisma.loyaltyReward.findUnique.mockResolvedValue(mockReward);
      prisma.loyaltyAccount.findUnique.mockResolvedValue(mockAccount);
      prisma.loyaltyAccount.update.mockResolvedValue({
        ...mockAccount,
        points_balance: 500
      });
      prisma.loyaltyTransaction.create.mockResolvedValue({});
      prisma.notification.create.mockResolvedValue({});

      const result = await loyaltyService.redeemReward(userId, rewardId);

      expect(result.reward).toEqual(mockReward);
      expect(result.points_used).toBe(500);
      expect(result.new_balance).toBe(500);
    });

    it('should throw error for invalid reward', async () => {
      const userId = 1;
      const rewardId = 999;

      prisma.loyaltyReward.findUnique.mockResolvedValue(null);

      await expect(loyaltyService.redeemReward(userId, rewardId))
        .rejects.toThrow(InvalidRewardError);
    });
  });

  describe('initializeDefaultTiers', () => {
    it('should create default tiers if none exist', async () => {
      prisma.loyaltyTier.count.mockResolvedValue(0);
      prisma.loyaltyTier.createMany.mockResolvedValue({});

      await loyaltyService.initializeDefaultTiers();

      expect(prisma.loyaltyTier.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Bronze' }),
          expect.objectContaining({ name: 'Argent' }),
          expect.objectContaining({ name: 'Or' }),
          expect.objectContaining({ name: 'Platine' })
        ])
      });
    });

    it('should not create tiers if they already exist', async () => {
      prisma.loyaltyTier.count.mockResolvedValue(4);

      await loyaltyService.initializeDefaultTiers();

      expect(prisma.loyaltyTier.createMany).not.toHaveBeenCalled();
    });
  });

  describe('initializeDefaultRewards', () => {
    it('should create default rewards if none exist', async () => {
      prisma.loyaltyReward.count.mockResolvedValue(0);
      prisma.loyaltyReward.createMany.mockResolvedValue({});

      await loyaltyService.initializeDefaultRewards();

      expect(prisma.loyaltyReward.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Réduction 10 MAD' }),
          expect.objectContaining({ name: 'Surclassement gratuit' }),
          expect.objectContaining({ name: 'Location gratuite 1 jour' })
        ])
      });
    });

    it('should not create rewards if they already exist', async () => {
      prisma.loyaltyReward.count.mockResolvedValue(6);

      await loyaltyService.initializeDefaultRewards();

      expect(prisma.loyaltyReward.createMany).not.toHaveBeenCalled();
    });
  });
});

describe('Integration Tests', () => {
  describe('Booking Integration', () => {
    it('should award points for completed booking with bonuses', async () => {
      const userId = 1;
      const bookingId = 1;
      const bookingAmount = 3000; // 30 days * 100 MAD
      const bookingDetails = {
        duration_days: 30 // Should get 500 bonus points for 30+ days
      };

      const mockAccount = {
        id: 1,
        user_id: userId,
        tier: { name: 'Bronze' }
      };

      prisma.loyaltyAccount.findUnique.mockResolvedValue(mockAccount);
      prisma.loyaltyAccount.update.mockResolvedValue({
        ...mockAccount,
        points_balance: 800 // 300 base + 500 bonus
      });
      prisma.loyaltyTransaction.create.mockResolvedValue({});
      prisma.booking.count.mockResolvedValue(0); // First booking
      prisma.loyaltyTier.findMany.mockResolvedValue([
        { id: 1, name: 'Bronze', min_points: 0 }
      ]);

      const result = await loyaltyService.awardBookingPoints(
        userId, 
        bookingId, 
        bookingAmount, 
        bookingDetails
      );

      expect(result.base_points).toBe(300); // 3000 MAD / 10 = 300 points
      expect(result.bonus_points).toBe(1000); // 500 first booking + 500 for 30+ days
      expect(result.total_points).toBe(1300);
      expect(result.is_first_booking).toBe(true);
    });
  });
});
