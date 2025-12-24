const prisma = require('../../config/prisma');
const { asyncHandler } = require('../../middlewares/errorHandler.middleware');

// Get comprehensive dashboard statistics with safe defaults
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // User stats
    const userTotal = await prisma.user.count().catch(() => 0);
    const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: true }).catch(() => []);
    const newUsersLast7Days = await prisma.user.count({ where: { date_creation: { gte: sevenDaysAgo } } }).catch(() => 0);
    const newUsersLast30Days = await prisma.user.count({ where: { date_creation: { gte: thirtyDaysAgo } } }).catch(() => 0);

    // Car stats
    const carTotal = await prisma.car.count().catch(() => 0);
    const carsByStatus = await prisma.car.groupBy({ by: ['statut'], _count: true }).catch(() => []);

    // Booking stats
    const bookingTotal = await prisma.booking.count().catch(() => 0);
    const bookingsLast7Days = await prisma.booking.count({ where: { date_creation: { gte: sevenDaysAgo } } }).catch(() => 0);
    const bookingsLast30Days = await prisma.booking.count({ where: { date_creation: { gte: thirtyDaysAgo } } }).catch(() => 0);

    // Payment stats
    const paymentStats = await prisma.payment.aggregate({ 
      _sum: { amount: true }, 
      _count: true 
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }));

    const completedPayments = await prisma.payment.aggregate({ 
      where: { status: 'COMPLETED' }, 
      _sum: { amount: true }, 
      _count: true 
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }));

    const failedPayments = await prisma.payment.count({ where: { status: 'FAILED' } }).catch(() => 0);

    const refundedPayments = await prisma.payment.aggregate({ 
      where: { status: 'REFUNDED' }, 
      _sum: { amount: true }, 
      _count: true 
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }));

    // Review stats
    const reviewStats = await prisma.review.aggregate({ 
      _avg: { rating: true }, 
      _count: true 
    }).catch(() => ({ _avg: { rating: 0 }, _count: 0 }));

    const verifiedReviews = await prisma.review.count({ where: { is_verified: true } }).catch(() => 0);

    // Maintenance stats
    const maintenanceTotal = await prisma.maintenance.count().catch(() => 0);
    const upcomingMaintenance = await prisma.maintenance.count({ 
      where: { 
        status: 'SCHEDULED',
        scheduled_date: { gte: now }
      } 
    }).catch(() => 0);

    const overdueMaintenance = await prisma.maintenance.count({ 
      where: { 
        status: 'SCHEDULED',
        scheduled_date: { lt: now }
      } 
    }).catch(() => 0);

    // Notification stats
    const notificationTotal = await prisma.notification.count().catch(() => 0);
    const unreadNotifications = await prisma.notification.count({ where: { is_read: false } }).catch(() => 0);

    // Loyalty stats
    const loyaltyTotal = await prisma.loyaltyAccount.count().catch(() => 0);
    const pointsEarned = await prisma.loyaltyTransaction.aggregate({
      where: { type: 'EARNED' },
      _sum: { points: true }
    }).catch(() => ({ _sum: { points: 0 } }));

    const pointsRedeemed = await prisma.loyaltyTransaction.aggregate({
      where: { type: 'REDEEMED' },
      _sum: { points: true }
    }).catch(() => ({ _sum: { points: 0 } }));

    // Chat stats
    const chatTotal = await prisma.chatConversation.count().catch(() => 0);
    const activeChatConversations = await prisma.chatConversation.count({ 
      where: { status: 'ACTIVE' } 
    }).catch(() => 0);
    const messageCount = await prisma.chatMessage.count().catch(() => 0);

    // Document stats
    const documentTotal = await prisma.document.count().catch(() => 0);
    const avgOcrConfidence = await prisma.document.aggregate({ 
      _avg: { ocr_confidence: true } 
    }).catch(() => ({ _avg: { ocr_confidence: 0 } }));

    // Recent activity
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { date_creation: 'desc' },
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        car: { include: { brand: true } },
        status: true
      }
    }).catch(() => []);

    const recentPayments = await prisma.payment.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { nom: true, prenom: true, email: true } }
      }
    }).catch(() => []);

    // Build response
    const stats = {
      globalKPIs: {
        users: {
          total: userTotal,
          byRole: usersByRole,
          newLast7Days: newUsersLast7Days,
          newLast30Days: newUsersLast30Days
        },
        cars: {
          total: carTotal,
          byStatus: carsByStatus
        },
        bookings: {
          total: bookingTotal,
          last7Days: bookingsLast7Days,
          last30Days: bookingsLast30Days
        },
        payments: {
          totalAmount: paymentStats._sum.amount || 0,
          totalCount: paymentStats._count || 0,
          completed: {
            amount: completedPayments._sum.amount || 0,
            count: completedPayments._count || 0
          },
          failed: failedPayments,
          refunded: {
            amount: refundedPayments._sum.amount || 0,
            count: refundedPayments._count || 0
          }
        },
        reviews: {
          total: reviewStats._count || 0,
          averageRating: reviewStats._avg.rating || 0,
          verified: verifiedReviews
        },
        maintenance: {
          total: maintenanceTotal,
          upcoming: upcomingMaintenance,
          overdue: overdueMaintenance
        },
        notifications: {
          total: notificationTotal,
          unread: unreadNotifications
        },
        loyalty: {
          totalAccounts: loyaltyTotal,
          pointsEarned: pointsEarned._sum.points || 0,
          pointsRedeemed: Math.abs(pointsRedeemed._sum.points || 0)
        },
        chat: {
          totalConversations: chatTotal,
          activeConversations: activeChatConversations,
          totalMessages: messageCount
        },
        documents: {
          total: documentTotal,
          avgOcrConfidence: avgOcrConfidence._avg.ocr_confidence || 0
        }
      },
      recentActivity: {
        bookings: recentBookings,
        payments: recentPayments
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    // Return minimal stats on error
    res.json({
      success: true,
      data: {
        globalKPIs: {
          users: { total: 0, byRole: [], newLast7Days: 0, newLast30Days: 0 },
          cars: { total: 0, byStatus: [] },
          bookings: { total: 0, last7Days: 0, last30Days: 0 },
          payments: { totalAmount: 0, totalCount: 0, completed: { amount: 0, count: 0 }, failed: 0, refunded: { amount: 0, count: 0 } },
          reviews: { total: 0, averageRating: 0, verified: 0 },
          maintenance: { total: 0, upcoming: 0, overdue: 0 },
          notifications: { total: 0, unread: 0 },
          loyalty: { totalAccounts: 0, pointsEarned: 0, pointsRedeemed: 0 },
          chat: { totalConversations: 0, activeConversations: 0, totalMessages: 0 },
          documents: { total: 0, avgOcrConfidence: 0 }
        },
        recentActivity: {
          bookings: [],
          payments: []
        }
      }
    });
  }
});

module.exports = {
  getDashboardStats
};
