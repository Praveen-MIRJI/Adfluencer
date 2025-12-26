import { Router } from 'express';
import { body } from 'express-validator';
import * as escrowController from '../controllers/escrow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Get fee breakdown (public - for displaying before payment)
router.get('/fee-breakdown', escrowController.getFeeBreakdown);

// Create escrow for contract
router.post(
  '/',
  authenticate,
  validate([
    body('contractId').notEmpty().withMessage('Contract ID is required'),
  ]),
  escrowController.createEscrow
);

// Verify payment and capture
router.post(
  '/verify-payment',
  authenticate,
  validate([
    body('escrowId').notEmpty().withMessage('Escrow ID is required'),
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
  ]),
  escrowController.verifyEscrowPayment
);

// Get escrow by ID
router.get('/:id', authenticate, escrowController.getEscrow);

// Get escrow by contract ID
router.get('/contract/:contractId', authenticate, escrowController.getEscrowByContract);

// Submit work (provider)
router.post('/:escrowId/submit-work', authenticate, escrowController.submitWork);

// Approve and release payment (client)
router.post('/:escrowId/approve', authenticate, escrowController.approveAndRelease);

// Raise dispute
router.post(
  '/:escrowId/dispute',
  authenticate,
  validate([
    body('reason').notEmpty().withMessage('Reason is required'),
    body('description').isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  ]),
  escrowController.raiseDispute
);

// Request refund (client - before work submitted)
router.post(
  '/:escrowId/refund',
  authenticate,
  validate([
    body('reason').optional().isString(),
  ]),
  escrowController.requestRefund
);

export default router;
