import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Star, CreditCard, MessageCircle, Target, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'PER_ACTION';
  features: {
    messaging: boolean;
    prioritySupport: boolean;
    verifiedBadge: boolean;
    credits: number;
    bidsPerMonth: number;
    adsPerMonth: number;
    customFeatures: string[];
  };
  isPopular: boolean;
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

const MembershipPlans: React.FC = () => {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data);
        } else {
          console.warn('Invalid plans data received:', data);
          setPlans([]);
        }
      } else {
        console.warn('Failed to fetch plans:', response.status);
        setPlans([]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
      toast.error('Failed to load membership plans');
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.data.status !== 'NO_SUBSCRIPTION') {
        setCurrentSubscription(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);

    try {
      // In a real implementation, you would integrate with a payment gateway
      // For now, we'll simulate the payment process
      const paymentMethodId = 'pm_test_' + Date.now();

      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId,
          paymentMethodId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription activated successfully!');
        fetchCurrentSubscription();
      } else {
        toast.error(data.error || 'Failed to activate subscription');
      }
    } catch (error) {
      toast.error('Failed to process subscription');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'User requested cancellation'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription canceled successfully');
        fetchCurrentSubscription();
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <Zap className="w-8 h-8 text-blue-400" />;
      case 'premium': return <Crown className="w-8 h-8 text-purple-400" />;
      case 'pay-per-bid': return <Target className="w-8 h-8 text-green-400" />;
      case 'pay-per-ad': return <MessageCircle className="w-8 h-8 text-orange-400" />;
      default: return <Star className="w-8 h-8 text-slate-400" />;
    }
  };

  const formatPrice = (price: number, billingCycle: string) => {
    if (billingCycle === 'PER_ACTION') {
      return `₹${price}`;
    }
    return `₹${price}/${billingCycle === 'MONTHLY' ? 'month' : 'year'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          Unlock the full potential of Adfluencer with our flexible membership plans. 
          From pay-per-use to unlimited access, we have the perfect plan for your needs.
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="mb-8 p-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-700/50 rounded-full">
                <Shield className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Current Plan: {currentSubscription.plan.name}</h3>
                <p className="text-slate-400">
                  {currentSubscription.status === 'ACTIVE' 
                    ? `Active until ${new Date(currentSubscription.endDate).toLocaleDateString()}`
                    : `Status: ${currentSubscription.status}`
                  }
                </p>
              </div>
            </div>
            {currentSubscription.status === 'ACTIVE' && (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Membership Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
              plan.isPopular 
                ? 'border-purple-500/50 ring-2 ring-purple-500/20' 
                : 'border-slate-600/50 hover:border-slate-500/50'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="p-8">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 mb-4">{plan.description}</p>
                <div className="text-4xl font-bold text-white">
                  {formatPrice(plan.price, plan.billingCycle)}
                </div>
                {plan.billingCycle === 'YEARLY' && (
                  <p className="text-sm text-green-400 mt-1">Save 58% annually</p>
                )}
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Check className={`w-5 h-5 ${plan.features.messaging ? 'text-green-400' : 'text-slate-500'}`} />
                  <span className={plan.features.messaging ? 'text-white' : 'text-slate-500'}>
                    {plan.features.messaging ? 'Unlimited Messaging' : 'Pay-per-message'}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <Check className={`w-5 h-5 ${plan.features.prioritySupport ? 'text-green-400' : 'text-slate-500'}`} />
                  <span className={plan.features.prioritySupport ? 'text-white' : 'text-slate-500'}>
                    {plan.features.prioritySupport ? 'Priority Support' : 'Standard Support'}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <Check className={`w-5 h-5 ${plan.features.verifiedBadge ? 'text-green-400' : 'text-slate-500'}`} />
                  <span className={plan.features.verifiedBadge ? 'text-white' : 'text-slate-500'}>
                    Verified Badge
                  </span>
                </div>

                {plan.features.bidsPerMonth > 0 && (
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-white">
                      {plan.features.bidsPerMonth === 999 ? 'Unlimited' : plan.features.bidsPerMonth} Bids/month
                    </span>
                  </div>
                )}

                {plan.features.adsPerMonth > 0 && (
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-white">
                      {plan.features.adsPerMonth === 999 ? 'Unlimited' : plan.features.adsPerMonth} Ads/month
                    </span>
                  </div>
                )}

                {plan.features.credits > 0 && (
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-white">₹{plan.features.credits} Wallet Credits</span>
                  </div>
                )}

                {plan.features.customFeatures?.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-white">{feature}</span>
                  </div>
                )) || []}
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={
                  subscribing === plan.id || 
                  (currentSubscription?.status === 'ACTIVE' && currentSubscription.plan.id === plan.id)
                }
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  currentSubscription?.plan.id === plan.id
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : plan.isPopular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                } ${subscribing === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {subscribing === plan.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : currentSubscription?.plan.id === plan.id ? (
                  'Current Plan'
                ) : plan.billingCycle === 'PER_ACTION' ? (
                  'Pay Per Use'
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-8">Why Choose Adfluencer Premium?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Verified Network</h3>
            <p className="text-slate-400">
              Connect with verified influencers and brands for secure, trustworthy collaborations.
            </p>
          </div>

          <div className="p-6">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure Payments</h3>
            <p className="text-slate-400">
              Safe and secure payment processing with multiple payment options and wallet system.
            </p>
          </div>

          <div className="p-6">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Premium Support</h3>
            <p className="text-slate-400">
              Get priority customer support and dedicated account management for your campaigns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;