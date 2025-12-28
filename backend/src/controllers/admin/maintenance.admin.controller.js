const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['car_id', 'maintenance_type', 'description', 'cost', 'scheduled_date', 'completed_date', 'status'];

const listMaintenance = asyncHandler(async (req, res) => {
  const { page, pageSize, car_id, maintenance_type, status, date_from, date_to, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (car_id) filters.car_id = parseInt(car_id);
  if (maintenance_type) filters.maintenance_type = maintenance_type;
  if (status) filters.status = status;
  if (date_from || date_to) {
    filters.scheduled_date = {};
    if (date_from) filters.scheduled_date.gte = new Date(date_from);
    if (date_to) filters.scheduled_date.lte = new Date(date_to);
  }

  const result = await listEntities('maintenance', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'scheduled_date',
    sortOrder: sortOrder || 'desc',
    include: {
      car: { include: { brand: true } }
    }
  });

  res.json({ success: true, data: result });
});

const getMaintenanceById = asyncHandler(async (req, res) => {
  const maintenance = await getEntityById('maintenance', req.params.id, {
    car: { include: { brand: true, category: true } }
  });

  res.json({ success: true, data: maintenance });
});

const createMaintenance = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['car_id', 'maintenance_type', 'description', 'scheduled_date']);
  
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.car_id) data.car_id = parseInt(data.car_id);

  const maintenance = await createEntity('maintenance', data);
  
  res.status(201).json({ success: true, data: maintenance });
});

const updateMaintenance = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.car_id) data.car_id = parseInt(data.car_id);
  
  const maintenance = await updateEntity('maintenance', req.params.id, data);
  
  res.json({ success: true, data: maintenance });
});

const deleteMaintenance = asyncHandler(async (req, res) => {
  await deleteEntity('maintenance', req.params.id);
  
  res.json({ success: true, message: 'Maintenance deleted successfully' });
});

module.exports = {
  listMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance
};
