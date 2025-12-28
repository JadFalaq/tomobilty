/**
 * Availability service for car rental system
 * Handles car availability checks, maintenance scheduling, and booking conflicts
 */

const prisma = require('../config/prisma');
const { 
  CarNotAvailableError, 
  MaintenanceConflictError 
} = require('../errors/booking.errors');
const { buildAvailabilityWhereClause } = require('../utils/booking.utils');

/**
 * Check if a car is available for the specified dates
 * @param {number} carId - Car ID
 * @param {Date|string} dateDebut - Start date
 * @param {Date|string} dateFin - End date
 * @param {number} excludeBookingId - Booking ID to exclude from check (for updates)
 * @returns {Promise<Object>} Availability result
 */
const checkCarAvailability = async (varianteCarId, dateDebut, dateFin, excludeBookingId = null) => {
  try {
    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    // Check if car exists and is active
    const variante = await prisma.varianteCar.findUnique({
      where: { id: varianteCarId },
      include: {
        car: {
          include: { brand: true, category: true }
        }
      }
    });

    if (!variante) {
      return {
        available: false,
        reason: 'Voiture introuvable',
        conflicts: []
      };
    }

    // Check for existing bookings that overlap
    const whereClause = {
      variante_car_id: varianteCarId,
      OR: [
        {
          date_debut: {
            lte: endDate
          },
          date_fin: {
            gte: startDate
          }
        }
      ],
      status_name: {
        in: ['EN_ATTENTE', 'EN_COURS']
      }
    };

    if (excludeBookingId) {
      whereClause.id = {
        not: excludeBookingId
      };
    }

    const conflictingBookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        },
        status: true
      }
    });

    // Check for maintenance conflicts
    const conflictingMaintenance = await prisma.maintenance.findMany({
      where: {
        variante_car_id: varianteCarId,
        scheduled_date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    const conflicts = [
      ...conflictingBookings.map(booking => ({
        type: 'BOOKING',
        id: booking.id,
        dateDebut: booking.date_debut,
        dateFin: booking.date_fin,
        status: booking.status_name,
        user: `${booking.user.nom} ${booking.user.prenom}`
      })),
      ...conflictingMaintenance.map(maintenance => ({
        type: 'MAINTENANCE',
        id: maintenance.id,
        date: maintenance.scheduled_date,
        type_maintenance: maintenance.maintenance_type,
        status: maintenance.status
      }))
    ];

    const available = conflicts.length === 0;

    return {
      available,
      reason: available ? null : 'Conflits de réservation ou maintenance',
      conflicts,
      variante: {
        id: variante.id,
        car_id: variante.car_id,
        brand: variante.car.brand.name,
        model: variante.car.modele,
        registration: variante.immatriculation
      }
    };

  } catch (error) {
    console.error('Error checking car availability:', error);
    throw error;
  }
};

/**
 * Get available cars for specified dates and filters
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Available cars
 */
const getAvailableCars = async (filters) => {
  try {
    const {
      date_debut,
      date_fin,
      category_id,
      brand_id,
      transmission,
      min_price,
      max_price,
      fuel,
      seats
    } = filters;

    if (!date_debut || !date_fin) {
      throw new Error('Dates de début et fin requises');
    }

    const startDate = new Date(date_debut);
    const endDate = new Date(date_fin);

    // Build where clause for cars (only allowed fields)
    const whereClause = {
      statut: 'DISPONIBLE'
    };

    if (category_id) {
      whereClause.category_id = parseInt(category_id);
    }

    if (brand_id) {
      whereClause.brand_id = parseInt(brand_id);
    }

    if (transmission) {
      whereClause.transmission = transmission;
    }

    if (seats) {
      whereClause.nombre_places = parseInt(seats);
    }

    if (min_price || max_price) {
      whereClause.prix_par_jour = {};
      if (min_price) {
        whereClause.prix_par_jour.gte = parseFloat(min_price);
      }
      if (max_price) {
        whereClause.prix_par_jour.lte = parseFloat(max_price);
      }
    }

    const availabilityWhere = buildAvailabilityWhereClause(startDate, endDate, {
      fuelEnum: mapFuelToEnum(fuel)
    });

    const cars = await prisma.car.findMany({
      where: {
        ...whereClause,
        ...availabilityWhere
      },
      select: {
        id: true,
        brand_id: true,
        category_id: true,
        modele: true,
        transmission: true,
        nombre_places: true,
        nombre_portes: true,
        prix_par_jour: true,
        statut: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { select: { image_url: true, is_primary: true } },
        variantes: {
          select: {
            id: true,
            type_carburant: true
          }
        }
      },
      orderBy: { prix_par_jour: 'asc' }
    });

    const numberOfDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const result = cars.map(car => ({
      ...car,
      pricing: {
        daily_rate: parseFloat(car.prix_par_jour),
        total_price: parseFloat(car.prix_par_jour) * numberOfDays,
        number_of_days: numberOfDays
      }
    }));

    return result;

  } catch (error) {
    console.error('Error getting available cars:', error);
    throw error;
  }
};

function mapFuelToEnum(value) {
  if (!value) return undefined;
  const v = String(value).toUpperCase();
  if (v.includes('DIESEL')) return 'DIESEL';
  if (v.includes('ESSENCE')) return 'ESSENCE';
  if (v.includes('ELECTRI') || v.includes('ÉLECTRI')) return 'ELECTRIQUE';
  if (v.includes('HYBR')) return 'HYBRIDE';
  return undefined;
}

/**
 * Get car maintenance schedule
 * @param {number} carId - Car ID
 * @param {Date} fromDate - Start date (optional)
 * @param {Date} toDate - End date (optional)
 * @returns {Promise<Array>} Maintenance schedule
 */
const getCarMaintenanceSchedule = async (varianteCarId, fromDate = null, toDate = null) => {
  try {
    const whereClause = { variante_car_id: varianteCarId };

    if (fromDate || toDate) {
      whereClause.scheduled_date = {};
      if (fromDate) {
        whereClause.scheduled_date.gte = new Date(fromDate);
      }
      if (toDate) {
        whereClause.scheduled_date.lte = new Date(toDate);
      }
    }

    const maintenance = await prisma.maintenance.findMany({
      where: whereClause,
      include: {
        varianteCar: {
          select: {
            id: true,
            immatriculation: true
          }
        }
      },
      orderBy: {
        scheduled_date: 'asc'
      }
    });

    return maintenance;

  } catch (error) {
    console.error('Error getting maintenance schedule:', error);
    throw error;
  }
};

/**
 * Check for maintenance conflicts with booking dates
 * @param {number} carId - Car ID
 * @param {Date|string} dateDebut - Start date
 * @param {Date|string} dateFin - End date
 * @returns {Promise<Array>} Maintenance conflicts
 */
const checkMaintenanceConflicts = async (varianteCarId, dateDebut, dateFin) => {
  try {
    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    const conflicts = await prisma.maintenance.findMany({
      where: {
        variante_car_id: varianteCarId,
        scheduled_date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      },
      orderBy: {
        scheduled_date: 'asc'
      }
    });

    return conflicts;

  } catch (error) {
    console.error('Error checking maintenance conflicts:', error);
    throw error;
  }
};

/**
 * Get booking conflicts for a car
 * @param {number} carId - Car ID
 * @param {Date|string} dateDebut - Start date
 * @param {Date|string} dateFin - End date
 * @param {number} excludeBookingId - Booking ID to exclude
 * @returns {Promise<Array>} Booking conflicts
 */
const getBookingConflicts = async (varianteCarId, dateDebut, dateFin, excludeBookingId = null) => {
  try {
    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    const whereClause = {
      variante_car_id: varianteCarId,
      OR: [
        {
          date_debut: {
            lte: endDate
          },
          date_fin: {
            gte: startDate
          }
        }
      ],
      status_name: {
        in: ['EN_ATTENTE', 'EN_COURS']
      }
    };

    if (excludeBookingId) {
      whereClause.id = {
        not: excludeBookingId
      };
    }

    const conflicts = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        },
        status: true
      },
      orderBy: {
        date_debut: 'asc'
      }
    });

    return conflicts;

  } catch (error) {
    console.error('Error getting booking conflicts:', error);
    throw error;
  }
};

/**
 * Reserve car for booking (mark as temporarily unavailable)
 * @param {number} carId - Car ID
 * @param {Date|string} dateDebut - Start date
 * @param {Date|string} dateFin - End date
 * @param {number} bookingId - Booking ID
 * @returns {Promise<boolean>} Success status
 */
const reserveCarForBooking = async (varianteCarId, dateDebut, dateFin, bookingId) => {
  try {
    // This is handled by the booking creation itself
    // We just verify availability one more time
    const availability = await checkCarAvailability(varianteCarId, dateDebut, dateFin);
    
    if (!availability.available) {
      throw new CarNotAvailableError(varianteCarId, dateDebut, dateFin, availability.reason);
    }

    return true;

  } catch (error) {
    console.error('Error reserving car:', error);
    throw error;
  }
};

/**
 * Release car from booking (make available again)
 * @param {number} carId - Car ID
 * @param {number} bookingId - Booking ID
 * @returns {Promise<boolean>} Success status
 */
const releaseCarFromBooking = async (varianteCarId, bookingId) => {
  try {
    // Verify the booking exists and is completed/cancelled
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { status: true }
    });

    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    if (!['TERMINE', 'ANNULE'].includes(booking.status_name)) {
      throw new Error('La réservation doit être terminée ou annulée pour libérer la voiture');
    }

    // Variante is automatically available when no active bookings exist
    // This is more of a verification step
    return true;

  } catch (error) {
    console.error('Error releasing car:', error);
    throw error;
  }
};

/**
 * Get car availability calendar
 * @param {number} carId - Car ID
 * @param {Date} startDate - Calendar start date
 * @param {Date} endDate - Calendar end date
 * @returns {Promise<Array>} Calendar with availability status
 */
const getCarAvailabilityCalendar = async (carId, startDate, endDate) => {
  try {
    const calendar = [];
    const currentDate = new Date(startDate);

    // Get all bookings and maintenance for the period
    const variants = await prisma.varianteCar.findMany({
      where: { car_id: carId },
      select: { id: true }
    });
    const variantIds = variants.map(v => v.id);

    const bookings = await prisma.booking.findMany({
      where: {
        variante_car_id: { in: variantIds },
        date_debut: { lte: endDate },
        date_fin: { gte: startDate },
        status_name: { in: ['EN_ATTENTE', 'EN_COURS'] }
      }
    });

    const maintenance = await prisma.maintenance.findMany({
      where: {
        variante_car_id: { in: variantIds },
        scheduled_date: { gte: startDate, lte: endDate },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
      }
    });

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if date has booking
      const hasBooking = bookings.some(booking => {
        const bookingStart = new Date(booking.date_debut);
        const bookingEnd = new Date(booking.date_fin);
        return currentDate >= bookingStart && currentDate <= bookingEnd;
      });

      // Check if date has maintenance
      const hasMaintenance = maintenance.some(m => {
        const maintenanceDate = new Date(m.scheduled_date);
        return currentDate.toDateString() === maintenanceDate.toDateString();
      });

      calendar.push({
        date: dateStr,
        available: !hasBooking && !hasMaintenance,
        hasBooking,
        hasMaintenance,
        bookings: bookings.filter(booking => {
          const bookingStart = new Date(booking.date_debut);
          const bookingEnd = new Date(booking.date_fin);
          return currentDate >= bookingStart && currentDate <= bookingEnd;
        }),
        maintenance: maintenance.filter(m => {
          const maintenanceDate = new Date(m.scheduled_date);
          return currentDate.toDateString() === maintenanceDate.toDateString();
        })
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendar;

  } catch (error) {
    console.error('Error getting availability calendar:', error);
    throw error;
  }
};

module.exports = {
  checkCarAvailability,
  getAvailableCars,
  getCarMaintenanceSchedule,
  checkMaintenanceConflicts,
  getBookingConflicts,
  reserveCarForBooking,
  releaseCarFromBooking,
  getCarAvailabilityCalendar
};
