import { Router } from 'express';
import { body } from 'express-validator';
import * as bidController from '../controllers/bid.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

const createBidValidation = [
  body('advertisementId').isUUID().withMessage('Valid advertisement ID is required'),
  body('proposedPrice').isFloat({ min: 1 }).withMessage('Proposed price must be at least 1'),
  body('proposal').trim().isLength({ min: 20 }).withMessage('Proposal must be at least 20 characters'),
  body('deliveryDays').isInt({ min: 1 }).withMessage('Delivery days must be at least 1'),
];

// Influencer routes
router.post('/', authenticate, authorize('INFLUENCER'), validate(createBidValidation), bidController.createBid);
router.get('/my-bids', authenticate, authorize('INFLUENCER'), bidController.getMyBids);
router.put('/:id', authenticate, authorize('INFLUENCER'), bidController.updateBid);
router.delete('/:id', authenticate, authorize('INFLUENCER'), bidController.withdrawBid);

// Client routes
router.get('/advertisement/:advertisementId', authenticate, authorize('CLIENT'), bidController.getBidsForAdvertisement);
router.patch('/:id/shortlist', authenticate, authorize('CLIENT'), bidController.shortlistBid);
router.patch('/:id/accept', authenticate, authorize('CLIENT'), bidController.acceptBid);
router.patch('/:id/reject', authenticate, authorize('CLIENT'), bidController.rejectBid);

export default router;
