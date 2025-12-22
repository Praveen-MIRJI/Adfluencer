import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('CLIENT'), reviewController.createReview);
router.get('/influencer/:influencerId', reviewController.getInfluencerReviews);
router.get('/my-reviews', authenticate, authorize('INFLUENCER'), reviewController.getMyReviews);

export default router;
