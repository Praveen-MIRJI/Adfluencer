-- =====================================================
-- ADFLUENCER - COMPLETE DATABASE SETUP
-- Production-Grade Influencer Marketplace
-- =====================================================

-- =====================================================
-- PART 1: CORE USER & PROFILE TABLES
-- =====================================================

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL CHECK (role IN ('CLIENT', 'INFLUENCER', 'ADMIN')),
    "status" TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'BLOCKED')),
    "isVerified" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "phoneVerified" BOOLEAN DEFAULT false,
    "phoneNumber" VARCHAR(20),
    "requiresKyc" BOOLEAN DEFAULT true,
    "kycDeadline" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PART 2: PAYMENT & ESCROW SYSTEM (PRODUCTION-GRADE)
-- =====================================================

-- Platform Settings
CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "platformFeePercent" NUMERIC(5,2) DEFAULT 10.00,
    "razorpayFeePercent" NUMERIC(5,2) DEFAULT 2.00,
    "razorpayGstPercent" NUMERIC(5,2) DEFAULT 18.00,
    "minPayoutAmount" NUMERIC(12,2) DEFAULT 100.00,
    "payoutDelayDays" INTEGER DEFAULT 3,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "PlatformSettings" ("id") VALUES ('default') ON CONFLICT DO NOTHING;

-- Main Escrow Transaction Table
-- Stores complete payment breakdown for each contract
CREATE TABLE IF NOT EXISTS "EscrowTransaction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "contractId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    
    -- Amount Breakdown (all in INR)
    -- Example: Client pays ₹1000
    "grossAmount" NUMERIC(12,2) NOT NULL,           -- ₹1000 (what client pays)
    "razorpayFee" NUMERIC(12,2) DEFAULT 0,          -- ₹24 (~2.36%)
    "amountAfterGateway" NUMERIC(12,2) DEFAULT 0,   -- ₹976
    "platformFeePercent" NUMERIC(5,2) DEFAULT 10,   -- 10%
    "platformFee" NUMERIC(12,2) DEFAULT 0,          -- ₹100
    "providerPayout" NUMERIC(12,2) DEFAULT 0,       -- ₹876
    "platformEarnings" NUMERIC(12,2) DEFAULT 0,     -- ₹100
    
    -- Razorpay Details
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "razorpayPayoutId" TEXT,
    
    -- Status Tracking
    "escrowStatus" TEXT NOT NULL DEFAULT 'CREATED' CHECK ("escrowStatus" IN (
        'CREATED',           -- Order created, awaiting payment
        'PAYMENT_CAPTURED',  -- Payment received
        'HELD_IN_ESCROW',    -- Funds held securely
        'WORK_SUBMITTED',    -- Provider submitted deliverables
        'APPROVED',          -- Client approved work
        'PAYOUT_INITIATED',  -- Payout to provider started
        'PAID_OUT',          -- Provider received payment
        'DISPUTED',          -- Under dispute
        'REFUNDED'           -- Refunded to client
    )),
    "paymentStatus" TEXT DEFAULT 'PENDING' CHECK ("paymentStatus" IN (
        'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'
    )),
    
    -- Timestamps
    "paymentCapturedAt" TIMESTAMP,
    "workSubmittedAt" TIMESTAMP,
    "approvedAt" TIMESTAMP,
    "payoutInitiatedAt" TIMESTAMP,
    "paidOutAt" TIMESTAMP,
    "disputedAt" TIMESTAMP,
    "refundedAt" TIMESTAMP,
    
    -- Metadata
    "currency" TEXT DEFAULT 'INR',
    "notes" JSONB DEFAULT '{}',
    "webhookEvents" JSONB DEFAULT '[]',
    
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payout Records
CREATE TABLE IF NOT EXISTS "Payout" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "escrowTransactionId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "amount" NUMERIC(12,2) NOT NULL,
    "currency" TEXT DEFAULT 'INR',
    "razorpayPayoutId" TEXT,
    "razorpayFundAccountId" TEXT,
    "status" TEXT DEFAULT 'PENDING' CHECK ("status" IN (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED'
    )),
    "failureReason" TEXT,
    "initiatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider Bank Accounts
CREATE TABLE IF NOT EXISTS "ProviderBankAccount" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "bankName" TEXT,
    "accountType" TEXT DEFAULT 'savings',
    "upiId" TEXT,
    "isVerified" BOOLEAN DEFAULT false,
    "isPrimary" BOOLEAN DEFAULT false,
    "razorpayFundAccountId" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Revenue Tracking
CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "escrowTransactionId" TEXT NOT NULL,
    "grossAmount" NUMERIC(12,2) NOT NULL,
    "platformFee" NUMERIC(12,2) NOT NULL,
    "razorpayFee" NUMERIC(12,2) NOT NULL,
    "netRevenue" NUMERIC(12,2) NOT NULL,
    "recordedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Events Log
CREATE TABLE IF NOT EXISTS "WebhookLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "source" TEXT DEFAULT 'razorpay',
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN DEFAULT false,
    "processedAt" TIMESTAMP,
    "error" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Wallet
CREATE TABLE IF NOT EXISTS "UserWallet" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "balance" NUMERIC(12,2) DEFAULT 0,
    "lockedBalance" NUMERIC(12,2) DEFAULT 0,
    "currency" TEXT DEFAULT 'INR',
    "lastTransactionAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS "WalletTransaction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'LOCK', 'UNLOCK')),
    "amount" NUMERIC(12,2) NOT NULL,
    "balanceBefore" NUMERIC(12,2) NOT NULL,
    "balanceAfter" NUMERIC(12,2) NOT NULL,
    "description" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PART 3: DELIVERABLES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS "Deliverable" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "influencerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL CHECK (type IN ('SCREENSHOT', 'LINK', 'VIDEO', 'IMAGE', 'DOCUMENT', 'ANALYTICS')),
    "fileUrl" TEXT,
    "externalLink" TEXT,
    "platform" TEXT,
    "metrics" JSONB DEFAULT '{}',
    "status" TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED')),
    "clientFeedback" TEXT,
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PART 4: DISPUTE SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS "Dispute" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "contractId" TEXT NOT NULL,
    "escrowId" TEXT,
    "raisedBy" TEXT NOT NULL,
    "againstUser" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB DEFAULT '[]',
    "status" TEXT DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'UNDER_REVIEW', 'RESOLVED_CLIENT', 'RESOLVED_INFLUENCER', 'RESOLVED_SPLIT', 'CLOSED'
    )),
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PART 5: MEMBERSHIP & BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS "MembershipPlan" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "price" NUMERIC(10,2) NOT NULL,
    "currency" TEXT DEFAULT 'INR',
    "description" TEXT,
    "features" JSONB DEFAULT '[]',
    "limitations" JSONB DEFAULT '{}',
    "isActive" BOOLEAN DEFAULT true,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO "MembershipPlan" ("name", "planType", "billingCycle", "price", "description", "features") VALUES
('Basic Monthly', 'BASIC_MONTHLY', 'MONTHLY', 100, 'Perfect for getting started', '["Unlimited messaging", "10 bids per month", "Basic analytics"]'),
('Premium Yearly', 'PREMIUM_YEARLY', 'YEARLY', 500, 'Best value for serious users', '["Unlimited messaging", "Unlimited bids", "Priority support", "Advanced analytics"]'),
('Pay Per Bid', 'PAY_PER_BID', 'PER_ACTION', 5, 'Pay only when you bid', '["Pay ₹5 per bid", "No monthly commitment"]'),
('Pay Per Ad', 'PAY_PER_AD', 'PER_ACTION', 10, 'Pay only when you post', '["Pay ₹10 per advertisement", "No monthly commitment"]')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 6: INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS "idx_escrow_contract" ON "EscrowTransaction"("contractId");
CREATE INDEX IF NOT EXISTS "idx_escrow_client" ON "EscrowTransaction"("clientId");
CREATE INDEX IF NOT EXISTS "idx_escrow_provider" ON "EscrowTransaction"("providerId");
CREATE INDEX IF NOT EXISTS "idx_escrow_status" ON "EscrowTransaction"("escrowStatus");
CREATE INDEX IF NOT EXISTS "idx_escrow_razorpay_order" ON "EscrowTransaction"("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "idx_payout_provider" ON "Payout"("providerId");
CREATE INDEX IF NOT EXISTS "idx_payout_status" ON "Payout"("status");
CREATE INDEX IF NOT EXISTS "idx_deliverable_contract" ON "Deliverable"("contractId");
CREATE INDEX IF NOT EXISTS "idx_dispute_contract" ON "Dispute"("contractId");
CREATE INDEX IF NOT EXISTS "idx_wallet_user" ON "UserWallet"("userId");
CREATE INDEX IF NOT EXISTS "idx_wallet_tx_user" ON "WalletTransaction"("userId");

-- =====================================================
-- PAYMENT FLOW DOCUMENTATION
-- =====================================================
/*
ESCROW PAYMENT FLOW:

1. CLIENT PAYS ₹1000
   └── Razorpay collects payment

2. RAZORPAY DEDUCTS FEE (~2.36%)
   └── Fee: ₹24 (2% + 18% GST on fee)
   └── Remaining: ₹976

3. PLATFORM TAKES FEE (10% of gross)
   └── Platform fee: ₹100
   └── Platform earnings: ₹100

4. PROVIDER RECEIVES
   └── Payout: ₹1000 - ₹24 - ₹100 = ₹876

ESCROW STATUS FLOW:
CREATED → HELD_IN_ESCROW → WORK_SUBMITTED → APPROVED → PAID_OUT
                ↓                              ↓
            REFUNDED                       DISPUTED
*/
