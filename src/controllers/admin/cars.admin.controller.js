const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['brand_id', 'category_id', 'modele', 'annee', 'immatriculation', 'couleur', 'type_carburant', 'transmission', 'nombre_places', 'nombre_portes', 'climatisation', 'gps', 'prix_par_jour', 'caution', 'kilometrage', 'statut', 'agence_nom', 'agence_ville', 'agence_adresse', 'agence_telephone', 'caracteristiques', 'description', 'ville', 'disponible'];

const listCars = asyncHandler(async (req, res) => {
  const { page, pageSize, search, brand_id, category_id, statut, disponible, ville, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (brand_id) filters.brand_id = parseInt(brand_id);
  if (category_id) filters.category_id = parseInt(category_id);
  if (statut) filters.statut = statut;
  if (disponible !== undefined) filters.disponible = disponible === 'true';
  if (ville) filters.ville = { contains: ville, mode: 'insensitive' };

  const result = await listEntities('car', {
    page,
    pageSize,
    search,
    searchFields: ['modele', 'immatriculation', 'ville'],
    filters,
    sortBy: sortBy || 'date_creation',
    sortOrder: sortOrder || 'desc',
    include: {
      brand: true,
      category: true,
      images: true,
      _count: { select: { bookings: true, maintenance: true } }
    }
  });

  res.json({ success: true, data: result });
});

const getCarById = asyncHandler(async (req, res) => {
  const car = await getEntityById('car', req.params.id, {
    brand: true,
    category: true,
    images: true,
    bookings: { include: { user: true, status: true } },
    maintenance: true
  });

  res.json({ success: true, data: car });
});

const createCar = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['brand_id', 'category_id', 'modele', 'annee', 'immatriculation', 'prix_par_jour', 'ville', 'type_carburant']);
  
  const data = whitelistFields(req.body, allowedFields);
  
  // Convert numeric fields
  if (data.brand_id) data.brand_id = parseInt(data.brand_id);
  if (data.category_id) data.category_id = parseInt(data.category_id);
  if (data.annee) data.annee = parseInt(data.annee);

  const car = await createEntity('car', data);
  
  res.status(201).json({ success: true, data: car });
});

const updateCar = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  // Convert numeric fields
  if (data.brand_id) data.brand_id = parseInt(data.brand_id);
  if (data.category_id) data.category_id = parseInt(data.category_id);
  if (data.annee) data.annee = parseInt(data.annee);
  
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
