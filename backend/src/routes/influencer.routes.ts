import { Router } from 'express';
import * as influencerController from '../controllers/influencer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes for discovering influencers
router.get('/discover', authenticate, influencerController.discoverInfluencers);
router.get('/niches', influencerController.getNiches);
router.get('/:id', influencerController.getInfluencerPublicProfile);

export default router;
