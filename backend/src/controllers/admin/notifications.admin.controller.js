const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['user_id', 'title', 'message', 'type', 'is_read'];

const listNotifications = asyncHandler(async (req, res) => {
  const { page, pageSize, user_id, type, is_read, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (type) filters.type = type;
  if (is_read !== undefined) filters.is_read = is_read === 'true';

  const result = await listEntities('notification', {
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

const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await getEntityById('notification', req.params.id, {
    user: true
  });

  res.json({ success: true, data: notification });
});

const createNotification = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['user_id', 'title', 'message', 'type']);
  
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.user_id) data.user_id = parseInt(data.user_id);

  const notification = await createEntity('notification', data);
  
  res.status(201).json({ success: true, data: notification });
});

const updateNotification = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.user_id) data.user_id = parseInt(data.user_id);
  
  const notification = await updateEntity('notification', req.params.id, data);
  
  res.json({ success: true, data: notification });
});

const deleteNotification = asyncHandler(async (req, res) => {
  await deleteEntity('notification', req.params.id);
  
  res.json({ success: true, message: 'Notification deleted successfully' });
});

module.exports = {
  listNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification
};
