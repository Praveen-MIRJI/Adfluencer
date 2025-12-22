import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import supabase from '../lib/supabase';
import { AuthRequest, JwtPayload, Role } from '../types';

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

    // Create user
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        email,
        password: hashedPassword,
        role: role as Role,
        status: 'ACTIVE',
      })
      .select('id, email, role, status, createdAt')
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

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } as JwtPayload,
      process.env.JWT_SECRET!,
      JWT_OPTIONS
    );

    res.status(201).json({
      success: true,
      data: { user, token },
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

    res.json({
      success: true,
      data: { user: formattedUser, token },
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
