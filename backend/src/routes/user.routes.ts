import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Avatar upload
router.post('/upload-avatar', authenticate, userController.uploadAvatar);

// General profile route (for VerificationBadge and other components)
router.get('/profile', authenticate, userController.getUserProfile);

// Client profile routes
router.get('/client/profile', authenticate, authorize('CLIENT'), userController.getClientProfile);
router.put('/client/profile', authenticate, authorize('CLIENT'), userController.updateClientProfile);

// Influencer profile routes
router.get('/influencer/profile', authenticate, authorize('INFLUENCER'), userController.getInfluencerProfile);
router.put('/influencer/profile', authenticate, authorize('INFLUENCER'), userController.updateInfluencerProfile);

// Public influencer profile
router.get('/influencer/:id', userController.getPublicInfluencerProfile);

// Dashboard stats
router.get('/dashboard/stats', authenticate, userController.getDashboardStats);

export default router;
