import { Router } from 'express';
import { body } from 'express-validator';
import * as disputeController from '../controllers/dispute.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Raise dispute
router.post(
  '/',
  authenticate,
  validate([
    body('contractId').isUUID().withMessage('Valid contract ID is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
    body('description').isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  ]),
  disputeController.raiseDispute
);

// Get my disputes
router.get('/my', authenticate, disputeController.getMyDisputes);

// Get all disputes (admin)
router.get('/all', authenticate, authorize('ADMIN'), disputeController.getAllDisputes);

// Get dispute by ID
router.get('/:id', authenticate, disputeController.getDispute);

// Add evidence
router.post(
  '/:id/evidence',
  authenticate,
  validate([
    body('evidence').isObject().withMessage('Evidence object is required'),
  ]),
  disputeController.addEvidence
);

// Resolve dispute (admin)
router.put(
  '/:id/resolve',
  authenticate,
  authorize('ADMIN'),
  validate([
    body('status').isIn(['RESOLVED_CLIENT', 'RESOLVED_INFLUENCER', 'RESOLVED_SPLIT', 'CLOSED']).withMessage('Invalid status'),
    body('resolution').notEmpty().withMessage('Resolution is required'),
  ]),
  disputeController.resolveDispute
);

export default router;
