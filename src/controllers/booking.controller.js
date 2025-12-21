const prisma = require('../config/prisma');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');
const { calculateRentalDays, generateBookingReference } = require('../utils/validation.util');
const { sendBookingConfirmation } = require('../utils/email.util');
const loyaltyService = require('../services/loyalty.service');

// Get user's bookings
const getUserBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    user_id: req.user.id
  };

  if (status) {
    where.status = {
      name: status
    };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        car: {
          include: {
            brand: true,
            category: true,
            images: {
              where: { is_primary: true },
              take: 1
            }
          }
        },
        status: true,
        payments: true,
        rentalContract: true
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

// Create new booking
const createBooking = asyncHandler(async (req, res) => {
  const {
    car_id,
    date_debut,
    date_fin,
    lieu_prise_en_charge,
    lieu_retour
  } = req.body;

  // Check car availability
  const car = await prisma.car.findUnique({
    where: { id: parseInt(car_id) },
    include: {
      brand: true,
      category: true
    }
  });

  if (!car) {
    throw new AppError('Voiture non trouvée', 404, 'CAR_NOT_FOUND');
  }

  if (!car.disponible || car.statut !== 'DISPONIBLE') {
    throw new AppError('Voiture indisponible', 400, 'CAR_UNAVAILABLE');
  }

  // Check for conflicting bookings
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      car_id: parseInt(car_id),
      AND: [
        {
          OR: [
            {
              date_debut: {
                lte: new Date(date_fin)
              }
            },
            {
              date_fin: {
                gte: new Date(date_debut)
              }
            }
          ]
        },
        {
          status: {
            name: {
              notIn: ['CANCELLED', 'REJECTED']
            }
          }
        }
      ]
    }
  });

  if (conflictingBooking) {
    throw new AppError('Voiture déjà réservée pour ces dates', 400, 'CAR_ALREADY_BOOKED');
  }

  // Calculate pricing
  const rentalDays = calculateRentalDays(date_debut, date_fin);
  let totalPrice = car.prix_par_jour * rentalDays;

  // Get user's loyalty account for discount
  const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
    where: { user_id: req.user.id },
    include: { tier: true }
  });

  let loyaltyDiscount = 0;
  if (loyaltyAccount && loyaltyAccount.tier.discount_percent > 0) {
    loyaltyDiscount = (totalPrice * loyaltyAccount.tier.discount_percent) / 100;
    totalPrice = totalPrice - loyaltyDiscount;
  }

  // Get default booking status (should be "PENDING")
  const defaultStatus = await prisma.bookingStatus.findFirst({
    where: { name: 'PENDING' }
  });

  if (!defaultStatus) {
    throw new AppError('Statut de réservation par défaut non trouvé', 500, 'MISSING_DEFAULT_STATUS');
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      user_id: req.user.id,
      car_id: parseInt(car_id),
      date_debut: new Date(date_debut),
      date_fin: new Date(date_fin),
      lieu_prise_en_charge,
      lieu_retour,
      prix_total: totalPrice,
      status_id: defaultStatus.id
    },
    include: {
      car: {
        include: {
          brand: true,
          category: true
        }
      },
      status: true,
      user: {
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true
        }
      }
    }
  });

  // Award loyalty points
  try {
    await loyaltyService.awardBookingPoints(req.user.id, booking.id, totalPrice);
  } catch (error) {
    console.error('Failed to award loyalty points:', error);
    // Don't fail the booking if loyalty points fail
  }

  // Send confirmation email
  try {
    await sendBookingConfirmation(req.user.email, booking);
  } catch (error) {
    console.error('Failed to send booking confirmation:', error);
    // Don't fail the booking if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Réservation créée avec succès',
    data: {
      booking,
      pricing_details: {
        daily_price: car.prix_par_jour,
        rental_days: rentalDays,
        subtotal: car.prix_par_jour * rentalDays,
        loyalty_discount: loyaltyDiscount,
        total_price: totalPrice
      }
    }
  });
});

// Get booking by ID
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id // Ensure user can only see their own bookings
    },
    include: {
      car: {
        include: {
          brand: true,
          category: true,
          images: true
        }
      },
      status: true,
      payments: true,
      rentalContract: true,
      additionalDrivers: true
    }
  });

  if (!booking) {
    throw new AppError('Réservation non trouvée', 404, 'BOOKING_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { booking }
  });
});

// Cancel booking
const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    },
    include: {
      status: true
    }
  });

  if (!booking) {
    throw new AppError('Réservation non trouvée', 404, 'BOOKING_NOT_FOUND');
  }

  // Check if booking can be cancelled
  const nonCancellableStatuses = ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'];
  if (nonCancellableStatuses.includes(booking.status.name)) {
    throw new AppError('Cette réservation ne peut pas être annulée', 400, 'BOOKING_NOT_CANCELLABLE');
  }

  // Check cancellation policy (e.g., 24 hours before start date)
  const now = new Date();
  const startDate = new Date(booking.date_debut);
  const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);

  if (hoursUntilStart < 24) {
    throw new AppError('Annulation impossible moins de 24h avant le début de la location', 400, 'LATE_CANCELLATION');
  }

  // Get cancelled status
  const cancelledStatus = await prisma.bookingStatus.findFirst({
    where: { name: 'CANCELLED' }
  });

  // Update booking status
  const updatedBooking = await prisma.booking.update({
    where: { id: parseInt(id) },
    data: {
      status_id: cancelledStatus.id
    },
    include: {
      car: {
        include: {
          brand: true
        }
      },
      status: true
    }
  });

  // Refund loyalty points if any were used
  try {
    await loyaltyService.refundBookingPoints(req.user.id, booking.id);
  } catch (error) {
    console.error('Failed to refund loyalty points:', error);
  }

  res.json({
    success: true,
    message: 'Réservation annulée avec succès',
    data: { booking: updatedBooking }
  });
});

// Add additional driver
const addAdditionalDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, permis_numero, permis_date } = req.body;

  // Verify booking belongs to user
  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    }
  });

  if (!booking) {
    throw new AppError('Réservation non trouvée', 404, 'BOOKING_NOT_FOUND');
  }

  // Check if license is valid (at least 2 years old)
  const licenseDate = new Date(permis_date);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  if (licenseDate > twoYearsAgo) {
    throw new AppError('Le permis de conduire doit être obtenu depuis au moins 2 ans', 400, 'INVALID_LICENSE_AGE');
  }

  // Check maximum additional drivers (usually 2)
  const currentDriversCount = await prisma.additionalDriver.count({
    where: { booking_id: parseInt(id) }
  });

  if (currentDriversCount >= 2) {
    throw new AppError('Maximum 2 conducteurs additionnels autorisés', 400, 'MAX_DRIVERS_EXCEEDED');
  }

  const additionalDriver = await prisma.additionalDriver.create({
    data: {
      booking_id: parseInt(id),
      user_id: req.user.id,
      nom,
      prenom,
      permis_numero,
      permis_date: new Date(permis_date)
    }
  });

  res.status(201).json({
    success: true,
    message: 'Conducteur additionnel ajouté avec succès',
    data: { additionalDriver }
  });
});

// Remove additional driver
const removeAdditionalDriver = asyncHandler(async (req, res) => {
  const { id, driverId } = req.params;

  // Verify booking belongs to user
  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    }
  });

  if (!booking) {
    throw new AppError('Réservation non trouvée', 404, 'BOOKING_NOT_FOUND');
  }

  await prisma.additionalDriver.delete({
    where: {
      id: parseInt(driverId),
      booking_id: parseInt(id)
    }
  });

  res.json({
    success: true,
    message: 'Conducteur additionnel supprimé avec succès'
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

module.exports = {
  getUserBookings,
  createBooking,
  getBookingById,
  cancelBooking,
  addAdditionalDriver,
  removeAdditionalDriver,
  getAllBookings,
  updateBookingStatus,
  getBookingStatistics
};
