-- =====================================================
-- UPDATE MEMBERSHIP PLANS
-- Simple 3-tier pricing for both Clients and Influencers
-- =====================================================

-- First, deactivate all existing plans
UPDATE "MembershipPlan" 
SET "isActive" = false;

-- Delete existing plans to start fresh
DELETE FROM "MembershipPlan";

-- Insert new simplified plans for both CLIENT and INFLUENCER
-- Plan 1: Weekly Plan (₹100/week)
INSERT INTO "MembershipPlan" (
    "id",
    "name", 
    "planType", 
    "billingCycle", 
    "price", 
    "currency",
    "description", 
    "features",
    "limitations",
    "targetRole",
    "isActive",
    "isPopular",
    "sortOrder"
) VALUES
-- WEEKLY PLAN FOR CLIENTS
(
    gen_random_uuid()::text,
    'Weekly Pro',
    'WEEKLY_PRO',
    'WEEKLY',
    100,
    'INR',
    'Perfect for short-term campaigns',
    '["Unlimited campaigns", "Priority support", "Basic analytics", "Direct messaging", "Campaign insights"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": 1000, "messagesPerMonth": 100, "featuredListings": 1}'::jsonb,
    'CLIENT',
    true,
    false,
    1
),
-- WEEKLY PLAN FOR INFLUENCERS
(
    gen_random_uuid()::text,
    'Weekly Pro',
    'WEEKLY_PRO',
    'WEEKLY',
    100,
    'INR',
    'Perfect for quick opportunities',
    '["Unlimited bids", "Priority support", "Basic analytics", "Direct messaging", "Featured profile"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": 1000, "messagesPerMonth": 100, "featuredListings": 1}'::jsonb,
    'INFLUENCER',
    true,
    false,
    1
),

-- MONTHLY PLAN FOR CLIENTS
(
    gen_random_uuid()::text,
    'Monthly Premium',
    'MONTHLY_PREMIUM',
    'MONTHLY',
    300,
    'INR',
    'Best for regular campaign needs',
    '["Unlimited campaigns", "Priority support", "Advanced analytics", "Direct messaging", "Campaign insights", "Dedicated account manager"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": 5000, "messagesPerMonth": 500, "featuredListings": 3}'::jsonb,
    'CLIENT',
    true,
    true,
    2
),
-- MONTHLY PLAN FOR INFLUENCERS
(
    gen_random_uuid()::text,
    'Monthly Premium',
    'MONTHLY_PREMIUM',
    'MONTHLY',
    300,
    'INR',
    'Best for active creators',
    '["Unlimited bids", "Priority support", "Advanced analytics", "Direct messaging", "Featured profile", "Performance insights"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": 5000, "messagesPerMonth": 500, "featuredListings": 3}'::jsonb,
    'INFLUENCER',
    true,
    true,
    2
),

-- YEARLY PLAN FOR CLIENTS
(
    gen_random_uuid()::text,
    'Annual Elite',
    'ANNUAL_ELITE',
    'YEARLY',
    600,
    'INR',
    'Maximum savings for committed users',
    '["Unlimited campaigns", "24/7 Priority support", "Advanced analytics", "Direct messaging", "Campaign insights", "Dedicated account manager", "Custom reporting", "Early access to features"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": -1, "messagesPerMonth": -1, "featuredListings": 10}'::jsonb,
    'CLIENT',
    true,
    false,
    3
),
-- YEARLY PLAN FOR INFLUENCERS
(
    gen_random_uuid()::text,
    'Annual Elite',
    'ANNUAL_ELITE',
    'YEARLY',
    600,
    'INR',
    'Maximum savings for serious creators',
    '["Unlimited bids", "24/7 Priority support", "Advanced analytics", "Direct messaging", "Featured profile", "Performance insights", "Custom reporting", "Early access to features"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": -1, "messagesPerMonth": -1, "featuredListings": 10}'::jsonb,
    'INFLUENCER',
    true,
    false,
    3
);

-- Add targetRole column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MembershipPlan' 
        AND column_name = 'targetRole'
    ) THEN
        ALTER TABLE "MembershipPlan" 
        ADD COLUMN "targetRole" TEXT CHECK ("targetRole" IN ('CLIENT', 'INFLUENCER', 'ALL'));
    END IF;
END $$;

-- Add isPopular column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MembershipPlan' 
        AND column_name = 'isPopular'
    ) THEN
        ALTER TABLE "MembershipPlan" 
        ADD COLUMN "isPopular" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Verify the plans
SELECT 
    "name", 
    "billingCycle", 
    "price", 
    "targetRole",
    "isPopular",
    "isActive"
FROM "MembershipPlan" 
ORDER BY "targetRole", "sortOrder";
