import { Router } from 'express';
import { body } from 'express-validator';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Create payment order
router.post(
  '/create-order',
  authenticate,
  validate([
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('purpose').isIn(['SUBSCRIPTION', 'WALLET_TOPUP', 'ESCROW', 'BID_FEE', 'AD_FEE']).withMessage('Invalid purpose'),
    body('resourceId').optional().isString(),
  ]),
  paymentController.createPaymentOrder
);

// Verify payment
router.post(
  '/verify',
  authenticate,
  validate([
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
  ]),
  paymentController.verifyPaymentOrder
);

// Get payment history
router.get('/history', authenticate, paymentController.getPaymentHistory);

// Request refund
router.post(
  '/refund',
  authenticate,
  validate([
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('reason').optional().isString(),
  ]),
  paymentController.requestRefund
);

export default router;
