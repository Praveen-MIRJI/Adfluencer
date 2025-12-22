import { Router } from 'express';
import * as contractController from '../controllers/contract.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('CLIENT'), contractController.createContract);
router.get('/my-contracts', authenticate, contractController.getMyContracts);
router.get('/:id', authenticate, contractController.getContractById);
router.patch('/:id/complete', authenticate, authorize('CLIENT'), contractController.completeContract);
router.patch('/:id/cancel', authenticate, contractController.cancelContract);

export default router;
