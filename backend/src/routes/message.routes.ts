import { Router } from 'express';
import { body } from 'express-validator';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { requireMessagingAccess, deductWalletBalance, requireVerification } from '../middleware/subscription.middleware';

const router = Router();

const sendMessageValidation = [
  body('receiverId').isUUID().withMessage('Valid receiver ID is required'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content must be between 1-2000 characters'),
];

router.use(authenticate);

router.get('/conversations', messageController.getConversations);
router.get('/conversation/:userId', requireMessagingAccess, messageController.getMessages);
router.post('/', 
  requireVerification,
  requireMessagingAccess, 
  validate(sendMessageValidation),
  deductWalletBalance,
  messageController.sendMessage
);
router.patch('/:id/read', messageController.markAsRead);

export default router;
