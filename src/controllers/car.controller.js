const prisma = require('../config/prisma');
const availabilityService = require('../services/availability.service');
const { resolveDateParams, normalizeDatetime, isOutsideBusinessHoursTZ } = require('../utils/datetime.utils');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');
const { calculateRentalDays } = require('../utils/validation.util');
 

// Get all cars with filters and pagination
const getCars = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    marque,
    prix_min,
    prix_max,
    date_debut,
    date_fin,
    category_id,
    transmission
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause
  const where = {
    statut: 'DISPONIBLE'
  };

  if (marque) {
    where.brand = {
      name: {
        contains: marque,
        mode: 'insensitive'
      }
    };
  }

  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  if (transmission) {
    where.transmission = transmission;
  }

  if (prix_min || prix_max) {
    where.prix_par_jour = {};
    if (prix_min) where.prix_par_jour.gte = parseFloat(prix_min);
    if (prix_max) where.prix_par_jour.lte = parseFloat(prix_max);
  }

  // Check availability for specific dates via centralized service
  let availableCarIds = null;
  if (date_debut && date_fin) {
    const availableCars = await availabilityService.getAvailableCars({
      date_debut,
      date_fin,
      category_id,
      brand_id: undefined,
      transmission,
      min_price: prix_min,
      max_price: prix_max
    });
    availableCarIds = availableCars.map(c => c.id);
  }

  // Get cars with relations
  const [cars, total] = await Promise.all([
    prisma.car.findMany({
      where: availableCarIds ? { ...where, id: { in: availableCarIds } } : where,
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
        images: { select: { image_url: true, is_primary: true } }
      },
      orderBy: { date_creation: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.car.count({ where: availableCarIds ? { ...where, id: { in: availableCarIds } } : where })
  ]);

  // Calculate rental price if dates provided
  const carsWithPricing = cars.map(car => {
    let totalPrice = null;
    let dailyPrice = car.prix_par_jour;

    if (date_debut && date_fin) {
      const days = calculateRentalDays(date_debut, date_fin);
      totalPrice = dailyPrice * days;

      // Apply loyalty discount if user is authenticated
      if (req.user && req.user.loyaltyAccount) {
        const discountPercent = req.user.loyaltyAccount.tier.discount_percent || 0;
        const discount = (totalPrice * discountPercent) / 100;
        totalPrice = totalPrice - discount;
      }
    }

    return {
      ...car,
      pricing: {
        daily_price: dailyPrice,
        total_price: totalPrice,
        rental_days: date_debut && date_fin ? calculateRentalDays(date_debut, date_fin) : null
      }
    };
  });

  res.json({
    success: true,
    data: {
      cars: carsWithPricing,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        marque,
        prix_min,
        prix_max,
        date_debut,
        date_fin
      }
    }
  });
});

// Search cars with advanced filters
const searchCars = asyncHandler(async (req, res) => {
  const {
    q,
    date_debut,
    date_fin,
    prix_max,
    places_min
  } = req.query;

  const where = {
    statut: 'DISPONIBLE'
  };

  // Text search
  if (q) {
    where.OR = [
      {
        brand: {
          name: {
            contains: q,
            mode: 'insensitive'
          }
        }
      },
      {
        modele: {
          contains: q,
          mode: 'insensitive'
        }
      },
      {
        category: {
          name: {
            contains: q,
            mode: 'insensitive'
          }
        }
      }
    ];
  }

  // Price filter
  if (prix_max) {
    where.prix_par_jour = {
      lte: parseFloat(prix_max)
    };
  }

  // Capacity filter
  if (places_min) {
    where.nombre_places = {
      gte: parseInt(places_min)
    };
  }

  // Availability check via centralized service
  if (date_debut && date_fin) {
    const availableCars = await availabilityService.getAvailableCars({
      date_debut,
      date_fin,
      category_id: undefined,
      brand_id: undefined,
      transmission: undefined,
      min_price: undefined,
      max_price: prix_max,
      min_seats: places_min ? parseInt(places_min) : undefined
    });
    where.id = { in: availableCars.map(c => c.id) };
  }

  const cars = await prisma.car.findMany({
    where,
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
      images: { select: { image_url: true, is_primary: true } }
    },
    orderBy: { prix_par_jour: 'asc' },
    take: 20
  });

  res.json({
    success: true,
    data: {
      cars,
      count: cars.length
    }
  });
});

// Get car by ID
const getCarById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const car = await prisma.car.findUnique({
    where: { id: parseInt(id) },
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
      images: { select: { image_url: true, is_primary: true } }
    }
  });

  if (!car) {
    throw new AppError('Voiture non trouvée', 404, 'CAR_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { car }
  });
});

// Check car availability
const checkAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dateDebut, dateFin } = resolveDateParams(req.query);

  if (!dateDebut || !dateFin) {
    throw new AppError('Dates de début et fin requises', 400, 'MISSING_DATES');
  }
  const startISO = normalizeDatetime(dateDebut, true);
  const endISO = normalizeDatetime(dateFin, false);
  if (!startISO || !endISO) {
    throw new AppError('Dates invalides', 400, 'INVALID_DATES');
  }
  const startHadTime = typeof dateDebut === 'string' && (dateDebut.includes('T') || /\d{2}:\d{2}/.test(dateDebut));
  const endHadTime = typeof dateFin === 'string' && (dateFin.includes('T') || /\d{2}:\d{2}/.test(dateFin));
  if ((startHadTime && isOutsideBusinessHoursTZ(startISO)) || (endHadTime && isOutsideBusinessHoursTZ(endISO))) {
    throw new AppError('Heures invalides (09:00–17:00)', 400, 'INVALID_HOURS');
  }

  const car = await prisma.car.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      statut: true
    }
  });

  if (!car) {
    throw new AppError('Voiture non trouvée', 404, 'CAR_NOT_FOUND');
  }

  if (car.statut !== 'DISPONIBLE') {
    return res.json({
      success: true,
      data: {
        available: false,
        reason: 'Voiture indisponible'
      }
    });
  }

  // Check for conflicting bookings
  // Available if any variant has no conflicting booking
  const variants = await prisma.varianteCar.findMany({
    where: { car_id: parseInt(id) },
    select: { id: true }
  });
  let available = false;
  for (const v of variants) {
    const conflict = await prisma.booking.findFirst({
      where: {
        variante_car_id: v.id,
        AND: [
          { date_debut: { lte: new Date(endISO) } },
          { date_fin: { gte: new Date(startISO) } },
          { status: { name: { notIn: ['ANNULE', 'TERMINE'] } } }
        ]
      }
    });
    if (!conflict) { available = true; break; }
  }

  res.json({
    success: true,
    data: {
      available,
      reason: available ? null : 'Voiture déjà réservée pour ces dates'
    }
  });
});

// Get available cars by time interval (via centralized availability service)
const getAvailableCars = asyncHandler(async (req, res) => {
  try {
    const { dateDebut, dateFin } = resolveDateParams(req.query);
    if (!dateDebut || !dateFin) {
      const validationErrors = [];
      validationErrors.push({ field: 'date_debut', message: 'date_debut is required' });
      validationErrors.push({ field: 'date_fin', message: 'date_fin is required' });
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validationErrors,
        received: req.query
      });
    }
    const startISO = normalizeDatetime(dateDebut, true);
    const endISO = normalizeDatetime(dateFin, false);
    const startHadTime = typeof dateDebut === 'string' && (dateDebut.includes('T') || /\d{2}:\d{2}/.test(dateDebut));
    const endHadTime = typeof dateFin === 'string' && (dateFin.includes('T') || /\d{2}:\d{2}/.test(dateFin));
    if ((startHadTime && isOutsideBusinessHoursTZ(startISO)) || (endHadTime && isOutsideBusinessHoursTZ(endISO))) {
      return res.status(400).json({
        success: false,
        message: 'Heures invalides',
        errors: [{ field: 'date', message: 'Doit être entre 09:00 et 17:00' }]
      });
    }
    const q = req.query;
    delete q.location;
    const fuel = q.fuel || q.fuel_type;
    const seats = q.seats;
    const cars = await availabilityService.getAvailableCars({
      date_debut: startISO,
      date_fin: endISO,
      category_id: q.category_id,
      brand_id: q.brand_id,
      transmission: q.transmission,
      min_price: q.min_price,
      max_price: q.max_price,
      seats,
      fuel
    });
    res.json({ success: true, data: { cars, total: cars.length } });
  } catch (err) {
    console.error('[GET /api/cars/available] Unexpected error:', err?.message);
    return res.status(500).json({ success: false, error: 'Server error', message: err?.message });
  }
});

// Create new car (Admin only)
const createCar = asyncHandler(async (req, res) => {
  const {
    brand_id,
    category_id,
    modele,
    transmission,
    nombre_places,
    nombre_portes,
    prix_par_jour,
    statut
  } = req.body;

  const car = await prisma.car.create({
    data: {
      brand_id: parseInt(brand_id),
      category_id: parseInt(category_id),
      modele,
      transmission,
      nombre_places: nombre_places ? parseInt(nombre_places) : null,
      nombre_portes: nombre_portes ? parseInt(nombre_portes) : null,
      prix_par_jour: parseFloat(prix_par_jour),
      statut: statut || 'DISPONIBLE'
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
      statut: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Voiture créée avec succès',
    data: { car }
  });
});

// Update car (Admin only)
const updateCar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Convert string numbers to integers/floats
  if (updateData.brand_id) updateData.brand_id = parseInt(updateData.brand_id);
  if (updateData.category_id) updateData.category_id = parseInt(updateData.category_id);
  if (updateData.nombre_places) updateData.nombre_places = parseInt(updateData.nombre_places);
  if (updateData.nombre_portes) updateData.nombre_portes = parseInt(updateData.nombre_portes);
  if (updateData.prix_par_jour) updateData.prix_par_jour = parseFloat(updateData.prix_par_jour);

  const car = await prisma.car.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      brand_id: true,
      category_id: true,
      modele: true,
      transmission: true,
      nombre_places: true,
      nombre_portes: true,
      prix_par_jour: true,
      statut: true
    }
  });

  res.json({
    success: true,
    message: 'Voiture mise à jour avec succès',
    data: { car }
  });
});

// Delete car (Admin only)
const deleteCar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if car has active bookings via variants
  const activeBookings = await prisma.booking.count({
    where: {
      varianteCar: {
        car_id: parseInt(id)
      },
      status: {
        name: {
          notIn: ['ANNULE', 'TERMINE']
        }
      }
    }
  });

  if (activeBookings > 0) {
    throw new AppError('Impossible de supprimer une voiture avec des réservations actives', 400, 'CAR_HAS_BOOKINGS');
  }

  await prisma.car.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Voiture supprimée avec succès'
  });
});

// Get all brands
const getBrands = asyncHandler(async (req, res) => {
  const brands = await prisma.carBrand.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  res.json({
    success: true,
    data: { brands }
  });
});

// Create brand (Admin only)
const createBrand = asyncHandler(async (req, res) => {
  const { name, logo_url } = req.body;

  const brand = await prisma.carBrand.create({
    data: {
      name,
      logo_url
    }
  });

  res.status(201).json({
    success: true,
    message: 'Marque créée avec succès',
    data: { brand }
  });
});

// Update brand (Admin only)
const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, logo_url } = req.body;

  const brand = await prisma.carBrand.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(logo_url && { logo_url })
    }
  });

  res.json({
    success: true,
    message: 'Marque mise à jour avec succès',
    data: { brand }
  });
});

// Delete brand (Admin only)
const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if brand has cars
  const carsCount = await prisma.car.count({
    where: { brand_id: parseInt(id) }
  });

  if (carsCount > 0) {
    throw new AppError('Impossible de supprimer une marque avec des voitures associées', 400, 'BRAND_HAS_CARS');
  }

  await prisma.carBrand.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Marque supprimée avec succès'
  });
});

// Get all categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.carCategory.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  res.json({
    success: true,
    data: { categories }
  });
});

// Create category (Admin only)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const category = await prisma.carCategory.create({
    data: {
      name,
      description
    }
  });

  res.status(201).json({
    success: true,
    message: 'Catégorie créée avec succès',
    data: { category }
  });
});

// Update category (Admin only)
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = await prisma.carCategory.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(description && { description })
    }
  });

  res.json({
    success: true,
    message: 'Catégorie mise à jour avec succès',
    data: { category }
  });
});

// Delete category (Admin only)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category has cars
  const carsCount = await prisma.car.count({
    where: { category_id: parseInt(id) }
  });

  if (carsCount > 0) {
    throw new AppError('Impossible de supprimer une catégorie avec des voitures associées', 400, 'CATEGORY_HAS_CARS');
  }

  await prisma.carCategory.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Catégorie supprimée avec succès'
  });
});

// Upload car images (Admin only)
const uploadCarImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { images } = req.body; // Array of image objects with url and alt_text

  if (!images || !Array.isArray(images)) {
    throw new AppError('Images requises', 400, 'MISSING_IMAGES');
  }

  const car = await prisma.car.findUnique({
    where: { id: parseInt(id) }
  });

  if (!car) {
    throw new AppError('Voiture non trouvée', 404, 'CAR_NOT_FOUND');
  }

  // Create image records
  const createdImages = await Promise.all(
    images.map((image, index) =>
      prisma.carImage.create({
        data: {
          car_id: parseInt(id),
          image_url: image.url,
          alt_text: image.alt_text || `${car.brand} ${car.modele}`,
          is_primary: index === 0 // First image is primary
        }
      })
    )
  );

  res.status(201).json({
    success: true,
    message: 'Images ajoutées avec succès',
    data: { images: createdImages }
  });
});

// Delete car image (Admin only)
const deleteCarImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  await prisma.carImage.delete({
    where: {
      id: parseInt(imageId),
      car_id: parseInt(id)
    }
  });

  res.json({
    success: true,
    message: 'Image supprimée avec succès'
  });
});

module.exports = {
  getCars,
  searchCars,
  getCarById,
  checkAvailability,
  getAvailableCars,
  createCar,
  updateCar,
  deleteCar,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCarImages,
  deleteCarImage
};
