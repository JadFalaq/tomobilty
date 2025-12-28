const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['name', 'description', 'discount', 'start_date', 'end_date', 'is_active'];

const listPromotions = asyncHandler(async (req, res) => {
  const { page, pageSize, search, is_active, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const result = await listEntities('promotion', {
    page,
    pageSize,
    search,
    searchFields: ['name', 'description'],
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      categories: { include: { category: true } }
    }
  });

  res.json({ success: true, data: result });
});

const getPromotionById = asyncHandler(async (req, res) => {
  const promotion = await getEntityById('promotion', req.params.id, {
    categories: { include: { category: true } }
  });

  res.json({ success: true, data: promotion });
});

const createPromotion = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name', 'discount', 'start_date', 'end_date']);
  
  const data = whitelistFields(req.body, allowedFields);

  const promotion = await createEntity('promotion', data);
  
  res.status(201).json({ success: true, data: promotion });
});

const updatePromotion = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  const promotion = await updateEntity('promotion', req.params.id, data);
  
  res.json({ success: true, data: promotion });
});

const deletePromotion = asyncHandler(async (req, res) => {
  await deleteEntity('promotion', req.params.id);
  
  res.json({ success: true, message: 'Promotion deleted successfully' });
});

module.exports = {
  listPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion
};
