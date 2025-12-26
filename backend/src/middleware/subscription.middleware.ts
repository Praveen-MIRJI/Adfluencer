import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import supabase from '../lib/supabase';

// Check if user has active subscription
export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: subscription, error } = await supabase
      .from('UserSubscription')
      .select(`
        *,
        plan:MembershipPlan(*)
      `)
      .eq('userId', req.user!.userId)
      .eq('status', 'ACTIVE')
      .gte('endDate', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!subscription) {
      res.status(403).json({
        success: false,
        error: 'Active subscription required',
        message: 'This feature requires an active subscription. Please subscribe to continue.',
        requiresSubscription: true
      });
      return;
    }

    // Add subscription info to request
    req.subscription = subscription;
    next();

  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify subscription status'
    });
  }
};

// Check if user has sufficient wallet balance for action
export const requireWalletBalance = (actionType: 'BID' | 'ADVERTISEMENT') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get action pricing
      const actionPrices = {
        BID: 5,
        ADVERTISEMENT: 10
      };

      const requiredAmount = actionPrices[actionType];

      // Check wallet balance
      const { data: wallet, error } = await supabase
        .from('UserWallet')
        .select('balance')
        .eq('userId', req.user!.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const currentBalance = wallet?.balance || 0;

      if (currentBalance < requiredAmount) {
        res.status(402).json({
          success: false,
          error: 'Insufficient wallet balance',
          message: `This action requires ₹${requiredAmount}. Your current balance is ₹${currentBalance}.`,
          requiredAmount,
          currentBalance,
          requiresPayment: true
        });
        return;
      }

      // Add balance info to request
      req.walletBalance = currentBalance;
      req.actionCost = requiredAmount;
      next();

    } catch (error) {
      console.error('Wallet balance check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify wallet balance'
      });
    }
  };
};

// Check if user is verified (KYC approved)
export const requireVerification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('isVerified, emailVerified, phoneVerified')
      .eq('id', req.user!.userId)
      .single();

    if (error) throw error;

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        error: 'Account verification required',
        message: 'Please complete KYC verification to access this feature.',
        requiresVerification: true,
        verificationStatus: {
          kycVerified: user.isVerified,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified
        }
      });
      return;
    }

    next();

  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify account status'
    });
  }
};

// Check if messaging is allowed (subscription or payment required)
export const requireMessagingAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user has active subscription
    const { data: subscription } = await supabase
      .from('UserSubscription')
      .select(`
        *,
        plan:MembershipPlan(features)
      `)
      .eq('userId', req.user!.userId)
      .eq('status', 'ACTIVE')
      .gte('endDate', new Date().toISOString())
      .single();

    // If user has subscription with messaging feature, allow access
    if (subscription && subscription.plan.features.messaging) {
      req.subscription = subscription;
      next();
      return;
    }

    // Otherwise, require payment for messaging
    const messagingCost = 2; // ₹2 per message

    const { data: wallet } = await supabase
      .from('UserWallet')
      .select('balance')
      .eq('userId', req.user!.userId)
      .single();

    const currentBalance = wallet?.balance || 0;

    if (currentBalance < messagingCost) {
      res.status(402).json({
        success: false,
        error: 'Messaging access restricted',
        message: 'Messaging requires either an active subscription or ₹2 per message. Please subscribe or add money to your wallet.',
        options: {
          subscription: 'Subscribe to unlimited messaging',
          payPerMessage: `Pay ₹${messagingCost} per message`
        },
        requiredAmount: messagingCost,
        currentBalance,
        requiresPayment: true
      });
      return;
    }

    req.walletBalance = currentBalance;
    req.messagingCost = messagingCost;
    next();

  } catch (error) {
    console.error('Messaging access check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify messaging access'
    });
  }
};

// Deduct wallet balance for action
export const deductWalletBalance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const actionCost = req.actionCost || req.messagingCost;
    const currentBalance = req.walletBalance;

    if (!actionCost || !currentBalance) {
      next();
      return;
    }

    const newBalance = currentBalance - actionCost;

    // Update wallet balance
    const { error: walletError } = await supabase
      .from('UserWallet')
      .update({
        balance: newBalance,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', req.user!.userId);

    if (walletError) throw walletError;

    // Create wallet transaction record
    const actionType = req.actionCost ? (req.actionCost === 5 ? 'BID' : 'ADVERTISEMENT') : 'MESSAGE';
    const description = req.actionCost 
      ? (req.actionCost === 5 ? 'Bid submission fee' : 'Advertisement posting fee')
      : 'Message sending fee';

    await supabase
      .from('WalletTransaction')
      .insert({
        userId: req.user!.userId,
        type: 'DEBIT',
        amount: actionCost,
        description,
        balanceAfter: newBalance,
        resourceType: actionType,
        resourceId: req.body.id || req.params.id
      });

    // Update request with new balance
    req.walletBalance = newBalance;
    next();

  } catch (error) {
    console.error('Deduct wallet balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment'
    });
  }
};