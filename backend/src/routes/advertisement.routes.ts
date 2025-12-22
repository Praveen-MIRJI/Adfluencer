import { Router } from 'express';
import { body } from 'express-validator';
import * as adController from '../controllers/advertisement.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

const createAdValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('categoryId').isUUID().withMessage('Valid category is required'),
  body('platform').isIn(['INSTAGRAM', 'YOUTUBE', 'TWITTER', 'TIKTOK', 'FACEBOOK', 'LINKEDIN']),
  body('contentType').isIn(['STORY', 'POST', 'REEL', 'VIDEO', 'TWEET', 'ARTICLE']),
  body('duration').trim().notEmpty().withMessage('Duration is required'),
  body('budgetMin').isFloat({ min: 1 }).withMessage('Minimum budget must be at least 1'),
  body('budgetMax').isFloat({ min: 1 }).withMessage('Maximum budget must be at least 1'),
  body('deadline').isISO8601().withMessage('Valid deadline is required'),
];

// Get client's own ads (must be before /:id to avoid conflict)
router.get('/client/my-ads', authenticate, authorize('CLIENT'), adController.getMyAdvertisements);

// Public routes
router.get('/', adController.getAdvertisements);
router.get('/:id', adController.getAdvertisementById);

// Client routes
router.post('/', authenticate, authorize('CLIENT'), validate(createAdValidation), adController.createAdvertisement);
router.put('/:id', authenticate, authorize('CLIENT'), adController.updateAdvertisement);
router.patch('/:id/close', authenticate, authorize('CLIENT'), adController.closeAdvertisement);
router.delete('/:id', authenticate, authorize('CLIENT'), adController.deleteAdvertisement);

export default router;
