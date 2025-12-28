import { Router } from 'express';
import { body, query } from 'express-validator';
import * as billingController from '../controllers/billing.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Subscription validation
const subscriptionValidation = [
  body('planId')
    .notEmpty()
    .withMessage('Plan ID is required')
];

// Cancel subscription validation
const cancelSubscriptionValidation = [
  body('reason')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Cancellation reason must be between 5-500 characters')
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Public routes
router.get('/plans', billingController.getMembershipPlans);

// User routes
router.get('/subscription', authenticate, billingController.getUserSubscription);
router.post('/subscribe', authenticate, validate(subscriptionValidation), billingController.subscribeToPlan);
router.post('/cancel-subscription', authenticate, validate(cancelSubscriptionValidation), billingController.cancelSubscription);

// Payment history
router.get('/payments', authenticate, validate(paginationValidation), billingController.getPaymentHistory);

// Wallet routes
router.get('/wallet', authenticate, billingController.getUserWallet);
router.get('/wallet/transactions', authenticate, validate(paginationValidation), billingController.getWalletTransactions);
router.post('/wallet/create-order', authenticate, billingController.createWalletTopupOrder);
router.post('/wallet/verify-payment', authenticate, billingController.verifyWalletTopup);

// Subscription payment verification
router.post('/verify-subscription-payment', authenticate, billingController.verifySubscriptionPayment);

export default router;
