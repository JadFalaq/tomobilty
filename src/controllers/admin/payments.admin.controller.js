const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['booking_id', 'user_id', 'amount', 'currency', 'status', 'provider', 'provider_session_id', 'provider_payment_id', 'metadata'];

const listPayments = asyncHandler(async (req, res) => {
  const { page, pageSize, user_id, booking_id, status, provider, date_from, date_to, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (booking_id) filters.booking_id = parseInt(booking_id);
  if (status) filters.status = status;
  if (provider) filters.provider = provider;
  if (date_from || date_to) {
    filters.created_at = {};
    if (date_from) filters.created_at.gte = new Date(date_from);
    if (date_to) filters.created_at.lte = new Date(date_to);
  }

  const result = await listEntities('payment', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      user: { select: { nom: true, prenom: true, email: true } },
      booking: { include: { car: true } },
      invoices: true
    }
  });

  res.json({ success: true, data: result });
});

const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await getEntityById('payment', req.params.id, {
    user: true,
    booking: { include: { car: true, user: true } },
    invoices: true
  });

  res.json({ success: true, data: payment });
});

const createPayment = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['booking_id', 'user_id', 'amount']);
  
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.booking_id) data.booking_id = parseInt(data.booking_id);
  if (data.user_id) data.user_id = parseInt(data.user_id);

  const payment = await createEntity('payment', data);
  
  res.status(201).json({ success: true, data: payment });
});

const updatePayment = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.booking_id) data.booking_id = parseInt(data.booking_id);
  if (data.user_id) data.user_id = parseInt(data.user_id);
  
  const payment = await updateEntity('payment', req.params.id, data);
  
  res.json({ success: true, data: payment });
});

const deletePayment = asyncHandler(async (req, res) => {
  await deleteEntity('payment', req.params.id);
  
  res.json({ success: true, message: 'Payment deleted successfully' });
});

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};
