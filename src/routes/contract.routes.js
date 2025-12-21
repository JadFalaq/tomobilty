const express = require('express');
const contractController = require('../controllers/contract.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validateId } = require('../middlewares/validation.middleware');

const router = express.Router();

// Protected routes (User must be authenticated)
router.get('/booking/:bookingId', verifyToken, validateId, contractController.getContractByBooking);
router.post('/booking/:bookingId/generate', verifyToken, validateId, contractController.generateContract);
router.get('/:id/download', verifyToken, validateId, contractController.downloadContract);

// Admin routes
router.get('/', verifyToken, requireAdmin, contractController.getAllContracts);
router.get('/templates', verifyToken, requireAdmin, contractController.getContractTemplates);
router.post('/templates', verifyToken, requireAdmin, contractController.createContractTemplate);
router.put('/templates/:id', verifyToken, requireAdmin, validateId, contractController.updateContractTemplate);
router.delete('/templates/:id', verifyToken, requireAdmin, validateId, contractController.deleteContractTemplate);

module.exports = router;
