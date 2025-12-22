import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Advertisement management
router.get('/advertisements', adminController.getAdvertisements);
router.patch('/advertisements/:id/status', adminController.updateAdStatus);

// Dashboard
router.get('/stats', adminController.getAdminStats);

export default router;
