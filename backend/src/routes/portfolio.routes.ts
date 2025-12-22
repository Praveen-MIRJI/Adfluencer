import { Router } from 'express';
import * as portfolioController from '../controllers/portfolio.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/my-portfolio', authenticate, authorize('INFLUENCER'), portfolioController.getMyPortfolio);
router.get('/influencer/:influencerId', portfolioController.getInfluencerPortfolio);
router.post('/', authenticate, authorize('INFLUENCER'), portfolioController.addPortfolioItem);
router.put('/:id', authenticate, authorize('INFLUENCER'), portfolioController.updatePortfolioItem);
router.delete('/:id', authenticate, authorize('INFLUENCER'), portfolioController.deletePortfolioItem);

export default router;
