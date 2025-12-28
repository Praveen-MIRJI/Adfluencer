import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Star, CreditCard, MessageCircle, Target, Shield, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'PER_ACTION' | 'ONE_TIME';
  features: string[];
  limitations: {
    adsPerMonth?: number;
    bidsPerMonth?: number;
    profileViews?: number;
    messagesPerMonth?: number;
    featuredListings?: number;
  };
  targetRole: 'CLIENT' | 'INFLUENCER' | 'ALL';
  isPopular?: boolean;
  isActive: boolean;
}

interface UserSubscription {
  id: string;
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan: MembershipPlan;
}

interface MembershipPlansProps {
  onSubscriptionChange?: () => void;
}

const MembershipPlans: React.FC<MembershipPlansProps> = ({ onSubscriptionChange }) => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-3">Subscription Plans</h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Unlock unlimited bids and posts with our subscription plans
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="max-w-2xl mx-auto">
        <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border border-slate-600/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 p-12 text-center">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-rose-500/5 rounded-2xl pointer-events-none"></div>
          
          <div className="relative">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full blur-xl opacity-50"></div>
                <div className="relative p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Coming Soon Text */}
            <h2 className="text-4xl font-bold text-white mb-4">
              Coming Soon
            </h2>
            <p className="text-xl text-slate-300 mb-6">
              Subscription plans are currently under development
            </p>
            <p className="text-slate-400 leading-relaxed max-w-lg mx-auto">
              We're working hard to bring you flexible subscription plans that will give you unlimited access to bids and posts. 
              Stay tuned for updates!
            </p>

            {/* Features Preview */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <Zap className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">Weekly Plans</h3>
                <p className="text-xs text-slate-400">Short-term flexibility</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">Monthly Plans</h3>
                <p className="text-xs text-slate-400">Best value option</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <Crown className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">Yearly Plans</h3>
                <p className="text-xs text-slate-400">Maximum savings</p>
              </div>
            </div>

            {/* Current Alternative */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">In the meantime</h4>
              <p className="text-xs text-slate-300">
                Use our credit system to bid and post. Purchase credits as needed from the billing section.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;
