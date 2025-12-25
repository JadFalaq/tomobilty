const bookingService = require('../services/booking.service');
const prisma = require('../config/prisma');
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

function getHourMinuteInTZ(dateStr, tz) {
  try {
    const parts = new Intl.DateTimeFormat('fr-MA', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: tz || 'Africa/Casablanca'
    }).formatToParts(new Date(dateStr));
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return { hour, minute };
  } catch {
    return { hour: NaN, minute: NaN };
  }
}

function isOutsideBusinessHoursTZ(dateStr) {
  const { hour, minute } = getHourMinuteInTZ(dateStr, 'Africa/Casablanca');
  if (isNaN(hour)) return true;
  if (hour < 9) return true;
  if (hour > 17) return true;
  if (hour === 17 && minute > 0) return true;
  return false;
}

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

  const errors = [];
  if (isOutsideBusinessHoursTZ(date_debut)) {
    errors.push({ field: 'start_date', msg: 'Doit être entre 09:00 et 17:00' });
  }
  if (isOutsideBusinessHoursTZ(date_fin)) {
    errors.push({ field: 'end_date', msg: 'Doit être entre 09:00 et 17:00' });
  }
  if (new Date(date_fin) <= new Date(date_debut)) {
    errors.push({ field: 'end_date', msg: 'Doit être après la date de départ' });
  }
  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors });
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

  const errors = [];
  if (!bookingData.date_debut || !bookingData.date_fin) {
    errors.push({ field: 'date_debut', msg: 'Requis' }, { field: 'date_fin', msg: 'Requis' });
  } else {
    if (isOutsideBusinessHoursTZ(bookingData.date_debut)) {
      errors.push({ field: 'start_date', msg: 'Doit être entre 09:00 et 17:00' });
    }
    if (isOutsideBusinessHoursTZ(bookingData.date_fin)) {
      errors.push({ field: 'end_date', msg: 'Doit être entre 09:00 et 17:00' });
    }
    if (new Date(bookingData.date_fin) <= new Date(bookingData.date_debut)) {
      errors.push({ field: 'end_date', msg: 'Doit être après la date de départ' });
    }
  }
  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors });
  }

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

// Apply loyalty to booking (points -> MAD discount, store in metadata)
const applyLoyalty = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { points_to_redeem } = req.body;
  const userId = req.user.id;

  if (!points_to_redeem || points_to_redeem <= 0) {
    return res.status(400).json({ success: false, message: 'Points à utiliser requis' });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { car: true, protection: true }
  });
  if (!booking || booking.user_id !== userId) {
    return res.status(404).json({ success: false, message: 'Réservation introuvable ou accès non autorisé' });
  }
  if (booking.paiement_effectue) {
    return res.status(400).json({ success: false, message: 'Réservation déjà payée' });
  }

  const account = await prisma.loyaltyAccount.findUnique({
    where: { user_id: userId },
    include: { tier: true }
  });
  if (!account || account.points_balance < points_to_redeem) {
    return res.status(400).json({ success: false, message: 'Points insuffisants' });
  }

  const discountMad = Math.round(points_to_redeem * 100) / 100; // 1 point = 1 MAD
  const numberOfDays = Math.ceil((new Date(booking.date_fin) - new Date(booking.date_debut)) / (1000 * 60 * 60 * 24));
  const basePerDay = parseFloat(booking.car.prix_par_jour);
  const protectionPerDay = booking.protection ? parseFloat(booking.protection.frais_par_jour) : 0;
  const meta = booking.metadata ? JSON.parse(booking.metadata) : {};
  const mileagePerDay = meta.mileage_fee_per_day || 0;

  const subtotalBase = Math.round((basePerDay * numberOfDays + protectionPerDay * numberOfDays + mileagePerDay * numberOfDays) * 100) / 100;
  const agencyFeePercent = booking.mode_paiement === 'EN_AGENCE' ? 0.025 : 0;
  const agencyFeeAmount = Math.round(subtotalBase * agencyFeePercent * 100) / 100;
  const total = Math.max(0, subtotalBase + agencyFeeAmount - discountMad);

  meta.loyalty = { points_redeemed: points_to_redeem, discount_mad: discountMad };

  await prisma.booking.update({
    where: { id: booking.id },
    data: { metadata: JSON.stringify(meta), prix_total: total }
  });

  res.json({
    success: true,
    message: 'Fidélité appliquée',
    data: {
      subtotal: subtotalBase,
      agency_fee_amount: agencyFeeAmount,
      discount_mad: discountMad,
      total,
      loyalty: {
        points_balance: account.points_balance,
        tier: account.tier?.name || null
      }
    }
  });
});

// Confirm booking for agency, create invoice and return confirmation
const confirmAgence = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  const {
    entreprise,
    prenom,
    nom,
    email,
    pays,
    telephone,
    ageConfirmed,
    termsAccepted,
    billing_address
  } = req.body;

  if (!ageConfirmed || !termsAccepted || !prenom || !nom || !email || !telephone) {
    return res.status(400).json({ success: false, message: 'Champs requis manquants ou validations non acceptées' });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { car: true, protection: true }
  });
  if (!booking || booking.user_id !== userId) {
    return res.status(404).json({ success: false, message: 'Réservation introuvable ou accès non autorisé' });
  }

  const numberOfDays = Math.ceil((new Date(booking.date_fin) - new Date(booking.date_debut)) / (1000 * 60 * 60 * 24));
  const basePerDay = parseFloat(booking.car.prix_par_jour);
  const protectionPerDay = booking.protection ? parseFloat(booking.protection.frais_par_jour) : 0;
  const meta = booking.metadata ? JSON.parse(booking.metadata) : {};
  const mileagePerDay = meta.mileage_fee_per_day || 0;
  const loyaltyDiscount = meta.loyalty?.discount_mad || 0;

  const subtotalBase = Math.round((basePerDay * numberOfDays + protectionPerDay * numberOfDays + mileagePerDay * numberOfDays) * 100) / 100;
  const agencyFeePercent = booking.mode_paiement === 'EN_AGENCE' ? 0.025 : 0;
  const agencyFeeAmount = Math.round(subtotalBase * agencyFeePercent * 100) / 100;
  const total = Math.max(0, subtotalBase + agencyFeeAmount - loyaltyDiscount);

  const invoice = await prisma.invoice.create({
    data: {
      user_id: userId,
      booking_id: booking.id,
      amount: total,
      currency: 'MAD',
      status: 'PENDING',
      metadata: JSON.stringify({
        billing_address,
        entreprise,
        prenom,
        nom,
        email,
        pays,
        telephone,
        agency_fee_percent: agencyFeePercent * 100,
        agency_fee_amount: agencyFeeAmount,
        subtotal: subtotalBase,
        loyalty_discount: loyaltyDiscount
      })
    }
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { prix_total: total }
  });

  res.json({
    success: true,
    message: 'Réservation confirmée pour paiement en agence',
    data: {
      booking_id: booking.id,
      invoice_id: invoice.id,
      total
    }
  });
});

// Quote pricing for booking draft
const getQuote = asyncHandler(async (req, res) => {
  const { carId, start_date, end_date, mode_paiement, kilometrage, protectionId } = req.body;
  if (!carId || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Paramètres requis: carId, start_date, end_date' });
  }
  const car = await prisma.car.findUnique({ where: { id: parseInt(carId) } });
  if (!car) return res.status(404).json({ success: false, message: 'Voiture introuvable' });
  const protection = protectionId ? await prisma.protection.findUnique({ where: { id: parseInt(protectionId) } }) : null;

  const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
  const base_price_per_day = parseFloat(car.prix_par_jour);
  const protection_price_per_day = protection ? parseFloat(protection.frais_par_jour) : 0;
  const km_option_price_per_day = kilometrage === 'KM_UNLIMITED' ? 50 : 0;
  const base_subtotal = Math.round(base_price_per_day * days * 100) / 100;
  const protection_subtotal = Math.round(protection_price_per_day * days * 100) / 100;
  const km_option_subtotal = Math.round(km_option_price_per_day * days * 100) / 100;
  const agency_fee_rate = mode_paiement === 'EN_AGENCE' ? 0.025 : 0;
  const subtotal_before_fee = base_subtotal + protection_subtotal + km_option_subtotal;
  const agency_fee_amount = Math.round(subtotal_before_fee * agency_fee_rate * 100) / 100;
  const total_ttc = Math.round((subtotal_before_fee + agency_fee_amount) * 100) / 100;
  const caution_amount = parseFloat(car.caution || 0);

  const breakdown_lines = [
    { label: `${days} jours x ${base_price_per_day.toFixed(2)} MAD/jour`, amount: base_subtotal },
    ...(protection_price_per_day > 0 ? [{ label: `Protection: +${protection_price_per_day.toFixed(2)} MAD/jour`, amount: protection_subtotal }] : []),
    ...(km_option_price_per_day > 0 ? [{ label: `Kilométrage illimité: +${km_option_price_per_day.toFixed(2)} MAD/jour`, amount: km_option_subtotal }] : []),
    ...(agency_fee_rate > 0 ? [{ label: `Frais paiement en agence (2,5%)`, amount: agency_fee_amount }] : []),
    { label: `Caution remboursable`, amount: caution_amount }
  ];

  res.json({
    success: true,
    data: {
      days,
      base_price_per_day,
      base_subtotal,
      protection_price_per_day,
      protection_subtotal,
      km_option_price_per_day,
      km_option_subtotal,
      agency_fee_rate,
      agency_fee_amount,
      total_ttc,
      caution_amount,
      breakdown_lines
    }
  });
});
/**
 * GET /api/cars/available
 * Get available cars for specified dates
 */
const getAvailableCars = asyncHandler(async (req, res) => {
  const q = req.query;
  const start_date = q.start_date || q.date_debut || q['start date'] || q.startDate;
  const end_date = q.end_date || q.date_fin || q['end date'] || q.endDate;
  const pickup_location = q.pickup_location || q.location || q['pickup location'] || q.pickupLocation;

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'Dates de début et fin requises'
    });
  }

  const sd = new Date(start_date);
  const ed = new Date(end_date);
  if (isNaN(sd.getTime()) || isNaN(ed.getTime())) {
    return res.status(400).json({ error: 'Format de date invalide.' });
  }
  if (ed <= sd) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors: [{ field: 'end_date', msg: 'Doit être après la date de départ' }] });
  }
  const hoursErrors = [];
  if (isOutsideBusinessHoursTZ(start_date)) {
    hoursErrors.push({ field: 'start_date', msg: 'Doit être entre 09:00 et 17:00' });
  }
  if (isOutsideBusinessHoursTZ(end_date)) {
    hoursErrors.push({ field: 'end_date', msg: 'Doit être entre 09:00 et 17:00' });
  }
  if (hoursErrors.length) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors: hoursErrors });
  }

  const allowed = [
    'Casablanca (Ville)',
    'Casablanca – Aéroport Mohammed V (CMN)',
    'Rabat (Ville)',
    'Rabat – Aéroport Rabat-Salé (RBA)'
  ];
  if (pickup_location && !allowed.includes(pickup_location)) {
    return res.status(400).json({ error: 'Lieu invalide' });
  }

  const prisma = require('../config/prisma');
  const where = {
    statut: 'DISPONIBLE',
    disponible: true
  };

  if (pickup_location) {
    const cityMap = {
      'Casablanca (Ville)': 'Casablanca',
      'Casablanca – Aéroport Mohammed V (CMN)': 'Casablanca',
      'Rabat (Ville)': 'Rabat',
      'Rabat – Aéroport Rabat-Salé (RBA)': 'Rabat'
    };
    const city = cityMap[pickup_location] || pickup_location;
    where.OR = [
      { ville: { contains: city, mode: 'insensitive' } },
      { agence_ville: { contains: city, mode: 'insensitive' } }
    ];
  }

  const cars = await prisma.car.findMany({
    where,
    include: {
      brand: true,
      category: true,
      images: {
        where: { is_primary: true }
      }
    },
    orderBy: {
      prix_par_jour: 'asc'
    }
  });

  res.json({
    success: true,
    data: {
      cars,
      total: cars.length
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
  applyLoyalty,
  confirmAgence,
  getAvailableCars,
  getAllBookings,
  updateBookingStatus,
  getBookingStatistics,
  getQuote,
  handleBookingErrors
};
