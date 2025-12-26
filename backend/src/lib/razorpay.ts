import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export interface CreateOrderParams {
  amount: number; // Amount in INR (will be converted to paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

// Create a Razorpay order
export const createOrder = async (params: CreateOrderParams) => {
  const { amount, currency = 'INR', receipt, notes = {} } = params;
  
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt,
    notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    return { success: false, error: error.message };
  }
};

// Verify payment signature
export const verifyPayment = (params: VerifyPaymentParams): boolean => {
  const { orderId, paymentId, signature } = params;
  
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

// Fetch payment details
export const fetchPayment = async (paymentId: string) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error: any) {
    console.error('Razorpay fetch payment error:', error);
    return { success: false, error: error.message };
  }
};

// Initiate refund
export const initiateRefund = async (paymentId: string, amount?: number) => {
  try {
    const refundOptions: any = {};
    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }
    
    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return { success: true, refund };
  } catch (error: any) {
    console.error('Razorpay refund error:', error);
    return { success: false, error: error.message };
  }
};

// Create transfer to influencer (for marketplace payouts)
export const createTransfer = async (paymentId: string, accountId: string, amount: number) => {
  try {
    const transfer = await razorpay.payments.transfer(paymentId, {
      transfers: [{
        account: accountId,
        amount: Math.round(amount * 100),
        currency: 'INR',
      }],
    });
    return { success: true, transfer };
  } catch (error: any) {
    console.error('Razorpay transfer error:', error);
    return { success: false, error: error.message };
  }
};

export default razorpay;
