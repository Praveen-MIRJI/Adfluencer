import { Request } from 'express';

export type Role = 'CLIENT' | 'INFLUENCER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED';
export type AdStatus = 'OPEN' | 'CLOSED' | 'PENDING_APPROVAL' | 'REJECTED';
export type BidStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
export type Platform = 'INSTAGRAM' | 'YOUTUBE' | 'TWITTER' | 'TIKTOK' | 'FACEBOOK' | 'LINKEDIN';
export type ContentType = 'STORY' | 'POST' | 'REEL' | 'VIDEO' | 'TWEET' | 'ARTICLE';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
