-- ==============================================
-- FINAL SQL: RUN THIS IN SUPABASE SQL EDITOR
-- Updates to only 3 plans for both roles
-- ==============================================

-- Step 1: Delete ALL old plans
DELETE FROM "MembershipPlan";

-- Step 2: Ensure columns exist
DO $$ 
BEGIN
    -- Add targetRole column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MembershipPlan' AND column_name = 'targetRole'
    ) THEN
        ALTER TABLE "MembershipPlan" 
        ADD COLUMN "targetRole" TEXT CHECK ("targetRole" IN ('CLIENT', 'INFLUENCER', 'ALL'));
    END IF;
    
    -- Add isPopular column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MembershipPlan' AND column_name = 'isPopular'
    ) THEN
        ALTER TABLE "MembershipPlan" 
        ADD COLUMN "isPopular" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Step 3: Insert ONLY 3 plans
INSERT INTO "MembershipPlan" (
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
-- Plan 1: WEEKLY (₹100/week)
(
    'Weekly Pro',
    'WEEKLY_PRO',
    'WEEKLY',
    100,
    'INR',
    'Perfect for short-term needs',
    '["Unlimited campaigns & bids", "Priority support", "Basic analytics", "Direct messaging", "Campaign insights"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": 1000, "messagesPerMonth": 100, "featuredListings": 1}'::jsonb,
    'ALL',
    true,
    false,
    1
),
-- Plan 2: MONTHLY (₹300/month) - MOST POPULAR
(
    'Monthly Premium',
    'MONTHLY_PREMIUM',
    'MONTHLY',
    300,
    'INR',
    'Best for regular users',
    '["Unlimited campaigns & bids", "Priority support", "Advanced analytics", "Direct messaging", "Featured profile", "Performance insights"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": 5000, "messagesPerMonth": 500, "featuredListings": 3}'::jsonb,
    'ALL',
    true,
    true,
    2
),
-- Plan 3: YEARLY (₹600/year) - BEST VALUE
(
    'Annual Elite',
    'ANNUAL_ELITE',
    'YEARLY',
    600,
    'INR',
    'Maximum savings - Only ₹50/month!',
    '["Unlimited campaigns & bids", "24/7 Priority support", "Advanced analytics", "Direct messaging", "Featured profile", "Dedicated manager", "Custom reporting", "Early access"]'::jsonb,
    '{"adsPerMonth": -1, "bidsPerMonth": -1, "profileViews": -1, "messagesPerMonth": -1, "featuredListings": 10}'::jsonb,
    'ALL',
    true,
    false,
    3
);

-- Step 4: Verify results
SELECT 
    "name", 
    "billingCycle", 
    "price", 
    "targetRole",
    "isPopular",
    "isActive",
    "description"
FROM "MembershipPlan" 
ORDER BY "sortOrder";

-- You should see exactly 3 rows, all with targetRole = 'ALL'
