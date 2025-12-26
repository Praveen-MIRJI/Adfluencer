import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../lib/supabase';

// Submit a deliverable (influencer action)
export const submitDeliverable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contractId, milestoneId, title, description, type, fileUrl, externalLink, platform, metrics } = req.body;
    const userId = req.user!.userId;

    // Verify contract belongs to influencer
    const { data: contract, error: contractError } = await supabase
      .from('Contract')
      .select('*, advertisement:Advertisement(title)')
      .eq('id', contractId)
      .eq('influencerId', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (contractError || !contract) {
      res.status(404).json({ success: false, error: 'Active contract not found' });
      return;
    }

    // Create deliverable
    const { data: deliverable, error } = await supabase
      .from('Deliverable')
      .insert({
        contractId,
        milestoneId,
        influencerId: userId,
        title,
        description,
        type,
        fileUrl,
        externalLink,
        platform,
        metrics: metrics || {},
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;

    // Update milestone if provided
    if (milestoneId) {
      await supabase
        .from('ContractMilestone')
        .update({ status: 'SUBMITTED', submittedAt: new Date().toISOString() })
        .eq('id', milestoneId);
    }

    // Notify client
    await supabase.from('Notification').insert({
      userId: contract.clientId,
      title: 'New Deliverable Submitted',
      message: `A new deliverable "${title}" has been submitted for "${contract.advertisement.title}"`,
      type: 'DELIVERABLE_SUBMITTED',
      link: `/contracts/${contractId}`,
    });

    res.status(201).json({ success: true, data: deliverable });
  } catch (error) {
    console.error('Submit deliverable error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit deliverable' });
  }
};

// Get deliverables for a contract
export const getContractDeliverables = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contractId } = req.params;
    const userId = req.user!.userId;

    // Verify user has access to contract
    const { data: contract } = await supabase
      .from('Contract')
      .select('id')
      .eq('id', contractId)
      .or(`clientId.eq.${userId},influencerId.eq.${userId}`)
      .single();

    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' });
      return;
    }

    const { data: deliverables, error } = await supabase
      .from('Deliverable')
      .select('*, milestone:ContractMilestone(title, amount)')
      .eq('contractId', contractId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: deliverables });
  } catch (error) {
    console.error('Get deliverables error:', error);
    res.status(500).json({ success: false, error: 'Failed to get deliverables' });
  }
};

// Review deliverable (client action)
export const reviewDeliverable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    const userId = req.user!.userId;

    if (!['APPROVED', 'REJECTED', 'REVISION_REQUESTED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    // Get deliverable with contract
    const { data: deliverable, error: deliverableError } = await supabase
      .from('Deliverable')
      .select('*, contract:Contract(clientId, influencerId, advertisement:Advertisement(title))')
      .eq('id', id)
      .single();

    if (deliverableError || !deliverable) {
      res.status(404).json({ success: false, error: 'Deliverable not found' });
      return;
    }

    if (deliverable.contract.clientId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Update deliverable
    const { error: updateError } = await supabase
      .from('Deliverable')
      .update({
        status,
        clientFeedback: feedback,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Update milestone if approved
    if (status === 'APPROVED' && deliverable.milestoneId) {
      await supabase
        .from('ContractMilestone')
        .update({ status: 'APPROVED', approvedAt: new Date().toISOString() })
        .eq('id', deliverable.milestoneId);
    }

    // Notify influencer
    const notificationTitle = status === 'APPROVED' 
      ? 'Deliverable Approved!' 
      : status === 'REJECTED' 
        ? 'Deliverable Rejected' 
        : 'Revision Requested';

    await supabase.from('Notification').insert({
      userId: deliverable.contract.influencerId,
      title: notificationTitle,
      message: feedback || `Your deliverable "${deliverable.title}" has been ${status.toLowerCase().replace('_', ' ')}.`,
      type: `DELIVERABLE_${status}`,
      link: `/contracts/${deliverable.contractId}`,
    });

    res.json({ success: true, message: `Deliverable ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Review deliverable error:', error);
    res.status(500).json({ success: false, error: 'Failed to review deliverable' });
  }
};

// Get single deliverable
export const getDeliverable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const { data: deliverable, error } = await supabase
      .from('Deliverable')
      .select(`
        *,
        milestone:ContractMilestone(*),
        contract:Contract(clientId, influencerId, advertisement:Advertisement(title))
      `)
      .eq('id', id)
      .single();

    if (error || !deliverable) {
      res.status(404).json({ success: false, error: 'Deliverable not found' });
      return;
    }

    // Check access
    if (deliverable.contract.clientId !== userId && deliverable.contract.influencerId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    res.json({ success: true, data: deliverable });
  } catch (error) {
    console.error('Get deliverable error:', error);
    res.status(500).json({ success: false, error: 'Failed to get deliverable' });
  }
};

// Delete deliverable (influencer action - only pending)
export const deleteDeliverable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const { data: deliverable } = await supabase
      .from('Deliverable')
      .select('*')
      .eq('id', id)
      .eq('influencerId', userId)
      .eq('status', 'PENDING')
      .single();

    if (!deliverable) {
      res.status(404).json({ success: false, error: 'Pending deliverable not found' });
      return;
    }

    await supabase.from('Deliverable').delete().eq('id', id);

    res.json({ success: true, message: 'Deliverable deleted' });
  } catch (error) {
    console.error('Delete deliverable error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete deliverable' });
  }
};

// Get deliverable stats for a contract
export const getDeliverableStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contractId } = req.params;

    const { data: deliverables } = await supabase
      .from('Deliverable')
      .select('status')
      .eq('contractId', contractId);

    const stats = {
      total: deliverables?.length || 0,
      pending: deliverables?.filter(d => d.status === 'PENDING').length || 0,
      approved: deliverables?.filter(d => d.status === 'APPROVED').length || 0,
      rejected: deliverables?.filter(d => d.status === 'REJECTED').length || 0,
      revisionRequested: deliverables?.filter(d => d.status === 'REVISION_REQUESTED').length || 0,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get deliverable stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
};
