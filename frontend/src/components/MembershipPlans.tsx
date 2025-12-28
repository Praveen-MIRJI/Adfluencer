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
  billingCycle: 'MONTHLY' | 'YEARLY' | 'PER_ACTION' | 'ONE_TIME';
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
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await api.get('/billing/wallet');
      if (response.data.success) {
        setWalletBalance(response.data.data?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      // Fetch plans filtered by user role
      const response = await api.get(`/billing/plans?role=${user?.role || ''}`);

      if (response.data.success && Array.isArray(response.data.data)) {
        setPlans(response.data.data);
      } else {
        console.warn('Invalid plans data received:', response.data);
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
      const response = await api.get('/billing/subscription');

      if (response.data.success && response.data.data.status !== 'NO_SUBSCRIPTION') {
        setCurrentSubscription(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: MembershipPlan) => {
    setSubscribing(plan.id);

    try {
      // Try to subscribe (backend will use wallet if sufficient balance)
      const response = await api.post('/billing/subscribe', {
        planId: plan.id,
        useWallet: true
      });

      if (response.data.success) {
        const { paymentMethod, requiresRazorpay, razorpayOrder, walletBalance: newWalletBalance } = response.data.data;

        // If paid with wallet, we're done
        if (paymentMethod === 'WALLET' || paymentMethod === 'FREE') {
          toast.success(`${plan.name} activated successfully!`);
          setWalletBalance(newWalletBalance || walletBalance);
          fetchCurrentSubscription();
          fetchWalletBalance();
          onSubscriptionChange?.();
          setSubscribing(null);
          return;
        }

        // If requires Razorpay (insufficient wallet balance)
        if (requiresRazorpay) {
          if (razorpayOrder) {
            // Razorpay order already created
            openRazorpay(razorpayOrder, plan);
          } else {
            // Need to create Razorpay order
            const razorpayResponse = await api.post('/billing/subscribe', {
              planId: plan.id,
              useWallet: false
            });

            if (razorpayResponse.data.success && razorpayResponse.data.data.razorpayOrder) {
              openRazorpay(razorpayResponse.data.data.razorpayOrder, plan);
            } else {
              toast.error('Failed to create payment order');
              setSubscribing(null);
            }
          }
          return;
        }
      } else {
        toast.error(response.data.error || 'Failed to activate subscription');
        setSubscribing(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to process subscription');
      setSubscribing(null);
    }
  };

  const openRazorpay = (razorpayOrder: any, plan: MembershipPlan) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Adfluencer',
      description: `Subscribe to ${plan.name}`,
      order_id: razorpayOrder.id,
      handler: async (response: any) => {
        try {
          const verifyResponse = await api.post('/billing/verify-subscription-payment', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            planId: plan.id
          });

          if (verifyResponse.data.success) {
            toast.success(`${plan.name} activated successfully!`);
            fetchCurrentSubscription();
            onSubscriptionChange?.();
          } else {
            toast.error('Payment verification failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast.error('Payment verification failed');
        } finally {
          setSubscribing(null);
        }
      },
      prefill: {
        email: user?.email || ''
      },
      theme: {
        color: '#3B82F6'
      },
      modal: {
        ondismiss: () => {
          setSubscribing(null);
        }
      }
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      const response = await api.post('/billing/cancel-subscription', {
        reason: 'User requested cancellation'
      });

      if (response.data.success) {
        toast.success('Subscription canceled successfully');
        fetchCurrentSubscription();
        onSubscriptionChange?.();
      } else {
        toast.error(response.data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free')) return <Star className="w-8 h-8 text-slate-400" />;
    if (name.includes('basic')) return <Zap className="w-8 h-8 text-blue-400" />;
    if (name.includes('premium')) return <Crown className="w-8 h-8 text-purple-400" />;
    if (name.includes('bid')) return <Target className="w-8 h-8 text-green-400" />;
    if (name.includes('ad')) return <MessageCircle className="w-8 h-8 text-orange-400" />;
    return <Star className="w-8 h-8 text-slate-400" />;
  };

  const formatPrice = (price: number, billingCycle: string) => {
    if (price === 0) return 'Free';
    if (billingCycle === 'PER_ACTION') return `₹${price}/action`;
    if (billingCycle === 'ONE_TIME') return `₹${price}`;
    return `₹${price}/${billingCycle === 'MONTHLY' ? 'month' : 'year'}`;
  };

  const canPayWithWallet = (price: number) => walletBalance >= price;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-3">Choose Your Plan</h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          {user?.role === 'CLIENT' 
            ? 'Plans designed for advertisers and brands'
            : 'Plans designed for influencers and creators'
          }
        </p>
      </div>

      {/* Wallet Balance Info */}
      <div className="flex items-center justify-center gap-3 p-4 bg-slate-800/50 rounded-lg mb-8 max-w-md mx-auto">
        <Wallet className="w-5 h-5 text-blue-400" />
        <span className="text-slate-300">Wallet Balance:</span>
        <span className="text-xl font-semibold text-white">₹{walletBalance.toLocaleString('en-IN')}</span>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="mb-8 p-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-700/50 rounded-full">
                <Shield className="w-6 h-6 text-green-400" />
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
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Membership Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = Number(plan.price);
          const isCurrentPlan = currentSubscription?.plan.id === plan.id;
          const walletSufficient = canPayWithWallet(price);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`relative bg-slate-800/50 border backdrop-blur-sm rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                plan.isPopular
                  ? 'border-purple-500/50 ring-2 ring-purple-500/20'
                  : 'border-slate-600/50 hover:border-slate-500/50'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-5">
                  <div className="flex justify-center mb-3">
                    {getPlanIcon(plan.name)}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mb-3">{plan.description}</p>
                  <div className="text-3xl font-bold text-white">
                    {formatPrice(price, plan.billingCycle)}
                  </div>
                  {plan.billingCycle === 'YEARLY' && (
                    <p className="text-xs text-green-400 mt-1">Save with annual billing</p>
                  )}
                </div>

                {/* Payment Method Indicator */}
                {price > 0 && !isCurrentPlan && (
                  <div className={`flex items-center justify-center gap-2 p-2 rounded-lg mb-4 text-xs ${
                    walletSufficient 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {walletSufficient ? (
                      <>
                        <Wallet className="w-3 h-3" />
                        <span>Pay from wallet</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3 h-3" />
                        <span>Pay via Razorpay</span>
                      </>
                    )}
                  </div>
                )}

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  {plan.features?.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations?.bidsPerMonth !== undefined && plan.limitations.bidsPerMonth > 0 && (
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">
                        {plan.limitations.bidsPerMonth === -1 ? 'Unlimited' : plan.limitations.bidsPerMonth} bids/month
                      </span>
                    </div>
                  )}
                  {plan.limitations?.adsPerMonth !== undefined && plan.limitations.adsPerMonth > 0 && (
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">
                        {plan.limitations.adsPerMonth === -1 ? 'Unlimited' : plan.limitations.adsPerMonth} ads/month
                      </span>
                    </div>
                  )}
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribing === plan.id || isCurrentPlan}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : plan.isPopular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                  } ${subscribing === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {subscribing === plan.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : price === 0 ? (
                    'Activate Free Plan'
                  ) : walletSufficient ? (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>Pay from Wallet</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Subscribe ₹{price}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No plans available for your account type.</p>
        </div>
      )}
    </div>
  );
};

export default MembershipPlans;
