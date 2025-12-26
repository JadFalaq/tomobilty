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
const { normalizeDatetime, resolveDateParams, isOutsideBusinessHoursTZ, toTZTimestamp } = require('../utils/datetime.utils');

 

function canTransition(currentName, targetName) {
  const transitions = {
    EN_ATTENTE: ['EN_COURS', 'ANNULE'],
    EN_COURS: ['TERMINE'],
    TERMINE: [],
    ANNULE: []
  };
  const allowedNext = transitions[currentName] || [];
  return allowedNext.includes(targetName);
}

function isOverdueTZ(booking, tz = 'Africa/Casablanca') {
  const statusName = booking.status?.name || booking.status_name;
  if (statusName !== 'EN_COURS') return false;
  const endTs = toTZTimestamp(booking.date_fin, tz);
  const nowTs = toTZTimestamp(new Date(), tz);
  return endTs < nowTs;
}

function shouldCreateOverdueNotification(booking, tz = 'Africa/Casablanca') {
  const meta = booking.metadata ? (() => { try { return JSON.parse(booking.metadata); } catch { return {}; } })() : {};
  return isOverdueTZ(booking, tz) && !meta.overdue_notified_at;
}

/**
 * POST /api/bookings/check-availability
 * Check car availability for specified dates
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { variante_car_id, date_debut, date_fin } = req.body;

  if (!variante_car_id || !date_debut || !date_fin) {
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

  const availability = await bookingService.checkAvailability(variante_car_id, date_debut, date_fin);

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
  const { variante_car_id, date_debut, date_fin, insurance_id, additional_drivers } = req.body;
  const userId = req.user?.id;

  if (!variante_car_id || !date_debut || !date_fin) {
    return res.status(400).json({
      success: false,
      message: 'ID voiture, date de début et date de fin requis'
    });
  }

  const pricing = await bookingService.calculateBookingPrice({
    carId: variante_car_id,
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
const createBooking = async (req, res) => {
  const merged = { ...req.body };
  const { dateDebut, dateFin } = resolveDateParams(merged);
  if (!dateDebut || !dateFin) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors: [{ field: 'date_debut', msg: 'Requis' }, { field: 'date_fin', msg: 'Requis' }] });
  }
  const normStartISO = normalizeDatetime(dateDebut, true);
  const normEndISO = normalizeDatetime(dateFin, false);
  if (!normStartISO || !normEndISO) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors: [{ field: 'date_debut', msg: 'Invalide' }, { field: 'date_fin', msg: 'Invalide' }] });
  }
  const normStart = new Date(normStartISO);
  const normEnd = new Date(normEndISO);
  const errors = [];
  if (normEnd <= normStart) {
    errors.push({ field: 'end_date', msg: 'Doit être après la date de départ' });
  }
  const startHadTime = typeof dateDebut === 'string' && (dateDebut.includes('T') || /\d{2}:\d{2}/.test(dateDebut));
  const endHadTime = typeof dateFin === 'string' && (dateFin.includes('T') || /\d{2}:\d{2}/.test(dateFin));
  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors });
  }
  // Resolve pickup/return sites if IDs are provided (backward compatible with legacy strings)
  let lieu_prise_en_charge = merged.lieu_prise_en_charge || null;
  let lieu_retour = merged.lieu_retour || null;
  const pickupIdRaw = merged.pickup_site_id;
  const returnIdRaw = merged.return_site_id;

  if (pickupIdRaw !== undefined && pickupIdRaw !== null && pickupIdRaw !== '') {
    const pickupId = parseInt(pickupIdRaw);
    if (isNaN(pickupId) || pickupId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: [{ field: 'pickup_site_id', msg: 'ID invalide', code: 'INVALID_PICKUP_SITE' }]
      });
    }
    const pickupSite = await prisma.pickupSite.findUnique({ where: { id: pickupId } });
    if (!pickupSite || pickupSite.is_active !== true) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: [{ field: 'pickup_site_id', msg: 'Site de retrait invalide', code: 'INVALID_PICKUP_SITE' }]
      });
    }
    lieu_prise_en_charge = pickupSite.nom;
  }

  if (returnIdRaw !== undefined && returnIdRaw !== null && returnIdRaw !== '') {
    const returnId = parseInt(returnIdRaw);
    if (isNaN(returnId) || returnId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: [{ field: 'return_site_id', msg: 'ID invalide', code: 'INVALID_RETURN_SITE' }]
      });
    }
    const returnSite = await prisma.pickupSite.findUnique({ where: { id: returnId } });
    if (!returnSite || returnSite.is_active !== true) {
      console.log('⚠️ invalid return_site_id:', returnId, 'returnSite:', returnSite);
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: [{ field: 'return_site_id', msg: 'Site de retour invalide', code: 'INVALID_RETURN_SITE' }]
      });
    }
    lieu_retour = returnSite.nom;
  }

  const bookingData = { 
    ...req.body, 
    user_id: req.user.id, 
    date_debut: normStartISO, 
    date_fin: normEndISO, 
    lieu_prise_en_charge, 
    lieu_retour 
  };
  console.log('➡️ createBooking controller: invoking bookingService.createBooking');
  console.log('🔎 typeof bookingService.createBooking:', typeof bookingService.createBooking);
  const bookingSvc = require('../services/booking.service');
  const result = await bookingSvc.createBooking(bookingData);

  res.status(201).json({
    success: true,
    message: 'Réservation créée avec succès',
    data: result
  });
};

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

const getMyBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, q } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { user_id: req.user.id };
  if (status) where.status = { name: status };
  if (q) {
    const term = q.toString().trim();
    const idNum = parseInt(term, 10);
    const textFilter = {
      varianteCar: {
        car: {
          OR: [
            { modele: { contains: term, mode: 'insensitive' } },
            { brand: { name: { contains: term, mode: 'insensitive' } } }
          ]
        }
      }
    };
    if (!isNaN(idNum)) {
      where.OR = [{ id: idNum }, textFilter];
    } else {
      Object.assign(where, textFilter);
    }
  }
  const [items, totalItems] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        status: true,
        varianteCar: {
          include: {
            car: {
              include: {
                brand: true,
                images: {
                  where: { is_primary: true },
                  take: 1
                }
              }
            }
          }
        },
        payments: {
          orderBy: { created_at: 'desc' },
          take: 1
        },
        invoices: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: { date_creation: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.booking.count({ where })
  ]);
  const projected = items.map(b => {
    const lastPayment = b.payments?.[0] || null;
    const lastInvoice = b.invoices?.[0] || null;
    const primaryImage = b.varianteCar?.car?.images?.[0] || null;
    return {
      id: b.id,
      date_debut: b.date_debut,
      date_fin: b.date_fin,
      prix_total: b.prix_total,
      status: { name: b.status?.name || b.status_name },
      mode_paiement: b.mode_paiement,
      date_creation: b.date_creation,
      car: {
        id: b.varianteCar?.car?.id,
        modele: b.varianteCar?.car?.modele,
        brand: { name: b.varianteCar?.car?.brand?.name },
        primaryImage: primaryImage ? { image_url: primaryImage.image_url, alt_text: primaryImage.alt_text || null } : null
      },
      is_paid: lastPayment ? lastPayment.status === 'COMPLETED' : false,
      has_invoice: !!lastInvoice,
      invoice_number: lastInvoice?.invoice_number || null
    };
  });
  res.json({
    success: true,
    data: {
      items: projected,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / parseInt(limit))
      }
    }
  });
});

const getMyBookingDetails = asyncHandler(async (req, res) => {
  const bookingId = parseInt(req.params.bookingId);
  const userId = req.user.id;
  const booking = await bookingService.getBookingDetails(bookingId, userId);
  const meta = booking.metadata ? (() => { try { return JSON.parse(booking.metadata); } catch { return {}; } })() : {};
  const lastPayment = booking.payments?.[booking.payments.length - 1] || null;
  const lastInvoice = booking.invoices?.[0] || null;
  const car = booking.varianteCar?.car || null;
  const primaryImage = car?.images?.find(i => i.is_primary) || car?.images?.[0] || null;
  const details = {
    id: booking.id,
    date_debut: booking.date_debut,
    date_fin: booking.date_fin,
    prix_total: booking.prix_total,
    status: { name: booking.status?.name || booking.status_name },
    mode_paiement: booking.mode_paiement,
    date_creation: booking.date_creation,
    car: car ? {
      id: car.id,
      modele: car.modele,
      brand: { name: car.brand?.name },
      category: car.category ? { name: car.category.name } : null,
      primaryImage: primaryImage ? { image_url: primaryImage.image_url, alt_text: primaryImage.alt_text || null } : null
    } : null,
    protection: booking.protection ? { id: booking.protection.id, name: booking.protection.name, price: booking.protection.frais_par_jour } : null,
    km_option: meta.mileage_option || meta.km_option || null,
    breakdown_lines: meta.breakdown_lines || meta.quote?.breakdown_lines || [],
    caution_amount: meta.caution_amount || meta.quote?.caution_amount || booking.caution_payee || 0,
    payment: lastPayment ? { status: lastPayment.status, amount: lastPayment.amount, provider: lastPayment.provider } : null,
    invoice: lastInvoice ? { id: lastInvoice.id, invoice_number: lastInvoice.invoice_number, status: lastInvoice.status, pdf_path: lastInvoice.pdf_path || null } : null,
    is_paid: lastPayment ? lastPayment.status === 'COMPLETED' : false,
    has_invoice: !!lastInvoice
  };
  res.json({
    success: true,
    data: { booking: details }
  });
});

const getMyBookingInvoice = asyncHandler(async (req, res) => {
  const bookingId = parseInt(req.params.bookingId);
  const booking = await bookingService.getBookingDetails(bookingId, req.user.id);
  if (!booking.invoices || booking.invoices.length === 0) {
    return res.status(404).json({ success: false, message: 'Facture non disponible' });
  }
  const invoice = await invoiceService.getInvoice(booking.invoices[0].id);
  if (invoice.pdf_path) {
    return res.sendFile(invoice.pdf_path);
  }
  return res.status(404).json({ success: false, message: 'Facture non disponible' });
});

const cancelMyBooking = asyncHandler(async (req, res) => {
  const bookingId = parseInt(req.params.bookingId);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { status: true }
  });
  if (!booking || booking.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Réservation introuvable' });
  }
  const statusName = booking.status?.name || booking.status_name;
  if (statusName !== 'EN_ATTENTE') {
    return res.status(400).json({ success: false, message: 'Réservation non annulable', code: 'BOOKING_NOT_CANCELLABLE' });
  }
  const cancelledStatus = await prisma.bookingStatus.findFirst({ where: { name: 'ANNULE' } });
  const meta = booking.metadata ? (() => { try { return JSON.parse(booking.metadata); } catch { return {}; } })() : {};
  const CANCELLATION_FEE_MAD = 50;
  const breakdown = Array.isArray(meta.breakdown_lines) ? meta.breakdown_lines.slice() : [];
  breakdown.push({ code: 'CANCEL', description: 'Frais d’annulation', amount: CANCELLATION_FEE_MAD });
  meta.breakdown_lines = breakdown;
  const newTotal = Math.max(0, parseFloat(booking.prix_total) + CANCELLATION_FEE_MAD);
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status_id: cancelledStatus.id,
      status_name: 'ANNULE',
      prix_total: newTotal,
      metadata: JSON.stringify(meta)
    },
    include: { status: true }
  });
  res.json({
    success: true,
    message: 'Réservation annulée avec succès',
    data: { booking: updated }
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
  return res.status(410).json({
    success: false,
    message: 'Fonction conducteur additionnel supprimée'
  });
});

/**
 * DELETE /api/bookings/:bookingId/additional-driver/:driverId
 * Remove additional driver from booking
 */
const removeAdditionalDriver = asyncHandler(async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Fonction conducteur additionnel supprimée'
  });
});

/**
 * GET /api/pickup-sites
 * Public: list active pickup/return sites
 */
const getPickupSites = asyncHandler(async (req, res) => {
  const items = await prisma.pickupSite.findMany({
    where: { is_active: true },
    orderBy: { nom: 'asc' },
    select: { id: true, nom: true }
  });
  res.json({
    success: true,
    data: {
      items,
      total: items.length
    }
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
  const { carId, mode_paiement, kilometrage, protectionId } = req.body;
  const { dateDebut, dateFin } = resolveDateParams(req.body);
  if (!carId || !dateDebut || !dateFin) {
    return res.status(400).json({ success: false, message: 'Paramètres requis: carId, start_date, end_date' });
  }
  const sd = new Date(normalizeDatetime(dateDebut, true));
  const ed = new Date(normalizeDatetime(dateFin, false));
  if (isNaN(sd.getTime()) || isNaN(ed.getTime()) || ed <= sd) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors: [{ field: 'end_date', msg: 'Doit être après la date de départ' }] });
  }
  const startHadTime = typeof dateDebut === 'string' && (dateDebut.includes('T') || /\d{2}:\d{2}/.test(dateDebut));
  const endHadTime = typeof dateFin === 'string' && (dateFin.includes('T') || /\d{2}:\d{2}/.test(dateFin));
  if ((startHadTime && isOutsideBusinessHoursTZ(sd.toISOString())) || (endHadTime && isOutsideBusinessHoursTZ(ed.toISOString()))) {
    return res.status(400).json({ success: false, message: 'Heures invalides', errors: [{ field: 'start_date', msg: 'Doit être entre 09:00 et 17:00' }] });
  }
  const car = await prisma.car.findUnique({ where: { id: parseInt(carId) } });
  if (!car) return res.status(404).json({ success: false, message: 'Voiture introuvable' });
  const protection = protectionId ? await prisma.protection.findUnique({ where: { id: parseInt(protectionId) } }) : null;

  const days = Math.ceil((ed - sd) / (1000 * 60 * 60 * 24));
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

  const prisma = require('../config/prisma');
  const where = {
    statut: 'DISPONIBLE',
    disponible: true
  };

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

  if (req.query.variante_car_id) {
    where.variante_car_id = parseInt(req.query.variante_car_id);
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

  const nowTs = toTZTimestamp(new Date(), 'Africa/Casablanca');
  const enriched = [];
  for (const b of bookings) {
    const overdue = isOverdueTZ(b, 'Africa/Casablanca');
    let meta = b.metadata ? (() => { try { return JSON.parse(b.metadata); } catch { return {}; } })() : {};
    if (shouldCreateOverdueNotification(b, 'Africa/Casablanca')) {
      try {
        await prisma.notification.create({
          data: {
            user_id: b.user_id,
            title: 'Réservation en retard',
            message: `Réservation ${b.id} (${b.car.brand.name} ${b.car.modele}) en retard depuis ${new Date(b.date_fin).toISOString()}`,
            type: 'BOOKING',
            is_read: false
          }
        });
        meta = { ...meta, overdue_notified_at: new Date().toISOString() };
        await prisma.booking.update({
          where: { id: b.id },
          data: { metadata: JSON.stringify(meta) }
        });
      } catch {}
    }
    enriched.push({ ...b, is_overdue: overdue });
  }

  res.json({
    success: true,
    data: {
      bookings: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Update booking status (Admin/Agent)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, status_name, notes } = req.body;

  const requestedStatus = status || status_name;
  if (!requestedStatus) {
    return res.status(400).json({ success: false, message: 'Statut requis', code: 'MISSING_STATUS' });
  }

  const allowed = ['EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULE'];
  if (!allowed.includes(requestedStatus)) {
    return res.status(400).json({ success: false, message: 'Statut invalide', code: 'INVALID_STATUS' });
  }

  const current = await prisma.booking.findUnique({
    where: { id: parseInt(id) },
    include: { status: true }
  });
  if (!current) {
    return res.status(404).json({ success: false, message: 'Réservation introuvable', code: 'BOOKING_NOT_FOUND' });
  }

  const currentName = current.status?.name || current.status_name;
  const transitions = {
    EN_ATTENTE: ['EN_COURS', 'ANNULE'],
    EN_COURS: ['TERMINE'],
    TERMINE: [],
    ANNULE: []
  };
  const allowedNext = transitions[currentName] || [];
  if (!allowedNext.includes(requestedStatus)) {
    return res.status(400).json({ success: false, message: 'Transition de statut invalide', code: 'INVALID_STATUS_TRANSITION' });
  }

  const statusRow = await prisma.bookingStatus.findFirst({ where: { name: requestedStatus } });
  if (!statusRow) {
    return res.status(400).json({ success: false, message: 'Statut non configuré', code: 'STATUS_NOT_CONFIGURED' });
  }

  const updated = await prisma.booking.update({
    where: { id: parseInt(id) },
    data: {
      status_id: statusRow.id,
      status_name: requestedStatus,
      metadata: notes ? JSON.stringify({ ...(current.metadata ? JSON.parse(current.metadata) : {}), status_notes: notes }) : current.metadata
    },
    include: {
      user: { select: { id: true, email: true, nom: true, prenom: true } },
      car: { include: { brand: true } },
      status: true
    }
  });

  res.status(200).json({ success: true, message: 'Statut mis à jour', data: { booking: updated } });
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
        status: { name: 'EN_COURS' }
      }
    }),
    prisma.booking.count({
      where: {
        ...dateFilter,
        status: { name: 'ANNULE' }
      }
    }),
    prisma.booking.aggregate({
      where: {
        ...dateFilter,
        status: { name: 'EN_COURS' }
      },
      _sum: { prix_total: true }
    }),
    prisma.booking.aggregate({
      where: {
        ...dateFilter,
        status: { name: 'EN_COURS' }
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
  getPickupSites,
  updateBooking,
  cancelBooking,
  startRental,
  completeRental,
  addAdditionalDriver,
  removeAdditionalDriver,
  getBookingContract,
  getBookingInvoice,
  getMyBookings,
  getMyBookingDetails,
  getMyBookingInvoice,
  cancelMyBooking,
  applyLoyalty,
  confirmAgence,
  getAvailableCars,
  getAllBookings,
  updateBookingStatus,
  getBookingStatistics,
  getQuote,
  handleBookingErrors,
  canTransition,
  isOverdueTZ,
  shouldCreateOverdueNotification
};
