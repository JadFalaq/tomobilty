const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['user_id', 'car_id', 'date_debut', 'date_fin', 'lieu_prise_en_charge', 'lieu_retour', 'prix_total', 'caution_payee', 'status_id', 'mode_paiement', 'paiement_effectue', 'montant_paye'];

const listBookings = asyncHandler(async (req, res) => {
  const { page, pageSize, search, user_id, car_id, status_id, paiement_effectue, date_from, date_to, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (car_id) filters.car_id = parseInt(car_id);
  if (status_id) filters.status_id = parseInt(status_id);
  if (paiement_effectue !== undefined) filters.paiement_effectue = paiement_effectue === 'true';
  if (date_from || date_to) {
    filters.date_debut = {};
    if (date_from) filters.date_debut.gte = new Date(date_from);
    if (date_to) filters.date_debut.lte = new Date(date_to);
  }

  const result = await listEntities('booking', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'date_creation',
    sortOrder: sortOrder || 'desc',
    include: {
      user: { select: { nom: true, prenom: true, email: true } },
      car: { include: { brand: true } },
      status: true,
      payments: true,
      invoices: true,
      rentalContract: true,
      _count: { select: { additionalDrivers: true } }
    }
  });

  res.json({ success: true, data: result });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await getEntityById('booking', req.params.id, {
    user: true,
    car: { include: { brand: true, category: true } },
    status: true,
    payments: true,
    invoices: true,
    additionalDrivers: true,
    rentalContract: { include: { template: true } },
    loyaltyTransactions: true
  });

  res.json({ success: true, data: booking });
});

const createBooking = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['user_id', 'car_id', 'date_debut', 'date_fin', 'prix_total']);
  
  const data = whitelistFields(req.body, allowedFields);
  
  // Convert numeric fields
  if (data.user_id) data.user_id = parseInt(data.user_id);
  if (data.car_id) data.car_id = parseInt(data.car_id);
  if (data.status_id) data.status_id = parseInt(data.status_id);

  const booking = await createEntity('booking', data);
  
  res.status(201).json({ success: true, data: booking });
});

const updateBooking = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  // Convert numeric fields
  if (data.user_id) data.user_id = parseInt(data.user_id);
  if (data.car_id) data.car_id = parseInt(data.car_id);
  if (data.status_id) data.status_id = parseInt(data.status_id);
  
  const booking = await updateEntity('booking', req.params.id, data);
  
  res.json({ success: true, data: booking });
});

const deleteBooking = asyncHandler(async (req, res) => {
  await deleteEntity('booking', req.params.id);
  
  res.json({ success: true, message: 'Booking deleted successfully' });
});

module.exports = {
  listBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
};
