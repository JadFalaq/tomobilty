const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

// Chat Conversations
const listChatConversations = asyncHandler(async (req, res) => {
  const { page, pageSize, user_id, status, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (status) filters.status = status;

  const result = await listEntities('chatConversation', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'updated_at',
    sortOrder: sortOrder || 'desc',
    include: {
      user: { select: { nom: true, prenom: true, email: true } },
      _count: { select: { messages: true } }
    }
  });

  res.json({ success: true, data: result });
});

const getChatConversationById = asyncHandler(async (req, res) => {
  const conversation = await getEntityById('chatConversation', req.params.id, {
    user: true,
    messages: { orderBy: { created_at: 'asc' } }
  });

  res.json({ success: true, data: conversation });
});

const updateChatConversation = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['status']);
  
  const conversation = await updateEntity('chatConversation', req.params.id, data);
  
  res.json({ success: true, data: conversation });
});

const deleteChatConversation = asyncHandler(async (req, res) => {
  await deleteEntity('chatConversation', req.params.id);
  
  res.json({ success: true, message: 'Chat conversation deleted successfully' });
});

// Chat Messages
const listChatMessages = asyncHandler(async (req, res) => {
  const { page, pageSize, conversation_id, sender, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (conversation_id) filters.conversation_id = parseInt(conversation_id);
  if (sender) filters.sender = sender;

  const result = await listEntities('chatMessage', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      conversation: { include: { user: { select: { nom: true, prenom: true, email: true } } } }
    }
  });

  res.json({ success: true, data: result });
});

const deleteChatMessage = asyncHandler(async (req, res) => {
  await deleteEntity('chatMessage', req.params.id);
  
  res.json({ success: true, message: 'Chat message deleted successfully' });
});

module.exports = {
  listChatConversations,
  getChatConversationById,
  updateChatConversation,
  deleteChatConversation,
  listChatMessages,
  deleteChatMessage
};
