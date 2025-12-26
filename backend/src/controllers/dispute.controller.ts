import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../lib/supabase';

// Raise a dispute
export const raiseDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contractId, reason, description, evidence } = req.body;
    const userId = req.user!.userId;

    // Get contract
    const { data: contract, error: contractError } = await supabase
      .from('Contract')
      .select('*, escrow:Escrow(*)')
      .eq('id', contractId)
      .or(`clientId.eq.${userId},influencerId.eq.${userId}`)
      .single();

    if (contractError || !contract) {
      res.status(404).json({ success: false, error: 'Contract not found' });
      return;
    }

    // Check if dispute already exists
    const { data: existingDispute } = await supabase
      .from('Dispute')
      .select('id')
      .eq('contractId', contractId)
      .in('status', ['OPEN', 'UNDER_REVIEW'])
      .single();

    if (existingDispute) {
      res.status(400).json({ success: false, error: 'An active dispute already exists for this contract' });
      return;
    }

    const againstUser = contract.clientId === userId ? contract.influencerId : contract.clientId;

    // Create dispute
    const { data: dispute, error } = await supabase
      .from('Dispute')
      .insert({
        contractId,
        escrowId: contract.escrow?.id,
        raisedBy: userId,
        againstUser,
        reason,
        description,
        evidence: evidence || [],
        status: 'OPEN',
      })
      .select()
      .single();

    if (error) throw error;

    // Update contract and escrow status
    await supabase.from('Contract').update({ status: 'DISPUTED' }).eq('id', contractId);
    
    if (contract.escrow) {
      await supabase.from('Escrow').update({ status: 'DISPUTED' }).eq('id', contract.escrow.id);
    }

    // Notify the other party and admins
    await supabase.from('Notification').insert([
      {
        userId: againstUser,
        title: 'Dispute Raised',
        message: `A dispute has been raised for your contract. Reason: ${reason}`,
        type: 'DISPUTE_RAISED',
        link: `/disputes/${dispute.id}`,
      },
    ]);

    // Notify admins
    const { data: admins } = await supabase
      .from('User')
      .select('id')
      .eq('role', 'ADMIN');

    if (admins && admins.length > 0) {
      await supabase.from('Notification').insert(
        admins.map(admin => ({
          userId: admin.id,
          title: 'New Dispute',
          message: `A new dispute has been raised and requires review.`,
          type: 'ADMIN_DISPUTE',
          link: `/admin/disputes/${dispute.id}`,
        }))
      );
    }

    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    console.error('Raise dispute error:', error);
    res.status(500).json({ success: false, error: 'Failed to raise dispute' });
  }
};

// Get user's disputes
export const getMyDisputes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const { data: disputes, error } = await supabase
      .from('Dispute')
      .select(`
        *,
        contract:Contract(*, advertisement:Advertisement(title)),
        raisedByUser:User!Dispute_raisedBy_fkey(email),
        againstUserData:User!Dispute_againstUser_fkey(email)
      `)
      .or(`raisedBy.eq.${userId},againstUser.eq.${userId}`)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: disputes });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get disputes' });
  }
};

// Get dispute details
export const getDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    let query = supabase
      .from('Dispute')
      .select(`
        *,
        contract:Contract(*, advertisement:Advertisement(*), escrow:Escrow(*)),
        raisedByUser:User!Dispute_raisedBy_fkey(email, clientProfile:ClientProfile(companyName), influencerProfile:InfluencerProfile(displayName)),
        againstUserData:User!Dispute_againstUser_fkey(email, clientProfile:ClientProfile(companyName), influencerProfile:InfluencerProfile(displayName))
      `)
      .eq('id', id);

    // Non-admins can only see their own disputes
    if (userRole !== 'ADMIN') {
      query = query.or(`raisedBy.eq.${userId},againstUser.eq.${userId}`);
    }

    const { data: dispute, error } = await query.single();

    if (error || !dispute) {
      res.status(404).json({ success: false, error: 'Dispute not found' });
      return;
    }

    res.json({ success: true, data: dispute });
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dispute' });
  }
};

// Add evidence to dispute
export const addEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { evidence } = req.body;
    const userId = req.user!.userId;

    const { data: dispute, error: disputeError } = await supabase
      .from('Dispute')
      .select('*')
      .eq('id', id)
      .or(`raisedBy.eq.${userId},againstUser.eq.${userId}`)
      .in('status', ['OPEN', 'UNDER_REVIEW'])
      .single();

    if (disputeError || !dispute) {
      res.status(404).json({ success: false, error: 'Active dispute not found' });
      return;
    }

    const updatedEvidence = [...(dispute.evidence || []), { ...evidence, addedBy: userId, addedAt: new Date().toISOString() }];

    await supabase
      .from('Dispute')
      .update({ evidence: updatedEvidence, updatedAt: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true, message: 'Evidence added successfully' });
  } catch (error) {
    console.error('Add evidence error:', error);
    res.status(500).json({ success: false, error: 'Failed to add evidence' });
  }
};

// Resolve dispute (admin action)
export const resolveDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolution, status, splitPercent } = req.body;
    const adminId = req.user!.userId;

    if (!['RESOLVED_CLIENT', 'RESOLVED_INFLUENCER', 'RESOLVED_SPLIT', 'CLOSED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid resolution status' });
      return;
    }

    const { data: dispute, error: disputeError } = await supabase
      .from('Dispute')
      .select('*, contract:Contract(*, escrow:Escrow(*))')
      .eq('id', id)
      .single();

    if (disputeError || !dispute) {
      res.status(404).json({ success: false, error: 'Dispute not found' });
      return;
    }

    // Update dispute
    await supabase
      .from('Dispute')
      .update({
        status,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    // Handle escrow based on resolution
    const escrow = dispute.contract?.escrow;
    if (escrow && escrow.status === 'DISPUTED') {
      if (status === 'RESOLVED_CLIENT') {
        // Refund to client
        await processDisputeRefund(escrow, dispute.contract.clientId, escrow.amount);
        await supabase.from('Escrow').update({ status: 'REFUNDED', refundedAt: new Date().toISOString() }).eq('id', escrow.id);
      } else if (status === 'RESOLVED_INFLUENCER') {
        // Release to influencer
        await processDisputeRelease(escrow, dispute.contract.influencerId, escrow.netAmount);
        await supabase.from('Escrow').update({ status: 'RELEASED', releasedAt: new Date().toISOString() }).eq('id', escrow.id);
      } else if (status === 'RESOLVED_SPLIT' && splitPercent) {
        // Split between both parties
        const clientAmount = (escrow.amount * splitPercent.client) / 100;
        const influencerAmount = (escrow.netAmount * splitPercent.influencer) / 100;
        await processDisputeRefund(escrow, dispute.contract.clientId, clientAmount);
        await processDisputeRelease(escrow, dispute.contract.influencerId, influencerAmount);
        await supabase.from('Escrow').update({ status: 'RELEASED', releasedAt: new Date().toISOString() }).eq('id', escrow.id);
      }
    }

    // Update contract status
    await supabase
      .from('Contract')
      .update({ status: status === 'RESOLVED_INFLUENCER' ? 'COMPLETED' : 'CANCELLED' })
      .eq('id', dispute.contractId);

    // Notify both parties
    await supabase.from('Notification').insert([
      {
        userId: dispute.raisedBy,
        title: 'Dispute Resolved',
        message: `Your dispute has been resolved. ${resolution}`,
        type: 'DISPUTE_RESOLVED',
        link: `/disputes/${id}`,
      },
      {
        userId: dispute.againstUser,
        title: 'Dispute Resolved',
        message: `The dispute has been resolved. ${resolution}`,
        type: 'DISPUTE_RESOLVED',
        link: `/disputes/${id}`,
      },
    ]);

    res.json({ success: true, message: 'Dispute resolved successfully' });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve dispute' });
  }
};

// Helper: Process refund to client
async function processDisputeRefund(escrow: any, clientId: string, amount: number) {
  const { data: wallet } = await supabase
    .from('UserWallet')
    .select('id, balance')
    .eq('userId', clientId)
    .single();

  const newBalance = (wallet?.balance || 0) + amount;

  await supabase
    .from('UserWallet')
    .upsert({ userId: clientId, balance: newBalance }, { onConflict: 'userId' });

  if (wallet) {
    await supabase.from('WalletTransaction').insert({
      walletId: wallet.id,
      userId: clientId,
      type: 'CREDIT',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: newBalance,
      description: 'Dispute resolution refund',
      metadata: { escrowId: escrow.id },
    });
  }
}

// Helper: Process release to influencer
async function processDisputeRelease(escrow: any, influencerId: string, amount: number) {
  const { data: wallet } = await supabase
    .from('UserWallet')
    .select('id, balance')
    .eq('userId', influencerId)
    .single();

  const newBalance = (wallet?.balance || 0) + amount;

  await supabase
    .from('UserWallet')
    .upsert({ userId: influencerId, balance: newBalance }, { onConflict: 'userId' });

  if (wallet) {
    await supabase.from('WalletTransaction').insert({
      walletId: wallet.id,
      userId: influencerId,
      type: 'CREDIT',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: newBalance,
      description: 'Dispute resolution payment',
      metadata: { escrowId: escrow.id },
    });
  }
}

// Get all disputes (admin)
export const getAllDisputes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('Dispute')
      .select(`
        *,
        contract:Contract(advertisement:Advertisement(title)),
        raisedByUser:User!Dispute_raisedBy_fkey(email),
        againstUserData:User!Dispute_againstUser_fkey(email)
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data: disputes, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: disputes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all disputes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get disputes' });
  }
};
