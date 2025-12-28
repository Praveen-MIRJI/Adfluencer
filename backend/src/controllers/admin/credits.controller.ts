import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { AuthRequest } from '../../types';

// Get credit settings (admin)
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

// Update credit settings (admin)
export const updateCreditSettings = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const {
      creditSystemEnabled,
      bidCreditPrice,
      postCreditPrice,
      freeBidsPerMonth,
      freePostsPerMonth
    } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Admin not authenticated'
      });
    }

    // Validate inputs
    if (typeof creditSystemEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'creditSystemEnabled must be a boolean'
      });
    }

    if (bidCreditPrice !== undefined && (bidCreditPrice < 0 || bidCreditPrice > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'bidCreditPrice must be between 0 and 1000'
      });
    }

    if (postCreditPrice !== undefined && (postCreditPrice < 0 || postCreditPrice > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'postCreditPrice must be between 0 and 1000'
      });
    }

    if (freeBidsPerMonth !== undefined && (freeBidsPerMonth < 0 || freeBidsPerMonth > 100)) {
      return res.status(400).json({
        success: false,
        error: 'freeBidsPerMonth must be between 0 and 100'
      });
    }

    if (freePostsPerMonth !== undefined && (freePostsPerMonth < 0 || freePostsPerMonth > 100)) {
      return res.status(400).json({
        success: false,
        error: 'freePostsPerMonth must be between 0 and 100'
      });
    }

    // Update settings
    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: adminId
    };

    if (creditSystemEnabled !== undefined) updateData.creditSystemEnabled = creditSystemEnabled;
    if (bidCreditPrice !== undefined) updateData.bidCreditPrice = bidCreditPrice;
    if (postCreditPrice !== undefined) updateData.postCreditPrice = postCreditPrice;
    if (freeBidsPerMonth !== undefined) updateData.freeBidsPerMonth = freeBidsPerMonth;
    if (freePostsPerMonth !== undefined) updateData.freePostsPerMonth = freePostsPerMonth;

    const { data: updatedSettings, error } = await supabase
      .from('CreditSettings')
      .update(updateData)
      .eq('id', 'default')
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: updatedSettings,
      message: 'Credit settings updated successfully'
    });
  } catch (error: any) {
    console.error('Update credit settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update credit settings'
    });
  }
};

// Get credit statistics (admin)
export const getCreditStats = async (req: Request, res: Response) => {
  try {
    // Get total users with credits
    const { data: userStats, error: userStatsError } = await supabase
      .from('UserCredits')
      .select('bidCredits, postCredits, totalBidCreditsUsed, totalPostCreditsUsed, totalBidCreditsPurchased, totalPostCreditsPurchased');

    if (userStatsError) throw userStatsError;

    // Calculate totals
    const totalBidCreditsInCirculation = userStats.reduce((sum, user) => sum + (user.bidCredits || 0), 0);
    const totalPostCreditsInCirculation = userStats.reduce((sum, user) => sum + (user.postCredits || 0), 0);
    const totalBidCreditsUsed = userStats.reduce((sum, user) => sum + (user.totalBidCreditsUsed || 0), 0);
    const totalPostCreditsUsed = userStats.reduce((sum, user) => sum + (user.totalPostCreditsUsed || 0), 0);
    const totalBidCreditsPurchased = userStats.reduce((sum, user) => sum + (user.totalBidCreditsPurchased || 0), 0);
    const totalPostCreditsPurchased = userStats.reduce((sum, user) => sum + (user.totalPostCreditsPurchased || 0), 0);

    // Get revenue from credit purchases
    const { data: transactions, error: transactionsError } = await supabase
      .from('CreditTransaction')
      .select('amount, creditType, paymentStatus')
      .in('transactionType', ['PURCHASE_BID_CREDITS', 'PURCHASE_POST_CREDITS'])
      .eq('paymentStatus', 'COMPLETED');

    if (transactionsError) throw transactionsError;

    const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const bidCreditRevenue = transactions
      .filter(tx => tx.creditType === 'BID')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const postCreditRevenue = transactions
      .filter(tx => tx.creditType === 'POST')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Get recent transactions count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTransactions, error: recentError } = await supabase
      .from('CreditTransaction')
      .select('id')
      .gte('createdAt', thirtyDaysAgo.toISOString());

    if (recentError) throw recentError;

    res.json({
      success: true,
      data: {
        credits: {
          totalBidCreditsInCirculation,
          totalPostCreditsInCirculation,
          totalBidCreditsUsed,
          totalPostCreditsUsed,
          totalBidCreditsPurchased,
          totalPostCreditsPurchased
        },
        revenue: {
          totalRevenue,
          bidCreditRevenue,
          postCreditRevenue
        },
        activity: {
          totalUsers: userStats.length,
          recentTransactions: recentTransactions.length
        }
      }
    });
  } catch (error: any) {
    console.error('Get credit stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit statistics'
    });
  }
};

// Adjust user credits (admin)
export const adjustUserCredits = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { userId, creditType, amount, reason } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Admin not authenticated'
      });
    }

    if (!['BID', 'POST'].includes(creditType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credit type'
      });
    }

    if (!amount || Math.abs(amount) > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be between -1000 and 1000'
      });
    }

    // Get user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('UserCredits')
      .select('*')
      .eq('userId', userId)
      .single();

    if (creditsError) throw creditsError;

    // Calculate new balances
    const currentBidCredits = userCredits.bidCredits || 0;
    const currentPostCredits = userCredits.postCredits || 0;

    const newBidCredits = creditType === 'BID' 
      ? Math.max(0, currentBidCredits + amount)
      : currentBidCredits;
    
    const newPostCredits = creditType === 'POST' 
      ? Math.max(0, currentPostCredits + amount)
      : currentPostCredits;

    // Update user credits
    const { error: updateError } = await supabase
      .from('UserCredits')
      .update({
        bidCredits: newBidCredits,
        postCredits: newPostCredits,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('CreditTransaction')
      .insert({
        userId,
        transactionType: 'ADMIN_ADJUSTMENT',
        creditType,
        credits: amount,
        balanceAfter: creditType === 'BID' ? newBidCredits : newPostCredits,
        description: reason || `Admin adjustment: ${amount > 0 ? 'added' : 'removed'} ${Math.abs(amount)} ${creditType.toLowerCase()} credits`,
        paymentStatus: 'COMPLETED',
        metadata: {
          adminId,
          reason
        }
      });

    if (transactionError) throw transactionError;

    res.json({
      success: true,
      data: {
        userId,
        creditType,
        adjustment: amount,
        newBalance: creditType === 'BID' ? newBidCredits : newPostCredits
      },
      message: 'User credits adjusted successfully'
    });
  } catch (error: any) {
    console.error('Adjust user credits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust user credits'
    });
  }
};

// Get all users with credits (admin)
export const getUsersWithCredits = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('UserCredits')
      .select(`
        *,
        User:userId (
          id,
          email,
          role,
          status
        )
      `)
      .order('updatedAt', { ascending: false });

    if (search) {
      // This is a simplified search - in production you might want to join with User table
      query = query.ilike('User.email', `%${search}%`);
    }

    const { data: users, error } = await query
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Get users with credits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users with credits'
    });
  }
};