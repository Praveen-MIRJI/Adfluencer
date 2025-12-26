import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../lib/supabase';
import { validationResult } from 'express-validator';

// Get all membership plans
export const getMembershipPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: plans, error } = await supabase
      .from('MembershipPlan')
      .select('*')
      .eq('isActive', true)
      .order('price', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('Get membership plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get membership plans'
    });
  }
};

// Get user's current subscription
export const getUserSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: subscription, error } = await supabase
      .from('UserSubscription')
      .select(`
        *,
        plan:MembershipPlan(*)
      `)
      .eq('userId', req.user!.userId)
      .eq('status', 'ACTIVE')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!subscription) {
      res.json({
        success: true,
        data: {
          status: 'NO_SUBSCRIPTION',
          message: 'No active subscription found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user subscription'
    });
  }
};

// Subscribe to a membership plan
export const subscribeToPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { planId, paymentMethodId } = req.body;

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('MembershipPlan')
      .select('*')
      .eq('id', planId)
      .eq('isActive', true)
      .single();

    if (planError || !plan) {
      res.status(404).json({
        success: false,
        error: 'Membership plan not found'
      });
      return;
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('UserSubscription')
      .select('id, status')
      .eq('userId', req.user!.userId)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      res.status(400).json({
        success: false,
        error: 'You already have an active subscription. Please cancel it first.'
      });
      return;
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (plan.billingCycle === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.billingCycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // In a real implementation, process payment here
    // For now, we'll simulate successful payment
    const paymentSuccessful = true;

    if (!paymentSuccessful) {
      res.status(400).json({
        success: false,
        error: 'Payment processing failed'
      });
      return;
    }

    // Create subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from('UserSubscription')
      .insert({
        userId: req.user!.userId,
        planId,
        status: 'ACTIVE',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true
      })
      .select(`
        *,
        plan:MembershipPlan(*)
      `)
      .single();

    if (subscriptionError) throw subscriptionError;

    // Create payment record
    await supabase
      .from('Payment')
      .insert({
        userId: req.user!.userId,
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: 'INR',
        paymentMethod: 'CARD',
        paymentMethodId,
        status: 'COMPLETED',
        transactionId: `txn_${Date.now()}`, // In real implementation, use actual transaction ID
        description: `Subscription to ${plan.name}`,
        paidAt: new Date().toISOString()
      });

    // Update user's wallet if plan includes credits
    if (plan.features.credits && plan.features.credits > 0) {
      await supabase
        .from('UserWallet')
        .upsert({
          userId: req.user!.userId,
          balance: plan.features.credits,
          currency: 'INR'
        }, {
          onConflict: 'userId'
        });
    }

    // Create notification
    await supabase
      .from('Notification')
      .insert({
        userId: req.user!.userId,
        title: 'Subscription Activated!',
        message: `Your ${plan.name} subscription has been activated successfully.`,
        type: 'SUBSCRIPTION_ACTIVATED',
        link: '/billing/subscription'
      });

    // Log activity
    await supabase
      .from('UserActivity')
      .insert({
        userId: req.user!.userId,
        action: 'SUBSCRIPTION_CREATED',
        resource: 'SUBSCRIPTION',
        resourceId: subscription.id,
        metadata: { planName: plan.name, amount: plan.price }
      });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription activated successfully!'
    });

  } catch (error) {
    console.error('Subscribe to plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    // Get active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('UserSubscription')
      .select(`
        *,
        plan:MembershipPlan(name)
      `)
      .eq('userId', req.user!.userId)
      .eq('status', 'ACTIVE')
      .single();

    if (subscriptionError || !subscription) {
      res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
      return;
    }

    // Update subscription status
    const { data: canceledSubscription, error: cancelError } = await supabase
      .from('UserSubscription')
      .update({
        status: 'CANCELED',
        canceledAt: new Date().toISOString(),
        cancelReason: reason,
        autoRenew: false
      })
      .eq('id', subscription.id)
      .select()
      .single();

    if (cancelError) throw cancelError;

    // Create notification
    await supabase
      .from('Notification')
      .insert({
        userId: req.user!.userId,
        title: 'Subscription Canceled',
        message: `Your ${subscription.plan.name} subscription has been canceled. You can continue using premium features until ${new Date(subscription.endDate).toLocaleDateString()}.`,
        type: 'SUBSCRIPTION_CANCELED',
        link: '/billing/subscription'
      });

    // Log activity
    await supabase
      .from('UserActivity')
      .insert({
        userId: req.user!.userId,
        action: 'SUBSCRIPTION_CANCELED',
        resource: 'SUBSCRIPTION',
        resourceId: subscription.id,
        metadata: { reason, planName: subscription.plan.name }
      });

    res.json({
      success: true,
      data: canceledSubscription,
      message: 'Subscription canceled successfully'
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
};

// Get user's payment history
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data: payments, count, error } = await supabase
      .from('Payment')
      .select(`
        *,
        subscription:UserSubscription(
          plan:MembershipPlan(name)
        )
      `, { count: 'exact' })
      .eq('userId', req.user!.userId)
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
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment history'
    });
  }
};

// Get user's wallet balance
export const getWalletBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: wallet, error } = await supabase
      .from('UserWallet')
      .select('*')
      .eq('userId', req.user!.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!wallet) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('UserWallet')
        .insert({
          userId: req.user!.userId,
          balance: 0,
          currency: 'INR'
        })
        .select()
        .single();

      if (createError) throw createError;

      res.json({
        success: true,
        data: newWallet
      });
      return;
    }

    res.json({
      success: true,
      data: wallet
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balance'
    });
  }
};

// Add money to wallet
export const addMoneyToWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { amount, paymentMethodId } = req.body;

    if (amount < 10) {
      res.status(400).json({
        success: false,
        error: 'Minimum amount to add is ₹10'
      });
      return;
    }

    // In a real implementation, process payment here
    const paymentSuccessful = true;

    if (!paymentSuccessful) {
      res.status(400).json({
        success: false,
        error: 'Payment processing failed'
      });
      return;
    }

    // Get current wallet balance
    const { data: wallet } = await supabase
      .from('UserWallet')
      .select('balance')
      .eq('userId', req.user!.userId)
      .single();

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + amount;

    // Update wallet balance
    const { data: updatedWallet, error: walletError } = await supabase
      .from('UserWallet')
      .upsert({
        userId: req.user!.userId,
        balance: newBalance,
        currency: 'INR',
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'userId'
      })
      .select()
      .single();

    if (walletError) throw walletError;

    // Create payment record
    await supabase
      .from('Payment')
      .insert({
        userId: req.user!.userId,
        amount,
        currency: 'INR',
        paymentMethod: 'CARD',
        paymentMethodId,
        status: 'COMPLETED',
        transactionId: `wallet_${Date.now()}`,
        description: 'Wallet top-up',
        paidAt: new Date().toISOString()
      });

    // Create wallet transaction record
    await supabase
      .from('WalletTransaction')
      .insert({
        userId: req.user!.userId,
        type: 'CREDIT',
        amount,
        description: 'Wallet top-up',
        balanceAfter: newBalance,
        transactionId: `wallet_${Date.now()}`
      });

    // Create notification
    await supabase
      .from('Notification')
      .insert({
        userId: req.user!.userId,
        title: 'Wallet Recharged',
        message: `₹${amount} has been added to your wallet successfully.`,
        type: 'WALLET_CREDITED',
        link: '/billing/wallet'
      });

    // Log activity
    await supabase
      .from('UserActivity')
      .insert({
        userId: req.user!.userId,
        action: 'WALLET_RECHARGED',
        resource: 'WALLET',
        resourceId: req.user!.userId,
        metadata: { amount, newBalance }
      });

    res.json({
      success: true,
      data: updatedWallet,
      message: `₹${amount} added to wallet successfully!`
    });

  } catch (error) {
    console.error('Add money to wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add money to wallet'
    });
  }
};

// Process per-action payment (bid/advertisement)
export const processActionPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { actionType, resourceId } = req.body;

    // Get pricing for the action
    let actionPrice = 0;
    let description = '';

    switch (actionType) {
      case 'BID':
        actionPrice = 5; // ₹5 per bid
        description = 'Bid submission fee';
        break;
      case 'ADVERTISEMENT':
        actionPrice = 10; // ₹10 per advertisement
        description = 'Advertisement posting fee';
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid action type'
        });
        return;
    }

    // Check if user has sufficient wallet balance
    const { data: wallet } = await supabase
      .from('UserWallet')
      .select('balance')
      .eq('userId', req.user!.userId)
      .single();

    const currentBalance = wallet?.balance || 0;

    if (currentBalance < actionPrice) {
      res.status(400).json({
        success: false,
        error: `Insufficient wallet balance. Required: ₹${actionPrice}, Available: ₹${currentBalance}`,
        requiredAmount: actionPrice,
        availableAmount: currentBalance
      });
      return;
    }

    // Deduct amount from wallet
    const newBalance = currentBalance - actionPrice;

    const { error: walletError } = await supabase
      .from('UserWallet')
      .update({
        balance: newBalance,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', req.user!.userId);

    if (walletError) throw walletError;

    // Create wallet transaction record
    await supabase
      .from('WalletTransaction')
      .insert({
        userId: req.user!.userId,
        type: 'DEBIT',
        amount: actionPrice,
        description,
        balanceAfter: newBalance,
        resourceType: actionType,
        resourceId
      });

    // Log activity
    await supabase
      .from('UserActivity')
      .insert({
        userId: req.user!.userId,
        action: `${actionType}_PAYMENT`,
        resource: actionType,
        resourceId,
        metadata: { amount: actionPrice, newBalance }
      });

    res.json({
      success: true,
      data: {
        amountDeducted: actionPrice,
        newBalance,
        description
      },
      message: `Payment of ₹${actionPrice} processed successfully`
    });

  } catch (error) {
    console.error('Process action payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment'
    });
  }
};

// Get wallet transaction history
export const getWalletTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('WalletTransaction')
      .select('*', { count: 'exact' })
      .eq('userId', req.user!.userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (type && ['CREDIT', 'DEBIT'].includes(type as string)) {
      query = query.eq('type', type);
    }

    const { data: transactions, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet transactions'
    });
  }
};