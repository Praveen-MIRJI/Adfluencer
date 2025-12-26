import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

// Razorpay webhook endpoint
// Note: This endpoint should NOT have authentication middleware
// Razorpay will send webhooks to this endpoint
router.post('/razorpay', webhookController.handleRazorpayWebhook);

export default router;
