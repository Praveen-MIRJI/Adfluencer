import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { createOrder } from '../lib/razorpay';
import { AuthRequest } from '../types';
import crypto from 'crypto';

// Get user's credit balance
export const getUserCredits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get or create user credits record
    let { data: userCredits, error } = await supabase
      .from('UserCredits')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create new record if doesn't exist
      const { data: newCredits, error: createError } = await supabase
        .from('UserCredits')
        .insert({
          userId,
          bidCredits: 0,
          postCredits: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      userCredits = newCredits;
    } else if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: userCredits
    });
  } catch (error: any) {
    console.error('Get user credits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user credits'
    });
  }
};

// Get credit settings (for pricing)
export const getCreditSettings = async (req: Request, res: Response) => {
  try {
    const { data: settings, error } = await supabase
      .from('CreditSettings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error('Get credit settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit settings'
    });
  }
};

// Purchase credits (create Razorpay order OR use wallet)
export const purchaseCredits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { creditType, quantity, useWallet } = req.body;

    console.log('Purchase credits request:', { userId, creditType, quantity, useWallet });

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!['BID', 'POST'].includes(creditType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credit type'
      });
    }

    if (!quantity || quantity < 1 || quantity > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity (1-1000)'
      });
    }

    // Get credit settings
    const { data: settings, error: settingsError } = await supabase
      .from('CreditSettings')
      .select('*')
      .eq('id', 'default')
      .single();

    console.log('Credit settings:', settings, 'Error:', settingsError);

    if (settingsError) {
      console.error('Settings error:', settingsError);
      throw settingsError;
    }

    if (!settings.creditSystemEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Credit system is currently disabled'
      });
    }

    // Calculate amount
    const pricePerCredit = creditType === 'BID' ? Number(settings.bidCreditPrice) : Number(settings.postCreditPrice);
    const totalAmount = pricePerCredit * quantity;

    // Check wallet balance if useWallet is true or not specified (default to wallet)
    if (useWallet !== false) {
      const { data: wallet, error: walletError } = await supabase
        .from('UserWallet')
        .select('*')
        .eq('userId', userId)
        .single();

      const walletBalance = wallet ? Number(wallet.balance) : 0;

      // If wallet has sufficient balance, use wallet
      if (walletBalance >= totalAmount) {
        console.log('Using wallet for purchase:', { walletBalance, totalAmount });

        // Deduct from wallet
        const newWalletBalance = walletBalance - totalAmount;
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
            amount: totalAmount,
            balanceBefore: walletBalance,
            balanceAfter: newWalletBalance,
            description: `Purchased ${quantity} ${creditType.toLowerCase()} credits`,
            resourceType: 'CREDIT_PURCHASE',
            metadata: { creditType, quantity, pricePerCredit }
          });

        // Get or create user credits
        let { data: userCredits, error: creditsError } = await supabase
          .from('UserCredits')
          .select('*')
          .eq('userId', userId)
          .single();

        if (creditsError && creditsError.code === 'PGRST116') {
          const { data: newCredits, error: createError } = await supabase
            .from('UserCredits')
            .insert({ userId, bidCredits: 0, postCredits: 0 })
            .select()
            .single();
          if (createError) throw createError;
          userCredits = newCredits;
        } else if (creditsError) {
          throw creditsError;
        }

        // Update user credits
        const newBidCredits = creditType === 'BID' 
          ? userCredits.bidCredits + quantity 
          : userCredits.bidCredits;
        const newPostCredits = creditType === 'POST' 
          ? userCredits.postCredits + quantity 
          : userCredits.postCredits;

        const { error: updateCreditsError } = await supabase
          .from('UserCredits')
          .update({
            bidCredits: newBidCredits,
            postCredits: newPostCredits,
            ...(creditType === 'BID' 
              ? { totalBidCreditsPurchased: userCredits.totalBidCreditsPurchased + quantity }
              : { totalPostCreditsPurchased: userCredits.totalPostCreditsPurchased + quantity }
            ),
            updatedAt: new Date().toISOString()
          })
          .eq('userId', userId);

        if (updateCreditsError) throw updateCreditsError;

        // Create credit transaction record
        await supabase
          .from('CreditTransaction')
          .insert({
            userId,
            transactionType: creditType === 'BID' ? 'PURCHASE_BID_CREDITS' : 'PURCHASE_POST_CREDITS',
            creditType,
            amount: totalAmount,
            credits: quantity,
            balanceAfter: creditType === 'BID' ? newBidCredits : newPostCredits,
            description: `Purchase ${quantity} ${creditType.toLowerCase()} credits (from wallet)`,
            paymentStatus: 'COMPLETED',
            metadata: { pricePerCredit, quantity, paymentMethod: 'WALLET' }
          });

        return res.json({
          success: true,
          data: {
            paymentMethod: 'WALLET',
            creditsAdded: quantity,
            newBalance: creditType === 'BID' ? newBidCredits : newPostCredits,
            walletBalance: newWalletBalance,
            creditType
          },
          message: `Successfully purchased ${quantity} ${creditType.toLowerCase()} credits from wallet!`
        });
      }

      // If wallet doesn't have enough, return info about needing Razorpay
      return res.json({
        success: true,
        data: {
          requiresRazorpay: true,
          walletBalance,
          totalAmount,
          shortfall: totalAmount - walletBalance
        }
      });
    }

    // If explicitly not using wallet, create Razorpay order
    console.log('Creating Razorpay order:', { pricePerCredit, totalAmount, quantity });

    // Create Razorpay order
    const shortUserId = userId.substring(0, 8);
    const razorpayOrderResult = await createOrder({
      amount: totalAmount,
      currency: 'INR',
      receipt: `cr_${shortUserId}_${Date.now()}`,
      notes: {
        userId,
        creditType,
        quantity: quantity.toString(),
        pricePerCredit: pricePerCredit.toString()
      }
    });

    console.log('Razorpay order result:', razorpayOrderResult);

    if (!razorpayOrderResult.success || !razorpayOrderResult.order) {
      console.error('Razorpay order failed:', razorpayOrderResult.error);
      return res.status(500).json({
        success: false,
        error: razorpayOrderResult.error || 'Failed to create payment order'
      });
    }

    const razorpayOrder = razorpayOrderResult.order;

    // Create credit transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('CreditTransaction')
      .insert({
        userId,
        transactionType: creditType === 'BID' ? 'PURCHASE_BID_CREDITS' : 'PURCHASE_POST_CREDITS',
        creditType,
        amount: totalAmount,
        credits: quantity,
        balanceAfter: 0, // Will be updated after payment
        description: `Purchase ${quantity} ${creditType.toLowerCase()} credits`,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'PENDING',
        metadata: {
          pricePerCredit,
          quantity
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
      throw transactionError;
    }

    console.log('Transaction created:', transaction.id);

    res.json({
      success: true,
      data: {
        paymentMethod: 'RAZORPAY',
        transaction,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency
        },
        totalAmount,
        quantity,
        pricePerCredit
      }
    });
  } catch (error: any) {
    console.error('Purchase credits error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create credit purchase order'
    });
  }
};

// Verify credit purchase payment
export const verifyCreditPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify Razorpay signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    // Get transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('CreditTransaction')
      .select('*')
      .eq('razorpayOrderId', orderId)
      .eq('userId', userId)
      .single();

    if (transactionError) throw transactionError;

    if (transaction.paymentStatus === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Payment already processed'
      });
    }

    // Update transaction status
    const { error: updateTransactionError } = await supabase
      .from('CreditTransaction')
      .update({
        razorpayPaymentId: paymentId,
        paymentStatus: 'COMPLETED',
        updatedAt: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (updateTransactionError) throw updateTransactionError;

    // Get current user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('UserCredits')
      .select('*')
      .eq('userId', userId)
      .single();

    if (creditsError) throw creditsError;

    // Update user credits
    const newBidCredits = transaction.creditType === 'BID' 
      ? userCredits.bidCredits + transaction.credits 
      : userCredits.bidCredits;
    
    const newPostCredits = transaction.creditType === 'POST' 
      ? userCredits.postCredits + transaction.credits 
      : userCredits.postCredits;

    const newTotalPurchased = transaction.creditType === 'BID'
      ? userCredits.totalBidCreditsPurchased + transaction.credits
      : userCredits.totalPostCreditsPurchased + transaction.credits;

    const { error: updateCreditsError } = await supabase
      .from('UserCredits')
      .update({
        bidCredits: newBidCredits,
        postCredits: newPostCredits,
        ...(transaction.creditType === 'BID' 
          ? { totalBidCreditsPurchased: newTotalPurchased }
          : { totalPostCreditsPurchased: newTotalPurchased }
        ),
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId);

    if (updateCreditsError) throw updateCreditsError;

    // Update transaction with final balance
    const finalBalance = transaction.creditType === 'BID' ? newBidCredits : newPostCredits;
    
    const { error: updateBalanceError } = await supabase
      .from('CreditTransaction')
      .update({
        balanceAfter: finalBalance
      })
      .eq('id', transaction.id);

    if (updateBalanceError) throw updateBalanceError;

    res.json({
      success: true,
      data: {
        creditsAdded: transaction.credits,
        newBalance: finalBalance,
        creditType: transaction.creditType
      }
    });
  } catch (error: any) {
    console.error('Verify credit payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
};

// Use credit (for bidding or posting)
export const useCredit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { creditType, resourceId, description } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!['BID', 'POST'].includes(creditType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credit type'
      });
    }

    // Check if credit system is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('CreditSettings')
      .select('creditSystemEnabled')
      .eq('id', 'default')
      .single();

    if (settingsError) throw settingsError;

    if (!settings.creditSystemEnabled) {
      // If credit system is disabled, allow the action
      return res.json({
        success: true,
        data: { creditSystemDisabled: true }
      });
    }

    // Get user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('UserCredits')
      .select('*')
      .eq('userId', userId)
      .single();

    if (creditsError) throw creditsError;

    const availableCredits = creditType === 'BID' ? userCredits.bidCredits : userCredits.postCredits;

    if (availableCredits < 1) {
      return res.status(400).json({
        success: false,
        error: `Insufficient ${creditType.toLowerCase()} credits`,
        availableCredits
      });
    }

    // Deduct credit
    const newBidCredits = creditType === 'BID' ? userCredits.bidCredits - 1 : userCredits.bidCredits;
    const newPostCredits = creditType === 'POST' ? userCredits.postCredits - 1 : userCredits.postCredits;
    const newTotalUsed = creditType === 'BID'
      ? userCredits.totalBidCreditsUsed + 1
      : userCredits.totalPostCreditsUsed + 1;

    const { error: updateCreditsError } = await supabase
      .from('UserCredits')
      .update({
        bidCredits: newBidCredits,
        postCredits: newPostCredits,
        ...(creditType === 'BID' 
          ? { totalBidCreditsUsed: newTotalUsed }
          : { totalPostCreditsUsed: newTotalUsed }
        ),
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId);

    if (updateCreditsError) throw updateCreditsError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('CreditTransaction')
      .insert({
        userId,
        transactionType: creditType === 'BID' ? 'USE_BID_CREDIT' : 'USE_POST_CREDIT',
        creditType,
        credits: -1, // Negative for usage
        balanceAfter: creditType === 'BID' ? newBidCredits : newPostCredits,
        description: description || `Used ${creditType.toLowerCase()} credit`,
        paymentStatus: 'COMPLETED',
        metadata: { resourceId }
      });

    if (transactionError) throw transactionError;

    res.json({
      success: true,
      data: {
        creditsUsed: 1,
        remainingCredits: creditType === 'BID' ? newBidCredits : newPostCredits,
        creditType
      }
    });
  } catch (error: any) {
    console.error('Use credit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to use credit'
    });
  }
};

// Get credit transaction history
export const getCreditHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { data: transactions, error } = await supabase
      .from('CreditTransaction')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: transactions
    });
  } catch (error: any) {
    console.error('Get credit history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit history'
    });
  }
};


// Claim spin wheel bonus credits
export const claimSpinWheelCredits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { credits } = req.body; // Credits won from spin wheel (1-5)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate credits amount
    if (!credits || credits < 1 || credits > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credits amount (must be 1-5)'
      });
    }

    // Check if user has already claimed spin wheel
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, role, spinWheelClaimed')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.spinWheelClaimed === true) {
      return res.status(400).json({
        success: false,
        error: 'Spin wheel bonus already claimed'
      });
    }

    // Determine credit type based on user role
    const creditType = user.role === 'CLIENT' ? 'POST' : 'BID';

    // Get or create user credits record
    let { data: userCredits, error: creditsError } = await supabase
      .from('UserCredits')
      .select('*')
      .eq('userId', userId)
      .single();

    if (creditsError && creditsError.code === 'PGRST116') {
      // Create new record if doesn't exist
      const { data: newCredits, error: createError } = await supabase
        .from('UserCredits')
        .insert({
          userId,
          bidCredits: 0,
          postCredits: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      userCredits = newCredits;
    } else if (creditsError) {
      throw creditsError;
    }

    // Update credits based on role
    const newBidCredits = creditType === 'BID' 
      ? (userCredits?.bidCredits || 0) + credits 
      : (userCredits?.bidCredits || 0);
    
    const newPostCredits = creditType === 'POST' 
      ? (userCredits?.postCredits || 0) + credits 
      : (userCredits?.postCredits || 0);

    // Update user credits
    const { error: updateCreditsError } = await supabase
      .from('UserCredits')
      .update({
        bidCredits: newBidCredits,
        postCredits: newPostCredits,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId);

    if (updateCreditsError) throw updateCreditsError;

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('CreditTransaction')
      .insert({
        userId,
        transactionType: 'FREE_CREDITS_GIVEN',
        creditType,
        credits,
        balanceAfter: creditType === 'BID' ? newBidCredits : newPostCredits,
        description: `Welcome bonus: ${credits} free ${creditType.toLowerCase()} credits from spin wheel`,
        paymentStatus: 'COMPLETED',
        metadata: { reason: 'spin_wheel_bonus' }
      });

    if (transactionError) throw transactionError;

    // Mark spin wheel as claimed
    const { error: updateUserError } = await supabase
      .from('User')
      .update({ 
        spinWheelClaimed: true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateUserError) throw updateUserError;

    res.json({
      success: true,
      data: {
        creditsAdded: credits,
        creditType,
        newBalance: creditType === 'BID' ? newBidCredits : newPostCredits
      },
      message: `Successfully claimed ${credits} free ${creditType.toLowerCase()} credits!`
    });
  } catch (error: any) {
    console.error('Claim spin wheel credits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim spin wheel credits'
    });
  }
};
