const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { buildAvailabilityWhereClause } = require('../../utils/booking.utils');
const { listEntities, getEntityById, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');
const prisma = require('../../config/prisma');

const allowedFields = ['brand_id', 'category_id', 'modele', 'transmission', 'prix_par_jour', 'statut'];

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
      statut: true
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
    'category_id',
    'modele',
    'prix_par_jour',
    'immatriculation',
    'type_carburant',
    'ville'
  ]);

  const {
    brand_id,
    category_id,
    modele,
    transmission,
    prix_par_jour,
    statut,
    immatriculation,
    couleur,
    type_carburant,
    description,
    ville
  } = req.body;

  const brandId = parseInt(brand_id);
  const categoryId = parseInt(category_id);
  const dailyPrice = parseFloat(prix_par_jour);

  const result = await prisma.$transaction(async (tx) => {
    let car = await tx.car.findFirst({
      where: {
        brand_id: brandId,
        modele
      }
    });

    if (!car) {
      car = await tx.car.create({
        data: {
          brand_id: brandId,
          category_id: categoryId,
          modele,
          transmission: transmission || null,
          prix_par_jour: dailyPrice,
          statut: statut || 'DISPONIBLE'
        }
      });
    }

    const variante = await tx.varianteCar.create({
      data: {
        car_id: car.id,
        immatriculation,
        couleur: couleur || null,
        type_carburant,
        description: description || null,
        ville
      }
    });

    return { car, variante };
  });

  res.status(201).json({ success: true, data: result });
});

const updateCar = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  // Convert numeric fields
  if (data.brand_id) data.brand_id = parseInt(data.brand_id);
  if (data.category_id) data.category_id = parseInt(data.category_id);
  // removed: annee
  
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
