const prisma = require('../config/prisma');
const availabilityService = require('../services/availability.service');
const { resolveDateParams, normalizeDatetime, isOutsideBusinessHoursTZ } = require('../utils/datetime.utils');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');
const { calculateRentalDays } = require('../utils/validation.util');
 
const mapPublicCar = (car) => ({
  ...car,
  statut: 'DISPONIBLE',
  display_variant: car?.transmission || 'STANDARD',
  display_name: [car?.brand?.name, car?.modele, car?.transmission].filter(Boolean).join(' ')
});


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
  const where = {};

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

  // Get cars with relations
  const [cars, total] = await Promise.all([
    prisma.car.findMany({
      where,
      select: {
        id: true,
        brand_id: true,
        category_id: true,
        modele: true,
        transmission: true,
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
    prisma.car.count({ where })
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

    return mapPublicCar({
      ...car,
      pricing: {
        daily_price: dailyPrice,
        total_price: totalPrice,
        rental_days: date_debut && date_fin ? calculateRentalDays(date_debut, date_fin) : null
      }
    });
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

// Get least demanded cars based on bookings count (excluding cancelled)
const getLeastDemandedCars = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 6
  } = req.query;

  // Fetch cars with variants and bookings to compute demand count
  const cars = await prisma.car.findMany({
    where: {},
    select: {
      id: true,
      brand_id: true,
      category_id: true,
      modele: true,
      transmission: true,
      prix_par_jour: true,
      statut: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { select: { image_url: true, is_primary: true } },
      variantes: {
        select: {
          id: true,
          bookings: {
            where: {
              status_name: { not: 'ANNULE' }
            },
            select: { id: true }
          }
        }
      }
    }
  });

  const carsWithDemand = cars.map(car => {
    const demand_count = (car.variantes || []).reduce((acc, v) => acc + (v.bookings?.length || 0), 0);
    const { variantes, ...rest } = car;
    return mapPublicCar({ ...rest, demand_count });
  });

  // Sort ascending by demand_count to surface least demanded first
  carsWithDemand.sort((a, b) => a.demand_count - b.demand_count || a.id - b.id);

  const total = carsWithDemand.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const start = (p - 1) * l;
  const paginated = carsWithDemand.slice(start, start + l);

  res.set('Cache-Control', 'no-store');
  res.json({
    success: true,
    data: {
      cars: paginated,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l)
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
    prix_max
  } = req.query;

  const where = {};

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

  const cars = await prisma.car.findMany({
    where,
    select: {
      id: true,
      brand_id: true,
      category_id: true,
      modele: true,
      transmission: true,
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
      cars: cars.map(mapPublicCar),
      count: cars.length
    }
  });
});

// Get car by ID
const getCarById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dateDebut, dateFin } = resolveDateParams(req.query);
  const hasDates = Boolean(dateDebut && dateFin);
  const startDate = hasDates ? new Date(dateDebut) : null;
  const endDate = hasDates ? new Date(dateFin) : null;

  const car = await prisma.car.findUnique({
    where: { id: parseInt(id) },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { select: { image_url: true, is_primary: true } },
      variantes: {
        include: {
          bookings: {
            where: hasDates
              ? {
                  AND: [
                    { date_debut: { lte: endDate } },
                    { date_fin: { gte: startDate } }
                  ],
                  status_name: { in: ['EN_ATTENTE', 'EN_COURS'] }
                }
              : {
                  status_name: { in: ['EN_ATTENTE', 'EN_COURS'] }
                },
            select: { id: true, date_debut: true, date_fin: true, status_name: true }
          }
        }
      }
    }
  });

  if (!car) {
    throw new AppError('Voiture non trouvée', 404, 'CAR_NOT_FOUND');
  }

  const variantsWithAvailability = (car.variantes || []).map(variant => {
    const overlappingBookings = variant.bookings || [];
    const available = overlappingBookings.length === 0;
    const { bookings, ...rest } = variant;
    return { ...rest, available };
  });
  const carAvailable = variantsWithAvailability.some(v => v.available === true);

  const {
    id: carId,
    brand_id,
    category_id,
    modele,
    transmission,
    prix_par_jour,
    statut,
    brand,
    category,
    images
  } = car;

  res.json({
    success: true,
    data: {
      car: {
        id: carId,
        brand_id,
        category_id,
        modele,
        transmission,
        prix_par_jour,
        statut: 'DISPONIBLE',
        brand,
        category,
        images,
        variantes: variantsWithAvailability.map((variant) => ({ ...variant, available: true })),
        carAvailable: true,
        query_range: hasDates
          ? { date_debut: new Date(dateDebut).toISOString(), date_fin: new Date(dateFin).toISOString() }
          : null
      }
    }
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

  res.json({
    success: true,
    data: {
      available: true,
      reason: null
    }
  });
});

// Get available cars by time interval (via centralized availability service)
const getAvailableCars = asyncHandler(async (req, res) => {
  try {
    const q = req.query;
    delete q.location;
    const where = {};

    if (q.category_id) {
      where.category_id = parseInt(q.category_id);
    }
    if (q.brand_id) {
      where.brand_id = parseInt(q.brand_id);
    }
    if (q.transmission) {
      where.transmission = q.transmission;
    }
    if (q.min_price || q.max_price) {
      where.prix_par_jour = {};
      if (q.min_price) where.prix_par_jour.gte = parseFloat(q.min_price);
      if (q.max_price) where.prix_par_jour.lte = parseFloat(q.max_price);
    }

    const cars = await prisma.car.findMany({
      where,
      select: {
        id: true,
        brand_id: true,
        category_id: true,
        modele: true,
        transmission: true,
        prix_par_jour: true,
        statut: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { select: { image_url: true, is_primary: true } }
      },
      orderBy: { date_creation: 'desc' }
    });

    res.json({ success: true, data: { cars: cars.map(mapPublicCar), total: cars.length } });
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
    prix_par_jour,
    statut
  } = req.body;

  const car = await prisma.car.create({
    data: {
      brand_id: parseInt(brand_id),
      category_id: parseInt(category_id),
      modele,
      transmission,
      prix_par_jour: parseFloat(prix_par_jour),
      statut: statut || 'DISPONIBLE'
    },
    select: {
      id: true,
      brand_id: true,
      category_id: true,
      modele: true,
      transmission: true,
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
  getLeastDemandedCars,
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
