import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../lib/supabase';
import { createOrder, verifyPayment } from '../lib/razorpay';
import { v4 as uuidv4 } from 'uuid';

/**
 * PAYMENT FLOW CALCULATION (Indian Market - Razorpay)
 * 
 * Example: Client pays ₹1000
 * 1. Razorpay fee: 2% + 18% GST on fee = ~2.36% = ₹23.60 (~₹24)
 * 2. Amount after gateway: ₹1000 - ₹24 = ₹976
 * 3. Platform fee (10% of gross): ₹100
 * 4. Provider payout: ₹1000 - ₹24 - ₹100 = ₹876
 * 
 * Platform earnings: ₹100 (platform fee)
 * Razorpay fee is operational expense, NOT profit
 */

// Platform fee percentage (configurable)
const PLATFORM_FEE_PERCENT = 10;
// Razorpay fee: 2% + 18% GST = 2.36%
const RAZORPAY_FEE_PERCENT = 2.36;

interface FeeBreakdown {
  grossAmount: number;
  razorpayFee: number;
  amountAfterGateway: number;
  platformFee: number;
  providerPayout: number;
  platformEarnings: number;
}

/**
 * Calculate fee breakdown for a given amount
 */
export function calculateFees(grossAmount: number): FeeBreakdown {
  // Razorpay fee: ~2.36% (2% + 18% GST on the 2%)
  const razorpayFee = Math.round((grossAmount * RAZORPAY_FEE_PERCENT) / 100 * 100) / 100;
  
  // Amount after Razorpay deduction
  const amountAfterGateway = grossAmount - razorpayFee;
  
  // Platform fee: 10% of gross amount
  const platformFee = Math.round((grossAmount * PLATFORM_FEE_PERCENT) / 100 * 100) / 100;
  
  // Provider payout: Gross - Razorpay fee - Platform fee
  const providerPayout = grossAmount - razorpayFee - platformFee;
  
  // Platform earnings = Platform fee (Razorpay fee is operational expense)
  const platformEarnings = platformFee;

  return {
    grossAmount,
    razorpayFee,
    amountAfterGateway,
    platformFee,
    providerPayout,
    platformEarnings,
  };
}

/**
 * Get fee breakdown for display (before payment)
 */
export const getFeeBreakdown = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount } = req.query;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
      res.status(400).json({ success: false, error: 'Valid amount is required' });
      return;
    }

    const breakdown = calculateFees(Number(amount));

    res.json({
      success: true,
      data: {
        ...breakdown,
        currency: 'INR',
        platformFeePercent: PLATFORM_FEE_PERCENT,
        razorpayFeePercent: RAZORPAY_FEE_PERCENT,
        description: {
          grossAmount: 'Total amount paid by client',
          razorpayFee: 'Payment gateway fee (2% + 18% GST)',
          platformFee: `Platform service fee (${PLATFORM_FEE_PERCENT}%)`,
          providerPayout: 'Amount provider will receive',
        },
      },
    });
  } catch (error) {
    console.error('Get fee breakdown error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate fees' });
  }
};

/**
 * Create escrow for a contract - Step 1: Initialize
 */
export const createEscrow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contractId } = req.body;
    const clientId = req.user!.userId;

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('Contract')
      .select('*, advertisement:Advertisement(title)')
      .eq('id', contractId)
      .eq('clientId', clientId)
      .single();

    if (contractError || !contract) {
      res.status(404).json({ success: false, error: 'Contract not found' });
      return;
    }

    // Check if escrow already exists
    const { data: existingEscrow } = await supabase
      .from('EscrowTransaction')
      .select('id, escrowStatus')
      .eq('contractId', contractId)
      .single();

    if (existingEscrow) {
      res.status(400).json({ 
        success: false, 
        error: 'Escrow already exists for this contract',
        escrowId: existingEscrow.id,
        status: existingEscrow.escrowStatus,
      });
      return;
    }

    // Calculate fees
    const fees = calculateFees(contract.agreedPrice);

    // Create escrow record
    const { data: escrow, error: escrowError } = await supabase
      .from('EscrowTransaction')
      .insert({
        contractId,
        clientId,
        providerId: contract.influencerId,
        grossAmount: fees.grossAmount,
        razorpayFee: fees.razorpayFee,
        amountAfterGateway: fees.amountAfterGateway,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        platformFee: fees.platformFee,
        providerPayout: fees.providerPayout,
        platformEarnings: fees.platformEarnings,
        escrowStatus: 'CREATED',
        paymentStatus: 'PENDING',
      })
      .select()
      .single();

    if (escrowError) throw escrowError;

    // Create Razorpay order
    const receipt = `esc_${uuidv4().slice(0, 8)}`;
    const orderResult = await createOrder({
      amount: fees.grossAmount,
      receipt,
      notes: { 
        escrowId: escrow.id, 
        contractId, 
        type: 'ESCROW',
        clientId,
        providerId: contract.influencerId,
      },
    });

    if (!orderResult.success || !orderResult.order) {
      // Rollback escrow creation
      await supabase.from('EscrowTransaction').delete().eq('id', escrow.id);
      res.status(500).json({ success: false, error: 'Failed to create payment order' });
      return;
    }

    // Update escrow with Razorpay order ID
    await supabase
      .from('EscrowTransaction')
      .update({ razorpayOrderId: orderResult.order.id })
      .eq('id', escrow.id);

    // Update contract with escrow reference
    await supabase
      .from('Contract')
      .update({ escrowTransactionId: escrow.id })
      .eq('id', contractId);

    res.status(201).json({
      success: true,
      data: {
        escrow: {
          id: escrow.id,
          ...fees,
          status: 'CREATED',
        },
        paymentOrder: {
          orderId: orderResult.order.id,
          amount: orderResult.order.amount, // In paise
          currency: orderResult.order.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
        breakdown: {
          clientPays: `₹${fees.grossAmount.toLocaleString()}`,
          razorpayFee: `₹${fees.razorpayFee.toLocaleString()} (payment gateway)`,
          platformFee: `₹${fees.platformFee.toLocaleString()} (${PLATFORM_FEE_PERCENT}% service fee)`,
          providerReceives: `₹${fees.providerPayout.toLocaleString()}`,
        },
      },
    });
  } catch (error) {
    console.error('Create escrow error:', error);
    res.status(500).json({ success: false, error: 'Failed to create escrow' });
  }
};

/**
 * Verify payment and capture - Step 2: Payment captured
 */
export const verifyEscrowPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { escrowId, orderId, paymentId, signature } = req.body;
    const clientId = req.user!.userId;

    // Verify signature
    const isValid = verifyPayment({ orderId, paymentId, signature });
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid payment signature' });
      return;
    }

    // Get escrow
    const { data: escrow, error: escrowError } = await supabase
      .from('EscrowTransaction')
      .select('*')
      .eq('id', escrowId)
      .eq('clientId', clientId)
      .eq('razorpayOrderId', orderId)
      .single();

    if (escrowError || !escrow) {
      res.status(404).json({ success: false, error: 'Escrow not found' });
      return;
    }

    if (escrow.escrowStatus !== 'CREATED') {
      res.status(400).json({ success: false, error: 'Payment already processed' });
      return;
    }

    // Update escrow status
    const { error: updateError } = await supabase
      .from('EscrowTransaction')
      .update({
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        escrowStatus: 'HELD_IN_ESCROW',
        paymentStatus: 'CAPTURED',
        paymentCapturedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (updateError) throw updateError;

    // Record platform revenue
    await supabase.from('PlatformRevenue').insert({
      escrowTransactionId: escrowId,
      grossAmount: escrow.grossAmount,
      platformFee: escrow.platformFee,
      razorpayFee: escrow.razorpayFee,
      netRevenue: escrow.platformFee, // Platform earnings
    });

    // Notify provider
    await supabase.from('Notification').insert({
      userId: escrow.providerId,
      title: 'Payment Secured in Escrow',
      message: `₹${escrow.grossAmount.toLocaleString()} has been secured. Complete the work to receive ₹${escrow.providerPayout.toLocaleString()}.`,
      type: 'ESCROW_FUNDED',
      link: `/contracts/${escrow.contractId}`,
    });

    // Notify client
    await supabase.from('Notification').insert({
      userId: clientId,
      title: 'Payment Secured',
      message: `Your payment of ₹${escrow.grossAmount.toLocaleString()} is now held in escrow.`,
      type: 'PAYMENT_CAPTURED',
      link: `/contracts/${escrow.contractId}`,
    });

    res.json({
      success: true,
      message: 'Payment captured and held in escrow',
      data: {
        escrowId,
        status: 'HELD_IN_ESCROW',
        grossAmount: escrow.grossAmount,
        providerWillReceive: escrow.providerPayout,
      },
    });
  } catch (error) {
    console.error('Verify escrow payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
};

/**
 * Mark work as submitted - Step 3: Provider submits work
 */
export const submitWork = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { escrowId } = req.params;
    const providerId = req.user!.userId;

    const { data: escrow, error: escrowError } = await supabase
      .from('EscrowTransaction')
      .select('*')
      .eq('id', escrowId)
      .eq('providerId', providerId)
      .single();

    if (escrowError || !escrow) {
      res.status(404).json({ success: false, error: 'Escrow not found' });
      return;
    }

    if (escrow.escrowStatus !== 'HELD_IN_ESCROW') {
      res.status(400).json({ success: false, error: `Cannot submit work in ${escrow.escrowStatus} status` });
      return;
    }

    await supabase
      .from('EscrowTransaction')
      .update({
        escrowStatus: 'WORK_SUBMITTED',
        workSubmittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrowId);

    // Notify client
    await supabase.from('Notification').insert({
      userId: escrow.clientId,
      title: 'Work Submitted for Review',
      message: 'The provider has submitted their work. Please review and approve to release payment.',
      type: 'WORK_SUBMITTED',
      link: `/contracts/${escrow.contractId}`,
    });

    res.json({ success: true, message: 'Work submitted for review', status: 'WORK_SUBMITTED' });
  } catch (error) {
    console.error('Submit work error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit work' });
  }
};

/**
 * Approve work and initiate payout - Step 4: Client approves
 */
export const approveAndRelease = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { escrowId } = req.params;
    const clientId = req.user!.userId;

    const { data: escrow, error: escrowError } = await supabase
      .from('EscrowTransaction')
      .select('*')
      .eq('id', escrowId)
      .eq('clientId', clientId)
      .single();

    if (escrowError || !escrow) {
      res.status(404).json({ success: false, error: 'Escrow not found' });
      return;
    }

    if (escrow.escrowStatus !== 'WORK_SUBMITTED') {
      res.status(400).json({ success: false, error: `Cannot approve in ${escrow.escrowStatus} status` });
      return;
    }

    // Update escrow to approved
    await supabase
      .from('EscrowTransaction')
      .update({
        escrowStatus: 'APPROVED',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrowId);

    // Credit provider wallet (immediate for now, can add delay)
    const { data: wallet } = await supabase
      .from('UserWallet')
      .select('id, balance')
      .eq('userId', escrow.providerId)
      .single();

    const currentBalance = wallet?.balance || 0;
    const newBalance = Number(currentBalance) + Number(escrow.providerPayout);

    await supabase
      .from('UserWallet')
      .upsert({
        userId: escrow.providerId,
        balance: newBalance,
        lastTransactionAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'userId' });

    // Record wallet transaction
    const { data: updatedWallet } = await supabase
      .from('UserWallet')
      .select('id')
      .eq('userId', escrow.providerId)
      .single();

    if (updatedWallet) {
      await supabase.from('WalletTransaction').insert({
        walletId: updatedWallet.id,
        userId: escrow.providerId,
        type: 'CREDIT',
        amount: escrow.providerPayout,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: 'Escrow release - work approved',
        metadata: { escrowId, contractId: escrow.contractId },
      });
    }

    // Create payout record
    await supabase.from('Payout').insert({
      escrowTransactionId: escrowId,
      providerId: escrow.providerId,
      amount: escrow.providerPayout,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });

    // Update escrow to paid out
    await supabase
      .from('EscrowTransaction')
      .update({
        escrowStatus: 'PAID_OUT',
        paidOutAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrowId);

    // Update contract status
    await supabase
      .from('Contract')
      .update({
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrow.contractId);

    // Notify provider
    await supabase.from('Notification').insert({
      userId: escrow.providerId,
      title: 'Payment Released! 🎉',
      message: `₹${escrow.providerPayout.toLocaleString()} has been added to your wallet.`,
      type: 'PAYOUT_COMPLETED',
      link: '/billing/wallet',
    });

    res.json({
      success: true,
      message: 'Work approved and payment released',
      data: {
        escrowId,
        status: 'PAID_OUT',
        amountReleased: escrow.providerPayout,
        providerNewBalance: newBalance,
      },
    });
  } catch (error) {
    console.error('Approve and release error:', error);
    res.status(500).json({ success: false, error: 'Failed to release payment' });
  }
};

/**
 * Raise dispute - Alternative flow
 */
export const raiseDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { escrowId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user!.userId;

    const { data: escrow, error: escrowError } = await supabase
      .from('EscrowTransaction')
      .select('*')
      .eq('id', escrowId)
      .or(`clientId.eq.${userId},providerId.eq.${userId}`)
      .single();

    if (escrowError || !escrow) {
      res.status(404).json({ success: false, error: 'Escrow not found' });
      return;
    }

    if (!['HELD_IN_ESCROW', 'WORK_SUBMITTED'].includes(escrow.escrowStatus)) {
      res.status(400).json({ success: false, error: 'Cannot raise dispute in current status' });
      return;
    }

    // Update escrow status
    await supabase
      .from('EscrowTransaction')
      .update({
        escrowStatus: 'DISPUTED',
        disputedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrowId);

    // Create dispute record
    const againstUser = escrow.clientId === userId ? escrow.providerId : escrow.clientId;
    
    await supabase.from('Dispute').insert({
      contractId: escrow.contractId,
      escrowId,
      raisedBy: userId,
      againstUser,
      reason,
      description,
      status: 'OPEN',
    });

    // Notify both parties and admins
    const otherParty = escrow.clientId === userId ? escrow.providerId : escrow.clientId;
    await supabase.from('Notification').insert([
      {
        userId: otherParty,
        title: 'Dispute Raised',
        message: `A dispute has been raised. Reason: ${reason}`,
        type: 'DISPUTE_RAISED',
        link: `/contracts/${escrow.contractId}`,
      },
    ]);

    res.json({ success: true, message: 'Dispute raised successfully', status: 'DISPUTED' });
  } catch (error) {
    console.error('Raise dispute error:', error);
    res.status(500).json({ success: false, error: 'Failed to raise dispute' });
  }
};

/**
 * Request refund (before work starts)
 */
export const requestRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const clientId = req.user!.userId;

    const { data: escrow, error: escrowError } = await supabase
      .from('EscrowTransaction')
      .select('*')
      .eq('id', escrowId)
      .eq('clientId', clientId)
      .single();

    if (escrowError || !escrow) {
      res.status(404).json({ success: false, error: 'Escrow not found' });
      return;
    }

    // Can only refund if work hasn't been submitted
    if (escrow.escrowStatus !== 'HELD_IN_ESCROW') {
      res.status(400).json({ 
        success: false, 
        error: 'Cannot refund after work has been submitted. Please raise a dispute instead.' 
      });
      return;
    }

    // Process refund to client wallet (minus Razorpay fee which is non-refundable)
    const refundAmount = escrow.amountAfterGateway; // Client gets back amount minus Razorpay fee

    const { data: wallet } = await supabase
      .from('UserWallet')
      .select('id, balance')
      .eq('userId', clientId)
      .single();

    const currentBalance = wallet?.balance || 0;
    const newBalance = Number(currentBalance) + Number(refundAmount);

    await supabase
      .from('UserWallet')
      .upsert({
        userId: clientId,
        balance: newBalance,
        lastTransactionAt: new Date().toISOString(),
      }, { onConflict: 'userId' });

    // Update escrow
    await supabase
      .from('EscrowTransaction')
      .update({
        escrowStatus: 'REFUNDED',
        refundedAt: new Date().toISOString(),
        notes: { ...escrow.notes, refundReason: reason },
        updatedAt: new Date().toISOString(),
      })
      .eq('id', escrowId);

    // Update contract
    await supabase
      .from('Contract')
      .update({ status: 'CANCELLED' })
      .eq('id', escrow.contractId);

    // Notify both parties
    await supabase.from('Notification').insert([
      {
        userId: clientId,
        title: 'Refund Processed',
        message: `₹${refundAmount.toLocaleString()} has been refunded to your wallet. (Razorpay fee of ₹${escrow.razorpayFee} is non-refundable)`,
        type: 'ESCROW_REFUNDED',
      },
      {
        userId: escrow.providerId,
        title: 'Contract Cancelled',
        message: 'The client has cancelled the contract and requested a refund.',
        type: 'CONTRACT_CANCELLED',
      },
    ]);

    res.json({
      success: true,
      message: 'Refund processed',
      data: {
        refundedAmount: refundAmount,
        razorpayFeeDeducted: escrow.razorpayFee,
        note: 'Razorpay fee is non-refundable',
      },
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ success: false, error: 'Failed to process refund' });
  }
};

/**
 * Get escrow details
 */
export const getEscrow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const { data: escrow, error } = await supabase
      .from('EscrowTransaction')
      .select(`
        *,
        contract:Contract(*, advertisement:Advertisement(title, platform)),
        client:User!EscrowTransaction_clientId_fkey(email, clientProfile:ClientProfile(companyName)),
        provider:User!EscrowTransaction_providerId_fkey(email, influencerProfile:InfluencerProfile(displayName))
      `)
      .eq('id', id)
      .or(`clientId.eq.${userId},providerId.eq.${userId}`)
      .single();

    if (error || !escrow) {
      res.status(404).json({ success: false, error: 'Escrow not found' });
      return;
    }

    res.json({ success: true, data: escrow });
  } catch (error) {
    console.error('Get escrow error:', error);
    res.status(500).json({ success: false, error: 'Failed to get escrow' });
  }
};

/**
 * Get escrow by contract ID
 */
export const getEscrowByContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contractId } = req.params;
    const userId = req.user!.userId;

    const { data: escrow, error } = await supabase
      .from('EscrowTransaction')
      .select('*')
      .eq('contractId', contractId)
      .or(`clientId.eq.${userId},providerId.eq.${userId}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({ success: true, data: escrow || null });
  } catch (error) {
    console.error('Get escrow by contract error:', error);
    res.status(500).json({ success: false, error: 'Failed to get escrow' });
  }
};
