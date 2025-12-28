-- =====================================================
-- CREDIT SYSTEM SETUP - Standalone Script
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Platform Credit Settings (Admin Configurable)
CREATE TABLE IF NOT EXISTS "CreditSettings" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "creditSystemEnabled" BOOLEAN DEFAULT false,
    "bidCreditPrice" NUMERIC(10,2) DEFAULT 5.00,      -- ₹5 per bid credit
    "postCreditPrice" NUMERIC(10,2) DEFAULT 10.00,    -- ₹10 per post credit
    "freeBidsPerMonth" INTEGER DEFAULT 0,              -- Free bids for new users
    "freePostsPerMonth" INTEGER DEFAULT 0,             -- Free posts for new users
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT
);

-- Insert default settings
INSERT INTO "CreditSettings" ("id") VALUES ('default') ON CONFLICT DO NOTHING;

-- User Credit Balance
CREATE TABLE IF NOT EXISTS "UserCredits" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "bidCredits" INTEGER DEFAULT 0,                    -- Available bid credits
    "postCredits" INTEGER DEFAULT 0,                   -- Available post credits
    "totalBidCreditsUsed" INTEGER DEFAULT 0,           -- Lifetime bid credits used
    "totalPostCreditsUsed" INTEGER DEFAULT 0,          -- Lifetime post credits used
    "totalBidCreditsPurchased" INTEGER DEFAULT 0,      -- Lifetime bid credits purchased
    "totalPostCreditsPurchased" INTEGER DEFAULT 0,     -- Lifetime post credits purchased
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Credit Transaction History
CREATE TABLE IF NOT EXISTS "CreditTransaction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL CHECK (transactionType IN (
        'PURCHASE_BID_CREDITS', 'PURCHASE_POST_CREDITS',
        'USE_BID_CREDIT', 'USE_POST_CREDIT',
        'ADMIN_ADJUSTMENT', 'REFUND'
    )),
    "creditType" TEXT NOT NULL CHECK (creditType IN ('BID', 'POST')),
    "amount" NUMERIC(10,2),                            -- Payment amount (for purchases)
    "credits" INTEGER NOT NULL,                        -- Credits added/removed (+/-)
    "balanceAfter" INTEGER NOT NULL,                   -- Credit balance after transaction
    "description" TEXT,
    "razorpayOrderId" TEXT,                           -- For payment tracking
    "razorpayPaymentId" TEXT,                         -- For payment tracking
    "paymentStatus" TEXT DEFAULT 'COMPLETED' CHECK (paymentStatus IN (
        'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
    )),
    "metadata" JSONB,                                 -- Additional transaction data
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_user_credits_user_id" ON "UserCredits"("userId");
CREATE INDEX IF NOT EXISTS "idx_credit_transaction_user_id" ON "CreditTransaction"("userId");
CREATE INDEX IF NOT EXISTS "idx_credit_transaction_type" ON "CreditTransaction"("transactionType");
CREATE INDEX IF NOT EXISTS "idx_credit_transaction_created_at" ON "CreditTransaction"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_credit_transaction_razorpay_order" ON "CreditTransaction"("razorpayOrderId");

-- Enable Row Level Security (RLS)
ALTER TABLE "CreditSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserCredits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CreditSettings (Admin only can modify, everyone can read)
CREATE POLICY "CreditSettings are viewable by everyone" ON "CreditSettings"
    FOR SELECT USING (true);

CREATE POLICY "CreditSettings are editable by admins only" ON "CreditSettings"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User"."id" = auth.uid()::text 
            AND "User"."role" = 'ADMIN'
        )
    );

-- RLS Policies for UserCredits (Users can view their own, admins can view all)
CREATE POLICY "Users can view their own credits" ON "UserCredits"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Admins can view all user credits" ON "UserCredits"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User"."id" = auth.uid()::text 
            AND "User"."role" = 'ADMIN'
        )
    );

CREATE POLICY "Users can insert their own credits" ON "UserCredits"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "System can update user credits" ON "UserCredits"
    FOR UPDATE USING (true);

-- RLS Policies for CreditTransaction (Users can view their own, admins can view all)
CREATE POLICY "Users can view their own transactions" ON "CreditTransaction"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Admins can view all transactions" ON "CreditTransaction"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User"."id" = auth.uid()::text 
            AND "User"."role" = 'ADMIN'
        )
    );

CREATE POLICY "System can insert transactions" ON "CreditTransaction"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update transactions" ON "CreditTransaction"
    FOR UPDATE USING (true);

-- Success message
SELECT 'Credit system tables created successfully!' as message;