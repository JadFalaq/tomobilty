const prisma = require('../../config/prisma');
const { asyncHandler } = require('../../middlewares/errorHandler.middleware');

// Helper function to safely execute queries
const safeQuery = async (queryFn, defaultValue = null) => {
  try {
    return await queryFn();
  } catch (error) {
    console.error('Query error:', error.message);
    return defaultValue;
  }
};

// Get comprehensive dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Execute all aggregations in parallel for performance
  const [
    // User stats
    userStats,
    usersByRole,
    newUsersLast7Days,
    newUsersLast30Days,
    
    // Car stats
    carStats,
    carsByStatus,
    carsByAvailability,
    carsByBrand,
    carsByCategory,
    
    // Booking stats
    bookingStats,
    bookingsByStatus,
    bookingsLast7Days,
    bookingsLast30Days,
    
    // Payment stats
    paymentStats,
    paymentsByStatus,
    completedPayments,
    failedPayments,
    refundedPayments,
    
    // Invoice stats
    invoiceStats,
    invoicesByStatus,
    
    // Promotion stats
    activePromotions,
    
    // Notification stats
    notificationStats,
    unreadNotifications,
    notificationsLast7Days,
    
    // Review stats
    reviewStats,
    verifiedReviews,
    
    // Document stats
    documentStats,
    documentsByStatus,
    avgOcrConfidence,
    
    // Maintenance stats
    maintenanceStats,
    upcomingMaintenance,
    overdueMaintenance,
    completedMaintenance,
    
    // Loyalty stats
    loyaltyStats,
    totalPointsEarned,
    totalPointsRedeemed,
    loyaltyByTier,
    totalSpent,
    
    // Chat stats
    chatStats,
    activeChatConversations,
    messageCount,
    
    // Recent activity
    recentBookings,
    recentPayments,
    recentInvoices,
    recentReviews,
    recentDocuments,
    recentChatMessages,
    recentAuditLogs,
    
    // Additional stats
    oauthAccounts,
    phoneVerifications,
    additionalDrivers,
    rentalContracts,
    contractTemplates,
    insurances,
    drivers,
    loyaltyRewards,
    carImages,
    systemSettings,
    admins
  ] = await Promise.all([
    // User stats
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.user.count({ where: { date_creation: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { date_creation: { gte: thirtyDaysAgo } } }),
    
    // Car stats
    prisma.car.count(),
    prisma.car.groupBy({ by: ['statut'], _count: true }),
    prisma.car.groupBy({ by: ['disponible'], _count: true }),
    prisma.car.groupBy({ by: ['brand_id'], _count: true, orderBy: { _count: { brand_id: 'desc' } }, take: 5 }),
    prisma.car.groupBy({ by: ['category_id'], _count: true }),
    
    // Booking stats
    prisma.booking.count(),
    prisma.booking.groupBy({ by: ['status_id'], _count: true }),
    prisma.booking.count({ where: { date_creation: { gte: sevenDaysAgo } } }),
    prisma.booking.count({ where: { date_creation: { gte: thirtyDaysAgo } } }),
    
    // Payment stats
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.payment.groupBy({ by: ['status'], _count: true, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { status: 'FAILED' }, _count: true }),
    prisma.payment.aggregate({ where: { status: 'REFUNDED' }, _sum: { amount: true }, _count: true }),
    
    // Invoice stats
    prisma.invoice.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.invoice.groupBy({ by: ['status'], _count: true, _sum: { amount: true } }),
    
    // Promotion stats
    prisma.promotion.count({ 
      where: { 
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now }
      } 
    }),
    
    // Notification stats
    prisma.notification.count(),
    prisma.notification.count({ where: { is_read: false } }),
    prisma.notification.count({ where: { created_at: { gte: sevenDaysAgo } } }),
    
    // Review stats
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
    prisma.review.count({ where: { is_verified: true } }),
    
    // Document stats
    prisma.document.count(),
    prisma.document.groupBy({ by: ['status'], _count: true }),
    prisma.document.aggregate({ _avg: { ocr_confidence: true } }),
    
    // Maintenance stats
    prisma.maintenance.count(),
    prisma.maintenance.count({ where: { status: 'SCHEDULED', scheduled_date: { gte: now } } }),
    prisma.maintenance.count({ where: { status: 'SCHEDULED', scheduled_date: { lt: now } } }),
    prisma.maintenance.count({ where: { status: 'COMPLETED' } }),
    
    // Loyalty stats
    prisma.loyaltyAccount.count(),
    prisma.loyaltyTransaction.aggregate({ where: { transaction_type: 'EARNED' }, _sum: { points: true } }),
    prisma.loyaltyTransaction.aggregate({ where: { transaction_type: 'REDEEMED' }, _sum: { points: true } }),
    prisma.loyaltyAccount.groupBy({ by: ['tier_id'], _count: true }),
    prisma.loyaltyAccount.aggregate({ _sum: { total_spent: true } }),
    
    // Chat stats
    prisma.chatConversation.count(),
    prisma.chatConversation.count({ where: { status: 'active' } }),
    prisma.chatMessage.count(),
    
    // Recent activity (last 10 of each)
    prisma.booking.findMany({ 
      take: 10, 
      orderBy: { date_creation: 'desc' },
      include: { user: { select: { nom: true, prenom: true, email: true } }, car: { include: { brand: true } }, status: true }
    }),
    prisma.payment.findMany({ 
      take: 10, 
      orderBy: { created_at: 'desc' },
      include: { user: { select: { nom: true, prenom: true, email: true } }, booking: true }
    }),
    prisma.invoice.findMany({ 
      take: 10, 
      orderBy: { created_at: 'desc' },
      include: { user: { select: { nom: true, prenom: true, email: true } } }
    }),
    prisma.review.findMany({ 
      take: 10, 
      orderBy: { created_at: 'desc' },
      include: { user: { select: { nom: true, prenom: true, email: true } } }
    }),
    prisma.document.findMany({ 
      take: 10, 
      orderBy: { created_at: 'desc' },
      include: { user: { select: { nom: true, prenom: true, email: true } } }
    }),
    prisma.chatMessage.findMany({ 
      take: 10, 
      orderBy: { created_at: 'desc' },
      include: { conversation: true }
    }),
    prisma.auditLog.findMany({ 
      take: 10, 
      orderBy: { created_at: 'desc' }
    }),
    
    // Additional entity counts
    prisma.oauthAccount.count(),
    prisma.phoneVerification.count(),
    prisma.additionalDriver.count(),
    prisma.rentalContract.count(),
    prisma.contractTemplate.count(),
    prisma.insurance.count(),
    prisma.driver.count(),
    prisma.loyaltyReward.count(),
    prisma.carImage.count(),
    prisma.systemSetting.count(),
    prisma.admin.count()
  ]);

  // Get time series data for charts
  const [userTimeSeries, bookingTimeSeries, revenueTimeSeries, maintenanceTimeSeries, notificationTimeSeries] = await Promise.all([
    // Users per day (last 30 days)
    prisma.$queryRaw`
      SELECT DATE(date_creation) as date, COUNT(*)::int as count
      FROM users
      WHERE date_creation >= ${thirtyDaysAgo}
      GROUP BY DATE(date_creation)
      ORDER BY date ASC
    `,
    
    // Bookings per day (last 30 days)
    prisma.$queryRaw`
      SELECT DATE(date_creation) as date, COUNT(*)::int as count
      FROM booking
      WHERE date_creation >= ${thirtyDaysAgo}
      GROUP BY DATE(date_creation)
      ORDER BY date ASC
    `,
    
    // Revenue per day (last 30 days)
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, SUM(amount)::numeric as revenue
      FROM payment
      WHERE created_at >= ${thirtyDaysAgo} AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    
    // Maintenance per day (last 30 days)
    prisma.$queryRaw`
      SELECT DATE(scheduled_date) as date, 
             COUNT(*)::int as scheduled,
             COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed
      FROM maintenance
      WHERE scheduled_date >= ${thirtyDaysAgo}
      GROUP BY DATE(scheduled_date)
      ORDER BY date ASC
    `,
    
    // Notifications per day (last 30 days)
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM notification
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `
  ]);

  res.json({
    success: true,
    data: {
      globalKPIs: {
        users: {
          total: userStats,
          byRole: usersByRole,
          newLast7Days: newUsersLast7Days,
          newLast30Days: newUsersLast30Days
        },
        cars: {
          total: carStats,
          byStatus: carsByStatus,
          byAvailability: carsByAvailability,
          topBrands: carsByBrand,
          byCategory: carsByCategory
        },
        bookings: {
          total: bookingStats,
          byStatus: bookingsByStatus,
          last7Days: bookingsLast7Days,
          last30Days: bookingsLast30Days
        },
        payments: {
          totalAmount: paymentStats._sum.amount || 0,
          totalCount: paymentStats._count,
          byStatus: paymentsByStatus,
          completed: {
            amount: completedPayments._sum.amount || 0,
            count: completedPayments._count
          },
          failed: failedPayments._count,
          refunded: {
            amount: refundedPayments._sum.amount || 0,
            count: refundedPayments._count
          }
        },
        invoices: {
          totalAmount: invoiceStats._sum.amount || 0,
          totalCount: invoiceStats._count,
          byStatus: invoicesByStatus
        },
        promotions: {
          active: activePromotions
        },
        notifications: {
          total: notificationStats,
          unread: unreadNotifications,
          last7Days: notificationsLast7Days
        },
        reviews: {
          total: reviewStats._count,
          averageRating: reviewStats._avg.rating || 0,
          verified: verifiedReviews
        },
        documents: {
          total: documentStats,
          byStatus: documentsByStatus,
          avgOcrConfidence: avgOcrConfidence._avg.ocr_confidence || 0
        },
        maintenance: {
          total: maintenanceStats,
          upcoming: upcomingMaintenance,
          overdue: overdueMaintenance,
          completed: completedMaintenance
        },
        loyalty: {
          totalAccounts: loyaltyStats,
          pointsEarned: totalPointsEarned._sum.points || 0,
          pointsRedeemed: Math.abs(totalPointsRedeemed._sum.points || 0),
          byTier: loyaltyByTier,
          totalSpent: totalSpent._sum.total_spent || 0
        },
        chat: {
          totalConversations: chatStats,
          activeConversations: activeChatConversations,
          totalMessages: messageCount
        },
        other: {
          oauthAccounts,
          phoneVerifications,
          additionalDrivers,
          rentalContracts,
          contractTemplates,
          insurances,
          drivers,
          loyaltyRewards,
          carImages,
          systemSettings,
          admins
        }
      },
      timeSeries: {
        users: userTimeSeries,
        bookings: bookingTimeSeries,
        revenue: revenueTimeSeries,
        maintenance: maintenanceTimeSeries,
        notifications: notificationTimeSeries
      },
      recentActivity: {
        bookings: recentBookings,
        payments: recentPayments,
        invoices: recentInvoices,
        reviews: recentReviews,
        documents: recentDocuments,
        chatMessages: recentChatMessages,
        auditLogs: recentAuditLogs
      }
    }
  });
});

module.exports = {
  getDashboardStats
};
