import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// Dashboard & Stats
router.get('/stats', adminController.getAdminStats);
router.get('/enhanced-stats', adminController.getEnhancedStats);
router.get('/analytics-charts', adminController.getAnalyticsChartData);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Advertisement management
router.get('/advertisements', adminController.getAdvertisements);
router.patch('/advertisements/:id/status', adminController.updateAdStatus);

// Contract management
router.get('/contracts', adminController.getContracts);

// Bid management
router.get('/bids', adminController.getBids);

// Review management
router.get('/reviews', adminController.getReviews);
router.delete('/reviews/:id', adminController.deleteReview);

// Category management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

export default router;
