import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  getCreditSettings,
  updateCreditSettings,
  getCreditStats,
  adjustUserCredits,
  getUsersWithCredits
} from '../../controllers/admin/credits.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize('ADMIN'));

// Get credit settings
router.get('/settings', getCreditSettings);

// Update credit settings
router.put('/settings', updateCreditSettings);

// Get credit statistics
router.get('/stats', getCreditStats);

// Adjust user credits
router.post('/adjust-credits', adjustUserCredits);

// Get all users with credits
router.get('/users', getUsersWithCredits);

export default router;