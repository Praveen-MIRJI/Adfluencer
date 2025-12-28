import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import supabase from '../lib/supabase';
import { AuthRequest, JwtPayload, Role } from '../types';
import { generateOtp, sendOtpEmail, testEmailConfig } from '../utils/email.util';

const JWT_OPTIONS: SignOptions = { expiresIn: '7d' };

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with spinWheelClaimed = false
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        email,
        password: hashedPassword,
        role: role as Role,
        status: 'ACTIVE',
        spinWheelClaimed: false,
      })
      .select('id, email, role, status, createdAt, spinWheelClaimed')
      .single();

    if (userError || !user) {
      throw userError || new Error('Failed to create user');
    }

    // Create profile based on role
    if (role === 'CLIENT') {
      await supabase.from('ClientProfile').insert({ userId: user.id });
    } else if (role === 'INFLUENCER') {
      await supabase.from('InfluencerProfile').insert({
        userId: user.id,
        displayName: email.split('@')[0],
      });
    }

    // Create UserCredits record with 0 credits (will be added after spin)
    await supabase.from('UserCredits').insert({
      userId: user.id,
      bidCredits: 0,
      postCredits: 0,
      totalBidCreditsPurchased: 0,
      totalPostCreditsPurchased: 0,
      totalBidCreditsUsed: 0,
      totalPostCreditsUsed: 0,
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } as JwtPayload,
      process.env.JWT_SECRET!,
      JWT_OPTIONS
    );

    res.status(201).json({
      success: true,
      data: { 
        user, 
        token,
        showSpinWheel: true // New user always shows spin wheel
      },
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with profiles
    const { data: user, error } = await supabase
      .from('User')
      .select('*, clientProfile:ClientProfile(*), influencerProfile:InfluencerProfile(*)')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Check status
    if (user.status === 'BLOCKED') {
      res.status(403).json({ success: false, error: 'Account is blocked' });
      return;
    }

    if (user.status === 'PENDING') {
      res.status(403).json({ success: false, error: 'Account pending approval' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } as JwtPayload,
      process.env.JWT_SECRET!,
      JWT_OPTIONS
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Supabase returns joined tables as arrays, convert to single object
    const formattedUser = {
      ...userWithoutPassword,
      clientProfile: Array.isArray(userWithoutPassword.clientProfile) ? userWithoutPassword.clientProfile[0] : userWithoutPassword.clientProfile,
      influencerProfile: Array.isArray(userWithoutPassword.influencerProfile) ? userWithoutPassword.influencerProfile[0] : userWithoutPassword.influencerProfile,
    };

    // Check if user needs to see spin wheel (hasn't claimed yet)
    const showSpinWheel = user.spinWheelClaimed === false;

    res.json({
      success: true,
      data: { 
        user: formattedUser, 
        token,
        showSpinWheel
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, email, role, status, createdAt, clientProfile:ClientProfile(*), influencerProfile:InfluencerProfile(*)')
      .eq('id', req.user!.userId)
      .single();

    if (error || !user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Supabase returns joined tables as arrays, convert to single object
    const formattedUser = {
      ...user,
      clientProfile: Array.isArray(user.clientProfile) ? user.clientProfile[0] : user.clientProfile,
      influencerProfile: Array.isArray(user.influencerProfile) ? user.influencerProfile[0] : user.influencerProfile,
    };

    res.json({ success: true, data: formattedUser });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
};

export const getSpinWheelStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, spinWheelClaimed')
      .eq('id', req.user!.userId)
      .single();

    if (error || !user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ 
      success: true, 
      data: { 
        showSpinWheel: user.spinWheelClaimed === false 
      } 
    });
  } catch (error) {
    console.error('GetSpinWheelStatus error:', error);
    res.status(500).json({ success: false, error: 'Failed to get spin wheel status' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: user } = await supabase
      .from('User')
      .select('id, password')
      .eq('id', req.user!.userId)
      .single();

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(400).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await supabase
      .from('User')
      .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
      .eq('id', user.id);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
};

// ==================== FORGOT PASSWORD FLOW ====================

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Safety check for email
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    console.log('[ForgotPassword] Processing request for:', email);

    // Test email configuration first
    const emailConfigValid = await testEmailConfig();
    if (!emailConfigValid) {
      console.error('[ForgotPassword] Email configuration is invalid');
      res.status(500).json({ success: false, error: 'Email service is not configured properly' });
      return;
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    console.log('[ForgotPassword] User lookup result:', user ? 'found' : 'not found', userError ? `Error: ${userError.message}` : '');

    // Always return success to prevent email enumeration attacks
    if (!user) {
      res.json({
        success: true,
        message: 'If an account with that email exists, you will receive an OTP shortly.'
      });
      return;
    }

    // Delete any existing OTPs for this user
    const { error: deleteError } = await supabase
      .from('PasswordReset')
      .delete()
      .eq('userId', user.id);

    if (deleteError) {
      console.error('[ForgotPassword] Error deleting existing OTPs:', deleteError);
    }

    // Generate 6-digit OTP
    const otp = generateOtp();

    // Set expiry to 10 minutes from now in UTC
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log('[ForgotPassword] Generated OTP:', otp, 'Expires at:', expiresAt.toISOString());

    // Store OTP in database
    const { data: insertData, error: insertError } = await supabase
      .from('PasswordReset')
      .insert({
        userId: user.id,
        otp,
        expiresAt: expiresAt.toISOString(),
        used: false,
      })
      .select();

    if (insertError) {
      console.error('[ForgotPassword] Error storing OTP:', insertError);
      res.status(500).json({ success: false, error: 'Failed to generate OTP. Please try again.' });
      return;
    }

    console.log('[ForgotPassword] OTP stored successfully:', insertData);

    // Send OTP email
    const emailSent = await sendOtpEmail(user.email, otp);

    if (!emailSent) {
      // Clean up the OTP if email failed
      await supabase
        .from('PasswordReset')
        .delete()
        .eq('userId', user.id)
        .eq('otp', otp);
        
      res.status(500).json({ success: false, error: 'Failed to send OTP email. Please try again.' });
      return;
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, you will receive an OTP shortly.',
      // Include email in response for frontend to use (only for valid emails)
      data: { email: user.email }
    });
  } catch (error) {
    console.error('[ForgotPassword] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    console.log('[VerifyOTP] Processing request for:', email, 'OTP:', otp);

    // Find user by email
    const { data: user } = await supabase
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      res.status(400).json({ success: false, error: 'Invalid OTP' });
      return;
    }

    console.log('[VerifyOTP] User found:', user.id);

    // Find valid OTP and check expiry in database
    const { data: resetRecord } = await supabase
      .from('PasswordReset')
      .select('*')
      .eq('userId', user.id)
      .eq('otp', otp)
      .eq('used', false)
      .gt('expiresAt', new Date().toISOString())
      .single();

    console.log('[VerifyOTP] Reset record:', resetRecord);

    if (!resetRecord) {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
      return;
    }

    // Generate a reset token for the password reset step
    const resetToken = jwt.sign(
      { userId: user.id, resetId: resetRecord.id, purpose: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    console.log('[VerifyOTP] Reset token generated successfully');

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: { resetToken }
    });
  } catch (error) {
    console.error('[VerifyOTP] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;

    // Verify reset token
    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET!);
    } catch {
      res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
      return;
    }

    if (decoded.purpose !== 'password-reset') {
      res.status(400).json({ success: false, error: 'Invalid reset token' });
      return;
    }

    // Verify the reset record still exists and is not used
    const { data: resetRecord } = await supabase
      .from('PasswordReset')
      .select('*')
      .eq('id', decoded.resetId)
      .eq('used', false)
      .single();

    if (!resetRecord) {
      res.status(400).json({ success: false, error: 'Reset token has already been used' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await supabase
      .from('User')
      .update({
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
      .eq('id', decoded.userId);

    // Mark OTP as used
    await supabase
      .from('PasswordReset')
      .update({ used: true })
      .eq('id', decoded.resetId);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};

// Test endpoint for email configuration
export const testEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    console.log('[TestEmail] Testing email configuration...');
    
    // Test SMTP configuration
    const configValid = await testEmailConfig();
    if (!configValid) {
      res.status(500).json({ success: false, error: 'SMTP configuration is invalid' });
      return;
    }

    // Generate test OTP
    const testOtp = generateOtp();
    
    // Send test email
    const emailSent = await sendOtpEmail(email, testOtp);
    
    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        data: { testOtp } // Include OTP in response for testing
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('[TestEmail] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to test email configuration' });
  }
};
