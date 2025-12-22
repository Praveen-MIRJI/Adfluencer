import { Router } from 'express';
import * as savedAdController from '../controllers/savedAd.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('INFLUENCER'), savedAdController.getSavedAds);
router.post('/', authenticate, authorize('INFLUENCER'), savedAdController.saveAd);
router.delete('/:advertisementId', authenticate, authorize('INFLUENCER'), savedAdController.unsaveAd);
router.get('/check/:advertisementId', authenticate, authorize('INFLUENCER'), savedAdController.checkSaved);

export default router;
