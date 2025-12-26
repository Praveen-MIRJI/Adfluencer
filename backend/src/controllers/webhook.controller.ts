import { Request, Response } from 'express';
import crypto from 'crypto';
import supabase from '../lib/supabase';

/**
 * Razorpay Webhook Handler
 * 
 * Handles events:
 * - payment.captured
 * - payment.failed
 * - refund.created
 * - payout.processed
 */
export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify webhook signature
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'] as string;
      const body = JSON.stringify(req.body);
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }
    }

    const event = req.body;
    const eventType = event.event;
    const payload = event.payload;

    // Log webhook event
    await supabase.from('WebhookLog').insert({
      source: 'razorpay',
      eventType,
      eventId: event.event_id || event.id,
      payload: event,
      processed: false,
    });

    // Process based on event type
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      
      case 'refund.created':
        await handleRefundCreated(payload);
        break;
      
      case 'payout.processed':
        await handlePayoutProcessed(payload);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    // Mark as processed
    await supabase
      .from('WebhookLog')
      .update({ processed: true, processedAt: new Date().toISOString() })
      .eq('eventId', event.event_id || event.id);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function handlePaymentCaptured(payload: any) {
  const payment = payload.payment?.entity;
  if (!payment) return;

  const orderId = payment.order_id;
  const paymentId = payment.id;

  // Find escrow by order ID
  const { data: escrow } = await supabase
    .from('EscrowTransaction')
    .select('*')
    .eq('razorpayOrderId', orderId)
    .single();

  if (!escrow) {
    console.log(`No escrow found for order: ${orderId}`);
    return;
  }

  // Update escrow status if not already updated
  if (escrow.escrowStatus === 'CREATED') {
    await supabase
      .from('EscrowTransaction')
      .update({
        razorpayPaymentId: paymentId,
        escrowStatus: 'HELD_IN_ESCROW',
        paymentStatus: 'CAPTURED',
        paymentCapturedAt: new Date().toISOString(),
        webhookEvents: [...(escrow.webhookEvents || []), { event: 'payment.captured', timestamp: new Date().toISOString() }],
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrow.id);

    // Record platform revenue
    await supabase.from('PlatformRevenue').insert({
      escrowTransactionId: escrow.id,
      grossAmount: escrow.grossAmount,
      platformFee: escrow.platformFee,
      razorpayFee: escrow.razorpayFee,
      netRevenue: escrow.platformFee,
    });

    // Notify provider
    await supabase.from('Notification').insert({
      userId: escrow.providerId,
      title: 'Payment Secured',
      message: `₹${escrow.grossAmount} has been secured in escrow. Complete the work to receive ₹${escrow.providerPayout}.`,
      type: 'ESCROW_FUNDED',
      link: `/contracts/${escrow.contractId}`,
    });
  }
}

async function handlePaymentFailed(payload: any) {
  const payment = payload.payment?.entity;
  if (!payment) return;

  const orderId = payment.order_id;

  // Find escrow by order ID
  const { data: escrow } = await supabase
    .from('EscrowTransaction')
    .select('*')
    .eq('razorpayOrderId', orderId)
    .single();

  if (!escrow) return;

  // Update escrow status
  await supabase
    .from('EscrowTransaction')
    .update({
      paymentStatus: 'FAILED',
      webhookEvents: [...(escrow.webhookEvents || []), { 
        event: 'payment.failed', 
        timestamp: new Date().toISOString(),
        error: payment.error_description,
      }],
      updatedAt: new Date().toISOString(),
    })
    .eq('id', escrow.id);

  // Notify client
  await supabase.from('Notification').insert({
    userId: escrow.clientId,
    title: 'Payment Failed',
    message: `Your payment of ₹${escrow.grossAmount} failed. Please try again.`,
    type: 'PAYMENT_FAILED',
    link: `/contracts/${escrow.contractId}`,
  });
}

async function handleRefundCreated(payload: any) {
  const refund = payload.refund?.entity;
  if (!refund) return;

  const paymentId = refund.payment_id;

  // Find escrow by payment ID
  const { data: escrow } = await supabase
    .from('EscrowTransaction')
    .select('*')
    .eq('razorpayPaymentId', paymentId)
    .single();

  if (!escrow) return;

  // Update escrow status
  await supabase
    .from('EscrowTransaction')
    .update({
      escrowStatus: 'REFUNDED',
      paymentStatus: 'REFUNDED',
      refundedAt: new Date().toISOString(),
      webhookEvents: [...(escrow.webhookEvents || []), { event: 'refund.created', timestamp: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    })
    .eq('id', escrow.id);
}

async function handlePayoutProcessed(payload: any) {
  const payout = payload.payout?.entity;
  if (!payout) return;

  // Find payout record
  const { data: payoutRecord } = await supabase
    .from('Payout')
    .select('*')
    .eq('razorpayPayoutId', payout.id)
    .single();

  if (!payoutRecord) return;

  // Update payout status
  await supabase
    .from('Payout')
    .update({
      status: payout.status === 'processed' ? 'COMPLETED' : 'FAILED',
      completedAt: new Date().toISOString(),
      failureReason: payout.failure_reason,
    })
    .eq('id', payoutRecord.id);

  // Update escrow if payout completed
  if (payout.status === 'processed') {
    await supabase
      .from('EscrowTransaction')
      .update({
        escrowStatus: 'PAID_OUT',
        paidOutAt: new Date().toISOString(),
      })
      .eq('id', payoutRecord.escrowTransactionId);
  }
}
