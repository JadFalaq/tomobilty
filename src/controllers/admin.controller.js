const prisma = require('../config/prisma');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');
const loyaltyService = require('../services/loyalty.service');
const contractService = require('../services/contract.service');

// Get dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    totalCars,
    availableCars,
    totalBookings,
    bookingsThisMonth,
    pendingBookings,
    totalRevenue,
    revenueThisMonth,
    averageRating
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        date_creation: {
          gte: thirtyDaysAgo
        }
      }
    }),
    prisma.car.count(),
    prisma.car.count({
      where: {
        disponible: true,
        statut: 'DISPONIBLE'
      }
    }),
    prisma.booking.count(),
    prisma.booking.count({
      where: {
        date_creation: {
          gte: thirtyDaysAgo
        }
      }
    }),
    prisma.booking.count({
      where: {
        status: {
          name: 'PENDING'
        }
      }
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        created_at: {
          gte: thirtyDaysAgo
        }
      },
      _sum: { amount: true }
    }),
    prisma.review.aggregate({
      _avg: { rating: true }
    })
  ]);

  // Get recent activity
  const recentBookings = await prisma.booking.findMany({
    include: {
      user: {
        select: {
          nom: true,
          prenom: true,
          email: true
        }
      },
      car: {
        include: {
          brand: true
        }
      },
      status: true
    },
    orderBy: {
      date_creation: 'desc'
    },
    take: 5
  });

  // Get booking trends (last 7 days)
  const bookingTrends = await prisma.booking.groupBy({
    by: ['date_creation'],
    where: {
      date_creation: {
        gte: sevenDaysAgo
      }
    },
    _count: true,
    orderBy: {
      date_creation: 'asc'
    }
  });

  res.json({
    success: true,
    data: {
      overview: {
        total_users: totalUsers,
        new_users_this_month: newUsersThisMonth,
        total_cars: totalCars,
        available_cars: availableCars,
        total_bookings: totalBookings,
        bookings_this_month: bookingsThisMonth,
        pending_bookings: pendingBookings,
        total_revenue: totalRevenue._sum.amount || 0,
        revenue_this_month: revenueThisMonth._sum.amount || 0,
        average_rating: averageRating._avg.rating || 0
      },
      recent_bookings: recentBookings,
      booking_trends: bookingTrends.map(trend => ({
        date: trend.date_creation,
        count: trend._count
      }))
    }
  });
});

// Get detailed analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  let dateFilter = {};
  const now = new Date();

  switch (period) {
    case '7d':
      dateFilter = {
        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      };
      break;
    case '30d':
      dateFilter = {
        gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      };
      break;
    case '90d':
      dateFilter = {
        gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      };
      break;
    case '1y':
      dateFilter = {
        gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      };
      break;
  }

  const [
    userGrowth,
    bookingsByStatus,
    revenueByMonth,
    topCars,
    topUsers,
    loyaltyStats
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ['date_creation'],
      where: {
        date_creation: dateFilter
      },
      _count: true,
      orderBy: {
        date_creation: 'asc'
      }
    }),
    prisma.booking.groupBy({
      by: ['status_id'],
      where: {
        date_creation: dateFilter
      },
      _count: true,
      orderBy: {
        _count: {
          status_id: 'desc'
        }
      }
    }),
    prisma.payment.groupBy({
      by: ['created_at'],
      where: {
        status: 'COMPLETED',
        created_at: dateFilter
      },
      _sum: { amount: true },
      orderBy: {
        created_at: 'asc'
      }
    }),
    prisma.booking.groupBy({
      by: ['car_id'],
      where: {
        date_creation: dateFilter,
        status: {
          name: 'COMPLETED'
        }
      },
      _count: true,
      orderBy: {
        _count: {
          car_id: 'desc'
        }
      },
      take: 10
    }),
    prisma.booking.groupBy({
      by: ['user_id'],
      where: {
        date_creation: dateFilter,
        status: {
          name: 'COMPLETED'
        }
      },
      _count: true,
      _sum: { prix_total: true },
      orderBy: {
        _sum: {
          prix_total: 'desc'
        }
      },
      take: 10
    }),
    prisma.loyaltyAccount.groupBy({
      by: ['tier_id'],
      _count: true,
      orderBy: {
        _count: {
          tier_id: 'desc'
        }
      }
    })
  ]);

  // Get additional data for top cars and users
  const carIds = topCars.map(car => car.car_id);
  const userIds = topUsers.map(user => user.user_id);

  const [carDetails, userDetails, statusDetails, tierDetails] = await Promise.all([
    prisma.car.findMany({
      where: {
        id: {
          in: carIds
        }
      },
      include: {
        brand: true
      }
    }),
    prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true
      }
    }),
    prisma.bookingStatus.findMany({
      where: {
        id: {
          in: bookingsByStatus.map(item => item.status_id)
        }
      }
    }),
    prisma.loyaltyTier.findMany({
      where: {
        id: {
          in: loyaltyStats.map(item => item.tier_id)
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      period,
      user_growth: userGrowth.map(item => ({
        date: item.date_creation,
        count: item._count
      })),
      bookings_by_status: bookingsByStatus.map(item => ({
        status: statusDetails.find(status => status.id === item.status_id)?.name,
        count: item._count
      })),
      revenue_by_month: revenueByMonth.map(item => ({
        date: item.created_at,
        revenue: item._sum.amount
      })),
      top_cars: topCars.map(item => {
        const car = carDetails.find(c => c.id === item.car_id);
        return {
          car: car ? `${car.brand.name} ${car.modele}` : 'Unknown',
          bookings: item._count
        };
      }),
      top_users: topUsers.map(item => {
        const user = userDetails.find(u => u.id === item.user_id);
        return {
          user: user ? `${user.nom} ${user.prenom}` : 'Unknown',
          bookings: item._count,
          total_spent: item._sum.prix_total
        };
      }),
      loyalty_distribution: loyaltyStats.map(item => ({
        tier: tierDetails.find(tier => tier.id === item.tier_id)?.name,
        count: item._count
      }))
    }
  });
});

// Get users (Admin view)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, sort_by = 'date_creation', sort_order = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      {
        email: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        nom: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        prenom: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ];
  }

  const orderBy = {};
  orderBy[sort_by] = sort_order;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        loyaltyAccount: {
          include: {
            tier: true
          }
        },
        _count: {
          select: {
            bookings: true,
            payments: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        email_verified: true,
        phone_verified: true,
        date_creation: true,
        loyaltyAccount: true,
        _count: true
      },
      orderBy,
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get user statistics
const getUserStatistics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    usersByRole,
    verificationStats,
    registrationTrends
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    }),
    prisma.user.aggregate({
      _count: {
        email_verified: true,
        phone_verified: true
      }
    }),
    prisma.user.groupBy({
      by: ['date_creation'],
      where: {
        date_creation: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _count: true,
      orderBy: {
        date_creation: 'asc'
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      total_users: totalUsers,
      users_by_role: usersByRole.map(item => ({
        role: item.role,
        count: item._count
      })),
      verification_stats: verificationStats,
      registration_trends: registrationTrends.map(item => ({
        date: item.date_creation,
        count: item._count
      }))
    }
  });
});

// Get cars (Admin view)
const getCars = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, brand_id, category_id, status, ville } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (brand_id) {
    where.brand_id = parseInt(brand_id);
  }

  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  if (status) {
    where.statut = status;
  }

  if (ville) {
    where.ville = {
      contains: ville,
      mode: 'insensitive'
    };
  }

  const [cars, total] = await Promise.all([
    prisma.car.findMany({
      where,
      include: {
        brand: true,
        category: true,
        images: {
          where: { is_primary: true },
          take: 1
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        date_creation: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.car.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get car statistics
const getCarStatistics = asyncHandler(async (req, res) => {
  const [
    totalCars,
    carsByStatus,
    carsByBrand,
    carsByCategory,
    utilizationStats
  ] = await Promise.all([
    prisma.car.count(),
    prisma.car.groupBy({
      by: ['statut'],
      _count: true
    }),
    prisma.car.groupBy({
      by: ['brand_id'],
      _count: true,
      orderBy: {
        _count: {
          brand_id: 'desc'
        }
      },
      take: 10
    }),
    prisma.car.groupBy({
      by: ['category_id'],
      _count: true,
      orderBy: {
        _count: {
          category_id: 'desc'
        }
      }
    }),
    prisma.booking.groupBy({
      by: ['car_id'],
      where: {
        status: {
          name: 'COMPLETED'
        }
      },
      _count: true,
      orderBy: {
        _count: {
          car_id: 'desc'
        }
      },
      take: 10
    })
  ]);

  // Get brand and category names
  const brandIds = carsByBrand.map(item => item.brand_id);
  const categoryIds = carsByCategory.map(item => item.category_id);

  const [brands, categories] = await Promise.all([
    prisma.carBrand.findMany({
      where: {
        id: {
          in: brandIds
        }
      }
    }),
    prisma.carCategory.findMany({
      where: {
        id: {
          in: categoryIds
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      total_cars: totalCars,
      cars_by_status: carsByStatus.map(item => ({
        status: item.statut,
        count: item._count
      })),
      cars_by_brand: carsByBrand.map(item => ({
        brand: brands.find(brand => brand.id === item.brand_id)?.name,
        count: item._count
      })),
      cars_by_category: carsByCategory.map(item => ({
        category: categories.find(cat => cat.id === item.category_id)?.name,
        count: item._count
      })),
      most_booked_cars: utilizationStats.map(item => ({
        car_id: item.car_id,
        bookings: item._count
      }))
    }
  });
});

// Get bookings (Admin view)
const getBookings = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    user_id, 
    car_id,
    date_from,
    date_to,
    sort_by = 'date_creation',
    sort_order = 'desc'
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (status) {
    where.status = { name: status };
  }

  if (user_id) {
    where.user_id = parseInt(user_id);
  }

  if (car_id) {
    where.car_id = parseInt(car_id);
  }

  if (date_from || date_to) {
    where.date_debut = {};
    if (date_from) where.date_debut.gte = new Date(date_from);
    if (date_to) where.date_debut.lte = new Date(date_to);
  }

  const orderBy = {};
  orderBy[sort_by] = sort_order;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true
          }
        },
        car: {
          include: {
            brand: true,
            category: true
          }
        },
        status: true,
        payments: true,
        rentalContract: true
      },
      orderBy,
      skip,
      take: parseInt(limit)
    }),
    prisma.booking.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get booking statistics
const getBookingStatistics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  let dateFilter = {};
  const now = new Date();

  switch (period) {
    case '7d':
      dateFilter = {
        date_creation: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case '30d':
      dateFilter = {
        date_creation: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case '90d':
      dateFilter = {
        date_creation: {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      };
      break;
  }

  const [
    totalBookings,
    bookingsByStatus,
    averageBookingValue,
    bookingTrends
  ] = await Promise.all([
    prisma.booking.count({ where: dateFilter }),
    prisma.booking.groupBy({
      by: ['status_id'],
      where: dateFilter,
      _count: true,
      orderBy: {
        _count: {
          status_id: 'desc'
        }
      }
    }),
    prisma.booking.aggregate({
      where: {
        ...dateFilter,
        status: { name: 'COMPLETED' }
      },
      _avg: { prix_total: true }
    }),
    prisma.booking.groupBy({
      by: ['date_creation'],
      where: dateFilter,
      _count: true,
      orderBy: {
        date_creation: 'asc'
      }
    })
  ]);

  // Get status names
  const statusIds = bookingsByStatus.map(item => item.status_id);
  const statuses = await prisma.bookingStatus.findMany({
    where: {
      id: {
        in: statusIds
      }
    }
  });

  res.json({
    success: true,
    data: {
      period,
      total_bookings: totalBookings,
      bookings_by_status: bookingsByStatus.map(item => ({
        status: statuses.find(status => status.id === item.status_id)?.name,
        count: item._count
      })),
      average_booking_value: averageBookingValue._avg.prix_total || 0,
      booking_trends: bookingTrends.map(item => ({
        date: item.date_creation,
        count: item._count
      }))
    }
  });
});

// Get payments (Admin view)
const getPayments = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    user_id, 
    booking_id,
    date_from,
    date_to
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (user_id) {
    where.user_id = parseInt(user_id);
  }

  if (booking_id) {
    where.booking_id = parseInt(booking_id);
  }

  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) where.created_at.gte = new Date(date_from);
    if (date_to) where.created_at.lte = new Date(date_to);
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true
          }
        },
        booking: {
          include: {
            car: {
              include: {
                brand: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.payment.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get payment statistics
const getPaymentStatistics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  let dateFilter = {};
  const now = new Date();

  switch (period) {
    case '7d':
      dateFilter = {
        created_at: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case '30d':
      dateFilter = {
        created_at: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case '90d':
      dateFilter = {
        created_at: {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      };
      break;
  }

  const [
    totalPayments,
    paymentsByStatus,
    totalRevenue,
    averagePayment,
    revenueTrends
  ] = await Promise.all([
    prisma.payment.count({ where: dateFilter }),
    prisma.payment.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
      orderBy: {
        _count: {
          status: 'desc'
        }
      }
    }),
    prisma.payment.aggregate({
      where: {
        ...dateFilter,
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: {
        ...dateFilter,
        status: 'COMPLETED'
      },
      _avg: { amount: true }
    }),
    prisma.payment.groupBy({
      by: ['created_at'],
      where: {
        ...dateFilter,
        status: 'COMPLETED'
      },
      _sum: { amount: true },
      orderBy: {
        created_at: 'asc'
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      period,
      total_payments: totalPayments,
      payments_by_status: paymentsByStatus.map(item => ({
        status: item.status,
        count: item._count
      })),
      total_revenue: totalRevenue._sum.amount || 0,
      average_payment: averagePayment._avg.amount || 0,
      revenue_trends: revenueTrends.map(item => ({
        date: item.created_at,
        revenue: item._sum.amount
      }))
    }
  });
});

// Get system health
const getSystemHealth = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;

    // Get system stats
    const [
      userCount,
      carCount,
      bookingCount,
      paymentCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.car.count(),
      prisma.booking.count(),
      prisma.payment.count()
    ]);

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          response_time_ms: dbResponseTime
        },
        statistics: {
          users: userCount,
          cars: carCount,
          bookings: bookingCount,
          payments: paymentCount
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error.message
        }
      }
    });
  }
});

// Initialize system with default data
const initializeSystem = asyncHandler(async (req, res) => {
  try {
    // Initialize default data
    await Promise.all([
      loyaltyService.initializeDefaultTiers(),
      loyaltyService.initializeDefaultRewards(),
      loyaltyService.initializeDefaultBookingStatuses(),
      contractService.initializeDefaultTemplate()
    ]);

    res.json({
      success: true,
      message: 'Système initialisé avec succès'
    });
  } catch (error) {
    console.error('System initialization error:', error);
    throw new AppError('Erreur lors de l\'initialisation du système', 500, 'INITIALIZATION_ERROR');
  }
});

// Get system logs (simplified version)
const getSystemLogs = asyncHandler(async (req, res) => {
  const { level = 'all', limit = 100 } = req.query;

  // This is a simplified implementation
  // In a real system, you would read from actual log files
  const logs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'System health check completed',
      source: 'admin.controller'
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'info',
      message: 'Database connection established',
      source: 'prisma.client'
    }
  ];

  res.json({
    success: true,
    data: {
      logs: logs.slice(0, parseInt(limit)),
      total: logs.length
    }
  });
});

// Broadcast notification to all users
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type = 'SYSTEM' } = req.body;

  if (!title || !message) {
    throw new AppError('Titre et message requis', 400, 'MISSING_DATA');
  }

  // Get all user IDs
  const users = await prisma.user.findMany({
    select: { id: true }
  });

  // Create notifications for all users
  const notifications = users.map(user => ({
    user_id: user.id,
    title,
    message,
    type
  }));

  await prisma.notification.createMany({
    data: notifications
  });

  res.json({
    success: true,
    message: `Notification envoyée à ${users.length} utilisateurs`,
    data: {
      recipients: users.length
    }
  });
});

module.exports = {
  getDashboardStats,
  getAnalytics,
  getUsers,
  getUserStatistics,
  getCars,
  getCarStatistics,
  getBookings,
  getBookingStatistics,
  getPayments,
  getPaymentStatistics,
  getSystemHealth,
  initializeSystem,
  getSystemLogs,
  broadcastNotification
};
