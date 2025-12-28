-- =====================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ONLY 3 PLANS for BOTH Clients and Influencers
-- =====================================================

-- Step 1: Clean up ALL existing plans
DELETE FROM "MembershipPlan";

-- Step 2: Add new columns if they don't exist
ALTER TABLE "MembershipPlan" 
ADD COLUMN IF NOT EXISTS "targetRole" TEXT CHECK ("targetRole" IN ('CLIENT', 'INFLUENCER', 'ALL'));

ALTER TABLE "MembershipPlan" 
ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN DEFAULT false;

-- Step 3: Insert ONLY 3 plans (targetRole = 'ALL' for both clients and influencers)

INSERT INTO "MembershipPlan" (
    "name", 
    "planType", 
    "billingCycle", 
    "price", 
    "description", 
    "features", 
    "limitations", 
    "targetRole", 
    "isActive", 
    "isPopular", 
    "sortOrder"
) VALUES
-- Plan 1: WEEKLY (₹100/week)
(
    'Weekly Pro',
    'WEEKLY_PRO',
    'WEEKLY',
    100,
    'Perfect for short-term needs',
    '["Unlimited campaigns & bids", "Priority support", "Basic analytics", "Direct messaging", "Campaign insights"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": 1000, "messagesPerMonth": 100, "featuredListings": 1}'::jsonb,
    'ALL',
    true,
    false,
    1
),
-- Plan 2: MONTHLY (₹300/month) ⭐ MOST POPULAR
(
    'Monthly Premium',
    'MONTHLY_PREMIUM',
    'MONTHLY',
    300,
    'Best for regular users',
    '["Unlimited campaigns & bids", "Priority support", "Advanced analytics", "Direct messaging", "Featured profile", "Performance insights"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": 5000, "messagesPerMonth": 500, "featuredListings": 3}'::jsonb,
    'ALL',
    true,
    true,
    2
),
-- Plan 3: YEARLY (₹600/year) 💎 BEST VALUE
(
    'Annual Elite',
    'ANNUAL_ELITE',
    'YEARLY',
    600,
    'Maximum savings - Only ₹50/month!',
    '["Unlimited campaigns & bids", "24/7 Priority support", "Advanced analytics", "Direct messaging", "Featured profile", "Dedicated manager", "Custom reporting", "Early access"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": -1, "messagesPerMonth": -1, "featuredListings": 10}'::jsonb,
    'ALL',
    true,
    false,
    3
);

-- Step 4: Verify the plans
SELECT 
    "id",
    "name", 
    "billingCycle", 
    "price", 
    "targetRole",
    "isPopular",
    "isActive",
    "description"
FROM "MembershipPlan" 
ORDER BY "sortOrder";

-- You should see exactly 3 plans, all with targetRole = 'ALL'
