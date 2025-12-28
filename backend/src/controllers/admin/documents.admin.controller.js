const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['user_id', 'booking_id', 'filename', 'original_filename', 'file_path', 'file_type', 'file_size', 'ocr_content', 'ocr_confidence', 'document_type', 'status', 'metadata'];

const listDocuments = asyncHandler(async (req, res) => {
  const { page, pageSize, user_id, booking_id, status, document_type, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (booking_id) filters.booking_id = parseInt(booking_id);
  if (status) filters.status = status;
  if (document_type) filters.document_type = document_type;

  const result = await listEntities('document', {
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

const getDocumentById = asyncHandler(async (req, res) => {
  const document = await getEntityById('document', req.params.id, {
    user: true
  });

  res.json({ success: true, data: document });
});

const createDocument = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.user_id) data.user_id = parseInt(data.user_id);
  if (data.booking_id) data.booking_id = parseInt(data.booking_id);
  if (data.file_size) data.file_size = parseInt(data.file_size);

  const document = await createEntity('document', data);
  
  res.status(201).json({ success: true, data: document });
});

const updateDocument = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  if (data.user_id) data.user_id = parseInt(data.user_id);
  if (data.booking_id) data.booking_id = parseInt(data.booking_id);
  if (data.file_size) data.file_size = parseInt(data.file_size);
  
  const document = await updateEntity('document', req.params.id, data);
  
  res.json({ success: true, data: document });
});

const deleteDocument = asyncHandler(async (req, res) => {
  await deleteEntity('document', req.params.id);
  
  res.json({ success: true, message: 'Document deleted successfully' });
});

module.exports = {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
};
