/**
 * Availability service for car rental system
 * Handles car availability checks, maintenance scheduling, and booking conflicts
 */

const prisma = require('../config/prisma');
const { 
  CarNotAvailableError, 
  MaintenanceConflictError 
} = require('../errors/booking.errors');
const { datesOverlap } = require('../utils/booking.utils');

/**
 * Check if a car is available for the specified dates
 * @param {number} carId - Car ID
 * @param {Date|string} dateDebut - Start date
 * @param {Date|string} dateFin - End date
 * @param {number} excludeBookingId - Booking ID to exclude from check (for updates)
 * @returns {Promise<Object>} Availability result
 */
const checkCarAvailability = async (carId, dateDebut, dateFin, excludeBookingId = null) => {
  try {
    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    // Check if car exists and is active
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        brand: true,
        category: true
      }
    });

    if (!car) {
      return {
        available: false,
        reason: 'Voiture introuvable',
        conflicts: []
      };
    }

    if (!car.is_available) {
      return {
        available: false,
        reason: 'Voiture temporairement indisponible',
        conflicts: []
      };
    }

    // Check for existing bookings that overlap
    const whereClause = {
      car_id: carId,
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
      status: {
        name: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE']
        }
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
        car_id: carId,
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
        status: booking.status.name,
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
      car: {
        id: car.id,
        brand: car.brand.name,
        model: car.modele,
        registration: car.immatriculation
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
      fuel_type,
      min_seats,
      location
    } = filters;

    if (!date_debut || !date_fin) {
      throw new Error('Dates de début et fin requises');
    }

    const startDate = new Date(date_debut);
    const endDate = new Date(date_fin);

    // Build where clause for cars
    const whereClause = {
      is_available: true,
      AND: []
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

    if (fuel_type) {
      whereClause.fuel_type = fuel_type;
    }

    if (min_seats) {
      whereClause.nombre_places = {
        gte: parseInt(min_seats)
      };
    }

    if (min_price || max_price) {
      whereClause.tarif_journalier = {};
      if (min_price) {
        whereClause.tarif_journalier.gte = parseFloat(min_price);
      }
      if (max_price) {
        whereClause.tarif_journalier.lte = parseFloat(max_price);
      }
    }

    // Get all cars matching basic criteria
    const cars = await prisma.car.findMany({
      where: whereClause,
      include: {
        brand: true,
        category: true,
        images: {
          take: 1,
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: {
        tarif_journalier: 'asc'
      }
    });

    // Filter out cars with conflicts
    const availableCars = [];

    for (const car of cars) {
      const availability = await checkCarAvailability(car.id, startDate, endDate);
      
      if (availability.available) {
        // Calculate total price for the period
        const numberOfDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const totalPrice = parseFloat(car.tarif_journalier) * numberOfDays;

        availableCars.push({
          ...car,
          availability: availability,
          pricing: {
            daily_rate: parseFloat(car.tarif_journalier),
            total_price: totalPrice,
            number_of_days: numberOfDays
          }
        });
      }
    }

    return availableCars;

  } catch (error) {
    console.error('Error getting available cars:', error);
    throw error;
  }
};

/**
 * Get car maintenance schedule
 * @param {number} carId - Car ID
 * @param {Date} fromDate - Start date (optional)
 * @param {Date} toDate - End date (optional)
 * @returns {Promise<Array>} Maintenance schedule
 */
const getCarMaintenanceSchedule = async (carId, fromDate = null, toDate = null) => {
  try {
    const whereClause = {
      car_id: carId
    };

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
        car: {
          select: {
            id: true,
            modele: true,
            immatriculation: true,
            brand: {
              select: {
                name: true
              }
            }
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
const checkMaintenanceConflicts = async (carId, dateDebut, dateFin) => {
  try {
    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    const conflicts = await prisma.maintenance.findMany({
      where: {
        car_id: carId,
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
const getBookingConflicts = async (carId, dateDebut, dateFin, excludeBookingId = null) => {
  try {
    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    const whereClause = {
      car_id: carId,
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
      status: {
        name: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE']
        }
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
const reserveCarForBooking = async (carId, dateDebut, dateFin, bookingId) => {
  try {
    // This is handled by the booking creation itself
    // We just verify availability one more time
    const availability = await checkCarAvailability(carId, dateDebut, dateFin);
    
    if (!availability.available) {
      throw new CarNotAvailableError(carId, dateDebut, dateFin, availability.reason);
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
const releaseCarFromBooking = async (carId, bookingId) => {
  try {
    // Verify the booking exists and is completed/cancelled
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { status: true }
    });

    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    if (!['COMPLETED', 'CANCELLED'].includes(booking.status.name)) {
      throw new Error('La réservation doit être terminée ou annulée pour libérer la voiture');
    }

    // Car is automatically available when no active bookings exist
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
    const bookings = await prisma.booking.findMany({
      where: {
        car_id: carId,
        date_debut: { lte: endDate },
        date_fin: { gte: startDate },
        status: {
          name: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] }
        }
      },
      include: { status: true }
    });

    const maintenance = await prisma.maintenance.findMany({
      where: {
        car_id: carId,
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
