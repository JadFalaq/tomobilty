const { AppError, asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { buildAvailabilityWhereClause } = require('../../utils/booking.utils');
const { listEntities, getEntityById, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');
const prisma = require('../../config/prisma');

const allowedFields = ['brand_id', 'category_id', 'modele', 'transmission', 'prix_par_jour', 'statut'];

const DEFAULT_VARIANT_CITY = 'Casablanca';
const DEFAULT_VARIANT_FUEL = 'ESSENCE';

const buildGeneratedPlate = (carId) => `AUTO-${carId}-${Date.now().toString().slice(-6)}`;

const resolveCategoryId = async (tx, categoryId, fallbackCategoryId) => {
  if (categoryId) {
    return parseInt(categoryId);
  }

  if (fallbackCategoryId) {
    return fallbackCategoryId;
  }

  const defaultCategory = await tx.carCategory.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true }
  });

  if (!defaultCategory) {
    throw new AppError('Aucune categorie de voiture disponible pour creer cette annonce', 400, 'NO_CAR_CATEGORY_AVAILABLE');
  }

  return defaultCategory.id;
};

const ensureDefaultVariant = async (tx, carId, description) => {
  const existingVariant = await tx.varianteCar.findFirst({
    where: { car_id: carId }
  });

  if (existingVariant) {
    return existingVariant;
  }

  return tx.varianteCar.create({
    data: {
      car_id: carId,
      immatriculation: buildGeneratedPlate(carId),
      type_carburant: DEFAULT_VARIANT_FUEL,
      ville: DEFAULT_VARIANT_CITY,
      description: description || null
    }
  });
};

const listCars = asyncHandler(async (req, res) => {
  const { page, pageSize, search, brand_id, category_id, statut, sortBy, sortOrder, date_debut, date_fin } = req.query;
  
  const filters = {};
  if (brand_id) filters.brand_id = parseInt(brand_id);
  if (category_id) filters.category_id = parseInt(category_id);
  if (statut) filters.statut = statut;
  // removed filters: disponible, ville
  if (date_debut && date_fin) {
    const startDate = new Date(date_debut);
    const endDate = new Date(date_fin);
    Object.assign(filters, buildAvailabilityWhereClause(startDate, endDate));
  }

  const result = await listEntities('car', {
    page,
    pageSize,
    search,
    searchFields: ['modele'],
    filters,
    sortBy: sortBy || 'date_creation',
    sortOrder: sortOrder || 'desc',
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
      images: {
        select: {
          id: true,
          image_url: true,
          alt_text: true,
          is_primary: true
        }
      }
    }
  });

  res.json({ success: true, data: result });
});

const getCarById = asyncHandler(async (req, res) => {
  const car = await getEntityById('car', req.params.id, {
    brand: true,
    category: true,
    images: true
  });

  res.json({ success: true, data: car });
});

const createCar = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, [
    'brand_id',
    'modele',
    'transmission',
    'prix_par_jour',
  ]);

  const {
    brand_id,
    category_id,
    modele,
    transmission,
    prix_par_jour,
    statut,
    description
  } = req.body;

  const brandId = parseInt(brand_id);
  const dailyPrice = parseFloat(prix_par_jour);

  const result = await prisma.$transaction(async (tx) => {
    const existingCar = await tx.car.findFirst({
      where: {
        brand_id: brandId,
        modele
      },
      include: {
        images: true,
        brand: true,
        category: true
      }
    });

    const resolvedCategoryId = await resolveCategoryId(
      tx,
      category_id,
      existingCar?.category_id
    );

    let car;
    if (!existingCar) {
      car = await tx.car.create({
        data: {
          brand_id: brandId,
          category_id: resolvedCategoryId,
          modele,
          transmission,
          prix_par_jour: dailyPrice,
          statut: statut || 'DISPONIBLE'
        },
        include: {
          images: true,
          brand: true,
          category: true
        }
      });
    } else {
      car = await tx.car.update({
        where: { id: existingCar.id },
        data: {
          category_id: resolvedCategoryId,
          transmission,
          prix_par_jour: dailyPrice,
          statut: statut || existingCar.statut
        },
        include: {
          images: true,
          brand: true,
          category: true
        }
      });
    }

    const variante = await ensureDefaultVariant(tx, car.id, description);

    return { car, variante };
  });

  res.status(201).json({ success: true, data: result });
});

const updateCar = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);

  if (data.brand_id) data.brand_id = parseInt(data.brand_id);
  if (data.category_id) data.category_id = parseInt(data.category_id);
  if (data.prix_par_jour) data.prix_par_jour = parseFloat(data.prix_par_jour);

  const currentCar = await prisma.car.findUnique({
    where: { id: parseInt(req.params.id) }
  });

  if (!currentCar) {
    throw new AppError('Voiture non trouvee', 404, 'CAR_NOT_FOUND');
  }

  const nextBrandId = data.brand_id || currentCar.brand_id;
  const nextModel = data.modele || currentCar.modele;

  const duplicate = await prisma.car.findFirst({
    where: {
      brand_id: nextBrandId,
      modele: nextModel,
      NOT: { id: parseInt(req.params.id) }
    }
  });

  if (duplicate) {
    throw new AppError('Une annonce existe deja pour cette marque et ce modele', 409, 'CAR_DUPLICATE_MODEL');
  }

  const car = await updateEntity('car', req.params.id, data);
  
  res.json({ success: true, data: car });
});

const deleteCar = asyncHandler(async (req, res) => {
  await deleteEntity('car', req.params.id);
  
  res.json({ success: true, message: 'Car deleted successfully' });
});

module.exports = {
  listCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar
};
