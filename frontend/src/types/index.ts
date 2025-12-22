export type Role = 'CLIENT' | 'INFLUENCER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED';
export type AdStatus = 'OPEN' | 'CLOSED' | 'PENDING_APPROVAL' | 'REJECTED';
export type BidStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
export type Platform = 'INSTAGRAM' | 'YOUTUBE' | 'TWITTER' | 'TIKTOK' | 'FACEBOOK' | 'LINKEDIN';
export type ContentType = 'STORY' | 'POST' | 'REEL' | 'VIDEO' | 'TWEET' | 'ARTICLE';

export interface User {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  clientProfile?: ClientProfile;
  influencerProfile?: InfluencerProfile;
}

export interface ClientProfile {
  id: string;
  userId: string;
  companyName?: string;
  industry?: string;
  website?: string;
  phone?: string;
  avatar?: string;
  description?: string;
}

export interface InfluencerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  primaryNiche?: string;
  secondaryNiches?: string[];
  instagramHandle?: string;
  instagramFollowers?: number;
  youtubeHandle?: string;
  youtubeSubscribers?: number;
  twitterHandle?: string;
  twitterFollowers?: number;
  tiktokHandle?: string;
  tiktokFollowers?: number;
  engagementRate?: number;
  portfolioUrls?: string[];
  averageRating?: number;
  totalReviews?: number;
  completedCampaigns?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Advertisement {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  platform: Platform;
  contentType: ContentType;
  duration: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  status: AdStatus;
  requirements?: string;
  targetAudience?: string;
  createdAt: string;
  category?: Category;
  client?: {
    id: string;
    email?: string;
    clientProfile?: { companyName?: string; avatar?: string; industry?: string };
  };
  bids?: Bid[];
  _count?: { bids: number };
}

export interface Bid {
  id: string;
  advertisementId: string;
  influencerId: string;
  proposedPrice: number;
  proposal: string;
  deliveryDays: number;
  status: BidStatus;
  createdAt: string;
  advertisement?: Advertisement;
  influencer?: {
    id: string;
    email?: string;
    influencerProfile?: InfluencerProfile;
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  partnerId: string;
  partner: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  clientId: string;
  influencerId: string;
  advertisementId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  client?: {
    clientProfile?: { companyName?: string; avatar?: string };
  };
  advertisement?: { title: string };
}

export interface Contract {
  id: string;
  bidId: string;
  clientId: string;
  influencerId: string;
  advertisementId: string;
  agreedPrice: number;
  deliveryDeadline: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  completedAt?: string;
  createdAt: string;
  advertisement?: Advertisement;
  client?: {
    email: string;
    clientProfile?: ClientProfile;
  };
  influencer?: {
    email: string;
    influencerProfile?: InfluencerProfile;
  };
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'LINK';
  platform?: string;
  metrics?: Record<string, number>;
  createdAt: string;
}

export interface SavedAd {
  id: string;
  userId: string;
  advertisementId: string;
  createdAt: string;
  advertisement?: Advertisement;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}
