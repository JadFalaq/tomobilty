/**
 * Core booking service - orchestrates the complete booking workflow
 * Integrates with loyalty, payment, contract, invoice, and notification services
 */

const prisma = require('../config/prisma');
const loyaltyService = require('./loyalty.service');
const paymentService = require('./payment.service');
const contractService = require('./contract.service');
const invoiceService = require('./invoice.service');
const notificationService = require('./notification.service');
const availabilityService = require('./availability.service');

const { calculateComprehensivePricing, calculateRefundAmount } = require('../utils/pricing.utils');
const { 
  validateBookingDates, 
  validateDriverLicense, 
  validateAdditionalDriver,
  calculateCancellationPenalty,
  canModifyBooking,
  generateBookingReference
} = require('../utils/booking.utils');

const {
  BookingNotFoundError,
  CarNotAvailableError,
  InvalidDriverLicenseError,
  InvalidBookingStatusError,
  BookingCancellationError,
  AdditionalDriverLimitError,
  InvalidBookingDatesError
} = require('../errors/booking.errors');

/**
 * Check car availability for specified dates
 * @param {number} carId - Car ID
 * @param {Date|string} dateDebut - Start date
 * @param {Date|string} dateFin - End date
 * @returns {Promise<Object>} Availability result
 */
const checkAvailability = async (carId, dateDebut, dateFin) => {
  try {
    validateBookingDates(dateDebut, dateFin);
    return await availabilityService.checkCarAvailability(carId, dateDebut, dateFin);
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

/**
 * Calculate comprehensive booking price with all fees and discounts
 * @param {Object} params - Pricing parameters
 * @returns {Promise<Object>} Detailed pricing breakdown
 */
const calculateBookingPrice = async (params) => {
  try {
    const { carId, dateDebut, dateFin, userId, insuranceId, additionalDrivers = [], protectionId } = params;

    // Validate dates
    validateBookingDates(dateDebut, dateFin);

    // Get car details (carId may be variante_car_id, resolve to car)
    let car = await prisma.car.findUnique({
      where: { id: carId },
      include: { brand: true, category: true }
    });
    if (!car) {
      const variante = await prisma.varianteCar.findUnique({
        where: { id: carId },
        include: { car: { include: { brand: true, category: true } } }
      });
      if (!variante) {
        throw new Error('Voiture introuvable');
      }
      car = variante.car;
    }

    if (!car) {
      throw new Error('Voiture introuvable');
    }

    // Check availability
    const availability = await checkAvailability(carId, dateDebut, dateFin);
    if (!availability.available) {
      throw new CarNotAvailableError(carId, dateDebut, dateFin, availability.reason);
    }

    // Get insurance details if selected
    let insurance = null;
    if (insuranceId) {
      insurance = await prisma.insurance.findUnique({
        where: { id: insuranceId }
      });
    }
    // Get protection details if selected
    let protection = null;
    if (protectionId) {
      protection = await prisma.protection.findUnique({
        where: { id: protectionId }
      });
      if (!protection) {
        throw new Error('Protection introuvable');
      }
    }

    // Calculate loyalty discount
    let loyaltyDiscountPercent = 0;
    let pointsToEarn = 0;
    
    if (userId) {
      try {
        loyaltyDiscountPercent = await loyaltyService.calculateDiscount(userId, 1000); // Base amount for calculation
        loyaltyDiscountPercent = (loyaltyDiscountPercent / 1000) * 100; // Convert to percentage
        
        const pointsCalculation = await loyaltyService.calculatePointsEarned(1000, userId);
        pointsToEarn = pointsCalculation.pointsWithMultiplier;
      } catch (loyaltyError) {
        console.warn('Could not calculate loyalty benefits:', loyaltyError.message);
      }
    }

    // Calculate comprehensive pricing
    const pricing = calculateComprehensivePricing({
      car,
      dateDebut,
      dateFin,
      insurance,
      additionalDrivers,
      loyaltyDiscountPercent
    });
    // Add protection fee per day if selected
    if (protection) {
      const numberOfDays = Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000 * 60 * 60 * 24));
      const protectionFee = parseFloat(protection.frais_par_jour) * numberOfDays;
      pricing.breakdown = {
        ...pricing.breakdown,
        protection_fee: protectionFee
      };
      pricing.totalPrice = parseFloat(pricing.totalPrice) + protectionFee;
    }

    // Calculate actual points to earn based on final price
    if (userId && pointsToEarn > 0) {
      try {
        const actualPointsCalculation = await loyaltyService.calculatePointsEarned(pricing.totalPrice, userId);
        pointsToEarn = actualPointsCalculation.pointsWithMultiplier;
      } catch (loyaltyError) {
        console.warn('Could not recalculate loyalty points:', loyaltyError.message);
      }
    }

    return {
      ...pricing,
      pointsToEarn,
      car: {
        id: car.id,
        brand: car.brand?.name || null,
        model: car.modele,
        category: car.category?.name || null,
        image: car.images?.[0]?.url || null
      },
      insurance: insurance ? {
        id: insurance.id,
        name: insurance.name,
        coverage: insurance.coverage,
        price: parseFloat(insurance.price)
      } : null,
      availability,
      protection: protection ? {
        id: protection.id,
        type: protection.type,
        frais_par_jour: parseFloat(protection.frais_par_jour),
        proprietes: protection.proprietes
      } : null
    };

  } catch (error) {
    console.error('Error calculating booking price:', error);
    throw error;
  }
};

/**
 * Create a new booking
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Object>} Created booking with payment session
 */
const createBooking = async (bookingData) => {
  try {
    const {
      user_id,
      variante_car_id,
      car_id,
      date_debut,
      date_fin,
      lieu_prise_en_charge,
      lieu_retour,
      insurance_id,
      protection_id,
      use_loyalty_points = 0
    } = bookingData;

    // Validate dates
    validateBookingDates(date_debut, date_fin);

    // Validate main driver (user)
    const user = await prisma.user.findUnique({
      where: { id: user_id }
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Validate driver license (minimum 2 years)
    if (user.permis_conduire && user.date_permis) {
      const licenseValidation = validateDriverLicense(user.permis_conduire, user.date_permis, 2);
      if (!licenseValidation.isValid) {
        throw new InvalidDriverLicenseError(`${user.prenom} ${user.nom}`, licenseValidation.reason);
      }
    }

    // Additional drivers feature removed

    // Calculate pricing
    // Resolve carId from variante
    // Resolve variante ID (supports legacy car_id)
    let variante = null;
    let resolvedVarianteId = null;
    if (variante_car_id) {
      variante = await prisma.varianteCar.findUnique({
        where: { id: parseInt(variante_car_id) },
        include: { car: true }
      });
      if (!variante) throw new Error('Variante introuvable');
      resolvedVarianteId = variante.id;
    } else if (car_id) {
      const variants = await prisma.varianteCar.findMany({
        where: { car_id: parseInt(car_id) },
        include: { car: true }
      });
      if (!variants || variants.length === 0) throw new Error('Variante introuvable pour cette voiture');
      const scored = [];
      for (const v of variants) {
        const avail = await availabilityService.checkCarAvailability(v.id, date_debut, date_fin);
        if (!avail.available) continue;
        const lastActive = await prisma.booking.findFirst({
          where: {
            variante_car_id: v.id,
            status_name: { in: ['EN_ATTENTE', 'EN_COURS'] }
          },
          orderBy: { date_fin: 'desc' },
          select: { date_fin: true }
        });
        scored.push({
          variante: v,
          lastEnd: lastActive?.date_fin || null
        });
      }
      if (scored.length === 0) {
        throw new CarNotAvailableError(car_id, date_debut, date_fin, 'Aucune variante disponible');
      }
      scored.sort((a, b) => {
        if (a.lastEnd === null && b.lastEnd === null) return 0;
        if (a.lastEnd === null) return -1;
        if (b.lastEnd === null) return 1;
        return new Date(a.lastEnd) - new Date(b.lastEnd);
      });
      variante = scored[0].variante;
      resolvedVarianteId = variante.id;
    } else {
      throw new Error('variante_car_id requis');
    }
    const pricing = await calculateBookingPrice({
      carId: variante.id,
      dateDebut: date_debut,
      dateFin: date_fin,
      userId: user_id,
      insuranceId: insurance_id,
      protectionId: protection_id
    });

    const availability = await availabilityService.checkCarAvailability(
      parseInt(resolvedVarianteId),
      date_debut,
      date_fin
    );
    if (!availability.available) {
      throw new CarNotAvailableError(resolvedVarianteId, date_debut, date_fin, availability.reason || 'Indisponible');
    }

    // Apply loyalty points if requested
    let pointsDiscount = 0;
    if (use_loyalty_points > 0) {
      try {
        const redemption = await loyaltyService.redeemPoints(user_id, use_loyalty_points, 'Réduction sur réservation');
        pointsDiscount = redemption.discount_amount;
      } catch (loyaltyError) {
        console.warn('Could not apply loyalty points:', loyaltyError.message);
      }
    }

    // Subtotal before agency fee: base + options + protection (already in pricing.totalPrice)
    const subtotalBase = parseFloat(pricing.totalPrice);
    const numberOfDays = Math.ceil((new Date(date_fin) - new Date(date_debut)) / (1000 * 60 * 60 * 24));
    const mileageFeePerDay = bookingData.mileage_option === 'KM_UNLIMITED' ? 50 : 0;
    const mileageFeeTotal = Math.round(mileageFeePerDay * numberOfDays * 100) / 100;
    const subtotal = Math.round((subtotalBase + mileageFeeTotal) * 100) / 100;
    const agencyFeePercent = bookingData.mode_paiement === 'EN_AGENCE' ? 0.025 : 0;
    const agencyFeeAmount = Math.round(subtotal * agencyFeePercent * 100) / 100;
    const finalPrice = Math.max(0, subtotal - pointsDiscount + agencyFeeAmount);
    const deposit = Math.round(finalPrice * 0.20 * 100) / 100;

    // Get booking status
    const pendingStatus = await prisma.bookingStatus.findFirst({
      where: { name: 'EN_ATTENTE' }
    });

    if (!pendingStatus) {
      throw new Error('Status EN_ATTENTE non trouvé. Veuillez initialiser les statuts de réservation.');
    }

    // Create booking in transaction
    const result = await prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          variante_car_id: parseInt(resolvedVarianteId),
          AND: [
            { date_debut: { lte: new Date(date_fin) } },
            { date_fin: { gte: new Date(date_debut) } },
            { status_name: { in: ['EN_ATTENTE', 'EN_COURS'] } }
          ]
        }
      });
      if (conflict) {
        throw new CarNotAvailableError(resolvedVarianteId, date_debut, date_fin, 'Conflit de réservation');
      }
      // Create booking
      const booking = await tx.booking.create({
        data: {
          user_id,
          variante_car_id: parseInt(resolvedVarianteId),
          date_debut: new Date(date_debut),
          date_fin: new Date(date_fin),
          lieu_prise_en_charge,
          lieu_retour,
          prix_total: finalPrice,
          caution_payee: deposit,
          status_id: pendingStatus.id,
          mode_paiement: (bookingData.mode_paiement === 'EN_LIGNE' || bookingData.mode_paiement === 'EN_AGENCE') ? bookingData.mode_paiement : 'EN_LIGNE',
          protection_id: protection_id || null,
          metadata: JSON.stringify({})
        },
        include: {
          user: true,
          varianteCar: {
            include: {
              car: {
                include: {
                  brand: true,
                  category: true
                }
              }
            }
          },
          status: true
        }
      });

      return booking;
    });

    let paymentSession = null;
    if (bookingData.mode_paiement === 'EN_AGENCE') {
      const agencyPayment = await prisma.payment.create({
        data: {
          booking_id: result.id,
          user_id: result.user.id,
          amount: finalPrice,
          currency: 'MAD',
          status: 'CREATED',
          provider: 'agence',
          metadata: JSON.stringify({
            booking_reference: generateBookingReference(result.id),
            date_debut: new Date(date_debut).toLocaleDateString('fr-FR'),
            date_fin: new Date(date_fin).toLocaleDateString('fr-FR'),
            points_used: use_loyalty_points,
            points_discount: pointsDiscount,
            protection_id,
            agency_fee_percent: agencyFeePercent * 100,
            agency_fee_amount: agencyFeeAmount,
            subtotal,
            mileage_option: bookingData.mileage_option || 'KM_340',
            mileage_fee_per_day: mileageFeePerDay,
            mileage_fee_total: mileageFeeTotal
          })
        }
      });
      paymentSession = {
        payment_id: agencyPayment.id,
        provider: 'agence',
        status: 'CREATED',
        amount: finalPrice,
        currency: 'MAD'
      };
    } else {
      paymentSession = await paymentService.createPaymentSession(result.id, {
        user: result.user,
        car: result.varianteCar?.car || null,
        pricing: {
          totalPrice: finalPrice
        },
        metadata: {
          booking_reference: generateBookingReference(result.id),
          date_debut: new Date(date_debut).toLocaleDateString('fr-FR'),
          date_fin: new Date(date_fin).toLocaleDateString('fr-FR'),
          points_used: use_loyalty_points,
          points_discount: pointsDiscount,
          protection_id,
          agency_fee_percent: agencyFeePercent * 100,
          agency_fee_amount: agencyFeeAmount,
          subtotal,
          mileage_option: bookingData.mileage_option || 'KM_340',
          mileage_fee_per_day: mileageFeePerDay,
          mileage_fee_total: mileageFeeTotal
        }
      });
    }

    // Send booking confirmation notification
    try {
      await notificationService.sendBookingConfirmation(result.id);
    } catch (notificationError) {
      console.warn('Could not send booking confirmation:', notificationError.message);
    }

    console.log(`✅ Booking ${result.id} created for user ${user_id}`);

    return {
      booking: result,
      pricing: {
        ...pricing,
        pointsDiscount,
        finalPrice,
        deposit
      },
      payment: paymentSession,
      additional_drivers: []
    };

  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Confirm booking after successful payment
 * @param {number} bookingId - Booking ID
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Confirmed booking details
 */
const confirmBooking = async (bookingId, paymentId) => {
  try {
    // Verify payment is completed
    const paymentStatus = await paymentService.getPaymentStatus(paymentId);
    
    if (paymentStatus.payment.status !== 'COMPLETED') {
      throw new Error('Le paiement doit être complété avant de confirmer la réservation');
    }

    const current = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        varianteCar: {
          include: {
            car: { include: { brand: true } }
          }
        },
        status: true
      }
    });
    const currentName = current?.status?.name || current?.status_name;
    if (currentName === 'EN_COURS') {
      const results = { contract: null, invoice: null, loyaltyTransaction: null, notifications: [] };
      return { booking: current, ...results };
    }

    // Get confirmed status
    const confirmedStatus = await prisma.bookingStatus.findFirst({
      where: { name: 'EN_COURS' }
    });

    if (!confirmedStatus) {
      throw new Error('Status EN_COURS non trouvé');
    }

  // Update booking status
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status_id: confirmedStatus.id,
      status_name: 'EN_COURS'
    },
    include: {
      user: true,
      varianteCar: {
        include: {
          car: {
            include: { brand: true }
          }
        }
      },
      status: true
    }
  });

    // Execute post-payment workflow
    const results = await executePostPaymentWorkflow(booking, paymentId);

    console.log(`✅ Booking ${bookingId} confirmed successfully`);

    return {
      booking,
      ...results
    };

  } catch (error) {
    console.error('Error confirming booking:', error);
    throw error;
  }
};

/**
 * Execute post-payment workflow (contract, invoice, loyalty points, notifications)
 * @param {Object} booking - Booking object
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Workflow results
 */
const executePostPaymentWorkflow = async (booking, paymentId) => {
  const results = {
    contract: null,
    invoice: null,
    loyaltyTransaction: null,
    notifications: []
  };

  try {
    // 1. Generate contract
    try {
      const contractResult = await contractService.generateContract(booking.id);
      results.contract = contractResult.contract;
      
      // Send contract email
      await notificationService.sendContractEmail(contractResult.contract.id);
      results.notifications.push('contract_sent');
    } catch (contractError) {
      console.error('Error generating contract:', contractError);
    }

    // 2. Generate invoice
    try {
      const invoiceResult = await invoiceService.generateInvoice(booking.id, paymentId);
      results.invoice = invoiceResult.invoice;
      
      // Send invoice email
      await notificationService.sendInvoiceEmail(invoiceResult.invoice.id);
      results.notifications.push('invoice_sent');
    } catch (invoiceError) {
      console.error('Error generating invoice:', invoiceError);
    }

    // 3. Add loyalty points
    try {
      const pointsCalculation = await loyaltyService.calculatePointsEarned(
        parseFloat(booking.prix_total), 
        booking.user_id
      );
      
      const loyaltyResult = await loyaltyService.addPoints(
        booking.user_id,
        pointsCalculation.pointsWithMultiplier,
        booking.id,
        `Points gagnés pour réservation #${booking.id}`
      );
      
      results.loyaltyTransaction = loyaltyResult;
      
      // Send loyalty points notification
      await notificationService.sendLoyaltyPointsNotification(
        booking.user_id,
        pointsCalculation.pointsWithMultiplier,
        `Réservation #${booking.id}`
      );
      results.notifications.push('loyalty_points_sent');
    } catch (loyaltyError) {
      console.error('Error adding loyalty points:', loyaltyError);
    }

    // 4. Send payment confirmation
    try {
      await notificationService.sendPaymentConfirmation(paymentId);
      results.notifications.push('payment_confirmation_sent');
    } catch (notificationError) {
      console.error('Error sending payment confirmation:', notificationError);
    }

    return results;

  } catch (error) {
    console.error('Error in post-payment workflow:', error);
    return results;
  }
};

const expireUnpaidBookings = async (minutes = 45) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - minutes * 60 * 1000);
  const cancelledStatus = await prisma.bookingStatus.findFirst({ where: { name: 'ANNULE' } });
  if (!cancelledStatus) {
    throw new Error('Status ANNULE non trouvé');
  }
  const pendingBookings = await prisma.booking.findMany({
    where: {
      status: { name: 'EN_ATTENTE' },
      date_creation: { lt: cutoff },
      paiement_effectue: { equals: false }
    }
  });
  const updated = [];
  for (const b of pendingBookings) {
    const meta = b.metadata ? (() => { try { return JSON.parse(b.metadata); } catch { return {}; } })() : {};
    meta.expired_at = new Date().toISOString();
    meta.expired_reason = `Unpaid after ${minutes} minutes`;
    const u = await prisma.booking.update({
      where: { id: b.id },
      data: {
        status_id: cancelledStatus.id,
        status_name: 'ANNULE',
        metadata: JSON.stringify(meta)
      }
    });
    updated.push(u.id);
  }
  return { expired_count: updated.length, expired_ids: updated };
};

/**
 * Start rental (when customer picks up the car)
 * @param {number} bookingId - Booking ID
 * @param {Object} contractData - Contract signature and vehicle condition data
 * @returns {Promise<Object>} Updated booking
 */
const startRental = async (bookingId, contractData) => {
  try {
    const {
      odometer_start,
      fuel_level_start,
      vehicle_condition,
      customer_signature
    } = contractData;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        status: true,
        rentalContract: true
      }
    });

    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Verify status is EN_COURS
    if (booking.status.name !== 'EN_COURS') {
      throw new InvalidBookingStatusError(booking.status.name, 'EN_COURS');
    }

    // Verify date is today or later
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.date_debut);
    startDate.setHours(0, 0, 0, 0);

    if (startDate > today) {
      throw new Error('La location ne peut pas commencer avant la date prévue');
    }

    // Get in-progress status
    const activeStatus = await prisma.bookingStatus.findFirst({
      where: { name: 'EN_COURS' }
    });

    if (!activeStatus) {
      throw new Error('Status EN_COURS non trouvé');
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status_id: activeStatus.id
      },
      include: {
        user: true,
        varianteCar: {
          include: {
            car: {
              include: { brand: true }
            }
          }
        },
        status: true
      }
    });

    // Sign contract with vehicle condition
    if (booking.rentalContract) {
      await contractService.signContract(booking.rentalContract.id, {
        customer_signature,
        agent_signature: 'TOMMOBILTY - Signature électronique'
      });
    }

    console.log(`✅ Rental started for booking ${bookingId}`);

    return {
      booking: updatedBooking,
      vehicle_condition: {
        odometer_start,
        fuel_level_start,
        vehicle_condition,
        recorded_at: new Date()
      }
    };

  } catch (error) {
    console.error('Error starting rental:', error);
    throw error;
  }
};

/**
 * Complete rental (when customer returns the car)
 * @param {number} bookingId - Booking ID
 * @param {Object} returnData - Return condition and additional charges
 * @returns {Promise<Object>} Completed booking details
 */
const completeRental = async (bookingId, returnData) => {
  try {
    const {
      odometer_end,
      fuel_level_end,
      vehicle_condition_end,
      damages = '',
      additional_charges = 0
    } = returnData;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        status: true,
        user: true,
        varianteCar: {
          include: {
            car: {
              include: { brand: true }
            }
          }
        }
      }
    });

    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Verify status is EN_COURS
    if (booking.status.name !== 'EN_COURS') {
      throw new InvalidBookingStatusError(booking.status.name, 'EN_COURS');
    }

    // Get completed status
    const completedStatus = await prisma.bookingStatus.findFirst({
      where: { name: 'TERMINE' }
    });

    if (!completedStatus) {
      throw new Error('Status TERMINE non trouvé');
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status_id: completedStatus.id
      },
      include: {
        user: true,
        varianteCar: {
          include: {
            car: {
              include: { brand: true }
            }
          }
        },
        status: true
      }
    });

    // Handle additional charges if any
    let additionalPayment = null;
    if (additional_charges > 0) {
      try {
        // Create additional payment for extra charges
        additionalPayment = await prisma.payment.create({
          data: {
            booking_id: bookingId,
            user_id: booking.user_id,
            amount: additional_charges,
            currency: 'MAD',
            status: 'PENDING',
            provider: 'manual',
            metadata: JSON.stringify({
              type: 'additional_charges',
              damages: damages,
              odometer_difference: odometer_end - (booking.odometer_start || 0),
              fuel_difference: fuel_level_end - (booking.fuel_level_start || 100)
            })
          }
        });
      } catch (paymentError) {
        console.error('Error creating additional payment:', paymentError);
      }
    }

    // Release car (make it available again)
    try {
      await availabilityService.releaseCarFromBooking(booking.variante_car_id, bookingId);
    } catch (releaseError) {
      console.warn('Could not release car:', releaseError.message);
    }

    // Send review request
    try {
      await notificationService.sendReviewRequest(bookingId);
    } catch (notificationError) {
      console.warn('Could not send review request:', notificationError.message);
    }

    console.log(`✅ Rental completed for booking ${bookingId}`);

    return {
      booking: updatedBooking,
      return_condition: {
        odometer_end,
        fuel_level_end,
        vehicle_condition_end,
        damages,
        additional_charges,
        returned_at: new Date()
      },
      additional_payment: additionalPayment
    };

  } catch (error) {
    console.error('Error completing rental:', error);
    throw error;
  }
};

/**
 * Cancel booking
 * @param {number} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 * @param {Object} cancellationPolicy - Custom cancellation policy (optional)
 * @returns {Promise<Object>} Cancellation result
 */
const cancelBooking = async (bookingId, reason, cancellationPolicy = null) => {
  try {
    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        status: true,
        user: true,
        varianteCar: {
          include: {
            car: {
              include: { brand: true }
            }
          }
        },
        payments: {
          where: {
            status: 'COMPLETED'
          }
        },
        loyaltyTransactions: true
      }
    });

    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Check if booking can be cancelled
    const allowedStatuses = ['EN_ATTENTE', 'EN_COURS'];
    if (!allowedStatuses.includes(booking.status.name)) {
      throw new BookingCancellationError(bookingId, `Impossible d'annuler une réservation avec le status ${booking.status.name}`);
    }

    // Calculate cancellation penalty
    const penalty = calculateCancellationPenalty(booking.date_debut);
    
    if (!penalty.canCancel) {
      throw new BookingCancellationError(bookingId, 'Délai d\'annulation dépassé');
    }

    // Get cancelled status
    const cancelledStatus = await prisma.bookingStatus.findFirst({
      where: { name: 'ANNULE' }
    });

    if (!cancelledStatus) {
      throw new Error('Status ANNULE non trouvé');
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status_id: cancelledStatus.id
      },
      include: {
        user: true,
        varianteCar: {
          include: {
            car: {
              include: { brand: true }
            }
          }
        },
        status: true
      }
    });

    const results = {
      booking: updatedBooking,
      penalty: penalty,
      refund: null,
      loyalty_refund: null
    };

    // Process refund if payment was made
    if (booking.payments.length > 0) {
      const payment = booking.payments[0];
      const refundCalculation = calculateRefundAmount(
        parseFloat(payment.amount), 
        penalty.penaltyPercent
      );

      if (refundCalculation.refundAmount > 0) {
        try {
          const refund = await paymentService.createRefund(
            payment.id,
            refundCalculation.refundAmount,
            `Annulation réservation: ${reason}`
          );
          results.refund = refund;
        } catch (refundError) {
          console.error('Error creating refund:', refundError);
        }
      }
    }

    // Refund loyalty points if any were awarded
    if (booking.loyaltyTransactions.length > 0) {
      try {
        await loyaltyService.refundPoints(bookingId);
        results.loyalty_refund = true;
      } catch (loyaltyError) {
        console.error('Error refunding loyalty points:', loyaltyError);
      }
    }

    // Send cancellation confirmation
    try {
      await notificationService.sendCancellationConfirmation(bookingId, reason);
    } catch (notificationError) {
      console.warn('Could not send cancellation confirmation:', notificationError.message);
    }

    console.log(`✅ Booking ${bookingId} cancelled: ${reason}`);

    return results;

  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Get user bookings with filters
 * @param {number} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of bookings
 */
const getUserBookings = async (userId, filters = {}) => {
  try {
    const { status, date_from, date_to, limit = 20, offset = 0 } = filters;

    const whereClause = {
      user_id: userId
    };

    if (status) {
      whereClause.status = {
        name: status
      };
    }

    if (date_from || date_to) {
      whereClause.date_debut = {};
      if (date_from) {
        whereClause.date_debut.gte = new Date(date_from);
      }
      if (date_to) {
        whereClause.date_debut.lte = new Date(date_to);
      }
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        varianteCar: {
          include: {
            car: {
              include: {
                brand: true,
                category: true,
                images: {
                  take: 1
                }
              }
            }
          }
        },
        status: true,
        payments: {
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        },
        invoices: {
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        },
        loyaltyTransactions: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return bookings.map(booking => ({
      ...booking,
      booking_reference: generateBookingReference(booking.id),
      can_modify: canModifyBooking(booking).canModify,
      can_cancel: ['EN_ATTENTE', 'EN_COURS'].includes(booking.status.name)
    }));

  } catch (error) {
    console.error('Error getting user bookings:', error);
    throw error;
  }
};

/**
 * Get detailed booking information
 * @param {number} bookingId - Booking ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Complete booking details
 */
const getBookingDetails = async (bookingId, userId) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true
          }
        },
        varianteCar: {
          include: {
            car: {
              include: {
                brand: true,
                category: true,
                images: true
              }
            }
          }
        },
        status: true,
        payments: {
          orderBy: {
            created_at: 'asc'
          }
        },
        invoices: {
          orderBy: {
            created_at: 'desc'
          }
        },
        loyaltyTransactions: {
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    });

    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Verify user ownership (unless admin)
    if (booking.user_id !== userId) {
      throw new Error('Accès non autorisé à cette réservation');
    }

    // Calculate price breakdown
    const priceBreakdown = await calculateBookingPrice({
      carId: booking.varianteCar.car_id,
      dateDebut: booking.date_debut,
      dateFin: booking.date_fin,
      userId: booking.user_id
    });

    return {
      ...booking,
      booking_reference: generateBookingReference(booking.id),
      priceBreakdown,
      can_modify: canModifyBooking(booking).canModify,
      can_cancel: ['EN_ATTENTE', 'EN_COURS'].includes(booking.status.name),
      cancellation_policy: calculateCancellationPenalty(booking.date_debut)
    };

  } catch (error) {
    console.error('Error getting booking details:', error);
    throw error;
  }
};

/**
 * Update booking (only if status is PENDING)
 * @param {number} bookingId - Booking ID
 * @param {Object} updates - Updates to apply
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated booking
 */
const updateBooking = async (bookingId, updates, userId) => {
  try {
    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        status: true,
        user: true,
        varianteCar: true
      }
    });

    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Verify user ownership
    if (booking.user_id !== userId) {
      throw new Error('Accès non autorisé à cette réservation');
    }

    // Check if booking can be modified
    const modificationCheck = canModifyBooking(booking);
    if (!modificationCheck.canModify) {
      throw new Error(modificationCheck.reason);
    }

    const allowedUpdates = ['date_debut', 'date_fin', 'lieu_prise_en_charge', 'lieu_retour'];
    const updateData = {};
    let priceRecalculation = false;

    // Process allowed updates
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        if (key === 'date_debut' || key === 'date_fin') {
          updateData[key] = new Date(value);
          priceRecalculation = true;
        } else {
          updateData[key] = value;
        }
      }
    }

    // Validate new dates if changed
    if (updateData.date_debut || updateData.date_fin) {
      const newStartDate = updateData.date_debut || booking.date_debut;
      const newEndDate = updateData.date_fin || booking.date_fin;
      
      validateBookingDates(newStartDate, newEndDate);
      
      // Check availability for new dates
      const availability = await checkAvailability(booking.variante_car_id, newStartDate, newEndDate);
      if (!availability.available) {
        throw new CarNotAvailableError(booking.variante_car_id, newStartDate, newEndDate, availability.reason);
      }
    }

    // Recalculate price if dates changed
    if (priceRecalculation) {
      const newPricing = await calculateBookingPrice({
        carId: booking.varianteCar.car_id,
        dateDebut: updateData.date_debut || booking.date_debut,
        dateFin: updateData.date_fin || booking.date_fin,
        userId: booking.user_id
      });
      
      updateData.prix_total = newPricing.totalPrice;
      updateData.caution_payee = Math.round(newPricing.totalPrice * 0.20 * 100) / 100;
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        user: true,
        varianteCar: {
          include: {
            car: {
              include: { brand: true }
            }
          }
        },
        status: true,
      }
    });

    console.log(`✅ Booking ${bookingId} updated successfully`);

    return updatedBooking;

  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

/**
 * Add additional driver to booking
 * @param {number} bookingId - Booking ID
 * @param {Object} driverData - Driver information
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated booking with new driver
 */
const addAdditionalDriver = async () => {
  throw new Error('Fonction conducteur additionnel supprimée');
};

/**
 * Remove additional driver from booking
 * @param {number} bookingId - Booking ID
 * @param {number} driverId - Driver ID to remove
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated booking details
 */
const removeAdditionalDriver = async () => {
  throw new Error('Fonction conducteur additionnel supprimée');
};

module.exports = {
  checkAvailability,
  calculateBookingPrice,
  createBooking,
  confirmBooking,
  startRental,
  completeRental,
  cancelBooking,
  getUserBookings,
  getBookingDetails,
  updateBooking,
  addAdditionalDriver,
  removeAdditionalDriver,
  executePostPaymentWorkflow
};
