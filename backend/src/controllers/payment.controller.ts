import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../lib/supabase';
import { createOrder, verifyPayment, fetchPayment, initiateRefund } from '../lib/razorpay';
import { v4 as uuidv4 } from 'uuid';

// Create Razorpay order for various purposes
export const createPaymentOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, purpose, resourceId, notes = {} } = req.body;
    const userId = req.user!.userId;

    if (!amount || amount < 1) {
      res.status(400).json({ success: false, error: 'Invalid amount' });
      return;
    }

    const validPurposes = ['SUBSCRIPTION', 'WALLET_TOPUP', 'ESCROW', 'BID_FEE', 'AD_FEE'];
    if (!validPurposes.includes(purpose)) {
      res.status(400).json({ success: false, error: 'Invalid payment purpose' });
      return;
    }

    const receipt = `rcpt_${uuidv4().slice(0, 8)}`;
    const result = await createOrder({
      amount,
      receipt,
      notes: { userId, purpose, resourceId, ...notes },
    });

    if (!result.success || !result.order) {
      res.status(500).json({ success: false, error: result.error || 'Failed to create order' });
      return;
    }

    // Store order in database
    const { data: orderRecord, error } = await supabase
      .from('RazorpayOrder')
      .insert({
        userId,
        orderId: result.order.id,
        amount,
        currency: 'INR',
        receipt,
        status: 'created',
        purpose,
        resourceId,
        notes: { userId, purpose, resourceId, ...notes },
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        orderId: result.order.id,
        amount: result.order.amount,
        currency: result.order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderRecord,
      },
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment order' });
  }
};

// Verify payment after completion
export const verifyPaymentOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const userId = req.user!.userId;

    // Verify signature
    const isValid = verifyPayment({ orderId, paymentId, signature });
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid payment signature' });
      return;
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('RazorpayOrder')
      .select('*')
      .eq('orderId', orderId)
      .eq('userId', userId)
      .single();

    if (orderError || !order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Update order status
    await supabase
      .from('RazorpayOrder')
      .update({ status: 'paid', paymentId, signature, updatedAt: new Date().toISOString() })
      .eq('id', order.id);

    // Process based on purpose
    let result;
    switch (order.purpose) {
      case 'WALLET_TOPUP':
        result = await processWalletTopup(userId, order.amount, paymentId);
        break;
      case 'ESCROW':
        result = await processEscrowFunding(order.resourceId, paymentId);
        break;
      case 'SUBSCRIPTION':
        result = await processSubscription(userId, order.resourceId, order.amount, paymentId);
        break;
      case 'BID_FEE':
      case 'AD_FEE':
        result = await processActionFee(userId, order.purpose, order.resourceId, order.amount, paymentId);
        break;
      default:
        result = { success: true };
    }

    if (!result.success) {
      res.status(500).json({ success: false, error: result.error });
      return;
    }

    // Create notification
    await supabase.from('Notification').insert({
      userId,
      title: 'Payment Successful',
      message: `Your payment of ₹${order.amount} has been processed successfully.`,
      type: 'PAYMENT_SUCCESS',
      link: '/billing',
    });

    res.json({ success: true, message: 'Payment verified successfully', data: result.data });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
};

// Process wallet top-up
async function processWalletTopup(userId: string, amount: number, paymentId: string) {
  try {
    // Get current wallet
    const { data: wallet } = await supabase
      .from('UserWallet')
      .select('id, balance')
      .eq('userId', userId)
      .single();

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + amount;

    // Update or create wallet
    await supabase
      .from('UserWallet')
      .upsert({
        userId,
        balance: newBalance,
        lastTransactionAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'userId' });

    // Record transaction
    if (wallet) {
      await supabase.from('WalletTransaction').insert({
        walletId: wallet.id,
        userId,
        type: 'CREDIT',
        amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: 'Wallet top-up via Razorpay',
        metadata: { paymentId },
      });
    }

    return { success: true, data: { newBalance } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Process escrow funding
async function processEscrowFunding(escrowId: string, paymentId: string) {
  try {
    const { error } = await supabase
      .from('Escrow')
      .update({
        status: 'FUNDED',
        fundedAt: new Date().toISOString(),
        razorpayPaymentId: paymentId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (error) throw error;

    // Update contract payment status
    const { data: escrow } = await supabase
      .from('Escrow')
      .select('contractId')
      .eq('id', escrowId)
      .single();

    if (escrow) {
      await supabase
        .from('Contract')
        .update({ paymentStatus: 'ESCROW_FUNDED', updatedAt: new Date().toISOString() })
        .eq('id', escrow.contractId);
    }

    return { success: true, data: { escrowId, status: 'FUNDED' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Process subscription payment
async function processSubscription(userId: string, planId: string, amount: number, paymentId: string) {
  try {
    const { data: plan } = await supabase
      .from('MembershipPlan')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) return { success: false, error: 'Plan not found' };

    const startDate = new Date();
    const endDate = new Date();
    if (plan.billingCycle === 'WEEKLY') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (plan.billingCycle === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.billingCycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const { data: subscription, error } = await supabase
      .from('UserSubscription')
      .insert({
        userId,
        planId,
        status: 'ACTIVE',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: { subscription } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Process action fee (bid/ad)
async function processActionFee(userId: string, purpose: string, resourceId: string, amount: number, paymentId: string) {
  try {
    await supabase.from('UsageTracking').insert({
      userId,
      action: purpose === 'BID_FEE' ? 'BID_SUBMITTED' : 'AD_POSTED',
      resourceId,
      cost: amount,
      chargedAt: new Date().toISOString(),
      metadata: { paymentId },
    });

    return { success: true, data: { resourceId, charged: amount } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get payment history
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data: payments, count, error } = await supabase
      .from('RazorpayOrder')
      .select('*', { count: 'exact' })
      .eq('userId', userId)
      .eq('status', 'paid')
      .order('createdAt', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ success: false, error: 'Failed to get payment history' });
  }
};

// Request refund
export const requestRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId, reason } = req.body;
    const userId = req.user!.userId;

    // Verify payment belongs to user
    const { data: order } = await supabase
      .from('RazorpayOrder')
      .select('*')
      .eq('paymentId', paymentId)
      .eq('userId', userId)
      .single();

    if (!order) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }

    const result = await initiateRefund(paymentId);
    if (!result.success) {
      res.status(500).json({ success: false, error: result.error });
      return;
    }

    await supabase
      .from('RazorpayOrder')
      .update({ status: 'refunded', notes: { ...order.notes, refundReason: reason } })
      .eq('id', order.id);

    res.json({ success: true, message: 'Refund initiated successfully', data: result.refund });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ success: false, error: 'Failed to process refund' });
  }
};
