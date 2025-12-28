const express = require('express');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { auditLog, captureOldValues } = require('../middlewares/audit.middleware');

// Import all admin controllers
const statsController = require('../controllers/admin/stats.admin.controller.simple');
const meController = require('../controllers/admin/me.admin.controller');
const usersController = require('../controllers/admin/users.admin.controller');
const carsController = require('../controllers/admin/cars.admin.controller');
const bookingsController = require('../controllers/admin/bookings.admin.controller');
const paymentsController = require('../controllers/admin/payments.admin.controller');
const invoicesController = require('../controllers/admin/invoices.admin.controller');
const reviewsController = require('../controllers/admin/reviews.admin.controller');
const maintenanceController = require('../controllers/admin/maintenance.admin.controller');
const notificationsController = require('../controllers/admin/notifications.admin.controller');
const promotionsController = require('../controllers/admin/promotions.admin.controller');
const loyaltyController = require('../controllers/admin/loyalty.admin.controller');
const chatController = require('../controllers/admin/chat.admin.controller');
const miscController = require('../controllers/admin/misc.admin.controller');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(verifyToken);
router.use(requireAdmin);

// ============================================
// DASHBOARD STATS
// ============================================
router.get('/stats', statsController.getDashboardStats);

// ============================================
// ADMIN SELF-SETTINGS (ME)
// ============================================
router.get('/me/settings', meController.getMySettings);
router.put('/me/settings', auditLog('UPDATE', 'AdminSettings'), meController.updateMySettings);
router.put('/me/password', auditLog('UPDATE', 'Password'), meController.changeMyPassword);

// ============================================
// USERS MANAGEMENT
// ============================================
router.get('/users', usersController.listUsers);
router.get('/users/:id', usersController.getUserById);
router.post('/users', auditLog('CREATE', 'User'), usersController.createUser);
router.put('/users/:id', captureOldValues('user'), auditLog('UPDATE', 'User'), usersController.updateUser);
router.delete('/users/:id', captureOldValues('user'), auditLog('DELETE', 'User'), usersController.deleteUser);

// ============================================
// CARS MANAGEMENT
// ============================================
router.get('/cars', carsController.listCars);
router.get('/cars/:id', carsController.getCarById);
router.post('/cars', auditLog('CREATE', 'Car'), carsController.createCar);
router.put('/cars/:id', captureOldValues('car'), auditLog('UPDATE', 'Car'), carsController.updateCar);
router.delete('/cars/:id', captureOldValues('car'), auditLog('DELETE', 'Car'), carsController.deleteCar);

// ============================================
// CAR BRANDS
// ============================================
router.get('/car-brands', miscController.listCarBrands);
router.post('/car-brands', auditLog('CREATE', 'CarBrand'), miscController.createCarBrand);
router.put('/car-brands/:id', captureOldValues('carBrand'), auditLog('UPDATE', 'CarBrand'), miscController.updateCarBrand);
router.delete('/car-brands/:id', captureOldValues('carBrand'), auditLog('DELETE', 'CarBrand'), miscController.deleteCarBrand);

// ============================================
// CAR CATEGORIES
// ============================================
router.get('/car-categories', miscController.listCarCategories);
router.post('/car-categories', auditLog('CREATE', 'CarCategory'), miscController.createCarCategory);
router.put('/car-categories/:id', captureOldValues('carCategory'), auditLog('UPDATE', 'CarCategory'), miscController.updateCarCategory);
router.delete('/car-categories/:id', captureOldValues('carCategory'), auditLog('DELETE', 'CarCategory'), miscController.deleteCarCategory);

// ============================================
// CAR IMAGES
// ============================================
router.get('/car-images', miscController.listCarImages);
router.post('/car-images', auditLog('CREATE', 'CarImage'), miscController.createCarImage);
router.delete('/car-images/:id', captureOldValues('carImage'), auditLog('DELETE', 'CarImage'), miscController.deleteCarImage);

// ============================================
// BOOKINGS MANAGEMENT
// ============================================
router.get('/bookings', bookingsController.listBookings);
router.get('/bookings/:id', bookingsController.getBookingById);
router.post('/bookings', auditLog('CREATE', 'Booking'), bookingsController.createBooking);
router.put('/bookings/:id', captureOldValues('booking'), auditLog('UPDATE', 'Booking'), bookingsController.updateBooking);
router.delete('/bookings/:id', captureOldValues('booking'), auditLog('DELETE', 'Booking'), bookingsController.deleteBooking);

// ============================================
// BOOKING STATUSES
// ============================================
router.get('/booking-statuses', miscController.listBookingStatuses);
router.post('/booking-statuses', auditLog('CREATE', 'BookingStatus'), miscController.createBookingStatus);
router.put('/booking-statuses/:id', captureOldValues('bookingStatus'), auditLog('UPDATE', 'BookingStatus'), miscController.updateBookingStatus);

// Removed: Additional Drivers endpoints

// ============================================
// PAYMENTS MANAGEMENT
// ============================================
router.get('/payments', paymentsController.listPayments);
router.get('/payments/:id', paymentsController.getPaymentById);
router.post('/payments', auditLog('CREATE', 'Payment'), paymentsController.createPayment);
router.put('/payments/:id', captureOldValues('payment'), auditLog('UPDATE', 'Payment'), paymentsController.updatePayment);
router.delete('/payments/:id', captureOldValues('payment'), auditLog('DELETE', 'Payment'), paymentsController.deletePayment);

// ============================================
// INVOICES MANAGEMENT
// ============================================
router.get('/invoices', invoicesController.listInvoices);
router.get('/invoices/:id', invoicesController.getInvoiceById);
router.post('/invoices', auditLog('CREATE', 'Invoice'), invoicesController.createInvoice);
router.put('/invoices/:id', captureOldValues('invoice'), auditLog('UPDATE', 'Invoice'), invoicesController.updateInvoice);
router.delete('/invoices/:id', captureOldValues('invoice'), auditLog('DELETE', 'Invoice'), invoicesController.deleteInvoice);

// Removed: Rental Contracts endpoints

// Removed: Contract Templates endpoints

// ============================================
// REVIEWS MANAGEMENT
// ============================================
router.get('/reviews', reviewsController.listReviews);
router.get('/reviews/:id', reviewsController.getReviewById);
router.post('/reviews', auditLog('CREATE', 'Review'), reviewsController.createReview);
router.put('/reviews/:id', captureOldValues('review'), auditLog('UPDATE', 'Review'), reviewsController.updateReview);
router.delete('/reviews/:id', captureOldValues('review'), auditLog('DELETE', 'Review'), reviewsController.deleteReview);

// ============================================
// MAINTENANCE MANAGEMENT
// ============================================
router.get('/maintenance', maintenanceController.listMaintenance);
router.get('/maintenance/:id', maintenanceController.getMaintenanceById);
router.post('/maintenance', auditLog('CREATE', 'Maintenance'), maintenanceController.createMaintenance);
router.put('/maintenance/:id', captureOldValues('maintenance'), auditLog('UPDATE', 'Maintenance'), maintenanceController.updateMaintenance);
router.delete('/maintenance/:id', captureOldValues('maintenance'), auditLog('DELETE', 'Maintenance'), maintenanceController.deleteMaintenance);

// Removed: Documents endpoints

// ============================================
// NOTIFICATIONS MANAGEMENT
// ============================================
router.get('/notifications', notificationsController.listNotifications);
router.get('/notifications/:id', notificationsController.getNotificationById);
router.post('/notifications', auditLog('CREATE', 'Notification'), notificationsController.createNotification);
router.put('/notifications/:id', captureOldValues('notification'), auditLog('UPDATE', 'Notification'), notificationsController.updateNotification);
router.delete('/notifications/:id', captureOldValues('notification'), auditLog('DELETE', 'Notification'), notificationsController.deleteNotification);

// ============================================
// PROMOTIONS MANAGEMENT
// ============================================
router.get('/promotions', promotionsController.listPromotions);
router.get('/promotions/:id', promotionsController.getPromotionById);
router.post('/promotions', auditLog('CREATE', 'Promotion'), promotionsController.createPromotion);
router.put('/promotions/:id', captureOldValues('promotion'), auditLog('UPDATE', 'Promotion'), promotionsController.updatePromotion);
router.delete('/promotions/:id', captureOldValues('promotion'), auditLog('DELETE', 'Promotion'), promotionsController.deletePromotion);

// ============================================
// LOYALTY MANAGEMENT
// ============================================
// Loyalty Accounts
router.get('/loyalty/accounts', loyaltyController.listLoyaltyAccounts);
router.get('/loyalty/accounts/:id', loyaltyController.getLoyaltyAccountById);

// Loyalty Tiers
router.get('/loyalty/tiers', loyaltyController.listLoyaltyTiers);
router.post('/loyalty/tiers', auditLog('CREATE', 'LoyaltyTier'), loyaltyController.createLoyaltyTier);
router.put('/loyalty/tiers/:id', captureOldValues('loyaltyTier'), auditLog('UPDATE', 'LoyaltyTier'), loyaltyController.updateLoyaltyTier);
router.delete('/loyalty/tiers/:id', captureOldValues('loyaltyTier'), auditLog('DELETE', 'LoyaltyTier'), loyaltyController.deleteLoyaltyTier);

// Loyalty Rewards
router.get('/loyalty/rewards', loyaltyController.listLoyaltyRewards);
router.post('/loyalty/rewards', auditLog('CREATE', 'LoyaltyReward'), loyaltyController.createLoyaltyReward);
router.put('/loyalty/rewards/:id', captureOldValues('loyaltyReward'), auditLog('UPDATE', 'LoyaltyReward'), loyaltyController.updateLoyaltyReward);
router.delete('/loyalty/rewards/:id', captureOldValues('loyaltyReward'), auditLog('DELETE', 'LoyaltyReward'), loyaltyController.deleteLoyaltyReward);

// Loyalty Transactions
router.get('/loyalty/transactions', loyaltyController.listLoyaltyTransactions);

// ============================================
// CHAT MANAGEMENT
// ============================================
// Chat Conversations
router.get('/chat/conversations', chatController.listChatConversations);
router.get('/chat/conversations/:id', chatController.getChatConversationById);
router.put('/chat/conversations/:id', captureOldValues('chatConversation'), auditLog('UPDATE', 'ChatConversation'), chatController.updateChatConversation);
router.delete('/chat/conversations/:id', captureOldValues('chatConversation'), auditLog('DELETE', 'ChatConversation'), chatController.deleteChatConversation);

// Chat Messages
router.get('/chat/messages', chatController.listChatMessages);
router.delete('/chat/messages/:id', captureOldValues('chatMessage'), auditLog('DELETE', 'ChatMessage'), chatController.deleteChatMessage);

// ============================================
// INSURANCE MANAGEMENT
// ============================================
router.get('/insurances', miscController.listInsurances);
router.post('/insurances', auditLog('CREATE', 'Insurance'), miscController.createInsurance);
router.put('/insurances/:id', captureOldValues('insurance'), auditLog('UPDATE', 'Insurance'), miscController.updateInsurance);
router.delete('/insurances/:id', captureOldValues('insurance'), auditLog('DELETE', 'Insurance'), miscController.deleteInsurance);

// Removed: Drivers endpoints

// ============================================
// OAUTH ACCOUNTS
// ============================================
router.get('/oauth-accounts', miscController.listOAuthAccounts);
router.delete('/oauth-accounts/:id', captureOldValues('oauthAccount'), auditLog('DELETE', 'OauthAccount'), miscController.deleteOAuthAccount);

// ============================================
// PHONE VERIFICATIONS
// ============================================
router.get('/phone-verifications', miscController.listPhoneVerifications);
router.delete('/phone-verifications/:id', captureOldValues('phoneVerification'), auditLog('DELETE', 'PhoneVerification'), miscController.deletePhoneVerification);

// ============================================
// SYSTEM SETTINGS
// ============================================
router.get('/system-settings', miscController.listSystemSettings);
router.get('/system-settings/:id', miscController.getSystemSettingById);
router.post('/system-settings', auditLog('CREATE', 'SystemSetting'), miscController.createSystemSetting);
router.put('/system-settings/:id', captureOldValues('systemSetting'), auditLog('UPDATE', 'SystemSetting'), miscController.updateSystemSetting);
router.delete('/system-settings/:id', captureOldValues('systemSetting'), auditLog('DELETE', 'SystemSetting'), miscController.deleteSystemSetting);

// ============================================
// AUDIT LOGS
// ============================================
router.get('/audit-logs', miscController.listAuditLogs);
router.get('/audit-logs/:id', miscController.getAuditLogById);

// ============================================
// ADMINS MANAGEMENT
// ============================================
router.get('/admins', miscController.listAdmins);
router.post('/admins', auditLog('CREATE', 'Admin'), miscController.createAdmin);
router.put('/admins/:id', captureOldValues('admin'), auditLog('UPDATE', 'Admin'), miscController.updateAdmin);
router.delete('/admins/:id', captureOldValues('admin'), auditLog('DELETE', 'Admin'), miscController.deleteAdmin);

module.exports = router;
