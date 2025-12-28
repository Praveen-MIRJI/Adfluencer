import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../lib/supabase';
import { validationResult } from 'express-validator';
import { createOrder, verifyPayment } from '../lib/razorpay';

// Get all membership plans (optionally filtered by role)
export const getMembershipPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;

    let query = supabase
      .from('MembershipPlan')
      .select('*')
      .eq('isActive', true)
      .order('price', { ascending: true });

    // If role is provided, filter plans:
    // - Show plans specifically for that role
    // - Show plans for ALL
    // - Exclude plans for the opposite role
    if (role === 'CLIENT') {
      // Clients see: CLIENT plans + ALL plans (exclude INFLUENCER-only plans)
      query = query.in('targetRole', ['CLIENT', 'ALL']);
    } else if (role === 'INFLUENCER') {
      // Influencers see: INFLUENCER plans + ALL plans (exclude CLIENT-only plans)
      query = query.in('targetRole', ['INFLUENCER', 'ALL']);
    }

    const { data: plans, error } = await query;

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

// Subscribe to a membership plan (wallet-first, then Razorpay)
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

    const { planId, useWallet = true } = req.body;
    const userId = req.user!.userId;

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
      .eq('userId', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      res.status(400).json({
        success: false,
        error: 'You already have an active subscription. Please cancel it first.'
      });
      return;
    }

    const planPrice = Number(plan.price);

    // Check wallet balance if useWallet is true
    if (useWallet && planPrice > 0) {
      const { data: wallet } = await supabase
        .from('UserWallet')
        .select('*')
        .eq('userId', userId)
        .single();

      const walletBalance = wallet ? Number(wallet.balance) : 0;

      // If wallet has sufficient balance, use wallet
      if (walletBalance >= planPrice) {
        // Deduct from wallet
        const newWalletBalance = walletBalance - planPrice;
        const { error: updateWalletError } = await supabase
          .from('UserWallet')
          .update({
            balance: newWalletBalance,
            lastTransactionAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('id', wallet.id);

        if (updateWalletError) throw updateWalletError;

        // Create wallet transaction record
        await supabase
          .from('WalletTransaction')
          .insert({
            walletId: wallet.id,
            userId,
            type: 'DEBIT',
            amount: planPrice,
            balanceBefore: walletBalance,
            balanceAfter: newWalletBalance,
            description: `Subscription to ${plan.name}`,
            resourceType: 'SUBSCRIPTION',
            metadata: { planId, planName: plan.name }
          });

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date();
        
        if (plan.billingCycle === 'MONTHLY') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan.billingCycle === 'YEARLY') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else if (plan.billingCycle === 'ONE_TIME' || plan.billingCycle === 'PER_ACTION') {
          endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime for one-time
        }

        // Create subscription record
        const { data: subscription, error: subscriptionError } = await supabase
          .from('UserSubscription')
          .insert({
            userId,
            planId,
            status: 'ACTIVE',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            autoRenew: plan.billingCycle !== 'ONE_TIME' && plan.billingCycle !== 'PER_ACTION'
          })
          .select(`*, plan:MembershipPlan(*)`)
          .single();

        if (subscriptionError) throw subscriptionError;

        // Create payment record
        await supabase
          .from('Payment')
          .insert({
            userId,
            subscriptionId: subscription.id,
            amount: planPrice,
            currency: 'INR',
            paymentMethod: 'WALLET',
            status: 'COMPLETED',
            transactionId: `txn_wlt_${Date.now()}`,
            description: `Subscription to ${plan.name} (from wallet)`,
            paidAt: new Date().toISOString()
          });

        // Create notification
        await supabase
          .from('Notification')
          .insert({
            userId,
            title: 'Subscription Activated!',
            message: `Your ${plan.name} subscription has been activated successfully.`,
            type: 'SUBSCRIPTION_ACTIVATED',
            link: '/billing/subscription'
          });

        res.status(201).json({
          success: true,
          data: {
            subscription,
            paymentMethod: 'WALLET',
            walletBalance: newWalletBalance
          },
          message: 'Subscription activated successfully!'
        });
        return;
      }

      // Wallet insufficient - return info for Razorpay
      res.json({
        success: true,
        data: {
          requiresRazorpay: true,
          walletBalance,
          planPrice,
          shortfall: planPrice - walletBalance,
          plan
        }
      });
      return;
    }

    // If not using wallet or free plan, create Razorpay order
    if (planPrice > 0) {
      const shortUserId = userId.substring(0, 8);
      const orderResult = await createOrder({
        amount: planPrice,
        currency: 'INR',
        receipt: `sub_${shortUserId}_${Date.now()}`,
        notes: {
          userId,
          planId,
          planName: plan.name,
          type: 'SUBSCRIPTION'
        }
      });

      if (!orderResult.success || !orderResult.order) {
        res.status(500).json({
          success: false,
          error: orderResult.error || 'Failed to create payment order'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          requiresRazorpay: true,
          razorpayOrder: {
            id: orderResult.order.id,
            amount: orderResult.order.amount,
            currency: orderResult.order.currency
          },
          plan
        }
      });
      return;
    }

    // Free plan - activate directly
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 100);

    const { data: subscription, error: subscriptionError } = await supabase
      .from('UserSubscription')
      .insert({
        userId,
        planId,
        status: 'ACTIVE',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: false
      })
      .select(`*, plan:MembershipPlan(*)`)
      .single();

    if (subscriptionError) throw subscriptionError;

    await supabase
      .from('Notification')
      .insert({
        userId,
        title: 'Free Plan Activated!',
        message: `Your ${plan.name} has been activated successfully.`,
        type: 'SUBSCRIPTION_ACTIVATED',
        link: '/billing/subscription'
      });

    res.status(201).json({
      success: true,
      data: { subscription, paymentMethod: 'FREE' },
      message: 'Free plan activated successfully!'
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
        status: 'CANCELLED',
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
        message: `Your ${subscription.plan.name} subscription has been canceled.`,
        type: 'SUBSCRIPTION_CANCELED',
        link: '/billing/subscription'
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

// Get user's wallet
export const getUserWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Get or create wallet
    let { data: wallet, error } = await supabase
      .from('UserWallet')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create wallet if doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('UserWallet')
        .insert({
          userId,
          balance: 0,
          lockedBalance: 0,
          currency: 'INR'
        })
        .select()
        .single();

      if (createError) throw createError;
      wallet = newWallet;
    } else if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: wallet
    });

  } catch (error) {
    console.error('Get user wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet'
    });
  }
};

// Get wallet transactions
export const getWalletTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get user's wallet first
    const { data: wallet, error: walletError } = await supabase
      .from('UserWallet')
      .select('id')
      .eq('userId', userId)
      .single();

    if (walletError) {
      res.json({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });
      return;
    }

    const { data: transactions, count, error } = await supabase
      .from('WalletTransaction')
      .select('*', { count: 'exact' })
      .eq('walletId', wallet.id)
      .order('createdAt', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: transactions || [],
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

// Create Razorpay order for wallet top-up
export const createWalletTopupOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { amount } = req.body;

    console.log('Wallet topup request:', { userId, amount });

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Validate amount
    const amountNum = Number(amount);
    if (!amountNum || amountNum < 10 || amountNum > 50000) {
      res.status(400).json({
        success: false,
        error: 'Amount must be between ₹10 and ₹50,000'
      });
      return;
    }

    // Create Razorpay order - receipt must be max 40 chars
    console.log('Creating Razorpay order for wallet topup:', { amount: amountNum, userId });
    
    const shortUserId = userId.substring(0, 8);
    const orderResult = await createOrder({
      amount: amountNum,
      currency: 'INR',
      receipt: `wlt_${shortUserId}_${Date.now()}`,
      notes: {
        userId,
        type: 'WALLET_TOPUP',
        amount: amountNum.toString()
      }
    });

    console.log('Razorpay order result:', orderResult);

    if (!orderResult.success || !orderResult.order) {
      res.status(500).json({
        success: false,
        error: orderResult.error || 'Failed to create payment order'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        razorpayOrder: {
          id: orderResult.order.id,
          amount: orderResult.order.amount,
          currency: orderResult.order.currency
        },
        amount: amountNum
      }
    });

  } catch (error: any) {
    console.error('Create wallet topup order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment order'
    });
  }
};

// Verify wallet top-up payment
export const verifyWalletTopup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderId, paymentId, signature, amount } = req.body;

    console.log('Verify wallet topup:', { userId, orderId, paymentId, amount });

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Verify Razorpay signature
    const isValid = verifyPayment({ orderId, paymentId, signature });

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
      return;
    }

    // Get or create wallet
    let { data: wallet, error: walletError } = await supabase
      .from('UserWallet')
      .select('*')
      .eq('userId', userId)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await supabase
        .from('UserWallet')
        .insert({
          userId,
          balance: 0,
          lockedBalance: 0,
          currency: 'INR'
        })
        .select()
        .single();

      if (createError) throw createError;
      wallet = newWallet;
    } else if (walletError) {
      throw walletError;
    }

    const currentBalance = Number(wallet.balance) || 0;
    const newBalance = currentBalance + Number(amount);

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('UserWallet')
      .update({
        balance: newBalance,
        lastTransactionAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (updateError) throw updateError;

    // Create wallet transaction record
    const { error: transactionError } = await supabase
      .from('WalletTransaction')
      .insert({
        walletId: wallet.id,
        userId,
        type: 'CREDIT',
        amount: Number(amount),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Wallet top-up via Razorpay`,
        metadata: {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId
        }
      });

    if (transactionError) throw transactionError;

    // Create notification
    await supabase
      .from('Notification')
      .insert({
        userId,
        title: 'Wallet Top-up Successful',
        message: `₹${amount} has been added to your wallet.`,
        type: 'WALLET_TOPUP',
        link: '/billing'
      });

    res.json({
      success: true,
      data: {
        newBalance,
        amountAdded: Number(amount)
      },
      message: `₹${amount} added to wallet successfully!`
    });

  } catch (error) {
    console.error('Verify wallet topup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
};

// Verify subscription payment via Razorpay
export const verifySubscriptionPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderId, paymentId, signature, planId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Verify Razorpay signature
    const isValid = verifyPayment({ orderId, paymentId, signature });

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
      return;
    }

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
      .select('id')
      .eq('userId', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      res.status(400).json({
        success: false,
        error: 'You already have an active subscription'
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
    } else {
      endDate.setFullYear(endDate.getFullYear() + 100);
    }

    // Create subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from('UserSubscription')
      .insert({
        userId,
        planId,
        status: 'ACTIVE',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: plan.billingCycle !== 'ONE_TIME' && plan.billingCycle !== 'PER_ACTION'
      })
      .select(`*, plan:MembershipPlan(*)`)
      .single();

    if (subscriptionError) throw subscriptionError;

    // Create payment record
    await supabase
      .from('Payment')
      .insert({
        userId,
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: 'INR',
        paymentMethod: 'RAZORPAY',
        status: 'COMPLETED',
        transactionId: paymentId,
        description: `Subscription to ${plan.name}`,
        paidAt: new Date().toISOString(),
        metadata: { razorpayOrderId: orderId }
      });

    // Create notification
    await supabase
      .from('Notification')
      .insert({
        userId,
        title: 'Subscription Activated!',
        message: `Your ${plan.name} subscription has been activated successfully.`,
        type: 'SUBSCRIPTION_ACTIVATED',
        link: '/billing/subscription'
      });

    res.json({
      success: true,
      data: { subscription },
      message: 'Subscription activated successfully!'
    });

  } catch (error) {
    console.error('Verify subscription payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify subscription payment'
    });
  }
};
