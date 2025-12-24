const bookingService = require('../services/booking.service');
const availabilityService = require('../services/availability.service');
const contractService = require('../services/contract.service');
const invoiceService = require('../services/invoice.service');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const {
  BookingNotFoundError,
  CarNotAvailableError,
  InvalidDriverLicenseError,
  InvalidBookingStatusError,
  BookingCancellationError
} = require('../errors/booking.errors');

/**
 * POST /api/bookings/check-availability
 * Check car availability for specified dates
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { car_id, date_debut, date_fin } = req.body;

  if (!car_id || !date_debut || !date_fin) {
    return res.status(400).json({
      success: false,
      message: 'ID voiture, date de début et date de fin requis'
    });
  }

  const availability = await bookingService.checkAvailability(car_id, date_debut, date_fin);

  res.json({
    success: true,
    data: availability
  });
});

/**
 * POST /api/bookings/calculate-price
 * Calculate booking price with all fees and discounts
 */
const calculatePrice = asyncHandler(async (req, res) => {
  const { car_id, date_debut, date_fin, insurance_id, additional_drivers } = req.body;
  const userId = req.user?.id;

  if (!car_id || !date_debut || !date_fin) {
    return res.status(400).json({
      success: false,
      message: 'ID voiture, date de début et date de fin requis'
    });
  }

  const pricing = await bookingService.calculateBookingPrice({
    carId: car_id,
    dateDebut: date_debut,
    dateFin: date_fin,
    userId,
    insuranceId: insurance_id,
    additionalDrivers: additional_drivers || []
  });

  res.json({
    success: true,
    data: pricing
  });
});

/**
 * POST /api/bookings
 * Create a new booking
 */
const createBooking = asyncHandler(async (req, res) => {
  const bookingData = {
    ...req.body,
    user_id: req.user.id
  };

  const result = await bookingService.createBooking(bookingData);

  res.status(201).json({
    success: true,
    message: 'Réservation créée avec succès',
    data: result
  });
});

/**
 * GET /api/bookings/user/:userId
 * Get user bookings with filters
 */
const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.params.userId ? parseInt(req.params.userId) : req.user.id;
  
  // Ensure user can only access their own bookings (unless admin)
  if (userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  const filters = {
    status: req.query.status,
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    limit: req.query.limit || 20,
    offset: req.query.offset || 0
  };

  const bookings = await bookingService.getUserBookings(userId, filters);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        limit: parseInt(filters.limit),
        offset: parseInt(filters.offset),
        total: bookings.length
      }
    }
  });
});

/**
 * GET /api/bookings/:bookingId
 * Get detailed booking information
 */
const getBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const booking = await bookingService.getBookingDetails(parseInt(bookingId), userId);

  res.json({
    success: true,
    data: { booking }
  });
});

/**
 * PUT /api/bookings/:bookingId
 * Update booking (only if status is PENDING)
 */
const updateBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const updates = req.body;
  const userId = req.user.id;

  const updatedBooking = await bookingService.updateBooking(parseInt(bookingId), updates, userId);

  res.json({
    success: true,
    message: 'Réservation mise à jour avec succès',
    data: { booking: updatedBooking }
  });
});

/**
 * DELETE /api/bookings/:bookingId
 * Cancel booking
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const result = await bookingService.cancelBooking(parseInt(bookingId), reason || 'Annulation par le client');

  res.json({
    success: true,
    message: 'Réservation annulée avec succès',
    data: result
  });
});

/**
 * POST /api/bookings/:bookingId/start
 * Start rental (customer picks up car)
 */
const startRental = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const contractData = req.body;

  const result = await bookingService.startRental(parseInt(bookingId), contractData);

  res.json({
    success: true,
    message: 'Location démarrée avec succès',
    data: result
  });
});

/**
 * POST /api/bookings/:bookingId/complete
 * Complete rental (customer returns car)
 */
const completeRental = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const returnData = req.body;

  const result = await bookingService.completeRental(parseInt(bookingId), returnData);

  res.json({
    success: true,
    message: 'Location terminée avec succès',
    data: result
  });
});

/**
 * POST /api/bookings/:bookingId/additional-driver
 * Add additional driver to booking
 */
const addAdditionalDriver = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const driverData = req.body;
  const userId = req.user.id;

  const result = await bookingService.addAdditionalDriver(parseInt(bookingId), driverData, userId);

  res.status(201).json({
    success: true,
    message: 'Conducteur additionnel ajouté avec succès',
    data: result
  });
});

/**
 * DELETE /api/bookings/:bookingId/additional-driver/:driverId
 * Remove additional driver from booking
 */
const removeAdditionalDriver = asyncHandler(async (req, res) => {
  const { bookingId, driverId } = req.params;
  const userId = req.user.id;

  const result = await bookingService.removeAdditionalDriver(
    parseInt(bookingId), 
    parseInt(driverId), 
    userId
  );

  res.json({
    success: true,
    message: 'Conducteur additionnel supprimé avec succès',
    data: result
  });
});

/**
 * GET /api/bookings/:bookingId/contract
 * Get booking contract
 */
const getBookingContract = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  // Get booking to verify ownership
  const booking = await bookingService.getBookingDetails(parseInt(bookingId), req.user.id);
  
  if (!booking.rentalContract) {
    return res.status(404).json({
      success: false,
      message: 'Contrat non trouvé pour cette réservation'
    });
  }

  const contract = await contractService.getContract(booking.rentalContract.id);

  res.json({
    success: true,
    data: { contract }
  });
});

/**
 * GET /api/bookings/:bookingId/invoice
 * Get booking invoice
 */
const getBookingInvoice = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  // Get booking to verify ownership
  const booking = await bookingService.getBookingDetails(parseInt(bookingId), req.user.id);
  
  if (!booking.invoices || booking.invoices.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Facture non trouvée pour cette réservation'
    });
  }

  const invoice = await invoiceService.getInvoice(booking.invoices[0].id);

  res.json({
    success: true,
    data: { invoice }
  });
});

/**
 * GET /api/cars/available
 * Get available cars for specified dates
 */
const getAvailableCars = asyncHandler(async (req, res) => {
  const filters = req.query;

  if (!filters.date_debut || !filters.date_fin) {
    return res.status(400).json({
      success: false,
      message: 'Dates de début et fin requises'
    });
  }

  const availableCars = await availabilityService.getAvailableCars(filters);

  res.json({
    success: true,
    data: {
      cars: availableCars,
      total: availableCars.length
    }
  });
});

// Get all bookings (Admin only)
const getAllBookings = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    user_id, 
    car_id,
    date_from,
    date_to
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
        payments: true
      },
      orderBy: {
        date_creation: 'desc'
      },
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

// Update booking status (Admin only)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status_name, notes } = req.body;

  if (!status_name) {
    throw new AppError('Nom du statut requis', 400, 'MISSING_STATUS');
  }

  // Get status by name
  const status = await prisma.bookingStatus.findFirst({
    where: { name: status_name }
  });

  if (!status) {
    throw new AppError('Statut invalide', 400, 'INVALID_STATUS');
  }

  const booking = await prisma.booking.update({
    where: { id: parseInt(id) },
    data: {
      status_id: status.id
    },
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
          brand: true
        }
      },
      status: true
    }
  });

  // If booking is confirmed, award loyalty points
  if (status_name === 'CONFIRMED') {
    try {
      await loyaltyService.awardBookingPoints(booking.user_id, booking.id, booking.prix_total);
    } catch (error) {
      console.error('Failed to award loyalty points:', error);
    }
  }

  res.json({
    success: true,
    message: 'Statut de réservation mis à jour avec succès',
    data: { booking }
  });
});

// Get booking statistics (Admin only)
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
    confirmedBookings,
    cancelledBookings,
    totalRevenue,
    averageBookingValue,
    bookingsByStatus
  ] = await Promise.all([
    prisma.booking.count({ where: dateFilter }),
    prisma.booking.count({
      where: {
        ...dateFilter,
        status: { name: 'CONFIRMED' }
      }
    }),
    prisma.booking.count({
      where: {
        ...dateFilter,
        status: { name: 'CANCELLED' }
      }
    }),
    prisma.booking.aggregate({
      where: {
        ...dateFilter,
        status: { name: 'CONFIRMED' }
      },
      _sum: { prix_total: true }
    }),
    prisma.booking.aggregate({
      where: {
        ...dateFilter,
        status: { name: 'CONFIRMED' }
      },
      _avg: { prix_total: true }
    }),
    prisma.booking.groupBy({
      by: ['status_id'],
      where: dateFilter,
      _count: true,
      orderBy: {
        _count: {
          status_id: 'desc'
        }
      }
    })
  ]);

  // Get status names for grouped results
  const statusNames = await prisma.bookingStatus.findMany({
    where: {
      id: {
        in: bookingsByStatus.map(item => item.status_id)
      }
    }
  });

  const bookingsByStatusWithNames = bookingsByStatus.map(item => ({
    status: statusNames.find(status => status.id === item.status_id)?.name,
    count: item._count
  }));

  res.json({
    success: true,
    data: {
      period,
      statistics: {
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        cancelled_bookings: cancelledBookings,
        cancellation_rate: totalBookings > 0 ? (cancelledBookings / totalBookings * 100).toFixed(2) : 0,
        total_revenue: totalRevenue._sum.prix_total || 0,
        average_booking_value: averageBookingValue._avg.prix_total || 0,
        bookings_by_status: bookingsByStatusWithNames
      }
    }
  });
});

/**
 * Error handling middleware for booking-specific errors
 */
const handleBookingErrors = (error, req, res, next) => {
  if (error instanceof BookingNotFoundError) {
    return res.status(404).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  if (error instanceof CarNotAvailableError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code,
      data: {
        carId: error.carId,
        dateDebut: error.dateDebut,
        dateFin: error.dateFin,
        reason: error.reason
      }
    });
  }
  
  if (error instanceof InvalidDriverLicenseError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  if (error instanceof InvalidBookingStatusError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  if (error instanceof BookingCancellationError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  // Pass other errors to the default error handler
  next(error);
};


module.exports = {
  checkAvailability,
  calculatePrice,
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  startRental,
  completeRental,
  addAdditionalDriver,
  removeAdditionalDriver,
  getBookingContract,
  getBookingInvoice,
  getAvailableCars,
  getAllBookings,
  updateBookingStatus,
  getBookingStatistics,
  handleBookingErrors
};
