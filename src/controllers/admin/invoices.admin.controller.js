const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['user_id', 'booking_id', 'payment_id', 'invoice_number', 'amount', 'currency', 'status', 'pdf_path', 'metadata'];

const listInvoices = asyncHandler(async (req, res) => {
  const { page, pageSize, user_id, booking_id, status, date_from, date_to, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (booking_id) filters.booking_id = parseInt(booking_id);
  if (status) filters.status = status;
  if (date_from || date_to) {
    filters.created_at = {};
    if (date_from) filters.created_at.gte = new Date(date_from);
    if (date_to) filters.created_at.lte = new Date(date_to);
  }

  const result = await listEntities('invoice', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      user: { select: { nom: true, prenom: true, email: true } },
      booking: { include: { car: true } },
      payment: true
    }
  });

  res.json({ success: true, data: result });
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await getEntityById('invoice', req.params.id, {
    user: true,
    booking: { include: { car: true } },
    payment: true
  });

  res.json({ success: true, data: invoice });
});

const createInvoice = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['user_id', 'booking_id', 'invoice_number', 'amount']);
  
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.user_id) data.user_id = parseInt(data.user_id);
  if (data.booking_id) data.booking_id = parseInt(data.booking_id);
  if (data.payment_id) data.payment_id = parseInt(data.payment_id);

  const invoice = await createEntity('invoice', data);
  
  res.status(201).json({ success: true, data: invoice });
});

const updateInvoice = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.user_id) data.user_id = parseInt(data.user_id);
  if (data.booking_id) data.booking_id = parseInt(data.booking_id);
  if (data.payment_id) data.payment_id = parseInt(data.payment_id);
  
  const invoice = await updateEntity('invoice', req.params.id, data);
  
  res.json({ success: true, data: invoice });
});

const deleteInvoice = asyncHandler(async (req, res) => {
  await deleteEntity('invoice', req.params.id);
  
  res.json({ success: true, message: 'Invoice deleted successfully' });
});

module.exports = {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
