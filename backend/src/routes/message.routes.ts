import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/conversations', messageController.getConversations);
router.get('/conversation/:userId', messageController.getMessages);
router.post('/', messageController.sendMessage);
router.patch('/:id/read', messageController.markAsRead);

export default router;
