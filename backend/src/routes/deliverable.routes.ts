import { Router } from 'express';
import { body } from 'express-validator';
import * as deliverableController from '../controllers/deliverable.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Submit deliverable
router.post(
  '/',
  authenticate,
  validate([
    body('contractId').isUUID().withMessage('Valid contract ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('type').isIn(['SCREENSHOT', 'LINK', 'VIDEO', 'IMAGE', 'DOCUMENT', 'ANALYTICS']).withMessage('Invalid type'),
  ]),
  deliverableController.submitDeliverable
);

// Get deliverables for contract
router.get('/contract/:contractId', authenticate, deliverableController.getContractDeliverables);

// Get deliverable stats
router.get('/contract/:contractId/stats', authenticate, deliverableController.getDeliverableStats);

// Get single deliverable
router.get('/:id', authenticate, deliverableController.getDeliverable);

// Review deliverable (client)
router.put(
  '/:id/review',
  authenticate,
  validate([
    body('status').isIn(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']).withMessage('Invalid status'),
    body('feedback').optional().isString(),
  ]),
  deliverableController.reviewDeliverable
);

// Delete deliverable
router.delete('/:id', authenticate, deliverableController.deleteDeliverable);

export default router;
