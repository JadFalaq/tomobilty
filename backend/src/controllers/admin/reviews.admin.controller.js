const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['user_id', 'car_id', 'rating', 'comment', 'is_verified'];

const listReviews = asyncHandler(async (req, res) => {
  const { page, pageSize, user_id, car_id, is_verified, rating_min, rating_max, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (car_id) filters.car_id = parseInt(car_id);
  if (is_verified !== undefined) filters.is_verified = is_verified === 'true';
  if (rating_min || rating_max) {
    filters.rating = {};
    if (rating_min) filters.rating.gte = parseInt(rating_min);
    if (rating_max) filters.rating.lte = parseInt(rating_max);
  }

  const result = await listEntities('review', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      user: { select: { nom: true, prenom: true, email: true } }
    }
  });

  res.json({ success: true, data: result });
});

const getReviewById = asyncHandler(async (req, res) => {
  const review = await getEntityById('review', req.params.id, {
    user: true
  });

  res.json({ success: true, data: review });
});

const createReview = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['user_id', 'rating']);
  
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.user_id) data.user_id = parseInt(data.user_id);
  if (data.car_id) data.car_id = parseInt(data.car_id);
  if (data.rating) data.rating = parseInt(data.rating);

  const review = await createEntity('review', data);
  
  res.status(201).json({ success: true, data: review });
});

const updateReview = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.user_id) data.user_id = parseInt(data.user_id);
  if (data.car_id) data.car_id = parseInt(data.car_id);
  if (data.rating) data.rating = parseInt(data.rating);
  
  const review = await updateEntity('review', req.params.id, data);
  
  res.json({ success: true, data: review });
});

const deleteReview = asyncHandler(async (req, res) => {
  await deleteEntity('review', req.params.id);
  
  res.json({ success: true, message: 'Review deleted successfully' });
});

module.exports = {
  listReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
};
