import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../lib/supabase';
import { validationResult } from 'express-validator';

// Submit KYC verification request
export const submitKycVerification = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const {
      documentType,
      documentNumber,
      fullName,
      dateOfBirth,
      address,
      phoneNumber,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl
    } = req.body;

    // Check if user already has pending or approved KYC
    const { data: existingKyc } = await supabase
      .from('KycVerification')
      .select('id, status')
      .eq('userId', req.user!.userId)
      .single();

    if (existingKyc && existingKyc.status === 'APPROVED') {
      res.status(400).json({
        success: false,
        error: 'KYC already approved for this account'
      });
      return;
    }

    if (existingKyc && existingKyc.status === 'PENDING') {
      res.status(400).json({
        success: false,
        error: 'KYC verification already pending. Please wait for review.'
      });
      return;
    }

    // Create or update KYC record
    const kycData = {
      userId: req.user!.userId,
      documentType,
      documentNumber,
      fullName,
      dateOfBirth,
      address,
      phoneNumber,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
      status: 'PENDING',
      submittedAt: new Date().toISOString()
    };

    let result;
    if (existingKyc) {
      // Update existing record
      const { data, error } = await supabase
        .from('KycVerification')
        .update(kycData)
        .eq('id', existingKyc.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('KycVerification')
        .insert(kycData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    // Create notification for admin
    await supabase
      .from('Notification')
      .insert({
        userId: req.user!.userId,
        title: 'KYC Verification Submitted',
        message: 'Your KYC verification has been submitted and is under review.',
        type: 'KYC_SUBMITTED',
        link: '/profile/verification'
      });

    // Log activity
    await supabase
      .from('UserActivity')
      .insert({
        userId: req.user!.userId,
        action: 'KYC_SUBMITTED',
        resource: 'KYC_VERIFICATION',
        resourceId: result.id,
        metadata: { documentType }
      });

    res.status(201).json({
      success: true,
      data: result,
      message: 'KYC verification submitted successfully. Review typically takes 24-48 hours.'
    });

  } catch (error) {
    console.error('Submit KYC error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit KYC verification'
    });
  }
};

// Get user's KYC status
export const getKycStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: kyc, error } = await supabase
      .from('KycVerification')
      .select('*')
      .eq('userId', req.user!.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!kyc) {
      res.json({
        success: true,
        data: {
          status: 'NOT_SUBMITTED',
          message: 'KYC verification not yet submitted'
        }
      });
      return;
    }

    // Remove sensitive data from response
    const { documentNumber, ...safeKycData } = kyc;

    res.json({
      success: true,
      data: {
        ...safeKycData,
        documentNumber: documentNumber ? `****${documentNumber.slice(-4)}` : null
      }
    });

  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get KYC status'
    });
  }
};

// Admin: Get all KYC verifications
export const getAllKycVerifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('KycVerification')
      .select(`
        *,
        user:User!KycVerification_userId_fkey(
          id,
          email,
          role,
          clientProfile:ClientProfile(companyName),
          influencerProfile:InfluencerProfile(displayName)
        )
      `, { count: 'exact' })
      .order('submittedAt', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: verifications, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: verifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get all KYC verifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get KYC verifications'
    });
  }
};

// Admin: Review KYC verification
export const reviewKycVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    console.log('Review KYC request:', { id, status, rejectionReason });

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be APPROVED or REJECTED'
      });
      return;
    }

    if (status === 'REJECTED' && !rejectionReason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required when rejecting KYC'
      });
      return;
    }

    // Get KYC record - simple query without join
    const { data: kyc, error: kycError } = await supabase
      .from('KycVerification')
      .select('*')
      .eq('id', id)
      .single();

    console.log('KYC lookup result:', { kyc, kycError });

    if (kycError) {
      console.error('KYC lookup error:', kycError);
      res.status(404).json({
        success: false,
        error: 'KYC verification not found'
      });
      return;
    }

    if (!kyc) {
      res.status(404).json({
        success: false,
        error: 'KYC verification not found'
      });
      return;
    }

    // Update KYC status
    const { data: updatedKyc, error: updateError } = await supabase
      .from('KycVerification')
      .update({
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user!.userId
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('KYC update error:', updateError);
      throw updateError;
    }

    // Update user verification status
    if (status === 'APPROVED') {
      await supabase
        .from('User')
        .update({ isVerified: true })
        .eq('id', kyc.userId);
    }

    // Create notification for user
    const notificationTitle = status === 'APPROVED' 
      ? 'KYC Verification Approved!' 
      : 'KYC Verification Rejected';
    
    const notificationMessage = status === 'APPROVED'
      ? 'Congratulations! Your KYC verification has been approved. You now have full access to all platform features.'
      : `Your KYC verification was rejected. Reason: ${rejectionReason}. Please resubmit with correct information.`;

    await supabase
      .from('Notification')
      .insert({
        userId: kyc.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: status === 'APPROVED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
        link: '/profile/verification'
      });

    res.json({
      success: true,
      data: updatedKyc,
      message: `KYC verification ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Review KYC error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review KYC verification'
    });
  }
};

// Verify phone number with OTP
export const verifyPhoneNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phoneNumber, otp } = req.body;

    // In a real implementation, you would:
    // 1. Send OTP via SMS service (Twilio, AWS SNS, etc.)
    // 2. Verify the OTP against what was sent
    // For now, we'll simulate this

    // Check if phone number is already verified by another user
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('phoneNumber', phoneNumber)
      .eq('phoneVerified', true)
      .neq('id', req.user!.userId)
      .single();

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Phone number already verified by another user'
      });
      return;
    }

    // Update user phone verification
    const { error } = await supabase
      .from('User')
      .update({
        phoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: new Date().toISOString()
      })
      .eq('id', req.user!.userId);

    if (error) throw error;

    // Log activity
    await supabase
      .from('UserActivity')
      .insert({
        userId: req.user!.userId,
        action: 'PHONE_VERIFIED',
        resource: 'USER',
        resourceId: req.user!.userId,
        metadata: { phoneNumber }
      });

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify phone number'
    });
  }
};

// Verify email (send verification email)
export const sendEmailVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user info
    const { data: user } = await supabase
      .from('User')
      .select('email, emailVerified')
      .eq('id', req.user!.userId)
      .single();

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
      return;
    }

    // In a real implementation, send verification email
    // For now, we'll simulate this
    
    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
    });
  }
};

// Verify email with token
export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    // In a real implementation, verify the token
    // For now, we'll simulate this

    const { error } = await supabase
      .from('User')
      .update({
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString()
      })
      .eq('id', req.user!.userId);

    if (error) throw error;

    // Log activity
    await supabase
      .from('UserActivity')
      .insert({
        userId: req.user!.userId,
        action: 'EMAIL_VERIFIED',
        resource: 'USER',
        resourceId: req.user!.userId
      });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email'
    });
  }
};