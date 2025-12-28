import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getUserCredits,
  getCreditSettings,
  purchaseCredits,
  verifyCreditPayment,
  useCredit,
  getCreditHistory,
  claimSpinWheelCredits,
  checkUserSubscriptionStatus
} from '../controllers/credits.controller';

const router = Router();

// Public endpoint - no authentication required
router.get('/settings', getCreditSettings);

// All other routes require authentication
router.use(authenticate);

// Get user's credit balance
router.get('/balance', getUserCredits);

// Check subscription status
router.get('/subscription-status', checkUserSubscriptionStatus);

// Get credit settings (pricing) - moved to public above

// Purchase credits
router.post('/purchase', purchaseCredits);

// Verify credit purchase payment
router.post('/verify-payment', verifyCreditPayment);

// Use credit (for bidding or posting)
router.post('/use', useCredit);

// Claim spin wheel bonus credits
router.post('/claim-spin-wheel', claimSpinWheelCredits);

// Get credit transaction history
router.get('/history', getCreditHistory);

export default router;