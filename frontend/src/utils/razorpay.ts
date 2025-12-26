import api from '../lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  amount: number;
  purpose: 'SUBSCRIPTION' | 'WALLET_TOPUP' | 'ESCROW' | 'BID_FEE' | 'AD_FEE';
  resourceId?: string;
  notes?: Record<string, string>;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

// Load Razorpay script
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Get fee breakdown for display
export const getFeeBreakdown = async (amount: number) => {
  try {
    const { data } = await api.get(`/escrow/fee-breakdown?amount=${amount}`);
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to get fee breakdown:', error);
    return null;
  }
};

// Initialize payment
export const initiatePayment = async (options: PaymentOptions): Promise<void> => {
  const { amount, purpose, resourceId, notes, onSuccess, onError, prefill } = options;

  // Load Razorpay script
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onError?.({ message: 'Failed to load payment gateway' });
    return;
  }

  try {
    // For ESCROW, the order is already created - we just need to open Razorpay
    // For other purposes, create order first
    let orderId: string;
    let keyId: string;
    let orderAmount: number;

    if (purpose === 'ESCROW' && resourceId) {
      // Escrow order already created, fetch details
      const { data: escrowData } = await api.get(`/escrow/${resourceId}`);
      if (!escrowData.success || !escrowData.data.razorpayOrderId) {
        onError?.({ message: 'Escrow order not found' });
        return;
      }
      orderId = escrowData.data.razorpayOrderId;
      orderAmount = escrowData.data.grossAmount * 100; // Convert to paise
      keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    } else {
      // Create order on backend
      const { data } = await api.post('/payments/create-order', {
        amount,
        purpose,
        resourceId,
        notes,
      });

      if (!data.success) {
        onError?.({ message: data.error || 'Failed to create order' });
        return;
      }

      orderId = data.data.orderId;
      orderAmount = data.data.amount;
      keyId = data.data.keyId;
    }

    // Configure Razorpay options
    const razorpayOptions = {
      key: keyId,
      amount: orderAmount,
      currency: 'INR',
      name: 'Adfluencer',
      description: getPurposeDescription(purpose),
      order_id: orderId,
      handler: async (response: any) => {
        // For non-escrow payments, verify on backend
        if (purpose !== 'ESCROW') {
          try {
            const verifyResponse = await api.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              onSuccess?.(verifyResponse.data);
            } else {
              onError?.({ message: 'Payment verification failed' });
            }
          } catch (error: any) {
            onError?.({ message: error.response?.data?.error || 'Payment verification failed' });
          }
        } else {
          // For escrow, pass the response back for manual verification
          onSuccess?.({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        }
      },
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || '',
      },
      theme: {
        color: '#6366f1', // Indigo color
      },
      modal: {
        ondismiss: () => {
          onError?.({ message: 'Payment cancelled' });
        },
        confirm_close: true,
      },
      notes: {
        purpose,
        resourceId: resourceId || '',
        ...notes,
      },
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    
    razorpay.on('payment.failed', (response: any) => {
      onError?.({
        message: response.error.description || 'Payment failed',
        code: response.error.code,
        reason: response.error.reason,
      });
    });

    razorpay.open();
  } catch (error: any) {
    onError?.({ message: error.response?.data?.error || 'Failed to initiate payment' });
  }
};

function getPurposeDescription(purpose: string): string {
  switch (purpose) {
    case 'SUBSCRIPTION':
      return 'Membership Subscription';
    case 'WALLET_TOPUP':
      return 'Wallet Top-up';
    case 'ESCROW':
      return 'Secure Escrow Payment';
    case 'BID_FEE':
      return 'Bid Submission Fee';
    case 'AD_FEE':
      return 'Advertisement Posting Fee';
    default:
      return 'Payment';
  }
}

// Format currency for display
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
