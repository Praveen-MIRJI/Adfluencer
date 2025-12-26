import { Router } from 'express';
import { body, query } from 'express-validator';
import * as billingController from '../controllers/billing.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Subscription validation
const subscriptionValidation = [
  body('planId')
    .isUUID()
    .withMessage('Invalid plan ID'),
  body('paymentMethodId')
    .isLength({ min: 5 })
    .withMessage('Payment method ID is required')
];

// Wallet top-up validation
const walletTopUpValidation = [
  body('amount')
    .isFloat({ min: 10, max: 50000 })
    .withMessage('Amount must be between ₹10 and ₹50,000'),
  body('paymentMethodId')
    .isLength({ min: 5 })
    .withMessage('Payment method ID is required')
];

// Action payment validation
const actionPaymentValidation = [
  body('actionType')
    .isIn(['BID', 'ADVERTISEMENT'])
    .withMessage('Action type must be BID or ADVERTISEMENT'),
  body('resourceId')
    .isUUID()
    .withMessage('Invalid resource ID')
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
router.get('/wallet', authenticate, billingController.getWalletBalance);
router.post('/wallet/add-money', authenticate, validate(walletTopUpValidation), billingController.addMoneyToWallet);
router.post('/wallet/pay', authenticate, validate(actionPaymentValidation), billingController.processActionPayment);
router.get('/wallet/transactions', authenticate, validate(paginationValidation), billingController.getWalletTransactions);

export default router;